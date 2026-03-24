import Foundation
import VikiClowDiscovery
import SwiftUI
import Testing
@testable import VikiClow

@Suite(.serialized)
@MainActor
struct OnboardingVoiceValidationTests {
    @Test func `final onboarding step is blocked until voice validation completes`() {
        let state = AppState(preview: true)
        let view = OnboardingView(
            state: state,
            permissionMonitor: PermissionMonitor.shared,
            discoveryModel: GatewayDiscoveryModel(localDisplayName: InstanceIdentity.displayName))

        view.currentPage = view.pageCount - 1

        #expect(view.buttonTitle == "Validate Voice")
        #expect(view.canAdvance == false)

        state.voiceWakeValidationComplete = true

        #expect(view.buttonTitle == "Finish")
        #expect(view.canAdvance)
    }

    @Test func `voice validation resets after critical voice setup changes`() async {
        await TestIsolation.withUserDefaultsValues([
            voiceWakeValidationCompleteKey: true,
            voiceWakeMicKey: "initial-mic",
            voiceWakeLocaleKey: "en-US",
            swabbleTriggersKey: ["hey vikiclow"]
        ]) {
            let state = AppState(preview: false)

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
