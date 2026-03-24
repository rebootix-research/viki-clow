export const VIKICLOW_CLI_ENV_VAR = "VIKICLOW_CLI";
export const VIKICLOW_CLI_ENV_VALUE = "1";

export function markVikiClowExecEnv<T extends Record<string, string | undefined>>(env: T): T {
  return {
    ...env,
    [VIKICLOW_CLI_ENV_VAR]: VIKICLOW_CLI_ENV_VALUE,
  };
}

export function ensureVikiClowExecMarkerOnProcess(
  env: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  env[VIKICLOW_CLI_ENV_VAR] = VIKICLOW_CLI_ENV_VALUE;
  return env;
}
