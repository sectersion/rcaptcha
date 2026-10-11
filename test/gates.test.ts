import { describe, it, expect } from "vitest";
import { noE } from "../src/gates/no-e";
import { _base64_nest } from "../src/gates/base64-nest";
import { _arith_chain } from "../src/gates/arith-chain";
import { _interleave } from "../src/gates/interleave";

describe("no-e", () => {
  it("rejects 46 words", async () => { const { check } = noE.make(); expect((await check("a ".repeat(45).trim() + "?")).pass).toBe(false); });
  it("rejects uppercase E", async () => { const { check } = noE.make(); expect((await check("E " + "x ".repeat(46) + "?")).pass).toBe(false); });
  it("rejects trailing space", async () => {
    const words = Array.from({ length: 47 }, (_, i) => "zxq" + i).join(" ") + "?";
    const { check } = noE.make();
    expect((await check(words + " ")).pass).toBe(false);
  });
});

describe("params round-trip", () => {
  it("base64-nest rebuilds identical challenge", async () => {
    const first = _base64_nest.make();
    const second = _base64_nest.make(first.params);
    expect(second.prompt).toBe(first.prompt);
    expect((await second.check("wrong")).pass).toBe(false);
  });
  it("arith-chain verifies correct value", async () => {
    const g = _arith_chain.make();
    const want = String(g.params.value);
    expect((await g.check(want)).pass).toBe(true);
    expect((await g.check(String(Number(want) + 1))).pass).toBe(false);
  });
  it("interleave rejects wrong length", async () => {
    const g = _interleave.make();
    expect((await g.check("short")).pass).toBe(false);
  });
});
