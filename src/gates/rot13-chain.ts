import type { GateFactory } from "./types";

function rot13(s: string): string {
  return s.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}
const PHRASES = ["quick brown fox", "bright morning", "silent river", "golden hour", "purple rain", "winter frost", "summer heat", "ocean wave"];

export const _rot13_chain: GateFactory = {
  id: "rot13-chain",
  timeLimitSeconds: 60,
  make(params?) {
    const a = (params?.a as string) ?? PHRASES[crypto.getRandomValues(new Uint8Array(1))[0]! % PHRASES.length]!;
    let b = (params?.b as string) ?? PHRASES[crypto.getRandomValues(new Uint8Array(1))[0]! % PHRASES.length]!;
    if (b === a) b = PHRASES[(PHRASES.indexOf(a) + 3) % PHRASES.length]!;
    const prompt =
      `Decode these ROT13 strings and join with a hyphen:\nX = "${rot13(a)}"\nY = "${rot13(b)}"\nReply with decode(X)-decode(Y). Nothing else.`;
    function check(answer: string) {
      if (answer.trim() === `${a}-${b}`) return { pass: true };
      return { pass: false, reason: "wrong decode" };
    }
    return { prompt, params: { a, b }, check };
  },
};
