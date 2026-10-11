import type { GateFactory } from "./types";
import { noE } from "./no-e";
import { _sha256 } from "./sha256";
import { _long_recall } from "./long-recall";
import { _exact_count } from "./exact-count";
import { _sort_lines } from "./sort-lines";
import { _rot13_chain } from "./rot13-chain";
import { _base64_nest } from "./base64-nest";
import { _json_reshape } from "./json-reshape";
import { _arith_chain } from "./arith-chain";
import { _interleave } from "./interleave";
export const REGISTRY: GateFactory[] = [noE, _sha256, _long_recall, _exact_count, _sort_lines, _rot13_chain, _base64_nest, _json_reshape, _arith_chain, _interleave];
export function getFactory(id: string) { return REGISTRY.find((g) => g.id === id); }
export function listGateMeta() { return REGISTRY.map((g) => ({ id: g.id, timeLimitSeconds: g.timeLimitSeconds })); }
export function pickRandom(): GateFactory { return REGISTRY[Math.floor(Math.random() * REGISTRY.length)]!; }
