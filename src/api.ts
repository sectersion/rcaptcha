import { DAILY_CHALLENGE_CAP, MAX_BODY_BYTES, PASS_TOKEN_TTL_SECONDS } from "./config";
import { getFactory, listGateMeta, pickRandom } from "./gates/index";
import { signChallenge, verifyChallenge } from "./challenge";
import { issueCert, verifyCert } from "./certificate";
import { store, type Env } from "./store";

async function body(req: Request): Promise<any> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BODY_BYTES) throw new Response(JSON.stringify({ error: "body-too-large" }), { status: 413 });
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) throw new Response(JSON.stringify({ error: "body-too-large" }), { status: 413 });
  try { return text ? JSON.parse(text) : {}; } catch { throw new Response(JSON.stringify({ error: "bad-json" }), { status: 400 }); }
}
function utcDay() { return new Date().toISOString().slice(0, 10); }
function cleanStr(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.replace(/[\u0000-\u001f\u007f-\u009f]/g, "").trim().slice(0, max);
  return s || undefined;
}
function csec(env: Env) { return env.CHALLENGE_SECRET || "dev-challenge-secret"; }
function vsec(env: Env) { return env.CERT_SECRET || "dev-cert-secret"; }
async function checkCap(env: Env): Promise<Response | null> {
  const s = store(env);
  const r: any = await (await s.fetch(`https://x/daily?date=${utcDay()}`)).json();
  if (r.n >= DAILY_CHALLENGE_CAP) return Response.json({ error: "daily-cap", resetAt: `${utcDay()}T24:00:00Z` }, { status: 429 });
  return null;
}
export async function handleApi(req: Request, env: Env): Promise<Response | null> {
  const u = new URL(req.url);
  if (!u.pathname.startsWith("/api/") && u.pathname !== "/verify") return null;
  if (u.pathname === "/verify") {
    const p = await verifyCert(vsec(env), u.searchParams.get("cert") ?? "");
    if (!p) return Response.json({ valid: false }, { status: 200 });
    return Response.json({ valid: true, ...p });
  }
  try {
    if (u.pathname === "/api/challenge" && req.method === "POST") {
      const capped = await checkCap(env);
      if (capped) return capped;
      const b = await body(req);
      const f = b.gate ? getFactory(b.gate) : pickRandom();
      if (!f) return Response.json({ error: "unknown-gate", valid: (await import("./gates/index")).REGISTRY.map((g) => g.id) }, { status: 400 });
      const { prompt, params, check } = f.make();
      void check;
      const iat = Math.floor(Date.now() / 1000);
      const id = crypto.randomUUID();
      const token = await signChallenge(csec(env), { id, gate: f.id, params, iat, exp: iat + f.timeLimitSeconds });
      await (await store(env).fetch(`https://x/daily?date=${utcDay()}`, { method: "POST" })).json();
      console.log(JSON.stringify({ gate: f.id, outcome: "issued", latency: 0 }));
      return Response.json({ token, prompt, expiresAt: new Date((iat + f.timeLimitSeconds) * 1000).toISOString() });
    }
    if (u.pathname === "/api/answer" && req.method === "POST") {
      const b = await body(req);
      const t0 = Date.now();
      const p = await verifyChallenge(csec(env), b.token ?? "");
      if (!p) return Response.json({ error: "bad-or-expired-token" }, { status: 401 });
      const f = getFactory(p.gate);
      if (!f) return Response.json({ error: "unknown-gate" }, { status: 400 });
      const { check, prompt } = f.make(p.params as Record<string, unknown> ?? {});
      const claim: any = await (await store(env).fetch("https://x/claim", { method: "POST", body: JSON.stringify({ id: p.id }) })).json();
      if (!claim.ok) return Response.json({ error: "already-used" }, { status: 401 });
      const r = await check(b.answer ?? "");
      const solveMs = Date.now() - p.iat * 1000;
      console.log(JSON.stringify({ gate: p.gate, outcome: r.pass ? "pass" : "fail", latency: Date.now() - t0 }));
      if (!r.pass) return Response.json({ pass: false, reason: r.reason });
      const passedAt = new Date().toISOString();
      const cert = await issueCert(vsec(env), { id: p.id, gate: p.gate, prompt, passedAt });
      const name = cleanStr(b.name, 32);
      const message = cleanStr(b.message, 140);
      const ip = req.headers.get("cf-connecting-ip")?.split(",")[0]?.trim() || "local";
      const th: { wait: number } = await (await store(env).fetch("https://x/throttle", { method: "POST", body: JSON.stringify({ ip }) })).json();
      if (th.wait > 0) {
        return Response.json({ pass: true, certificate: cert, solveMs, leaderboard: `skipped: 1 pass per minute per solver (retry in ${th.wait}s)` });
      }
      await store(env).fetch("https://x/solve", { method: "POST", body: JSON.stringify({ id: p.id, gate: p.gate, passedAt, solveMs, name, message }) }).catch(() => {});
      return Response.json({ pass: true, certificate: cert, solveMs });
    }
    if (u.pathname === "/api/leaderboard" && req.method === "GET") {
      const limit = Math.min(Math.max(parseInt(u.searchParams.get("limit") ?? "20", 10) || 20, 1), 50);
      const res = await store(env).fetch(`https://x/solves?limit=${limit}`);
      return Response.json({ solves: await res.json() });
    }
    if (u.pathname === "/api/certfile" && req.method === "POST") {
      const b = await body(req);
      const p = await verifyCert(vsec(env), b.certificate ?? "");
      if (!p) return Response.json({ error: "bad-certificate" }, { status: 400 });
      const host = new URL(req.url).origin === "https://x" ? "" : new URL(req.url).origin;
      const doc = {
        certificate: b.certificate,
        payload: p,
        verify: `${host}/verify?cert=${encodeURIComponent(b.certificate)}`,
        algorithm: "split on '.'; payload=base64url-decode(part0); check hmac-sha256(payload_b64, CERT_SECRET)==part1",
        note: "A fun reward for speed, not a bot filter.",
      };
      return Response.json({ filename: "rcaptcha-cert.json", contentType: "application/json", content: JSON.stringify(doc, null, 2) });
    }
    if (u.pathname === "/api/siteverify" && req.method === "POST") {
      const b = await body(req);
      return Response.json({ success: false, todo: "v0.2-verify", token: !!b.token, secret: !!b.secret });
    }
    return Response.json({ error: "not-found" }, { status: 404 });
  } catch (e) { if (e instanceof Response) return e; return Response.json({ error: "internal", message: String((e as Error)?.message ?? e) }, { status: 500 }); }
}
export { PASS_TOKEN_TTL_SECONDS };
