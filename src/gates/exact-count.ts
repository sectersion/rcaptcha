import type { GateFactory } from "./types";

export const _exact_count: GateFactory = {
  id: "exact-count",
  timeLimitSeconds: 60,
  make(params?) {
    let blob = params?.blob as string | undefined;
    if (!blob) {
      const buf = crypto.getRandomValues(new Uint8Array(800));
      blob = [...buf].map((b) => "abc"[b % 3]).join("");
    }
    let a = 0, b = 0, c = 0;
    for (const ch of blob) { if (ch === "a") a++; else if (ch === "b") b++; else c++; }
    const prompt =
      `Count the characters in this 800-character string of a/b/c exactly:\n${blob}\nReply with exactly: a=N b=M c=K (e.g. a=1 b=2 c=3). Nothing else.`;
    function check(answer: string) {
      const m = answer.trim().match(/^a=(\d+) b=(\d+) c=(\d+)$/);
      if (!m) return { pass: false, reason: "format must be exactly: a=N b=M c=K" };
      if (+m[1]! !== a || +m[2]! !== b || +m[3]! !== c)
        return { pass: false, reason: "counts wrong" };
      return { pass: true };
    }
    return { prompt, params: { blob }, check };
  },
};
