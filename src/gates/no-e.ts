import type { GateFactory } from "./types";

function countWords(s: string): string[] {
  return s.split(/\s+/).filter((w) => w.length > 0);
}

export const noE: GateFactory = {
  id: "no-e",
  timeLimitSeconds: 60,
  make() {
    const prompt =
      "Write exactly 47 words, with no letter 'e' in either case, ending in '?'.";
    function check(answer: string) {
      if (/[eE]/.test(answer)) return { pass: false, reason: "contains-e" };
      if (answer.length > 0 && /\s$/.test(answer))
        return { pass: false, reason: "trailing-whitespace" };
      const trimmed = answer.trimEnd();
      if (!trimmed.endsWith("?"))
        return { pass: false, reason: "must-end-with-?" };
      const words = countWords(answer);
      if (words.length !== 47)
        return { pass: false, reason: `word-count: got ${words.length}, want 47` };
      return { pass: true };
    }
    return { prompt, check };
  },
};
