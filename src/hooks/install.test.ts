import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";
import JSZip from "jszip";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { expectSingleNpmPackIgnoreScriptsCall } from "../test-utils/exec-assertions.js";
import {
  expectInstallUsesIgnoreScripts,
  expectIntegrityDriftRejected,
  expectUnsupportedNpmSpec,
  mockNpmPackMetadataResult,
} from "../test-utils/npm-spec-install-test-helpers.js";
import { isAddressInUseError } from "./gmail-watcher.js";

const fixtureRoot = path.join(os.tmpdir(), `vikiclow-hook-install-${randomUUID()}`);
const sharedArchiveDir = path.join(fixtureRoot, "_archives");
let tempDirIndex = 0;
const sharedArchivePathByName = new Map<string, string>();
let zipHooksBuffer: Buffer;
let zipTraversalBuffer: Buffer;
let tarHooksBuffer: Buffer;
let tarTraversalBuffer: Buffer;
let tarEvilIdBuffer: Buffer;
let tarReservedIdBuffer: Buffer;
let npmPackHooksBuffer: Buffer;

vi.mock("../process/exec.js", () => ({
  runCommandWithTimeout: vi.fn(),
}));

function makeTempDir() {
  const dir = path.join(fixtureRoot, `case-${tempDirIndex++}`);
  fs.mkdirSync(dir);
  return dir;
}

function buildHookMarkdown(name: string): string {
  return [
    "---",
    `name: ${name}`,
    "description: Test hook",
    'metadata: {"vikiclow":{"events":["command:new"]}}',
    "---",
    "",
    `# ${name}`,
    "",
  ].join("\n");
}

function tarOctal(value: number, length: number): string {
  return value.toString(8).padStart(length - 1, "0");
}

function createTarEntryBuffer(params: {
  name: string;
  content?: Buffer;
  mode?: number;
  typeflag?: string;
}): Buffer {
  const content = params.content ?? Buffer.alloc(0);
  const header = Buffer.alloc(512, 0);
  const write = (offset: number, length: number, value: string) => {
    header.write(value.slice(0, length), offset, "utf8");
  };

  write(0, 100, params.name);
  write(100, 8, tarOctal(params.mode ?? 0o644, 8));
  write(108, 8, tarOctal(0, 8));
  write(116, 8, tarOctal(0, 8));
  write(124, 12, tarOctal(content.length, 12));
  write(136, 12, tarOctal(0, 12));
  write(148, 8, "        ");
  write(156, 1, params.typeflag ?? "0");
  write(257, 6, "ustar");
  write(263, 2, "00");

  let checksum = 0;
  for (const byte of header) {
    checksum += byte;
  }
  write(148, 8, `${tarOctal(checksum, 7)}\0 `);

  const padding = Buffer.alloc((512 - (content.length % 512)) % 512, 0);
  return Buffer.concat([header, content, padding]);
}

function buildTarBuffer(
  entries: Array<{ name: string; content?: string | Buffer; mode?: number; typeflag?: string }>,
): Buffer {
  const buffers = entries.map((entry) =>
    createTarEntryBuffer({
      name: entry.name,
      content:
        typeof entry.content === "string"
          ? Buffer.from(entry.content, "utf8")
          : (entry.content ?? Buffer.alloc(0)),
      mode: entry.mode,
      typeflag: entry.typeflag,
    }),
  );
  return Buffer.concat([...buffers, Buffer.alloc(1024, 0)]);
}

function buildHookPackEntries(params: {
  packageName: string;
  hookDirName: string;
  hookName: string;
  version?: string;
  dependencies?: Record<string, string>;
}): Array<{ path: string; content: string }> {
  const manifest = {
    name: params.packageName,
    version: params.version ?? "0.0.1",
    vikiclow: { hooks: [`./hooks/${params.hookDirName}`] },
    ...(params.dependencies ? { dependencies: params.dependencies } : {}),
  };
  return [
    {
      path: "package/package.json",
      content: JSON.stringify(manifest),
    },
    {
      path: `package/hooks/${params.hookDirName}/HOOK.md`,
      content: buildHookMarkdown(params.hookName),
    },
    {
      path: `package/hooks/${params.hookDirName}/handler.ts`,
      content: "export default async () => {};\n",
    },
  ];
}

async function buildHookPackZipBuffer(params: {
  packageName: string;
  hookDirName: string;
  hookName: string;
}): Promise<Buffer> {
  const zip = new JSZip();
  for (const entry of buildHookPackEntries(params)) {
    zip.file(entry.path, entry.content);
  }
  return Buffer.from(await zip.generateAsync({ type: "nodebuffer" }));
}

function buildHookPackTarBuffer(params: {
  packageName: string;
  hookDirName: string;
  hookName: string;
  version?: string;
  dependencies?: Record<string, string>;
  gzip?: boolean;
}): Buffer {
  const tarBuffer = buildTarBuffer(
    buildHookPackEntries(params).map((entry) => ({
      name: entry.path,
      content: entry.content,
    })),
  );
  return params.gzip ? gzipSync(tarBuffer) : tarBuffer;
}

const { runCommandWithTimeout } = await import("../process/exec.js");
const { installHooksFromArchive, installHooksFromNpmSpec, installHooksFromPath } =
  await import("./install.js");

afterAll(() => {
  try {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  } catch {
    // ignore cleanup failures
  }
});

beforeEach(() => {
  vi.clearAllMocks();
});

beforeAll(async () => {
  fs.mkdirSync(fixtureRoot, { recursive: true });
  fs.mkdirSync(sharedArchiveDir, { recursive: true });
  zipHooksBuffer = await buildHookPackZipBuffer({
    packageName: "@vikiclow/zip-hooks",
    hookDirName: "zip-hook",
    hookName: "zip-hook",
  });
  zipTraversalBuffer = Buffer.from(
    await new JSZip().file("../../escape.txt", "escape").generateAsync({ type: "nodebuffer" }),
  );
  tarHooksBuffer = buildHookPackTarBuffer({
    packageName: "@vikiclow/tar-hooks",
    hookDirName: "tar-hook",
    hookName: "tar-hook",
  });
  tarTraversalBuffer = buildTarBuffer([{ name: "../../escape.txt", content: "escape" }]);
  tarEvilIdBuffer = buildHookPackTarBuffer({
    packageName: "@evil/..",
    hookDirName: "evil-hook",
    hookName: "evil-hook",
  });
  tarReservedIdBuffer = buildHookPackTarBuffer({
    packageName: "@evil/.",
    hookDirName: "reserved-hook",
    hookName: "reserved-hook",
  });
  npmPackHooksBuffer = buildHookPackTarBuffer({
    packageName: "@vikiclow/test-hooks",
    hookDirName: "one-hook",
    hookName: "one-hook",
    gzip: true,
  });
});

function writeArchiveFixture(params: { fileName: string; contents: Buffer }) {
  const stateDir = makeTempDir();
  const archiveHash = createHash("sha256").update(params.contents).digest("hex").slice(0, 12);
  const archiveKey = `${params.fileName}:${archiveHash}`;
  let archivePath = sharedArchivePathByName.get(archiveKey);
  if (!archivePath) {
    archivePath = path.join(sharedArchiveDir, `${archiveHash}-${params.fileName}`);
    fs.writeFileSync(archivePath, params.contents);
    sharedArchivePathByName.set(archiveKey, archivePath);
  }
  return {
    stateDir,
    archivePath,
    hooksDir: path.join(stateDir, "hooks"),
  };
}

function expectInstallFailureContains(
  result: Awaited<ReturnType<typeof installHooksFromArchive>>,
  snippets: string[],
) {
  expect(result.ok).toBe(false);
  if (result.ok) {
    throw new Error("expected install failure");
  }
  for (const snippet of snippets) {
    expect(result.error).toContain(snippet);
  }
}

function writeHookPackManifest(params: {
  pkgDir: string;
  hooks: string[];
  dependencies?: Record<string, string>;
}) {
  fs.writeFileSync(
    path.join(params.pkgDir, "package.json"),
    JSON.stringify({
      name: "@vikiclow/test-hooks",
      version: "0.0.1",
      vikiclow: { hooks: params.hooks },
      ...(params.dependencies ? { dependencies: params.dependencies } : {}),
    }),
    "utf-8",
  );
}

async function installArchiveFixture(params: { fileName: string; contents: Buffer }) {
  const fixture = writeArchiveFixture(params);
  const result = await installHooksFromArchive({
    archivePath: fixture.archivePath,
    hooksDir: fixture.hooksDir,
  });
  return { fixture, result };
}

function expectPathInstallFailureContains(
  result: Awaited<ReturnType<typeof installHooksFromPath>>,
  snippet: string,
) {
  expect(result.ok).toBe(false);
  if (result.ok) {
    throw new Error("expected install failure");
  }
  expect(result.error).toContain(snippet);
}

describe("installHooksFromArchive", () => {
  it.each([
    {
      name: "zip",
      fileName: "hooks.zip",
      contents: () => zipHooksBuffer,
      expectedPackId: "zip-hooks",
      expectedHook: "zip-hook",
    },
    {
      name: "tar",
      fileName: "hooks.tar",
      contents: () => tarHooksBuffer,
      expectedPackId: "tar-hooks",
      expectedHook: "tar-hook",
    },
  ])("installs hook packs from $name archives", async (tc) => {
    const { fixture, result } = await installArchiveFixture({
      fileName: tc.fileName,
      contents: tc.contents(),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.hookPackId).toBe(tc.expectedPackId);
    expect(result.hooks).toContain(tc.expectedHook);
    expect(result.targetDir).toBe(path.join(fixture.stateDir, "hooks", tc.expectedPackId));
    expect(fs.existsSync(path.join(result.targetDir, "hooks", tc.expectedHook, "HOOK.md"))).toBe(
      true,
    );
  });

  it.each([
    {
      name: "zip",
      fileName: "traversal.zip",
      contents: () => zipTraversalBuffer,
      expectedDetail: "archive entry",
    },
    {
      name: "tar",
      fileName: "traversal.tar",
      contents: () => tarTraversalBuffer,
      expectedDetail: "escapes destination",
    },
  ])("rejects $name archives with traversal entries", async (tc) => {
    const { result } = await installArchiveFixture({
      fileName: tc.fileName,
      contents: tc.contents(),
    });
    expectInstallFailureContains(result, ["failed to extract archive", tc.expectedDetail]);
  });

  it.each([
    {
      name: "traversal-like ids",
      contents: () => tarEvilIdBuffer,
    },
    {
      name: "reserved ids",
      contents: () => tarReservedIdBuffer,
    },
  ])("rejects hook packs with $name", async (tc) => {
    const { result } = await installArchiveFixture({
      fileName: "hooks.tar",
      contents: tc.contents(),
    });
    expectInstallFailureContains(result, ["reserved path segment"]);
  });
});

describe("installHooksFromPath", () => {
  it("uses --ignore-scripts for dependency install", async () => {
    const workDir = makeTempDir();
    const stateDir = makeTempDir();
    const pkgDir = path.join(workDir, "package");
    fs.mkdirSync(path.join(pkgDir, "hooks", "one-hook"), { recursive: true });
    writeHookPackManifest({
      pkgDir,
      hooks: ["./hooks/one-hook"],
      dependencies: { "left-pad": "1.3.0" },
    });
    fs.writeFileSync(
      path.join(pkgDir, "hooks", "one-hook", "HOOK.md"),
      [
        "---",
        "name: one-hook",
        "description: One hook",
        'metadata: {"vikiclow":{"events":["command:new"]}}',
        "---",
        "",
        "# One Hook",
      ].join("\n"),
      "utf-8",
    );
    fs.writeFileSync(
      path.join(pkgDir, "hooks", "one-hook", "handler.ts"),
      "export default async () => {};\n",
      "utf-8",
    );

    const run = vi.mocked(runCommandWithTimeout);
    await expectInstallUsesIgnoreScripts({
      run,
      install: async () =>
        await installHooksFromPath({
          path: pkgDir,
          hooksDir: path.join(stateDir, "hooks"),
        }),
    });
  });

  it("installs a single hook directory", async () => {
    const stateDir = makeTempDir();
    const workDir = makeTempDir();
    const hookDir = path.join(workDir, "my-hook");
    fs.mkdirSync(hookDir, { recursive: true });
    fs.writeFileSync(
      path.join(hookDir, "HOOK.md"),
      [
        "---",
        "name: my-hook",
        "description: My hook",
        'metadata: {"vikiclow":{"events":["command:new"]}}',
        "---",
        "",
        "# My Hook",
      ].join("\n"),
      "utf-8",
    );
    fs.writeFileSync(path.join(hookDir, "handler.ts"), "export default async () => {};\n");

    const hooksDir = path.join(stateDir, "hooks");
    const result = await installHooksFromPath({ path: hookDir, hooksDir });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.hookPackId).toBe("my-hook");
    expect(result.hooks).toEqual(["my-hook"]);
    expect(result.targetDir).toBe(path.join(stateDir, "hooks", "my-hook"));
    expect(fs.existsSync(path.join(result.targetDir, "HOOK.md"))).toBe(true);
  });

  it("rejects hook pack entries that traverse outside package directory", async () => {
    const stateDir = makeTempDir();
    const workDir = makeTempDir();
    const pkgDir = path.join(workDir, "package");
    const outsideHookDir = path.join(workDir, "outside");
    fs.mkdirSync(pkgDir, { recursive: true });
    fs.mkdirSync(outsideHookDir, { recursive: true });
    writeHookPackManifest({
      pkgDir,
      hooks: ["../outside"],
    });
    fs.writeFileSync(path.join(outsideHookDir, "HOOK.md"), "---\nname: outside\n---\n", "utf-8");
    fs.writeFileSync(path.join(outsideHookDir, "handler.ts"), "export default async () => {};\n");

    const result = await installHooksFromPath({
      path: pkgDir,
      hooksDir: path.join(stateDir, "hooks"),
    });

    expectPathInstallFailureContains(result, "vikiclow.hooks entry escapes package directory");
  });

  it("rejects hook pack entries that escape via symlink", async () => {
    const stateDir = makeTempDir();
    const workDir = makeTempDir();
    const pkgDir = path.join(workDir, "package");
    const outsideHookDir = path.join(workDir, "outside");
    const linkedDir = path.join(pkgDir, "linked");
    fs.mkdirSync(pkgDir, { recursive: true });
    fs.mkdirSync(outsideHookDir, { recursive: true });
    fs.writeFileSync(path.join(outsideHookDir, "HOOK.md"), "---\nname: outside\n---\n", "utf-8");
    fs.writeFileSync(path.join(outsideHookDir, "handler.ts"), "export default async () => {};\n");
    try {
      fs.symlinkSync(outsideHookDir, linkedDir, process.platform === "win32" ? "junction" : "dir");
    } catch {
      return;
    }
    writeHookPackManifest({
      pkgDir,
      hooks: ["./linked"],
    });

    const result = await installHooksFromPath({
      path: pkgDir,
      hooksDir: path.join(stateDir, "hooks"),
    });

    expectPathInstallFailureContains(
      result,
      "vikiclow.hooks entry resolves outside package directory",
    );
  });
});

describe("installHooksFromNpmSpec", () => {
  it("uses --ignore-scripts for npm pack and cleans up temp dir", async () => {
    const stateDir = makeTempDir();

    const run = vi.mocked(runCommandWithTimeout);
    let packTmpDir = "";
    const packedName = "test-hooks-0.0.1.tgz";
    run.mockImplementation(async (argv, opts) => {
      if (argv[0] === "npm" && argv[1] === "pack") {
        packTmpDir = String(typeof opts === "number" ? "" : (opts.cwd ?? ""));
        fs.writeFileSync(path.join(packTmpDir, packedName), npmPackHooksBuffer);
        return {
          code: 0,
          stdout: JSON.stringify([
            {
              id: "@vikiclow/test-hooks@0.0.1",
              name: "@vikiclow/test-hooks",
              version: "0.0.1",
              filename: packedName,
              integrity: "sha512-hook-test",
              shasum: "hookshasum",
            },
          ]),
          stderr: "",
          signal: null,
          killed: false,
          termination: "exit",
        };
      }
      throw new Error(`unexpected command: ${argv.join(" ")}`);
    });

    const hooksDir = path.join(stateDir, "hooks");
    const result = await installHooksFromNpmSpec({
      spec: "@vikiclow/test-hooks@0.0.1",
      hooksDir,
      logger: { info: () => {}, warn: () => {} },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.hookPackId).toBe("test-hooks");
    expect(result.npmResolution?.resolvedSpec).toBe("@vikiclow/test-hooks@0.0.1");
    expect(result.npmResolution?.integrity).toBe("sha512-hook-test");
    expect(fs.existsSync(path.join(result.targetDir, "hooks", "one-hook", "HOOK.md"))).toBe(true);

    expectSingleNpmPackIgnoreScriptsCall({
      calls: run.mock.calls,
      expectedSpec: "@vikiclow/test-hooks@0.0.1",
    });

    expect(packTmpDir).not.toBe("");
    expect(fs.existsSync(packTmpDir)).toBe(false);
  });

  it("rejects non-registry npm specs", async () => {
    await expectUnsupportedNpmSpec((spec) => installHooksFromNpmSpec({ spec }));
  });

  it("aborts when integrity drift callback rejects the fetched artifact", async () => {
    const run = vi.mocked(runCommandWithTimeout);
    mockNpmPackMetadataResult(run, {
      id: "@vikiclow/test-hooks@0.0.1",
      name: "@vikiclow/test-hooks",
      version: "0.0.1",
      filename: "test-hooks-0.0.1.tgz",
      integrity: "sha512-new",
      shasum: "newshasum",
    });

    const onIntegrityDrift = vi.fn(async () => false);
    const result = await installHooksFromNpmSpec({
      spec: "@vikiclow/test-hooks@0.0.1",
      expectedIntegrity: "sha512-old",
      onIntegrityDrift,
    });
    expectIntegrityDriftRejected({
      onIntegrityDrift,
      result,
      expectedIntegrity: "sha512-old",
      actualIntegrity: "sha512-new",
    });
  });

  it("rejects bare npm specs that resolve to prerelease versions", async () => {
    const run = vi.mocked(runCommandWithTimeout);
    mockNpmPackMetadataResult(run, {
      id: "@vikiclow/test-hooks@0.0.2-beta.1",
      name: "@vikiclow/test-hooks",
      version: "0.0.2-beta.1",
      filename: "test-hooks-0.0.2-beta.1.tgz",
      integrity: "sha512-beta",
      shasum: "betashasum",
    });

    const result = await installHooksFromNpmSpec({
      spec: "@vikiclow/test-hooks",
      logger: { info: () => {}, warn: () => {} },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("prerelease version 0.0.2-beta.1");
      expect(result.error).toContain('"@vikiclow/test-hooks@beta"');
    }
  });
});

describe("gmail watcher", () => {
  it("detects address already in use errors", () => {
    expect(isAddressInUseError("listen tcp 127.0.0.1:8788: bind: address already in use")).toBe(
      true,
    );
    expect(isAddressInUseError("EADDRINUSE: address already in use")).toBe(true);
    expect(isAddressInUseError("some other error")).toBe(false);
  });
});
