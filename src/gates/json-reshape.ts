import type { GateFactory } from "./types";

const KEYS = ["alpha", "bravo", "delta", "echo", "foxtrot"];
const VALS = ["redwood", "harbor", "lantern", "meadow", "quartz"];

function pick<T>(arr: T[]): T {
  return arr[crypto.getRandomValues(new Uint8Array(1))[0]! % arr.length]!;
}

export const _json_reshape: GateFactory = {
  id: "json-reshape",
  timeLimitSeconds: 60,
  make(params?) {
    const obj = (params?.obj as Record<string, string>) ?? { [pick(KEYS)]: pick(VALS), [pick(KEYS)]: pick(VALS), [pick(KEYS)]: pick(VALS) };
    const keys = Object.keys(obj);
    if (keys.length < 2) obj.extra = "signal";
    const prompt =
      `Given this JSON object, reply with single-line canonical JSON: keys sorted alphabetically, all string values UPPERCASED:\n${JSON.stringify(obj)}\nReply with the JSON only. Nothing else.`;
    function check(answer: string) {
      let got: unknown;
      try { got = JSON.parse(answer); } catch { return { pass: false, reason: "not valid JSON" }; }
      const want: Record<string, string> = {};
      for (const k of Object.keys(obj).sort()) want[k] = obj[k]!.toUpperCase();
      if (JSON.stringify(got) === JSON.stringify(want)) return { pass: true };
      return { pass: false, reason: "wrong canonical form" };
    }
    return { prompt, params: { obj }, check };
  },
};
