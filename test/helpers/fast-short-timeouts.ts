import { vi } from "vitest";

export function useFastShortTimeouts(): () => void {
  const nativeSetTimeout = globalThis.setTimeout;
  const spy = vi.spyOn(globalThis, "setTimeout").mockImplementation(((
    handler: TimerHandler,
    timeout?: number,
    ...args: unknown[]
  ) => {
    const delay = Math.min(typeof timeout === "number" ? timeout : 0, 5);
    if (typeof handler === "function") {
      return nativeSetTimeout(() => {
        handler(...args);
      }, delay);
    }
    return nativeSetTimeout(() => {}, delay);
  }) as unknown as typeof setTimeout);
  return () => {
    spy.mockRestore();
  };
}
