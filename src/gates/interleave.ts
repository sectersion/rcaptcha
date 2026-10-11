import type { GateFactory } from "./types";

function randStr(n: number): string {
  const alpha = "abcdefghjkmnpqrstuvwxyz23456789";
  const buf = crypto.getRandomValues(new Uint8Array(n));
  return [...buf].map((b) => alpha[b % alpha.length]).join("");
}

export const _interleave: GateFactory = {
  id: "interleave",
  timeLimitSeconds: 45,
  make(params?) {
    const a = (params?.a as string) ?? randStr(12);
    const b = (params?.b as string) ?? randStr(12);
    let want = "";
    for (let i = 0; i < 12; i++) want += a[i] + b[i];
    const prompt =
      `Interleave these two 12-character strings character by character (A1B1A2B2…):\nA = "${a}"\nB = "${b}"\nReply with the 24-character result only. Nothing else.`;
    function check(answer: string) {
      const s = answer.trim();
      if (s.length !== 24) return { pass: false, reason: `want 24 chars, got ${s.length}` };
      if (s === want) return { pass: true };
      return { pass: false, reason: "wrong interleave" };
    }
    return { prompt, params: { a, b }, check };
  },
};
