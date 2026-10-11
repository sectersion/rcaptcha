import type { GateFactory } from "./types";

function b64(s: string): string {
  const bin = new TextEncoder().encode(s);
  let str = "";
  bin.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str);
}
const SECRETS = ["midnight garden", "copper kettle", "velvet storm", "paper crane", "glass harbor", "amber signal", "quiet thunder", " maple syrup ".trim()];

export const _base64_nest: GateFactory = {
  id: "base64-nest",
  timeLimitSeconds: 60,
  make(params?) {
    const text = (params?.text as string) ?? SECRETS[crypto.getRandomValues(new Uint8Array(1))[0]! % SECRETS.length]!;
    const once = b64(text);
    const twice = b64(once);
    const prompt = `Fully decode this double-base64 string to its plaintext:\n${twice}\nReply with the plaintext only. Nothing else.`;
    function check(answer: string) {
      if (answer.trim() === text) return { pass: true };
      return { pass: false, reason: "wrong plaintext" };
    }
    return { prompt, params: { text }, check };
  },
};
