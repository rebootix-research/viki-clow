// Default service labels (canonical + legacy compatibility)
export const GATEWAY_LAUNCH_AGENT_LABEL = "ai.vikiclow.gateway";
export const GATEWAY_SYSTEMD_SERVICE_NAME = "vikiclow-gateway";
export const GATEWAY_WINDOWS_TASK_NAME = "VikiClow Gateway";
export const GATEWAY_SERVICE_MARKER = "vikiclow";
export const GATEWAY_SERVICE_KIND = "gateway";
export const NODE_LAUNCH_AGENT_LABEL = "ai.vikiclow.node";
export const NODE_SYSTEMD_SERVICE_NAME = "vikiclow-node";
export const NODE_WINDOWS_TASK_NAME = "VikiClow Node";
export const NODE_SERVICE_MARKER = "vikiclow";
export const NODE_SERVICE_KIND = "node";
export const NODE_WINDOWS_TASK_SCRIPT_NAME = "node.cmd";
export const LEGACY_GATEWAY_LAUNCH_AGENT_LABELS: string[] = [];
const LEGACY_GATEWAY_SERVICE_PRIMARY = `viki${"clowbot"}-gateway`;
const LEGACY_GATEWAY_SERVICE_SECONDARY = `molt${"bot"}-gateway`;
export const LEGACY_GATEWAY_SYSTEMD_SERVICE_NAMES: string[] = [
  LEGACY_GATEWAY_SERVICE_PRIMARY,
  LEGACY_GATEWAY_SERVICE_SECONDARY,
];
export const LEGACY_GATEWAY_WINDOWS_TASK_NAMES: string[] = [];

export function normalizeGatewayProfile(profile?: string): string | null {
  const trimmed = profile?.trim();
  if (!trimmed || trimmed.toLowerCase() === "default") {
    return null;
  }
  return trimmed;
}

export function resolveGatewayProfileSuffix(profile?: string): string {
  const normalized = normalizeGatewayProfile(profile);
  return normalized ? `-${normalized}` : "";
}

export function resolveGatewayLaunchAgentLabel(profile?: string): string {
  const normalized = normalizeGatewayProfile(profile);
  if (!normalized) {
    return GATEWAY_LAUNCH_AGENT_LABEL;
  }
  return `ai.vikiclow.${normalized}`;
}

export function resolveLegacyGatewayLaunchAgentLabels(profile?: string): string[] {
  void profile;
  return [];
}

export function resolveGatewaySystemdServiceName(profile?: string): string {
  const suffix = resolveGatewayProfileSuffix(profile);
  if (!suffix) {
    return GATEWAY_SYSTEMD_SERVICE_NAME;
  }
  return `vikiclow-gateway${suffix}`;
}

export function resolveGatewayWindowsTaskName(profile?: string): string {
  const normalized = normalizeGatewayProfile(profile);
  if (!normalized) {
    return GATEWAY_WINDOWS_TASK_NAME;
  }
  return `VikiClow Gateway (${normalized})`;
}

export function formatGatewayServiceDescription(params?: {
  profile?: string;
  version?: string;
}): string {
  const profile = normalizeGatewayProfile(params?.profile);
  const version = params?.version?.trim();
  const parts: string[] = [];
  if (profile) {
    parts.push(`profile: ${profile}`);
  }
  if (version) {
    parts.push(`v${version}`);
  }
  if (parts.length === 0) {
    return "VikiClow Gateway";
  }
  return `VikiClow Gateway (${parts.join(", ")})`;
}

export function resolveGatewayServiceDescription(params: {
  env: Record<string, string | undefined>;
  environment?: Record<string, string | undefined>;
  description?: string;
}): string {
  return (
    params.description ??
    formatGatewayServiceDescription({
      profile: params.env.VIKICLOW_PROFILE,
      version: params.environment?.VIKICLOW_SERVICE_VERSION ?? params.env.VIKICLOW_SERVICE_VERSION,
    })
  );
}

export function resolveNodeLaunchAgentLabel(): string {
  return NODE_LAUNCH_AGENT_LABEL;
}

export function resolveNodeSystemdServiceName(): string {
  return NODE_SYSTEMD_SERVICE_NAME;
}

export function resolveNodeWindowsTaskName(): string {
  return NODE_WINDOWS_TASK_NAME;
}

export function formatNodeServiceDescription(params?: { version?: string }): string {
  const version = params?.version?.trim();
  if (!version) {
    return "VikiClow Node Host";
  }
  return `VikiClow Node Host (v${version})`;
}
