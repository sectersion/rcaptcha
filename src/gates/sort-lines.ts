import type { GateFactory } from "./types";
export const _sort_lines: GateFactory = { id: "sort-lines", timeLimitSeconds: 60, make() { const prompt = "Sort lines."; function check(a: string) { return { pass: a.trim().length > 0 }; } return { prompt, check }; } };
