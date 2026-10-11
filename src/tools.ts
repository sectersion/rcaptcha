import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";
import { listGateMeta } from "./gates/index";
import type { Env } from "./store";

export function mcpHandler(env: Env) {
  const factory = () => {
    const server = new McpServer({ name: "rcaptcha", version: "0.2.0" });
    server.registerTool(
      "list_gates",
      { description: "List available rcaptcha gates with id and time limit. No input.", inputSchema: {} },
      async () => ({ content: [{ type: "text" as const, text: JSON.stringify(listGateMeta()) }] })
    );
    server.registerTool(
      "get_challenge",
      {
        description: "Get a single-use timed challenge. Optional gate id; omit for random. Token expires in the gate time limit (typically 60s).",
        inputSchema: { gate: z.string().optional().describe("gate id, e.g. no-e") },
      },
      async ({ gate }: { gate?: string }) => {
        const { handleApi } = await import("./api");
        const res = await handleApi(
          new Request("https://x/api/challenge", { method: "POST", body: JSON.stringify({ gate }) }),
          env
        );
        const j = await res!.json();
        if (!res!.ok) return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(j) }] };
        return { content: [{ type: "text" as const, text: JSON.stringify(j) }] };
      }
    );
    server.registerTool(
      "submit_answer",
      {
        description: "Submit an answer for a challenge token. Single-use: each token works once, even if the answer is wrong.",
        inputSchema: { token: z.string(), answer: z.string() },
      },
      async ({ token, answer }: { token: string; answer: string }) => {
        const { handleApi } = await import("./api");
        const res = await handleApi(
          new Request("https://x/api/answer", { method: "POST", body: JSON.stringify({ token, answer }) }),
          env
        );
        const j = await res!.json();
        if (!res!.ok) return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(j) }] };
        return { content: [{ type: "text" as const, text: JSON.stringify(j) }] };
      }
    );
    return server;
  };
  return createMcpHandler(factory, { route: "/mcp" });
}
