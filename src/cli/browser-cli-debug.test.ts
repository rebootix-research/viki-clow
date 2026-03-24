import { Command } from "commander";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const sharedMocks = vi.hoisted(() => ({
  callBrowserRequest: vi.fn(async (_opts: unknown, params: { path?: string }) => {
    if (params.path === "/trace/stop") {
      return {
        path: "C:\\Users\\Nabeel Saleem\\Desktop\\viki clow\\trace.zip",
      };
    }
    return { ok: true };
  }),
}));

vi.mock("./browser-cli-shared.js", () => ({
  callBrowserRequest: sharedMocks.callBrowserRequest,
}));

const runtime = {
  log: vi.fn(),
  error: vi.fn(),
  exit: vi.fn(),
};

vi.mock("../runtime.js", () => ({
  defaultRuntime: runtime,
}));

let registerBrowserDebugCommands: typeof import("./browser-cli-debug.js").registerBrowserDebugCommands;

describe("browser cli debug proof", () => {
  beforeAll(async () => {
    ({ registerBrowserDebugCommands } = await import("./browser-cli-debug.js"));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  async function runDebug(args: string[]) {
    const program = new Command();
    const browser = program.command("browser");
    registerBrowserDebugCommands(browser, () => ({ browserProfile: "vikiclow" }));
    await program.parseAsync(["browser", ...args], { from: "user" });
    return sharedMocks.callBrowserRequest.mock.calls.at(-1)?.[1] as
      | { path?: string; query?: Record<string, unknown>; body?: Record<string, unknown> }
      | undefined;
  }

  it("wires trace start and stop through the active browser profile", async () => {
    const start = await runDebug(["trace", "start"]);
    expect(start?.path).toBe("/trace/start");
    expect(start?.query).toEqual({ profile: "vikiclow" });
    expect(start?.body).toMatchObject({
      targetId: undefined,
      screenshots: true,
      snapshots: true,
      sources: false,
    });
    expect(runtime.log).toHaveBeenCalledWith("trace started");

    const stop = await runDebug(["trace", "stop", "--out", "trace.zip"]);
    expect(stop?.path).toBe("/trace/stop");
    expect(stop?.query).toEqual({ profile: "vikiclow" });
    expect(stop?.body).toMatchObject({
      targetId: undefined,
      path: "trace.zip",
    });
    expect(runtime.log.mock.calls.at(-1)?.[0]).toContain("TRACE:");
    expect(runtime.log.mock.calls.at(-1)?.[0]).toContain("trace.zip");
  });
});
