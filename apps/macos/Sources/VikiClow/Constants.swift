import Foundation

// Stable identifier used for both the macOS LaunchAgent label and Nix-managed defaults suite.
// nix-vikiclow writes app defaults into this suite to survive app bundle identifier churn.
let launchdLabel = "ai.vikiclow.mac"
let gatewayLaunchdLabel = "ai.vikiclow.gateway"
let onboardingVersionKey = "vikiclow.onboardingVersion"
let onboardingSeenKey = "vikiclow.onboardingSeen"
let currentOnboardingVersion = 7
let pauseDefaultsKey = "vikiclow.pauseEnabled"
let iconAnimationsEnabledKey = "vikiclow.iconAnimationsEnabled"
let swabbleEnabledKey = "vikiclow.swabbleEnabled"
let swabbleTriggersKey = "vikiclow.swabbleTriggers"
let voiceWakeTriggerChimeKey = "vikiclow.voiceWakeTriggerChime"
let voiceWakeSendChimeKey = "vikiclow.voiceWakeSendChime"
let showDockIconKey = "vikiclow.showDockIcon"
let defaultVoiceWakeTriggers = ["vikiclow"]
let voiceWakeMaxWords = 32
let voiceWakeMaxWordLength = 64
let voiceWakeMicKey = "vikiclow.voiceWakeMicID"
let voiceWakeMicNameKey = "vikiclow.voiceWakeMicName"
let voiceWakeLocaleKey = "vikiclow.voiceWakeLocaleID"
let voiceWakeAdditionalLocalesKey = "vikiclow.voiceWakeAdditionalLocaleIDs"
let voicePushToTalkEnabledKey = "vikiclow.voicePushToTalkEnabled"
let voiceWakeValidationCompleteKey = "vikiclow.voiceWakeValidationComplete"
let talkEnabledKey = "vikiclow.talkEnabled"
let iconOverrideKey = "vikiclow.iconOverride"
let connectionModeKey = "vikiclow.connectionMode"
let remoteTargetKey = "vikiclow.remoteTarget"
let remoteIdentityKey = "vikiclow.remoteIdentity"
let remoteProjectRootKey = "vikiclow.remoteProjectRoot"
let remoteCliPathKey = "vikiclow.remoteCliPath"
let canvasEnabledKey = "vikiclow.canvasEnabled"
let cameraEnabledKey = "vikiclow.cameraEnabled"
let systemRunPolicyKey = "vikiclow.systemRunPolicy"
let systemRunAllowlistKey = "vikiclow.systemRunAllowlist"
let systemRunEnabledKey = "vikiclow.systemRunEnabled"
let locationModeKey = "vikiclow.locationMode"
let locationPreciseKey = "vikiclow.locationPreciseEnabled"
let peekabooBridgeEnabledKey = "vikiclow.peekabooBridgeEnabled"
let deepLinkKeyKey = "vikiclow.deepLinkKey"
let modelCatalogPathKey = "vikiclow.modelCatalogPath"
let modelCatalogReloadKey = "vikiclow.modelCatalogReload"
let cliInstallPromptedVersionKey = "vikiclow.cliInstallPromptedVersion"
let heartbeatsEnabledKey = "vikiclow.heartbeatsEnabled"
let debugPaneEnabledKey = "vikiclow.debugPaneEnabled"
let debugFileLogEnabledKey = "vikiclow.debug.fileLogEnabled"
let appLogLevelKey = "vikiclow.debug.appLogLevel"
let voiceWakeSupported: Bool = ProcessInfo.processInfo.operatingSystemVersion.majorVersion >= 26
