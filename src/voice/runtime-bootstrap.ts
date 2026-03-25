import fs from "node:fs/promises";
import path from "node:path";
import { hasBinary } from "../agents/skills.js";
import type { VikiClowConfig } from "../config/config.js";
import { resolveConfigDir } from "../utils.js";

export type VoiceRuntimeBootstrapStatus = {
  version: 1;
  generatedAt: string;
  required: true;
  ready: boolean;
  configDir: string;
  manifestPath: string;
  dirs: {
    base: string;
    wakeword: string;
    stt: string;
    tts: string;
    logs: string;
  };
  plugins: {
    talkVoiceEnabled: boolean;
    phoneControlEnabled: boolean;
    devicePairEnabled: boolean;
    voiceCallAvailable: boolean;
  };
  localBackends: {
    sherpaConfigured: boolean;
    sherpaRuntimeDir?: string;
    sherpaModelDir?: string;
    whisperConfigured: boolean;
    whisperBinaryPresent: boolean;
  };
  notes: string[];
};

function isEnabled(cfg: VikiClowConfig, pluginId: string): boolean {
  return cfg.plugins?.entries?.[pluginId]?.enabled !== false;
}

function readSkillEnv(cfg: VikiClowConfig, skillKey: string, envName: string): string | undefined {
  const value = cfg.skills?.entries?.[skillKey]?.env?.[envName];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function ensureVoiceRuntimeBootstrap(params: {
  cfg: VikiClowConfig;
  env?: NodeJS.ProcessEnv;
}): Promise<VoiceRuntimeBootstrapStatus> {
  const env = params.env ?? process.env;
  const configDir = resolveConfigDir(env);
  const base = path.join(configDir, "voice");
  const dirs = {
    base,
    wakeword: path.join(base, "wakeword"),
    stt: path.join(base, "stt"),
    tts: path.join(base, "tts"),
    logs: path.join(base, "logs"),
  };
  await Promise.all(Object.values(dirs).map((dir) => fs.mkdir(dir, { recursive: true })));

  const sherpaRuntimeDir = readSkillEnv(params.cfg, "sherpa-onnx-tts", "SHERPA_ONNX_RUNTIME_DIR");
  const sherpaModelDir = readSkillEnv(params.cfg, "sherpa-onnx-tts", "SHERPA_ONNX_MODEL_DIR");
  const whisperConfigured =
    Boolean(env.WHISPER_MODEL) ||
    Boolean(readSkillEnv(params.cfg, "openai-whisper", "WHISPER_MODEL"));
  const whisperBinaryPresent = hasBinary("whisper");
  const sttReady = whisperConfigured || whisperBinaryPresent;
  const ttsReady = Boolean(sherpaRuntimeDir && sherpaModelDir);
  const talkVoiceEnabled = isEnabled(params.cfg, "talk-voice");

  const status: VoiceRuntimeBootstrapStatus = {
    version: 1,
    generatedAt: new Date().toISOString(),
    required: true,
    ready: talkVoiceEnabled && ttsReady && sttReady,
    configDir,
    manifestPath: path.join(base, "bootstrap-manifest.json"),
    dirs,
    plugins: {
      talkVoiceEnabled,
      phoneControlEnabled: isEnabled(params.cfg, "phone-control"),
      devicePairEnabled: isEnabled(params.cfg, "device-pair"),
      voiceCallAvailable: params.cfg.plugins?.entries?.["voice-call"]?.enabled !== false,
    },
    localBackends: {
      sherpaConfigured: Boolean(sherpaRuntimeDir && sherpaModelDir),
      sherpaRuntimeDir,
      sherpaModelDir,
      whisperConfigured,
      whisperBinaryPresent,
    },
    notes: [],
  };

  if (!status.plugins.talkVoiceEnabled) {
    status.ready = false;
    status.notes.push("talk-voice plugin is not enabled");
  }
  if (!status.localBackends.sherpaConfigured) {
    status.ready = false;
    status.notes.push("Local sherpa-onnx TTS assets are not fully configured yet");
  }
  if (!sttReady) {
    status.ready = false;
    status.notes.push("Local Whisper STT is not configured yet");
  }

  await fs.writeFile(status.manifestPath, `${JSON.stringify(status, null, 2)}\n`, "utf8");
  return status;
}
