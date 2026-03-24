const ANSI_RE = /\x1b\[[0-9;]*m/g;

export function normalizeTestText(input: string): string {
  return input
    .replace(ANSI_RE, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
