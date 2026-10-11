import type { GateFactory } from "./types";
export const _json_reshape: GateFactory = { id: "json-reshape", timeLimitSeconds: 60, make() { const prompt = "Reshape JSON."; function check(a: string) { try { JSON.parse(a); return { pass: true }; } catch { return { pass: false, reason: "bad-json" }; } } return { prompt, check }; } };
