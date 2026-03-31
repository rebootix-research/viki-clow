import fs from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTempHomeEnv, type TempHomeEnv } from "../test-utils/temp-home.js";

const mocks = vi.hoisted(() => ({
  readLocalFileSafely: vi.fn(),
}));

vi.mock("../infra/fs-safe.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../infra/fs-safe.js")>();
  return {
    ...actual,
    readLocalFileSafely: mocks.readLocalFileSafely,
  };
});

let saveMediaSource: typeof import("./store.js").saveMediaSource;
let SafeOpenError: typeof import("../infra/fs-safe.js").SafeOpenError;

describe("media store outside-workspace mapping", () => {
  let tempHome: TempHomeEnv;
  let home = "";

  beforeAll(async () => {
    tempHome = await createTempHomeEnv("vikiclow-media-store-test-home-");
    home = tempHome.home;
  });

  beforeEach(async () => {
    mocks.readLocalFileSafely.mockReset();
    vi.resetModules();
    ({ saveMediaSource } = await import("./store.js"));
    ({ SafeOpenError } = await import("../infra/fs-safe.js"));
  });

  afterAll(async () => {
    await tempHome.restore();
  });

  it("maps outside-workspace reads to a descriptive invalid-path error", async () => {
    const sourcePath = path.join(home, "outside-media.txt");
    await fs.writeFile(sourcePath, "hello");
    mocks.readLocalFileSafely.mockRejectedValueOnce(
      new SafeOpenError("outside-workspace", "file is outside workspace root"),
    );

    await expect(saveMediaSource(sourcePath)).rejects.toMatchObject({
      code: "invalid-path",
      message: "Media path is outside workspace root",
    });
  });
});
