import type { GateFactory } from "./types";

function b64(s: string): string {
  const bin = new TextEncoder().encode(s);
  let str = "";
  bin.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str);
}
function rot13(s: string): string {
  return s.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}
function randStr(n: number): string {
  const alpha = "abcdefghjkmnpqrstuvwxyz23456789";
  const buf = crypto.getRandomValues(new Uint8Array(n));
  return [...buf].map((b) => alpha[b % alpha.length]).join("");
}

const WORDS = ["harbor", "lantern", "meadow", "quartz", "velvet", "copper", "ember", "glacier", "summit", "tundra", "willow", "zephyr"];
const PHRASES = ["quick brown fox", "bright morning", "silent river", "golden hour", "purple rain", "winter frost", "summer heat", "ocean wave", "ironwood grove", "cobalt signal", "amber beacon", "slate canyon"];
const KEYS = ["a", "b", "c"] as const;

function solve(p: { word: string; rots: Record<string, string>; pairA: string; pairB: string }): string {
  const w = p.word;
  const k = KEYS[w.charCodeAt(w.length - 1)! % 3]!;
  const phrase = p.rots[k]!;
  const [w1, w2] = phrase.split(" ") as [string, string];
  let tail = "";
  const [first, second] = w1! < w2! ? [p.pairA, p.pairB] : [p.pairB, p.pairA];
  for (let i = 0; i < 12; i++) tail += first[i] + second[i];
  return `${w}|${phrase}|${tail}`;
}

export const quest: GateFactory = {
  id: "quest",
  timeLimitSeconds: 120,
  make(params?) {
    const pick = <T>(arr: readonly T[]): T => arr[crypto.getRandomValues(new Uint8Array(1))[0]! % arr.length]!;
    const word = (params?.word as string) ?? pick(WORDS);
    const rots = (params?.rots as Record<string, string>) ?? { a: pick(PHRASES), b: pick(PHRASES), c: pick(PHRASES) };
    const pairA = (params?.pairA as string) ?? randStr(12);
    const pairB = (params?.pairB as string) ?? randStr(12);
    const p = { word, rots, pairA, pairB };
    const keyHint = "abc"[word.charCodeAt(word.length - 1)! % 3];
    void keyHint;
    const prompt =
      `A 3-step quest. Each step depends on the last. Reply with exactly: WORD|PHRASE|TAIL (no spaces around |).\n` +
      `Step 1: fully decode this double-base64 string to WORD:\n${b64(b64(word))}\n` +
      `Step 2: take the LAST character of WORD, its char code mod 3 picks a key (0->a, 1->b, 2->c). Decode the ROT13 line under that key to PHRASE:\n` +
      `a = "${rot13(rots.a)}"\nb = "${rot13(rots.b)}"\nc = "${rot13(rots.c)}"\n` +
      `Step 3: split PHRASE into two words w1 w2. If w1 < w2 alphabetically, TAIL = interleave(A,B) char by char (A1B1A2B2…); else TAIL = interleave(B,A).\n` +
      `A = "${pairA}"\nB = "${pairB}"`;
    function check(answer: string) {
      const want = solve(p);
      if (answer.trim() === want) return { pass: true };
      const parts = answer.trim().split("|");
      if (parts.length !== 3) return { pass: false, reason: "format must be exactly WORD|PHRASE|TAIL" };
      if (parts[0] !== word) return { pass: false, reason: "step 1 (decode) wrong" };
      const k = KEYS[word.charCodeAt(word.length - 1)! % 3]!;
      if (parts[1] !== rots[k]) return { pass: false, reason: "step 2 (rot13 pick) wrong" };
      return { pass: false, reason: "step 3 (interleave) wrong" };
    }
    return { prompt, params: p, check };
  },
};
