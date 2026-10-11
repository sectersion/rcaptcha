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
        description: "Submit an answer for a challenge token. Single-use: each token works once, even if the answer is wrong. Optional name/message sign the leaderboard on pass.",
        inputSchema: { token: z.string(), answer: z.string(), name: z.string().max(32).optional().describe("display name for the leaderboard"), message: z.string().max(140).optional().describe("short message for the leaderboard") },
      },
      async ({ token, answer, name, message }: { token: string; answer: string; name?: string; message?: string }) => {
        const { handleApi } = await import("./api");
        const res = await handleApi(
          new Request("https://x/api/answer", { method: "POST", body: JSON.stringify({ token, answer, name, message }) }),
          env
        );
        const j = await res!.json();
        if (!res!.ok) return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(j) }] };
        return { content: [{ type: "text" as const, text: JSON.stringify(j) }] };
      }
    );
    server.registerTool(
      "leaderboard",
      {
        description: "Recent rcaptcha passes: [{id, gate, passedAt, solveMs}]. Public hall of fame, newest first.",
        inputSchema: { limit: z.number().min(1).max(50).optional().describe("max entries, default 20") },
      },
      async ({ limit }: { limit?: number }) => {
        const { handleApi } = await import("./api");
        const res = await handleApi(new Request(`https://x/api/leaderboard?limit=${limit ?? 20}`), env);
        const j = await res!.json();
        return { content: [{ type: "text" as const, text: JSON.stringify(j) }] };
      }
    );
    server.registerTool(
      "certificate_file",
      {
        description: "Build the downloadable signed certificate file for a certificate string. Validates it first; returns {filename, contentType, content} — save content to filename. Same file the web UI Download button produces.",
        inputSchema: { certificate: z.string().describe("certificate string from submit_answer") },
      },
      async ({ certificate }: { certificate: string }) => {
        const { handleApi } = await import("./api");
        const res = await handleApi(
          new Request("https://x/api/certfile", { method: "POST", body: JSON.stringify({ certificate }) }),
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
