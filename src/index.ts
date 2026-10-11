import { handleApi } from "./api";
import { handleEmbed } from "./embed";
import { mcpHandler } from "./tools";
import type { Env } from "./store";
export { Store } from "./store";
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const u = new URL(req.url);
    if (u.pathname === "/mcp" || u.pathname.startsWith("/mcp/")) {
      const h: any = mcpHandler(env);
      return h.fetch ? h.fetch(req, env, {}) : (h as any)(req, env, {});
    }
    const em = handleEmbed(req);
    if (em) return em;
    const api = await handleApi(req, env);
    if (api) return api;
    return new Response("not found", { status: 404 });
  },
};
