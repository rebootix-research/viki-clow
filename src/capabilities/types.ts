export type CapabilityKind =
  | "core_tool"
  | "installable_skill"
  | "generated_local_skill"
  | "runtime_adapter"
  | "downloadable_asset";

export type CapabilityStatus = "ready" | "provisioned" | "missing" | "failed";

export type CapabilityId =
  | "git"
  | "node"
  | "python"
  | "ffmpeg"
  | "playwright"
  | "browser_profiles"
  | "generated_skill";

export type CapabilitySpec = {
  id: CapabilityId;
  label: string;
  kind: CapabilityKind;
  summary: string;
  objectiveHints: string[];
  installLabel?: string;
};

export type CapabilityRecord = {
  id: CapabilityId;
  label: string;
  kind: CapabilityKind;
  status: CapabilityStatus;
  checkedAt: string;
  details?: string;
};

export type CapabilityPlan = {
  objective: string;
  inferred: CapabilityId[];
  ready: CapabilityRecord[];
  provisioned: CapabilityRecord[];
  missing: CapabilityRecord[];
  failed: CapabilityRecord[];
  generatedSkillPath?: string;
};
