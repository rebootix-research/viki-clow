import { vi } from "vitest";
import type { MemorySearchResult } from "../../src/memory/types.js";

export type MemoryReadParams = {
  relPath: string;
  from?: number;
  lines?: number;
};

type MemoryToolMockState = {
  backend: string;
  provider: string;
  model: string;
  searchImpl: (query: string) => Promise<MemorySearchResult[]>;
  readFileImpl: (params: MemoryReadParams) => Promise<{ text: string; path: string }>;
};

const state: MemoryToolMockState = {
  backend: "builtin",
  provider: "mock",
  model: "mock-embed",
  searchImpl: async () => [],
  readFileImpl: async (params) => ({ text: "", path: params.relPath }),
};

export function resetMemoryToolMockState(params: Partial<MemoryToolMockState> = {}): void {
  state.backend = params.backend ?? "builtin";
  state.provider = params.provider ?? "mock";
  state.model = params.model ?? "mock-embed";
  state.searchImpl = params.searchImpl ?? (async () => []);
  state.readFileImpl = params.readFileImpl ?? (async (readParams) => ({ text: "", path: readParams.relPath }));
}

export function setMemoryBackend(backend: string): void {
  state.backend = backend;
}

export function setMemorySearchImpl(
  impl: (query: string) => Promise<MemorySearchResult[]>,
): void {
  state.searchImpl = impl;
}

export function setMemoryReadFileImpl(
  impl: (params: MemoryReadParams) => Promise<{ text: string; path: string }>,
): void {
  state.readFileImpl = impl;
}

vi.mock("../../src/memory/index.js", () => ({
  getMemorySearchManager: vi.fn(async () => ({
    manager: {
      search: async (query: string) => await state.searchImpl(query),
      readFile: async (params: MemoryReadParams) => await state.readFileImpl(params),
      status: () => ({
        backend: state.backend,
        provider: state.provider,
        model: state.model,
        custom: {},
      }),
      close: async () => {},
    },
    error: undefined,
  })),
}));

vi.mock("../../src/memory/backend-config.js", () => ({
  resolveMemoryBackendConfig: vi.fn(() => ({
    qmd: { limits: { maxInjectedChars: undefined } },
  })),
}));
