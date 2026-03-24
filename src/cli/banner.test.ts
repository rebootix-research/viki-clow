import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const loadConfigMock = vi.fn();

vi.mock("../config/config.js", () => ({
  loadConfig: loadConfigMock,
}));

let formatCliBannerLine: typeof import("./banner.js").formatCliBannerLine;

beforeAll(async () => {
  ({ formatCliBannerLine } = await import("./banner.js"));
});

beforeEach(() => {
  loadConfigMock.mockReset();
  loadConfigMock.mockReturnValue({});
});

describe("formatCliBannerLine", () => {
  it("hides tagline text when cli.banner.taglineMode is off", () => {
    loadConfigMock.mockReturnValue({
      cli: { banner: { taglineMode: "off" } },
    });

    const line = formatCliBannerLine("2026.3.7", {
      commit: "abc1234",
      richTty: false,
    });

    expect(line).toBe("VikiClow 2026.3.7 (abc1234)");
  });

  it("uses default tagline when cli.banner.taglineMode is default", () => {
    loadConfigMock.mockReturnValue({
      cli: { banner: { taglineMode: "default" } },
    });

    const line = formatCliBannerLine("2026.3.7", {
      commit: "abc1234",
      richTty: false,
    });

    expect(line).toBe("VikiClow 2026.3.7 (abc1234) - Autonomous work, shipped with VikiClow.");
  });

  it("prefers explicit tagline mode over config", () => {
    loadConfigMock.mockReturnValue({
      cli: { banner: { taglineMode: "off" } },
    });

    const line = formatCliBannerLine("2026.3.7", {
      commit: "abc1234",
      richTty: false,
      mode: "default",
    });

    expect(line).toBe("VikiClow 2026.3.7 (abc1234) - Autonomous work, shipped with VikiClow.");
  });

  it("defaults to the stable brand tagline when config is missing", () => {
    loadConfigMock.mockImplementation(() => {
      throw new Error("missing config");
    });

    const line = formatCliBannerLine("2026.3.7", {
      commit: "abc1234",
      richTty: false,
    });

    expect(line).toBe("VikiClow 2026.3.7 (abc1234) - Autonomous work, shipped with VikiClow.");
  });
});
