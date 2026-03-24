import { EventEmitter } from "node:events";
import { vi } from "vitest";

export type MockBaileysSocket = {
  ev: EventEmitter;
  end: ReturnType<typeof vi.fn>;
  ws: { close: ReturnType<typeof vi.fn> };
  user?: { id: string };
};

function createSocket(): MockBaileysSocket {
  return {
    ev: new EventEmitter(),
    end: vi.fn(),
    ws: { close: vi.fn() },
    user: { id: "12345@s.whatsapp.net" },
  };
}

export function createMockBaileys() {
  let socket = createSocket();
  const makeWASocket = vi.fn((_options?: unknown) => socket);
  const useMultiFileAuthState = vi.fn(async () => ({
    state: { creds: {}, keys: {} },
    saveCreds: vi.fn(async () => {}),
  }));
  const fetchLatestBaileysVersion = vi.fn(async () => ({
    version: [2, 3000, 0],
    isLatest: true,
  }));
  const makeCacheableSignalKeyStore = vi.fn((value: unknown) => value);

  return {
    mod: {
      makeWASocket,
      useMultiFileAuthState,
      fetchLatestBaileysVersion,
      makeCacheableSignalKeyStore,
      DisconnectReason: {},
      Browsers: { ubuntu: () => ["Ubuntu", "Chrome", "1.0"] },
    },
    lastSocket: () => socket,
    reset() {
      socket = createSocket();
    },
  };
}
