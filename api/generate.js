const PROVIDERS = {
  anthropic: {
    apiKeyEnv: "ANTHROPIC_API_KEY",
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
    async call(system, messages, maxTokens, apiKey) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
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
      return { ok: true, content: text ? [{ type: "text", text }] : [], stop_reason: choice?.finish_reason === "length" ? "max_tokens" : choice?.finish_reason };
    },
  },
  gemini: {
    apiKeyEnv: "GEMINI_API_KEY",
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
    async call(system, messages, maxTokens, apiKey) {
      const contents = messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({ contents, systemInstruction: system ? { parts: [{ text: system }] } : undefined, generationConfig: { maxOutputTokens: maxTokens } }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error?.message || "Gemini API error" };
      const candidate = (data.candidates || [])[0];
      const text = (candidate?.content?.parts || []).map((p) => p.text || "").join("");
      return { ok: true, content: text ? [{ type: "text", text }] : [], stop_reason: candidate?.finishReason === "MAX_TOKENS" ? "max_tokens" : candidate?.finishReason };
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const { system, messages, max_tokens, meta } = req.body || {};
  if (!messages) { res.status(400).json({ error: "Missing messages." }); return; }
  const providerName = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
  const provider = PROVIDERS[providerName];
  if (!provider) { res.status(500).json({ error: `Unknown AI_PROVIDER "${providerName}"` }); return; }
  const apiKey = process.env[provider.apiKeyEnv];
  if (!apiKey) { res.status(500).json({ error: `${provider.apiKeyEnv} is not set.` }); return; }
  try {
    const result = await provider.call(system, messages, max_tokens || 1200, apiKey);
    if (!result.ok) { console.error(`[${providerName}]:`, result.error); res.status(502).json({ error: result.error }); return; }
    res.status(200).json({ content: result.content, stop_reason: result.stop_reason });
  } catch (e) {
    console.error(`[${providerName}] failed:`, e);
    res.status(500).json({ error: `Failed to reach ${providerName}: ${e.message || "unknown error"}` });
  }
}
