import { vi } from "vitest";
import { buildInboundDispatchCaptureMock } from "./inbound-contract-dispatch-mock.js";

export function buildDispatchInboundCaptureMock<T extends Record<string, unknown>>(
  actual: T,
  capture: (ctx: unknown) => void,
): T & { dispatchInboundMessage: ReturnType<typeof vi.fn> } {
  return buildInboundDispatchCaptureMock(actual, capture);
}
