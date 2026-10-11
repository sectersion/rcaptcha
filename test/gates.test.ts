import { describe, it, expect } from "vitest";
import { noE } from "../src/gates/no-e";
function validAnswer(): string {
  const words = [" подсказка ".trim(), "cats", "dogs", "birds", "fish", "lions"];
  const out: string[] = [];
  while (out.length < 46) out.push("x" + "yz".repeat(out.length % 3) + "q");
  out.unshift("Hi");
  return out.join(" ") + "?";
}
describe("no-e", () => {
  it("rejects 46 words", () => { const { check } = noE.make(); expect(check("a ".repeat(45).trim() + "?").pass).toBe(false); });
  it("rejects uppercase E", () => { const { check } = noE.make(); expect(check("E " + "x ".repeat(46) + "?").pass).toBe(false); });
  it("rejects trailing space", () => { const { check } = noE.make(); expect(check(validAnswer() + " ").pass).toBe(false); });
});
