# Voice Readiness Proof

This proof records the voice bootstrap and readiness changes currently wired into the Vikiclow repo.

## Mandatory setup gate

- macOS onboarding now blocks the final step until `voiceWakeValidationComplete` is true.
- The final onboarding button now reads `Validate Voice` while voice validation is still incomplete.
- The onboarding finish copy explicitly says the setup stays locked until Voice Wake validation completes.

## Native command-center readiness surfaces

- macOS Voice Wake settings show a readiness banner before the toggle/test controls.
- macOS Voice Wake settings show a completion callout after a successful validation run.
- Android voice tab shows a dedicated readiness banner built from `VoiceWakeStatusPresenter`.

## Validation persistence

- `voiceWakeValidationComplete` is persisted in app state.
- Changing the mic, locale, or trigger set resets validation so setup must be re-proven after voice-critical changes.
- The Voice Wake tester reuses the shared privacy-string check used by the readiness evaluator.
- The onboarding regression test now proves the reset rule for mic, locale, and trigger edits.

## Proof coverage added

- `apps/macos/Tests/VikiClowIPCTests/VoiceWakeReadinessTests.swift`
- `apps/macos/Tests/VikiClowIPCTests/OnboardingVoiceValidationTests.swift`
- `apps/android/app/src/test/java/ai/vikiclow/app/voice/VoiceWakeStatusPresenterTest.kt`

## Verification performed in this shell

- Source-level inspection confirmed the onboarding gate, settings banner, and Android banner are wired into the live UI paths.
- Targeted Android unit execution was attempted earlier in this lane, but this machine does not currently expose `JAVA_HOME` or `java`.
- Swift test execution is not available in this shell because the `swift` toolchain is absent from `PATH`.

## Remaining blockers

- Native test execution still depends on local macOS Swift and Android Java toolchains being present on the host.
- The repository changes are in place, but end-to-end native runtime proof cannot be fully executed from this Windows shell alone.
