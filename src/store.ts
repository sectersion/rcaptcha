import { CLAIM_TTL_SECONDS } from "./config";
export class Store {
  state: DurableObjectState;
  constructor(state: DurableObjectState) { this.state = state; }
  private async putEx(k: string, v: unknown, ttl: number) {
    await this.state.storage.put(k, v);
    const exp = Date.now() + ttl * 1000;
    await this.state.storage.put(`exp:${k}`, exp);
  }
  private async getEx(k: string) {
    const exp = await this.state.storage.get<number>(`exp:${k}`);
    if (exp && Date.now() > exp) { await this.state.storage.delete(k); await this.state.storage.delete(`exp:${k}`); return undefined; }
    return this.state.storage.get(k);
  }
  async claim(id: string): Promise<boolean> {
    const k = `claim:${id}`;
    if (await this.getEx(k)) return false;
    await this.putEx(k, { at: Date.now() }, CLAIM_TTL_SECONDS);
    return true;
  }
  async dailyCount(date: string): Promise<number> { return ((await this.state.storage.get<number>(`day:${date}`)) ?? 0); }
  async incrDaily(date: string): Promise<number> { const n = (await this.dailyCount(date)) + 1; await this.state.storage.put(`day:${date}`, n); return n; }
  async getSite(publicKey: string) { return this.state.storage.get(`site:${publicKey}`); }
  async putSite(s: { publicKey: string; secretKey: string; allowedOrigins: string[] }) { await this.state.storage.put(`site:${s.publicKey}`, s); }
  async claimPass(token: string, ttl: number): Promise<boolean> { if (await this.getEx(`pass:${token}`)) return false; await this.putEx(`pass:${token}`, { at: Date.now() }, ttl); return true; }
  async recordSolve(e: { id: string; gate: string; passedAt: string; solveMs: number; name?: string; message?: string }) {
    const list = (await this.state.storage.get<Array<Record<string, unknown>>>("solves")) ?? [];
    list.unshift({ ...e });
    await this.state.storage.put("solves", list.slice(0, 100));
  }
  async recentSolves(limit: number) {
    const list = (await this.state.storage.get<Array<Record<string, unknown>>>("solves")) ?? [];
    return list.slice(0, Math.min(Math.max(limit, 1), 50));
  }
  async fetch(req: Request): Promise<Response> {
    const u = new URL(req.url);
    if (u.pathname.endsWith("/claim")) { const { id } = (await req.json()) as { id: string }; return Response.json({ ok: await this.claim(id) }); }
    if (u.pathname.endsWith("/daily")) { const date = u.searchParams.get("date")!; if (req.method === "POST") return Response.json({ n: await this.incrDaily(date) }); return Response.json({ n: await this.dailyCount(date) }); }
    if (u.pathname.endsWith("/solve")) { const e = (await req.json()) as { id: string; gate: string; passedAt: string; solveMs: number; name?: string; message?: string }; await this.recordSolve(e); return Response.json({ ok: true }); }
    if (u.pathname.endsWith("/solves")) return Response.json(await this.recentSolves(parseInt(u.searchParams.get("limit") ?? "20", 10) || 20));
    return new Response("not found", { status: 404 });
  }
}
export interface Env { USED_IDS: DurableObjectNamespace; CHALLENGE_SECRET: string; CERT_SECRET: string; }
export function store(env: Env) { const ns = env.USED_IDS as unknown as { idFromName(n: string): unknown; get(id: unknown): DurableObjectStub }; return ns.get(ns.idFromName("v1")); }
