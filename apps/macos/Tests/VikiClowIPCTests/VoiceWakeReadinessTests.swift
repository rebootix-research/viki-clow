import Testing
@testable import VikiClow

@Suite(.serialized) struct VoiceWakeReadinessTests {
    @Test func readyWhenAllChecksPass() {
        let readiness = VoiceWakeReadinessEvaluator.evaluate(
            isEnabled: true,
            isSupported: true,
            hasPrivacyStrings: true,
            microphoneAuthorized: true,
            speechAuthorized: true,
            hasInputDevice: true)

        #expect(readiness == .ready)
    }

    @Test func disabledWhenValidatedButNotEnabled() {
        let readiness = VoiceWakeReadinessEvaluator.evaluate(
            isEnabled: false,
            isSupported: true,
            hasPrivacyStrings: true,
            microphoneAuthorized: true,
            speechAuthorized: true,
            hasInputDevice: true)

        #expect(readiness == .disabled)
    }

    @Test func reportsSpecificPermissionAndHardwareFailures() {
        #expect(
            VoiceWakeReadinessEvaluator.evaluate(
                isEnabled: true,
                isSupported: true,
                hasPrivacyStrings: false,
                microphoneAuthorized: true,
                speechAuthorized: true,
                hasInputDevice: true) == .missingPrivacyStrings)

        #expect(
            VoiceWakeReadinessEvaluator.evaluate(
                isEnabled: true,
                isSupported: true,
                hasPrivacyStrings: true,
                microphoneAuthorized: false,
                speechAuthorized: true,
                hasInputDevice: true) == .missingMicPermission)

        #expect(
            VoiceWakeReadinessEvaluator.evaluate(
                isEnabled: true,
                isSupported: true,
                hasPrivacyStrings: true,
                microphoneAuthorized: true,
                speechAuthorized: false,
                hasInputDevice: true) == .missingSpeechPermission)

        #expect(
            VoiceWakeReadinessEvaluator.evaluate(
                isEnabled: true,
                isSupported: true,
                hasPrivacyStrings: true,
                microphoneAuthorized: true,
                speechAuthorized: true,
                hasInputDevice: false) == .noInputDevice)

        #expect(
            VoiceWakeReadinessEvaluator.evaluate(
                isEnabled: true,
                isSupported: false,
                hasPrivacyStrings: true,
                microphoneAuthorized: true,
                speechAuthorized: true,
                hasInputDevice: true) == .unsupported)
    }
}
