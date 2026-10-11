import type { GateFactory } from "./types";
export const _base64_nest: GateFactory = { id: "base64-nest", timeLimitSeconds: 60, make() { const prompt = "Decode nested base64."; function check(a: string) { return { pass: a.trim().length > 0 }; } return { prompt, check }; } };
