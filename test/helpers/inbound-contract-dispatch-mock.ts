import { vi } from "vitest";

export const inboundCtxCapture: { ctx?: unknown } = {};

export function buildInboundDispatchCaptureMock<T extends Record<string, unknown>>(
  actual: T,
  capture: (ctx: unknown) => void = (ctx) => {
    inboundCtxCapture.ctx = ctx;
  },
): T & { dispatchInboundMessage: ReturnType<typeof vi.fn> } {
  return {
    ...actual,
    dispatchInboundMessage: vi.fn(async (ctx: unknown, ...rest: unknown[]) => {
      capture(ctx);
      inboundCtxCapture.ctx = ctx;
      const dispatch = actual.dispatchInboundMessage;
      if (typeof dispatch === "function") {
        return await (dispatch as (...args: unknown[]) => unknown)(ctx, ...rest);
      }
      return undefined;
    }),
  };
}
