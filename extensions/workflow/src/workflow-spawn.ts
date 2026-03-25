import {
  applyWindowsSpawnProgramPolicy,
  materializeWindowsSpawnProgram,
  resolveWindowsSpawnProgramCandidate,
} from "vikiclow/plugin-sdk/workflow";

type SpawnTarget = {
  command: string;
  argv: string[];
  windowsHide?: boolean;
};

export function resolveWindowsWorkflowSpawn(
  execPath: string,
  argv: string[],
  env: NodeJS.ProcessEnv,
): SpawnTarget {
  const candidate = resolveWindowsSpawnProgramCandidate({
    command: execPath,
    env,
    packageName: "viki-workflow",
  });
  const program = applyWindowsSpawnProgramPolicy({
    candidate,
    allowShellFallback: false,
  });
  const resolved = materializeWindowsSpawnProgram(program, argv);
  if (resolved.shell) {
    throw new Error("workflow wrapper resolved to shell fallback unexpectedly");
  }
  return {
    command: resolved.command,
    argv: resolved.argv,
    windowsHide: resolved.windowsHide,
  };
}
