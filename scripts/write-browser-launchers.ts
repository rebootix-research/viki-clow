#!/usr/bin/env -S node --import tsx

import { writeNativeVikiBrowserLaunchers } from "../src/browser/native-launcher.ts";

const paths = await writeNativeVikiBrowserLaunchers();

console.log(`browser-launchers: wrote ${paths.nodeLauncherPath}`);
console.log(`browser-launchers: wrote ${paths.windowsCmdPath}`);
console.log(`browser-launchers: wrote ${paths.windowsPs1Path}`);
console.log(`browser-launchers: wrote ${paths.unixLauncherPath}`);
