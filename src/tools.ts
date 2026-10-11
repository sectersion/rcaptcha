import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";
import { listGateMeta } from "./gates/index";
import type { Env } from "./store";

export function mcpHandler(env: Env) {
  const factory = () => {
    const server: any = new McpServer({ name: "rcaptcha", version: "0.2.0" });
    server.tool("list_gates", "List gates with id and time limit. No input.", {}, async () => ({ content: [{ type: "text", text: JSON.stringify(listGateMeta()) }] }));
    server.tool("get_challenge", "Get a single-use challenge. Optional gate id. Expires in gate time limit (60s typical).", { gate: z.string().optional().describe("gate id") }, async ({ gate }: { gate?: string }) => {
      const { handleApi } = await import("./api");
      const res = await handleApi(new Request("https://x/api/challenge", { method: "POST", body: JSON.stringify({ gate }) }), env);
      const j = await res!.json();
      if (!res!.ok) return { isError: true, content: [{ type: "text", text: JSON.stringify(j) }] };
      return { content: [{ type: "text", text: JSON.stringify(j) }] };
    });
    server.tool("submit_answer", "Submit answer for token. Single-use, expires quickly.", { token: z.string(), answer: z.string() }, async ({ token, answer }: { token: string; answer: string }) => {
      const { handleApi } = await import("./api");
      const res = await handleApi(new Request("https://x/api/answer", { method: "POST", body: JSON.stringify({ token, answer }) }), env);
      const j = await res!.json();
      if (!res!.ok) return { isError: true, content: [{ type: "text", text: JSON.stringify(j) }] };
      return { content: [{ type: "text", text: JSON.stringify(j) }] };
    });
    return server;
  };
  return createMcpHandler(factory, { route: "/mcp" });
}
