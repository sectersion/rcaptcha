export type CheckResult = { pass: boolean; reason?: string };
export type CheckFn = (answer: string) => CheckResult | Promise<CheckResult>;
export interface MadeGate {
  prompt: string;
  /** JSON-serializable params, embedded in the signed challenge token so submit can reconstruct the check. */
  params: Record<string, unknown>;
  check: CheckFn;
}
export interface GateFactory {
  id: string;
  timeLimitSeconds: number;
  /** If params are supplied (from a challenge token), rebuild the identical challenge. Otherwise generate fresh. */
  make(params?: Record<string, unknown>): MadeGate;
}
