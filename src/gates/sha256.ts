import type { GateFactory } from "./types";

function rand(n: number, alpha: string): string {
  let s = "";
  const buf = crypto.getRandomValues(new Uint8Array(n));
  for (const b of buf) s += alpha[b % alpha.length];
  return s;
}
async function sha256hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const _sha256: GateFactory = {
  id: "sha256",
  timeLimitSeconds: 90,
  make(params?) {
    const nonce =
      (params?.nonce as string) ?? rand(8, "abcdefghijklmnopqrstuvwxyz0123456789");
    const prompt =
      `Find a 4-character lowercase-letter suffix S such that sha256("${nonce}" + S) in hex starts with "00". Reply with S only, nothing else.`;
    async function check(answer: string) {
      const s = answer.trim();
      if (!/^[a-z]{4}$/.test(s)) return { pass: false, reason: "want exactly 4 lowercase letters" };
      const h = await sha256hex(nonce + s);
      if (!h.startsWith("00")) return { pass: false, reason: `hash ${h.slice(0, 8)}… does not start with 00` };
      return { pass: true };
    }
    return { prompt, params: { nonce }, check };
  },
};
