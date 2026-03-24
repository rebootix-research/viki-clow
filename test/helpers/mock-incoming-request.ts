import type { IncomingMessage } from "node:http";
import { Readable } from "node:stream";

export function createMockIncomingRequest(
  chunks: string[],
  headers: Record<string, string> = {},
): IncomingMessage {
  const stream = Readable.from(chunks) as Readable & Partial<IncomingMessage>;
  Object.assign(stream, {
    headers,
    aborted: false,
    httpVersion: "1.1",
    httpVersionMajor: 1,
    httpVersionMinor: 1,
    complete: true,
    connection: null,
    rawHeaders: [],
    rawTrailers: [],
    trailers: {},
    method: "POST",
    url: "/",
    setTimeout: () => stream as IncomingMessage,
  });
  return stream as IncomingMessage;
}
