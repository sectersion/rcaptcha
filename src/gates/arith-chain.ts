import type { GateFactory } from "./types";
export const _arith_chain: GateFactory = { id: "arith-chain", timeLimitSeconds: 60, make() { const prompt = "Compute."; function check(a: string) { return { pass: /^-?\d+$/.test(a.trim()) }; } return { prompt, check }; } };
