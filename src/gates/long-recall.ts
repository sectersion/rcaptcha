import type { GateFactory } from "./types";
export const _long_recall: GateFactory = { id: "long-recall", timeLimitSeconds: 60, make() { const prompt = "Recall items 7,13,19 from shown list."; function check(a: string) { return { pass: a.trim().length > 0 }; } return { prompt, check }; } };
