import { expect } from "vitest";

export function expectInboundContextContract(ctx: unknown): void {
  expect(ctx).toBeTruthy();
  expect(typeof ctx).toBe("object");
  const record = ctx as Record<string, unknown>;
  expect(record.Body ?? record.text ?? record.message).toBeDefined();
  expect(
    record.OriginatingChannel ??
      record.channel ??
      record.Channel ??
      record.Transport ??
      record.Source,
  ).toBeDefined();
}
