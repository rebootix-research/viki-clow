import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

export type VoiceBootstrapCheck = {
  id: string;
  label: string;
  file: string;
  passed: boolean;
  details: string;
};

export type VoiceBootstrapProof = {
  generatedAt: string;
  rootDir: string;
  passed: boolean;
  checks: VoiceBootstrapCheck[];
  toolchains: {
    swift: boolean;
    java: boolean;
    javaHome: string | null;
  };
};

async function readText(rootDir: string, relativePath: string): Promise<string> {
  return await fs.readFile(path.join(rootDir, relativePath), "utf8");
}

function hasAll(content: string, needles: string[]): boolean {
  return needles.every((needle) => content.includes(needle));
}

function commandAvailable(command: string): boolean {
  const probe = spawnSync(command, ["--version"], {
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: "ignore",
  });
  return probe.status === 0;
}

export async function collectVoiceBootstrapProof(
  rootDir: string = process.cwd(),
): Promise<VoiceBootstrapProof> {
  const checks: VoiceBootstrapCheck[] = [];

  const installSh = await readText(rootDir, "scripts/install.sh");
  checks.push({
    id: "install-sh-required-voice",
    label: "Unix installer keeps voice bootstrap mandatory",
    file: "scripts/install.sh",
    passed: hasAll(installSh, ["required voice bootstrap", "required voice and workspace setup"]),
    details:
      "Installer must keep onboarding incomplete until voice bootstrap finishes successfully.",
  });

  const installPs1 = await readText(rootDir, "scripts/install.ps1");
  checks.push({
    id: "install-ps1-required-voice",
    label: "Windows installer calls out voice backend and mic permissions",
    file: "scripts/install.ps1",
    passed: hasAll(installPs1, ["voice backend and mic permissions", "complete required setup"]),
    details: "PowerShell install flow must not present the voice backend as optional.",
  });

  const macOnboarding = await readText(rootDir, "apps/macos/Sources/VikiClow/Onboarding.swift");
  checks.push({
    id: "mac-onboarding-voice-gate",
    label: "macOS onboarding blocks final completion until voice validation succeeds",
    file: "apps/macos/Sources/VikiClow/Onboarding.swift",
    passed: hasAll(macOnboarding, ["Validate Voice", "voiceWakeValidationComplete"]),
    details: "The native command center must keep the final onboarding action locked.",
  });

  const macVoiceSettings = await readText(
    rootDir,
    "apps/macos/Sources/VikiClow/VoiceWakeSettings.swift",
  );
  checks.push({
    id: "mac-voice-readiness-banner",
    label: "macOS settings surface readiness and completion state",
    file: "apps/macos/Sources/VikiClow/VoiceWakeSettings.swift",
    passed: hasAll(macVoiceSettings, [
      "Voice Wake validation complete. Onboarding can finish.",
      "VoiceWakeReadinessBanner",
    ]),
    details: "Settings must expose readiness before the operator trusts the voice stack.",
  });

  const androidVoicePresenter = await readText(
    rootDir,
    "apps/android/app/src/main/java/ai/vikiclow/app/voice/VoiceWakeStatusPresenter.kt",
  );
  checks.push({
    id: "android-voice-readiness-presenter",
    label: "Android voice tab ships a readiness presenter",
    file: "apps/android/app/src/main/java/ai/vikiclow/app/voice/VoiceWakeStatusPresenter.kt",
    passed: hasAll(androidVoicePresenter, ["VoiceWakeStatusPresenter", "VoiceWakeStatusCard"]),
    details: "Android must keep a first-class readiness model instead of a silent failure path.",
  });

  const docsProof = await readText(rootDir, "docs/proofs/voice-readiness-proof.md");
  checks.push({
    id: "voice-proof-doc",
    label: "Voice readiness proof doc exists",
    file: "docs/proofs/voice-readiness-proof.md",
    passed: hasAll(docsProof, ["Mandatory setup gate", "Remaining blockers"]),
    details: "The repo should ship a persistent written proof for the native voice gate.",
  });

  const toolchains = {
    swift: commandAvailable("swift"),
    java: commandAvailable("java"),
    javaHome: process.env.JAVA_HOME?.trim() || null,
  };

  return {
    generatedAt: new Date().toISOString(),
    rootDir,
    passed: checks.every((check) => check.passed),
    checks,
    toolchains,
  };
}

export async function writeVoiceBootstrapProof(
  rootDir: string = process.cwd(),
  outDir: string = path.resolve(rootDir, ".artifacts/voice-proof"),
): Promise<{ proof: VoiceBootstrapProof; jsonPath: string; mdPath: string }> {
  const proof = await collectVoiceBootstrapProof(rootDir);
  await fs.mkdir(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "voice-proof.json");
  const mdPath = path.join(outDir, "voice-proof.md");
  await fs.writeFile(jsonPath, `${JSON.stringify(proof, null, 2)}\n`, "utf8");
  const markdown = [
    "# VikiClow Voice Bootstrap Proof",
    "",
    `- Generated at: \`${proof.generatedAt}\``,
    `- Passed: \`${proof.passed}\``,
    `- Swift available: \`${proof.toolchains.swift}\``,
    `- Java available: \`${proof.toolchains.java}\``,
    `- JAVA_HOME: \`${proof.toolchains.javaHome ?? "(unset)"}\``,
    "",
    "## Checks",
    "",
    ...proof.checks.map(
      (check) =>
        `- [${check.passed ? "x" : " "}] \`${check.id}\` - ${check.label} (\`${check.file}\`)`,
    ),
    "",
  ].join("\n");
  await fs.writeFile(mdPath, `${markdown}\n`, "utf8");
  return { proof, jsonPath, mdPath };
}
