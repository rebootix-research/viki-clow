import type { VikiClowConfig } from "../config/config.js";
import type { DmScope } from "../config/types.base.js";
import type { ToolProfileId } from "../config/types.tools.js";

export const ONBOARDING_DEFAULT_DM_SCOPE: DmScope = "per-channel-peer";
export const ONBOARDING_DEFAULT_TOOLS_PROFILE: ToolProfileId = "coding";
export const ONBOARDING_DEFAULT_THINKING_LEVEL = "adaptive";
export const ONBOARDING_DEFAULT_HEARTBEAT_EVERY = "30m";
export const ONBOARDING_DEFAULT_POST_COMPACTION_SECTIONS = [
  "Session Startup",
  "Execution Rule",
  "Red Lines",
] as const;
export const ONBOARDING_DEFAULT_SUBAGENT_MAX_SPAWN_DEPTH = 2;
export const ONBOARDING_DEFAULT_SUBAGENT_MAX_CHILDREN = 8;
export const ONBOARDING_DEFAULT_SUBAGENT_ARCHIVE_AFTER_MINUTES = 180;

type AgentDefaults = NonNullable<NonNullable<VikiClowConfig["agents"]>["defaults"]>;

export function applyOnboardingAutonomyDefaults(
  defaults: AgentDefaults | undefined,
): AgentDefaults {
  const heartbeat = defaults?.heartbeat ?? {};
  const subagents = defaults?.subagents ?? {};
  const compaction = defaults?.compaction ?? {};

  return {
    ...defaults,
    thinkingDefault: defaults?.thinkingDefault ?? ONBOARDING_DEFAULT_THINKING_LEVEL,
    heartbeat: {
      ...heartbeat,
      every: heartbeat.every ?? ONBOARDING_DEFAULT_HEARTBEAT_EVERY,
      lightContext: heartbeat.lightContext ?? true,
      suppressToolErrorWarnings: heartbeat.suppressToolErrorWarnings ?? true,
      target: heartbeat.target ?? "none",
    },
    subagents: {
      ...subagents,
      maxSpawnDepth: subagents.maxSpawnDepth ?? ONBOARDING_DEFAULT_SUBAGENT_MAX_SPAWN_DEPTH,
      maxChildrenPerAgent:
        subagents.maxChildrenPerAgent ?? ONBOARDING_DEFAULT_SUBAGENT_MAX_CHILDREN,
      archiveAfterMinutes:
        subagents.archiveAfterMinutes ?? ONBOARDING_DEFAULT_SUBAGENT_ARCHIVE_AFTER_MINUTES,
    },
    compaction: {
      ...compaction,
      postCompactionSections: compaction.postCompactionSections ?? [
        ...ONBOARDING_DEFAULT_POST_COMPACTION_SECTIONS,
      ],
    },
  };
}

export function applyOnboardingLocalWorkspaceConfig(
  baseConfig: VikiClowConfig,
  workspaceDir: string,
): VikiClowConfig {
  const agentDefaults = applyOnboardingAutonomyDefaults(baseConfig.agents?.defaults);
  return {
    ...baseConfig,
    agents: {
      ...baseConfig.agents,
      defaults: {
        ...agentDefaults,
        workspace: workspaceDir,
      },
    },
    gateway: {
      ...baseConfig.gateway,
      mode: "local",
    },
    session: {
      ...baseConfig.session,
      dmScope: baseConfig.session?.dmScope ?? ONBOARDING_DEFAULT_DM_SCOPE,
    },
    tools: {
      ...baseConfig.tools,
      profile: baseConfig.tools?.profile ?? ONBOARDING_DEFAULT_TOOLS_PROFILE,
    },
  };
}
