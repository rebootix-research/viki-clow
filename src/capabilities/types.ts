export type CapabilityKind =
  | "core_tool"
  | "installable_skill"
  | "generated_local_skill"
  | "runtime_adapter"
  | "downloadable_asset";

export type CapabilityStatus = "ready" | "provisioned" | "missing" | "failed";

export type CapabilityRouteSource = "objective" | "derived" | "bootstrap";

export type CapabilityRouteMetadata = {
  source: CapabilityRouteSource;
  matchedHints: string[];
  derivedFrom?: CapabilityId[];
};

export type CapabilitySourceKind =
  | "binary"
  | "runtime_adapter"
  | "workspace_artifact"
  | "generated_skill";

export type CapabilitySourceDescriptor = {
  kind: CapabilitySourceKind;
  command?: string;
  args?: string[];
  path?: string;
  create?: boolean;
  notes?: string;
  installLabel?: string;
};

export type CapabilityFoundryKind =
  | "skill"
  | "plugin"
  | "mcp_server"
  | "repo_integration"
  | "asset_dependency";

export type CapabilityFoundryState =
  | "discovered"
  | "fetched"
  | "inspected"
  | "sandboxed"
  | "tested"
  | "promoted"
  | "rejected"
  | "bundled";

export type CapabilityFoundryScope = "bundled" | "optional" | "experimental" | "rejected";

export type CapabilityFoundryOutcome = "suggested" | "success" | "failure";

export type CapabilityFoundrySourceKind = "local_repo" | "github_repo" | "npm_registry";

export type CapabilityFoundryInstallMethod =
  | "workspace_copy"
  | "plugin_enable"
  | "npm_pack"
  | "git_clone"
  | "download";

export type CapabilityFoundryCompatibility = "compatible" | "wrapped" | "manual" | "incompatible";

export type CapabilityFoundrySource = {
  kind: CapabilityFoundrySourceKind;
  sourceUrl: string;
  repo?: string;
  packageName?: string;
  ref?: string;
  localPath?: string;
  installMethod: CapabilityFoundryInstallMethod;
  dependencies: string[];
  notes?: string;
};

export type CapabilityFoundryClassification = {
  objectiveHints: string[];
  tags: string[];
  selectionNotes: string[];
};

export type CapabilityFoundrySandbox = {
  path: string;
  fetchedAt?: string;
  inspectedAt?: string;
};

export type CapabilityFoundryTestStatus = "pending" | "passed" | "failed" | "skipped";

export type CapabilityFoundryTestResult = {
  status: CapabilityFoundryTestStatus;
  summary: string;
  command?: string[];
  testedAt?: string;
  proofPath?: string;
};

export type CapabilityFoundryRuntimeRegistration = {
  kind: CapabilityFoundryKind;
  targetId: string;
  entrypoint: string;
  path?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  autoBundled: boolean;
  routeHints: string[];
  usageRecipe?: string;
};

export type CapabilityFoundryUsageSummary = {
  suggested: number;
  success: number;
  failure: number;
  lastOutcome?: CapabilityFoundryOutcome;
  lastUsedAt?: string;
};

export type CapabilityFoundryCandidate = {
  id: string;
  name: string;
  type: CapabilityFoundryKind;
  summary: string;
  compatibility: CapabilityFoundryCompatibility;
  scope: CapabilityFoundryScope;
  state: CapabilityFoundryState;
  source: CapabilityFoundrySource;
  classification: CapabilityFoundryClassification;
  sandbox?: CapabilityFoundrySandbox;
  provenance: {
    version?: string;
    license?: string;
    sourceRef?: string;
    dependencies: string[];
    fetchedFrom?: string;
  };
  test: CapabilityFoundryTestResult;
  registration?: CapabilityFoundryRuntimeRegistration;
  promotedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  usage: CapabilityFoundryUsageSummary;
  notes?: string[];
};

export type CapabilityFoundryUsageRecord = {
  candidateId: string;
  objective: string;
  outcome: CapabilityFoundryOutcome;
  recordedAt: string;
  missionId?: string;
  note?: string;
};

export type CapabilityFoundryRegistry = {
  version: 1;
  generatedAt: string;
  updatedAt: string;
  sourceCatalogRevision: string;
  workspaceDir?: string;
  supportedSources: string[];
  candidates: CapabilityFoundryCandidate[];
  usage: CapabilityFoundryUsageRecord[];
};

export type CapabilityFoundryRoute = {
  candidateId: string;
  name: string;
  type: CapabilityFoundryKind;
  score: number;
  reasons: string[];
  scope: CapabilityFoundryScope;
  state: CapabilityFoundryState;
  sourceUrl: string;
  registration?: CapabilityFoundryRuntimeRegistration;
  usage: CapabilityFoundryUsageSummary;
};

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
  source: CapabilitySourceDescriptor;
  aliases?: string[];
};

export type CapabilityRecord = {
  id: CapabilityId;
  label: string;
  kind: CapabilityKind;
  status: CapabilityStatus;
  checkedAt: string;
  details?: string;
  source?: CapabilitySourceDescriptor;
  objective?: string;
  matchedHints?: string[];
  inspectedBy?: "discover" | "fetch" | "bootstrap" | "plan";
  route?: CapabilityRouteMetadata;
  usageCount?: number;
};

export type CapabilityDiscoveryRecord = CapabilityRecord & {
  relevance: "direct" | "related" | "available";
  matchReasons: string[];
};

export type CapabilityRegistry = {
  version: 2;
  generatedAt: string;
  catalogRevision: string;
  objective?: string;
  records: CapabilityRecord[];
};

export type CapabilityPlan = {
  objective: string;
  inferred: CapabilityId[];
  discovered?: CapabilityDiscoveryRecord[];
  ready: CapabilityRecord[];
  provisioned: CapabilityRecord[];
  missing: CapabilityRecord[];
  failed: CapabilityRecord[];
  catalogRevision?: string;
  registryPath?: string;
  routing?: Array<
    CapabilityRouteMetadata & {
      id: CapabilityId;
      usageCount: number;
    }
  >;
  foundry?: {
    registryPath: string;
    discovered: number;
    promoted: number;
    bundled: number;
    rejected: number;
    routes: CapabilityFoundryRoute[];
  };
  generatedSkillPath?: string;
};
