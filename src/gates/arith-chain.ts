import type { GateFactory } from "./types";

export const _arith_chain: GateFactory = {
  id: "arith-chain",
  timeLimitSeconds: 60,
  make(params?) {
    let expr = params?.expr as string | undefined;
    let value = params?.value as number | undefined;
    if (expr === undefined || value === undefined) {
      const r = (lo: number, hi: number) =>
        lo + (crypto.getRandomValues(new Uint8Array(1))[0]! % (hi - lo + 1));
      const a = r(11, 49), b = r(11, 49), c = r(3, 19), d = r(2, 9), e = r(5, 50);
      // ((a*b - c*d) + e): integer, deterministic
      value = a * b - c * d + e;
      expr = `((${a}*${b} - ${c}*${d}) + ${e})`;
    }
    const prompt = `Compute this exactly and reply with the integer only. Nothing else:\n${expr}`;
    function check(answer: string) {
      if (!/^-?\d+$/.test(answer.trim())) return { pass: false, reason: "reply with an integer only" };
      if (parseInt(answer.trim(), 10) === value) return { pass: true };
      return { pass: false, reason: "wrong value" };
    }
    return { prompt, params: { expr, value }, check };
  },
};
