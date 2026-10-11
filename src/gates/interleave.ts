import type { GateFactory } from "./types";
export const _interleave: GateFactory = { id: "interleave", timeLimitSeconds: 45, make() { const prompt = "Interleave."; function check(a: string) { return { pass: a.trim().length === 24 }; } return { prompt, check }; } };
