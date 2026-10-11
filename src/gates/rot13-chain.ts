import type { GateFactory } from "./types";
export const _rot13_chain: GateFactory = { id: "rot13-chain", timeLimitSeconds: 60, make() { const prompt = "Decode rot13."; function check(a: string) { return { pass: a.trim().length > 0 }; } return { prompt, check }; } };
