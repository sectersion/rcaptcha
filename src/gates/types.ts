export interface Gate {
  id: string;
  timeLimitSeconds: number;
  prompt: string;
  check(answer: string): { pass: boolean; reason?: string };
}
export interface GateFactory {
  id: string;
  timeLimitSeconds: number;
  make(): { prompt: string; check: (answer: string) => { pass: boolean; reason?: string } };
}
