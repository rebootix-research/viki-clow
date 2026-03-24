export type GatewayErrorInfo = {
  code: string;
  message: string;
  details?: {
    code?: string;
  };
};

const NON_RECOVERABLE_AUTH_CODES = new Set([
  "AUTH_TOKEN_MISSING",
  "AUTH_PASSWORD_MISSING",
  "AUTH_PASSWORD_MISMATCH",
  "AUTH_RATE_LIMITED",
  "PAIRING_REQUIRED",
]);

export function isNonRecoverableAuthError(error?: GatewayErrorInfo): boolean {
  const detailCode = error?.details?.code?.trim();
  if (!detailCode) {
    return false;
  }
  return NON_RECOVERABLE_AUTH_CODES.has(detailCode);
}
