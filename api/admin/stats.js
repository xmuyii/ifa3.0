// In-memory store — resets per cold start on Vercel serverless.
// Fine for admin inspection since this is read-only; real persistence needs KV.
const adminAttempts = new Map();

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const ip = req.headers["x-forwarded-for"] || "unknown";
  const now = Date.now();
  let a = adminAttempts.get(ip);
  if (!a || now - a.windowStart > 15 * 60000) { a = { count: 0, windowStart: now }; adminAttempts.set(ip, a); }
  a.count++;
  if (a.count > 10) { res.status(429).json({ error: "Too many attempts." }); return; }
  const real = process.env.ADMIN_PASSPHRASE;
  const { passphrase } = req.body || {};
  if (!real || passphrase !== real) { res.status(403).json({ error: "Not authorized." }); return; }
  // On serverless, server-side stats aren't persistent — return a note explaining this
  res.status(200).json({
    totalDevices: 0, activeLast24h: 0, activeLast7d: 0,
    totalConsultations: 0, readingsCount: 0, strategistCount: 0,
    ifaCount: 0, tarotCount: 0, topTarot: null, topOdu: null,
    byDim: {}, days: [],
    _note: "Server-side stats reset per cold start on Vercel serverless. For persistent stats, add Vercel KV.",
  });
}
