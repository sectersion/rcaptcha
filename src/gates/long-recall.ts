import type { GateFactory } from "./types";

const POOL = ("oak maple pine cedar birch elm ash willow alder birch spruce juniper " +
  "robin finch wren sparrow heron egret crane loon owl hawk stone river cloud " +
  "ember frost glade harbor inlet meadow ridge vale").split(" ");

function randWord(): string {
  const b = crypto.getRandomValues(new Uint8Array(1))[0]!;
  return POOL[b % POOL.length]! + (b % 7 === 0 ? b % 100 : "");
}

export const _long_recall: GateFactory = {
  id: "long-recall",
  timeLimitSeconds: 60,
  make(params?) {
    const words = (params?.words as string[]) ?? Array.from({ length: 20 }, randWord);
    const idx = [6, 12, 18];
    const prompt =
      `Memorize this list (position 1-20):\n${words.map((w, i) => `${i + 1}. ${w}`).join("\n")}\nReply with items 7, 13 and 19 in order, one per line, exact spelling. Nothing else.`;
    function check(answer: string) {
      const lines = answer.trim().split(/\r?\n/).map((l) => l.trim());
      const want = idx.map((i) => words[i]);
      if (lines.length !== 3) return { pass: false, reason: `want 3 lines, got ${lines.length}` };
      for (let k = 0; k < 3; k++)
        if (lines[k] !== want[k]) return { pass: false, reason: `line ${k + 1} wrong` };
      return { pass: true };
    }
    return { prompt, params: { words }, check };
  },
};
