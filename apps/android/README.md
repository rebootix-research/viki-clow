# VikiClow Android

The Android app is VikiClow's mobile command-center and node surface for Android devices.

It is actively evolving, but the product direction is clear: secure pairing, polished onboarding, voice and screen surfaces, and reliable device-linked execution.

## Current release posture

- Development build: supported
- Internal/beta hardening: active
- Final public release hardening: still in progress

## Build and run

```bash
cd apps/android
./gradlew :app:assembleDebug
./gradlew :app:installDebug
./gradlew :app:testDebugUnitTest
```

## Open in Android Studio

Open:

- `apps/android`

## What this app covers

- onboarding and gateway connection
- setup code and manual connection flows
- chat and talk surfaces
- voice and screen tabs
- encrypted local persistence for gateway state
- permission-driven device workflows

## Device execution role

When paired, the Android app can participate in real operator workflows:

- canvas/screen surfaces
- camera and media capture
- location-aware flows
- push-backed gateway updates

## Notes

- Keep the app foregrounded for the most reliable command and screen behavior during testing.
- Native verification on this repo depends on Android toolchains being present on the host machine.
- For integration and pairing flows, see `docs/platforms/android.md`.
