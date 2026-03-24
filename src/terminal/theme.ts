import chalk, { Chalk } from "chalk";
import { VIKI_PALETTE } from "./palette.js";

const hasForceColor =
  typeof process.env.FORCE_COLOR === "string" &&
  process.env.FORCE_COLOR.trim().length > 0 &&
  process.env.FORCE_COLOR.trim() !== "0";

const baseChalk = process.env.NO_COLOR && !hasForceColor ? new Chalk({ level: 0 }) : chalk;

const hex = (value: string) => baseChalk.hex(value);

export const theme = {
  accent: hex(VIKI_PALETTE.accent),
  accentBright: hex(VIKI_PALETTE.accentBright),
  accentDim: hex(VIKI_PALETTE.accentDim),
  info: hex(VIKI_PALETTE.info),
  success: hex(VIKI_PALETTE.success),
  warn: hex(VIKI_PALETTE.warn),
  error: hex(VIKI_PALETTE.error),
  muted: hex(VIKI_PALETTE.muted),
  heading: baseChalk.bold.hex(VIKI_PALETTE.accent),
  command: hex(VIKI_PALETTE.accentBright),
  option: hex(VIKI_PALETTE.warn),
} as const;

export const isRich = () => Boolean(baseChalk.level > 0);

export const colorize = (rich: boolean, color: (value: string) => string, value: string) =>
  rich ? color(value) : value;
