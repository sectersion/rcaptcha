import type { GateFactory } from "./types";

const WORDS = ("amber bronze copper coral ember frost garnet hazel ivory jade khaki lilac " +
  "mango navy onyx pearl quartz ruby slate topaz umber violet wheat xenon yarrow zinc").split(" ");

export const _sort_lines: GateFactory = {
  id: "sort-lines",
  timeLimitSeconds: 60,
  make(params?) {
    const words = (params?.words as string[]) ?? [...WORDS].sort(() => 0.5 - Math.random()).slice(0, 15);
    const sorted = [...words].sort();
    const prompt =
      `Sort these 15 words alphabetically, one per line, exact:\n${words.join("\n")}`;
    function check(answer: string) {
      const lines = answer.trim().split(/\r?\n/).map((l) => l.trim());
      if (lines.length !== sorted.length)
        return { pass: false, reason: `want ${sorted.length} lines, got ${lines.length}` };
      for (let i = 0; i < sorted.length; i++)
        if (lines[i] !== sorted[i]) return { pass: false, reason: `line ${i + 1} wrong` };
      return { pass: true };
    }
    return { prompt, params: { words }, check };
  },
};
