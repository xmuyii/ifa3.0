import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// ---- rolling credits, per device, in memory ----
// Not a hard daily reset — credits trickle back over time, so someone who runs
// out can return in a few hours rather than waiting for a calendar day.
// In-memory means this resets if the Railway service restarts; swap in Redis
// or Postgres once this needs to survive restarts / scale past one instance.
const CREDIT_MAX = 8;
const CREDIT_REFILL_HOURS = 3;
const deviceState = new Map();

function getState(deviceId) {
  const now = Date.now();
  let s = deviceState.get(deviceId);
  if (!s) { s = { credits: CREDIT_MAX, lastRefillAt: now, firstSeenAt: now, lastSeenAt: now }; deviceState.set(deviceId, s); }
  s.lastSeenAt = now;
  const elapsedHours = (now - s.lastRefillAt) / 3600000;
  const toAdd = Math.floor(elapsedHours / CREDIT_REFILL_HOURS);
  if (toAdd > 0) {
    s.credits = Math.min(CREDIT_MAX, s.credits + toAdd);
    s.lastRefillAt = s.lastRefillAt + toAdd * CREDIT_REFILL_HOURS * 3600000;
  }
  return s;
}
function formatWait(hours) {
  const totalMin = Math.max(1, Math.round(hours * 60));
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ---- server-side event log, for the admin overview ----
// Only real, billable events land here (see the hasText/!internal check below) — same
// "never log a failed attempt" principle as the credit system itself.
const MAX_EVENTS = 10000;
const serverEvents = [];
function logEvent(deviceId, meta) {
  if (!meta || !meta.type) return;
  serverEvents.push({ deviceId, date: new Date().toISOString(), ...meta });
  if (serverEvents.length > MAX_EVENTS) serverEvents.splice(0, serverEvents.length - MAX_EVENTS);
}

// ---- lightweight brute-force protection for the admin endpoint ----
const adminAttempts = new Map();
function adminRateLimitOk(ip) {
  const now = Date.now();
  let a = adminAttempts.get(ip);
  if (!a || now - a.windowStart > 15 * 60000) { a = { count: 0, windowStart: now }; adminAttempts.set(ip, a); }
  a.count += 1;
  return a.count <= 10;
}

// ---- devices that have proven they know the admin passphrase ----
// Bypasses the credit limit entirely for that device — a fast lane for you while
// everyone else's rolling credits still apply normally. In memory, same as
// everything else here: resets on a service restart, so re-enter the passphrase
// once after a redeploy to re-open the fast lane.
const adminDevices = new Set();

/* ============================================================
   AI PROVIDER LAYER
   ------------------------------------------------------------
   Everything below normalizes whichever provider is chosen into
   ONE shape: { content: [{ type: "text", text }], stop_reason }.
   That's Anthropic's native shape — the frontend already expects
   it, so adding a provider here never requires a frontend change.

   Switch providers by setting AI_PROVIDER in Railway's environment
   variables — no code edits, no redeploy of the frontend:
     AI_PROVIDER=anthropic   (default) — needs ANTHROPIC_API_KEY
     AI_PROVIDER=deepseek                — needs DEEPSEEK_API_KEY
   ============================================================ */

const PROVIDERS = {
  anthropic: {
    apiKeyEnv: "ANTHROPIC_API_KEY",
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
    async call(system, messages, maxTokens, apiKey) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        // Check https://docs.claude.com/en/docs/about-claude/models if the model string ever changes.
        body: JSON.stringify({ model: this.model, max_tokens: maxTokens, system, messages }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error?.message || "Anthropic API error" };
      return { ok: true, content: data.content || [], stop_reason: data.stop_reason };
    },
  },
  deepseek: {
    apiKeyEnv: "DEEPSEEK_API_KEY",
    model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    async call(system, messages, maxTokens, apiKey) {
      // DeepSeek speaks the OpenAI-compatible chat/completions shape: the system
      // prompt is just another message, not a separate top-level field.
      const dsMessages = [{ role: "system", content: system }, ...messages];
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: this.model, max_tokens: maxTokens, messages: dsMessages }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error?.message || "DeepSeek API error" };
      const choice = (data.choices || [])[0];
      const text = choice?.message?.content || "";
      return {
        ok: true,
        content: text ? [{ type: "text", text }] : [],
        stop_reason: choice?.finish_reason === "length" ? "max_tokens" : choice?.finish_reason,
      };
    },
  },
  gemini: {
    apiKeyEnv: "GEMINI_API_KEY",
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
    async call(system, messages, maxTokens, apiKey) {
      // Gemini's shape differs from the other two: turns are "contents" with
      // role "user"/"model" (not "assistant"), and the system prompt is its own
      // top-level field rather than a message.
      const contents = messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents,
          systemInstruction: system ? { parts: [{ text: system }] } : undefined,
          generationConfig: { maxOutputTokens: maxTokens },
        }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error?.message || "Gemini API error" };
      const candidate = (data.candidates || [])[0];
      const text = (candidate?.content?.parts || []).map((p) => p.text || "").join("");
      return {
        ok: true,
        content: text ? [{ type: "text", text }] : [],
        stop_reason: candidate?.finishReason === "MAX_TOKENS" ? "max_tokens" : candidate?.finishReason,
      };
    },
  },
};

app.post("/api/generate", async (req, res) => {
  const deviceId = req.headers["x-device-id"] || req.ip || "anon";
  const { system, messages, max_tokens, internal, meta } = req.body || {};
  if (!messages) { res.status(400).json({ error: "Missing messages." }); return; }

  const isAdmin = adminDevices.has(deviceId);
  const state = getState(deviceId);
  // "internal" calls (dimension classification, quiet vessel-insight extraction)
  // don't cost the seeker a consultation — only their own questions and readings do.
  // Admin devices skip this check entirely, on top of that.
  if (!internal && !isAdmin && state.credits < 1) {
    const hoursUntilNext = CREDIT_REFILL_HOURS - (Date.now() - state.lastRefillAt) / 3600000;
    res.status(429).json({ error: `You're out of consultations for now — the next one unlocks in about ${formatWait(Math.max(0, hoursUntilNext))}.` });
    return;
  }

  const providerName = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
  const provider = PROVIDERS[providerName];
  if (!provider) { res.status(500).json({ error: `Unknown AI_PROVIDER "${providerName}" — expected "anthropic" or "deepseek".` }); return; }
  const apiKey = process.env[provider.apiKeyEnv];
  if (!apiKey) { res.status(500).json({ error: `${provider.apiKeyEnv} is not set on the server.` }); return; }

  try {
    const result = await provider.call(system, messages, max_tokens || 1200, apiKey);
    if (!result.ok) { console.error(`[${providerName}] API error:`, result.error); res.status(502).json({ error: result.error }); return; }
    // Only spend a credit — and only log an event — on genuinely meaningful content.
    // An empty or failed response should never cost the seeker a consultation, and
    // shouldn't pollute the admin stats either. Admin devices never spend a credit,
    // and their own testing draws don't get folded into the usage stats they're
    // looking at, so the numbers stay representative of real seekers.
    const hasText = result.content.some((b) => b.text && b.text.trim());
    if (!internal && hasText && !isAdmin) {
      state.credits -= 1;
      logEvent(deviceId, meta);
    }
    res.status(200).json({ content: result.content, stop_reason: result.stop_reason });
  } catch (e) {
    console.error(`[${providerName}] request failed:`, e);
    res.status(500).json({ error: `Failed to reach ${providerName}: ${e.message || "unknown error"}` });
  }
});

app.post("/api/admin/stats", (req, res) => {
  const ip = req.ip || "unknown";
  if (!adminRateLimitOk(ip)) { res.status(429).json({ error: "Too many attempts." }); return; }
  const real = process.env.ADMIN_PASSPHRASE;
  const { passphrase } = req.body || {};
  if (!real || passphrase !== real) { res.status(403).json({ error: "Not authorized." }); return; }

  const deviceId = req.headers["x-device-id"];
  if (deviceId) adminDevices.add(deviceId);

  const now = Date.now();
  const devices = [...deviceState.values()];
  const readings = serverEvents.filter((e) => e.type === "reading");
  const strategistMsgs = serverEvents.filter((e) => e.type === "strategist");
  const byDim = {};
  readings.forEach((r) => { byDim[r.dimension] = (byDim[r.dimension] || 0) + 1; });
  let ifaCount = 0, tarotCount = 0;
  const tarotCounts = {}, oduCounts = {};
  readings.forEach((r) => (r.traditions || []).forEach((t) => (t === "ifa" ? ifaCount++ : tarotCount++)));
  readings.forEach((r) => (r.cardNames || []).forEach((c) => {
    const bucket = c.tradition === "tarot" ? tarotCounts : oduCounts;
    bucket[c.name] = (bucket[c.name] || 0) + 1;
  }));
  const topTarot = Object.entries(tarotCounts).sort((a, b) => b[1] - a[1])[0] || null;
  const topOdu = Object.entries(oduCounts).sort((a, b) => b[1] - a[1])[0] || null;
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    days.push({ day: d.toLocaleDateString(undefined, { weekday: "short" }), count: serverEvents.filter((e) => e.date.slice(0, 10) === key).length });
  }

  res.status(200).json({
    totalDevices: devices.length,
    activeLast24h: devices.filter((d) => now - d.lastSeenAt < 86400000).length,
    activeLast7d: devices.filter((d) => now - d.lastSeenAt < 7 * 86400000).length,
    totalConsultations: serverEvents.length,
    readingsCount: readings.length,
    strategistCount: strategistMsgs.length,
    ifaCount, tarotCount, topTarot, topOdu, byDim, days,
  });
});

// serve the built frontend
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Ifatarot server listening on port ${PORT} (AI provider: ${process.env.AI_PROVIDER || "anthropic"})`));
