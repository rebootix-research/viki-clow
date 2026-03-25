import Foundation
import VikiClowDiscovery
import SwiftUI
import Testing
@testable import VikiClow

@Suite(.serialized)
@MainActor
struct OnboardingVoiceValidationTests {
    @Test func `final onboarding step is blocked until voice validation completes`() async {
        await TestIsolation.withUserDefaultsValues([
            voiceWakeValidationCompleteKey: false,
        ]) {
            let state = AppState(preview: true)
            state.voiceWakeValidationComplete = false
            let view = OnboardingView(
                state: state,
                permissionMonitor: PermissionMonitor.shared,
                discoveryModel: GatewayDiscoveryModel(localDisplayName: InstanceIdentity.displayName))
            let finalPage = view.pageCount - 1

            #expect(view.buttonTitle(forPage: finalPage) == "Validate Voice")
            #expect(view.canAdvance(forPage: finalPage) == false)

            state.voiceWakeValidationComplete = true

            #expect(view.buttonTitle(forPage: finalPage) == "Finish")
            #expect(view.canAdvance(forPage: finalPage))
        }
    }

    @Test func `voice validation resets after critical voice setup changes`() async {
        await TestIsolation.withUserDefaultsValues([
            voiceWakeValidationCompleteKey: true,
            voiceWakeMicKey: "initial-mic",
            voiceWakeLocaleKey: "en-US",
            swabbleTriggersKey: ["hey vikiclow"],
        ]) {
            let state = AppState(preview: false, treatTestsAsPreview: false)

            #expect(state.voiceWakeValidationComplete)

            state.voiceWakeMicID = "external-mic"
            #expect(state.voiceWakeValidationComplete == false)

            state.voiceWakeValidationComplete = true
            state.voiceWakeLocaleID = "de-DE"
            #expect(state.voiceWakeValidationComplete == false)

            state.voiceWakeValidationComplete = true
            state.swabbleTriggerWords = ["new trigger"]
            #expect(state.voiceWakeValidationComplete == false)
        }
    }
}
