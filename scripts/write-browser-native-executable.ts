#!/usr/bin/env -S node --import tsx

import { packageNativeVikiBrowserExecutable } from "../src/browser/native-packager.ts";

async function main() {
  if (process.platform !== "win32") {
    console.log("browser-native-executable: skipped (Windows-only packaging path)");
    return;
  }
  const result = await packageNativeVikiBrowserExecutable();
  console.log(`browser-native-executable: wrote ${result.executablePath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
