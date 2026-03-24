# VikiClow iOS

The iOS app is the mobile companion surface for VikiClow.

It is not positioned as a toy client. It is a node-style execution surface that can pair with the gateway, participate in operator flows, and expose device capabilities in a controlled way.

## Current release posture

- Public App Store distribution: not available
- Internal/beta distribution: local archive + TestFlight
- Local development path: Xcode source build

The app is still evolving, but it is no longer documented as an internal-only novelty. Treat it as a serious companion surface under active hardening.

## Manual build

```bash
pnpm install
./scripts/ios-configure-signing.sh
cd apps/ios
xcodegen generate
open VikiClow.xcodeproj
```

## Beta archive

```bash
pnpm ios:beta:archive
```

Upload to TestFlight:

```bash
pnpm ios:beta
```

## What the app is for

- pairing with the VikiClow gateway
- chat and talk surfaces
- camera, canvas, screen, location, and mobile-device workflows
- operator notifications and reconnect-aware companion behavior

## Expectations

- foreground behavior is the primary reliability target today
- background recovery is still being hardened
- push, mic, camera, and location permissions must be configured correctly

## Related docs

- `docs/platforms/ios.md`
- `docs/gateway/protocol.md`
- `docs/tools/browser.md`
