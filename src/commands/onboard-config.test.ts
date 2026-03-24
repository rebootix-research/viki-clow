import { describe, expect, it } from "vitest";
import type { VikiClowConfig } from "../config/config.js";
import {
  applyOnboardingAutonomyDefaults,
  applyOnboardingLocalWorkspaceConfig,
  ONBOARDING_DEFAULT_DM_SCOPE,
  ONBOARDING_DEFAULT_HEARTBEAT_EVERY,
  ONBOARDING_DEFAULT_POST_COMPACTION_SECTIONS,
  ONBOARDING_DEFAULT_SUBAGENT_ARCHIVE_AFTER_MINUTES,
  ONBOARDING_DEFAULT_SUBAGENT_MAX_CHILDREN,
  ONBOARDING_DEFAULT_SUBAGENT_MAX_SPAWN_DEPTH,
  ONBOARDING_DEFAULT_THINKING_LEVEL,
  ONBOARDING_DEFAULT_TOOLS_PROFILE,
} from "./onboard-config.js";

describe("applyOnboardingLocalWorkspaceConfig", () => {
  it("defaults local onboarding tool profile to coding", () => {
    expect(ONBOARDING_DEFAULT_TOOLS_PROFILE).toBe("coding");
  });

  it("sets secure dmScope default when unset", () => {
    const baseConfig: VikiClowConfig = {};
    const result = applyOnboardingLocalWorkspaceConfig(baseConfig, "/tmp/workspace");

    expect(result.session?.dmScope).toBe(ONBOARDING_DEFAULT_DM_SCOPE);
    expect(result.gateway?.mode).toBe("local");
    expect(result.agents?.defaults?.workspace).toBe("/tmp/workspace");
    expect(result.agents?.defaults?.thinkingDefault).toBe(ONBOARDING_DEFAULT_THINKING_LEVEL);
    expect(result.agents?.defaults?.heartbeat).toMatchObject({
      every: ONBOARDING_DEFAULT_HEARTBEAT_EVERY,
      lightContext: true,
      suppressToolErrorWarnings: true,
      target: "none",
    });
    expect(result.agents?.defaults?.subagents).toMatchObject({
      maxSpawnDepth: ONBOARDING_DEFAULT_SUBAGENT_MAX_SPAWN_DEPTH,
      maxChildrenPerAgent: ONBOARDING_DEFAULT_SUBAGENT_MAX_CHILDREN,
      archiveAfterMinutes: ONBOARDING_DEFAULT_SUBAGENT_ARCHIVE_AFTER_MINUTES,
    });
    expect(result.agents?.defaults?.compaction?.postCompactionSections).toEqual(
      ONBOARDING_DEFAULT_POST_COMPACTION_SECTIONS,
    );
    expect(result.tools?.profile).toBe(ONBOARDING_DEFAULT_TOOLS_PROFILE);
  });

  it("preserves existing dmScope when already configured", () => {
    const baseConfig: VikiClowConfig = {
      session: {
        dmScope: "main",
      },
    };
    const result = applyOnboardingLocalWorkspaceConfig(baseConfig, "/tmp/workspace");

    expect(result.session?.dmScope).toBe("main");
  });

  it("preserves explicit non-main dmScope values", () => {
    const baseConfig: VikiClowConfig = {
      session: {
        dmScope: "per-account-channel-peer",
      },
    };
    const result = applyOnboardingLocalWorkspaceConfig(baseConfig, "/tmp/workspace");

    expect(result.session?.dmScope).toBe("per-account-channel-peer");
  });

  it("preserves an explicit tools.profile when already configured", () => {
    const baseConfig: VikiClowConfig = {
      tools: {
        profile: "full",
      },
    };
    const result = applyOnboardingLocalWorkspaceConfig(baseConfig, "/tmp/workspace");

    expect(result.tools?.profile).toBe("full");
  });

  it("preserves explicit autonomy defaults when already configured", () => {
    const baseConfig: VikiClowConfig = {
      agents: {
        defaults: {
          thinkingDefault: "high",
          heartbeat: {
            every: "2h",
            lightContext: false,
            suppressToolErrorWarnings: false,
            target: "last",
          },
          subagents: {
            maxSpawnDepth: 3,
            maxChildrenPerAgent: 4,
            archiveAfterMinutes: 45,
          },
          compaction: {
            postCompactionSections: ["Boot Sequence", "Safety"],
          },
        },
      },
    };

    const result = applyOnboardingLocalWorkspaceConfig(baseConfig, "/tmp/workspace");

    expect(result.agents?.defaults?.thinkingDefault).toBe("high");
    expect(result.agents?.defaults?.heartbeat).toMatchObject({
      every: "2h",
      lightContext: false,
      suppressToolErrorWarnings: false,
      target: "last",
    });
    expect(result.agents?.defaults?.subagents).toMatchObject({
      maxSpawnDepth: 3,
      maxChildrenPerAgent: 4,
      archiveAfterMinutes: 45,
    });
    expect(result.agents?.defaults?.compaction?.postCompactionSections).toEqual([
      "Boot Sequence",
      "Safety",
    ]);
  });
});

describe("applyOnboardingAutonomyDefaults", () => {
  it("fills in agentic defaults for onboarding-ready workspaces", () => {
    const result = applyOnboardingAutonomyDefaults(undefined);

    expect(result).toMatchObject({
      thinkingDefault: ONBOARDING_DEFAULT_THINKING_LEVEL,
      heartbeat: {
        every: ONBOARDING_DEFAULT_HEARTBEAT_EVERY,
        lightContext: true,
        suppressToolErrorWarnings: true,
        target: "none",
      },
      subagents: {
        maxSpawnDepth: ONBOARDING_DEFAULT_SUBAGENT_MAX_SPAWN_DEPTH,
        maxChildrenPerAgent: ONBOARDING_DEFAULT_SUBAGENT_MAX_CHILDREN,
        archiveAfterMinutes: ONBOARDING_DEFAULT_SUBAGENT_ARCHIVE_AFTER_MINUTES,
      },
      compaction: {
        postCompactionSections: ONBOARDING_DEFAULT_POST_COMPACTION_SECTIONS,
      },
    });
  });
});
