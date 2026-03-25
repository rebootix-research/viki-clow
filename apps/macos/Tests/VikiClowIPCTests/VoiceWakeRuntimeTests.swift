import Foundation
import SwabbleKit
import Testing
@testable import VikiClow

struct VoiceWakeRuntimeTests {
    @Test func `trims after trigger keeps post speech`() {
        let triggers = ["claude", "vikiclow"]
        let text = "hey Claude how are you"
        #expect(VoiceWakeRuntime._testTrimmedAfterTrigger(text, triggers: triggers) == "how are you")
    }

    @Test func `trims after trigger returns original when no trigger`() {
        let triggers = ["claude"]
        let text = "good morning friend"
        #expect(VoiceWakeRuntime._testTrimmedAfterTrigger(text, triggers: triggers) == text)
    }

    @Test func `trims after first matching trigger`() {
        let triggers = ["buddy", "claude"]
        let text = "hello buddy this is after trigger claude also here"
        #expect(
            VoiceWakeRuntime._testTrimmedAfterTrigger(text, triggers: triggers)
                == "this is after trigger claude also here"
        )
    }

    @Test func `has content after trigger false when only trigger`() {
        let triggers = ["vikiclow"]
        let text = "hey vikiclow"
        #expect(!VoiceWakeRuntime._testHasContentAfterTrigger(text, triggers: triggers))
    }

    @Test func `has content after trigger true when speech continues`() {
        let triggers = ["claude"]
        let text = "claude write a note"
        #expect(VoiceWakeRuntime._testHasContentAfterTrigger(text, triggers: triggers))
    }

    @Test func `trims after chinese trigger keeps post speech`() {
        let triggers = ["\u{5C0F}\u{722A}", "vikiclow"]
        let text = "\u{563F} \u{5C0F}\u{722A} \u{5E2E}\u{6211}\u{6253}\u{5F00}\u{8BBE}\u{7F6E}"
        #expect(
            VoiceWakeRuntime._testTrimmedAfterTrigger(text, triggers: triggers)
                == "\u{5E2E}\u{6211}\u{6253}\u{5F00}\u{8BBE}\u{7F6E}"
        )
    }

    @Test func `trims after trigger handles width insensitive forms`() {
        let triggers = ["vikiclow"]
        let text = "\u{FF36}\u{FF49}\u{FF4B}\u{FF49}\u{FF23}\u{FF4C}\u{FF4F}\u{FF57} \u{8BF7}\u{5E2E}\u{6211}"
        #expect(
            VoiceWakeRuntime._testTrimmedAfterTrigger(text, triggers: triggers)
                == "\u{8BF7}\u{5E2E}\u{6211}"
        )
    }

    @Test func `gate requires gap between trigger and command`() {
        let transcript = "hey vikiclow do thing"
        let segments = makeWakeWordSegments(
            transcript: transcript,
            words: [
                ("hey", 0.0, 0.1),
                ("vikiclow", 0.2, 0.1),
                ("do", 0.35, 0.1),
                ("thing", 0.5, 0.1),
            ])
        let config = WakeWordGateConfig(triggers: ["vikiclow"], minPostTriggerGap: 0.3)
        #expect(WakeWordGate.match(transcript: transcript, segments: segments, config: config) == nil)
    }

    @Test func `gate accepts gap and extracts command`() {
        let transcript = "hey vikiclow do thing"
        let segments = makeWakeWordSegments(
            transcript: transcript,
            words: [
                ("hey", 0.0, 0.1),
                ("vikiclow", 0.2, 0.1),
                ("do", 0.9, 0.1),
                ("thing", 1.1, 0.1),
            ])
        let config = WakeWordGateConfig(triggers: ["vikiclow"], minPostTriggerGap: 0.3)
        #expect(WakeWordGate.match(transcript: transcript, segments: segments, config: config)?.command == "do thing")
    }
}
