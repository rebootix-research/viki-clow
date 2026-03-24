import { vi } from "vitest";

export function useFastShortTimeouts(): () => void {
  const spy = vi
    .spyOn(globalThis, "setTimeout")
    .mockImplementation(((handler: TimerHandler, timeout?: number, ...args: unknown[]) =>
      setTimeout(handler, Math.min(typeof timeout === "number" ? timeout : 0, 5), ...args)) as
      typeof setTimeout);
  return () => {
    spy.mockRestore();
  };
}
