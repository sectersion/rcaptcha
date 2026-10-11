import type { GateFactory } from "./types";
export const _exact_count: GateFactory = { id: "exact-count", timeLimitSeconds: 60, make() { const prompt = "Count chars."; function check(a: string) { return { pass: /^a=\d+ b=\d+ c=\d+$/.test(a.trim()) }; } return { prompt, check }; } };
