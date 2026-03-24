import AppKit
import AVFoundation
import Foundation
import Speech
import SwiftUI
import SwabbleKit

enum VoiceWakeReadiness: Equatable {
    case ready
    case disabled
    case unsupported
    case missingPrivacyStrings
    case missingMicPermission
    case missingSpeechPermission
    case noInputDevice

    var headline: String {
        switch self {
        case .ready:
            "Voice Wake is active"
        case .disabled:
            "Voice Wake is ready"
        case .unsupported:
            "Voice Wake is unavailable"
        case .missingPrivacyStrings:
            "Voice permissions need a rebuild"
        case .missingMicPermission:
            "Microphone access is required"
        case .missingSpeechPermission:
            "Speech recognition access is required"
        case .noInputDevice:
            "No usable microphone detected"
        }
    }

    var detail: String {
        switch self {
        case .ready:
            "Mic, speech recognition, and input device checks all passed."
        case .disabled:
            "The voice stack is validated. Turn Voice Wake on to start listening."
        case .unsupported:
            "Voice Wake needs macOS 26 or newer on this machine."
        case .missingPrivacyStrings:
            "Rebuild the app so the microphone and speech usage descriptions are bundled."
        case .missingMicPermission:
            "Open System Settings and allow microphone access for VikiClow."
        case .missingSpeechPermission:
            "Open System Settings and allow speech recognition for VikiClow."
        case .noInputDevice:
            "Connect or select a microphone before enabling Voice Wake."
        }
    }

    var symbolName: String {
        switch self {
        case .ready:
            "checkmark.seal.fill"
        case .disabled:
            "waveform.circle.fill"
        case .unsupported, .missingPrivacyStrings, .missingMicPermission, .missingSpeechPermission, .noInputDevice:
            "exclamationmark.triangle.fill"
        }
    }

    var tint: Color {
        switch self {
        case .ready:
            .green
        case .disabled:
            .accentColor
        case .unsupported, .missingPrivacyStrings, .missingMicPermission, .missingSpeechPermission, .noInputDevice:
            .orange
        }
    }

    var background: Color {
        switch self {
        case .ready:
            Color.green.opacity(0.12)
        case .disabled:
            Color.accentColor.opacity(0.12)
        case .unsupported, .missingPrivacyStrings, .missingMicPermission, .missingSpeechPermission, .noInputDevice:
            Color.orange.opacity(0.12)
        }
    }

    var border: Color {
        self.tint.opacity(0.28)
    }
}

enum VoiceWakeReadinessEvaluator {
    static func evaluate(
        isEnabled: Bool,
        isSupported: Bool,
        hasPrivacyStrings: Bool,
        microphoneAuthorized: Bool,
        speechAuthorized: Bool,
        hasInputDevice: Bool) -> VoiceWakeReadiness
    {
        guard isSupported else { return .unsupported }
        guard hasPrivacyStrings else { return .missingPrivacyStrings }
        guard microphoneAuthorized else { return .missingMicPermission }
        guard speechAuthorized else { return .missingSpeechPermission }
        guard hasInputDevice else { return .noInputDevice }
        return isEnabled ? .ready : .disabled
    }

    static func current(for state: AppState) -> VoiceWakeReadiness {
        let speechStatus = SFSpeechRecognizer.authorizationStatus()
        let micStatus = AVCaptureDevice.authorizationStatus(for: .audio)
        return self.evaluate(
            isEnabled: state.swabbleEnabled,
            isSupported: voiceWakeSupported,
            hasPrivacyStrings: self.hasPrivacyStrings(),
            microphoneAuthorized: micStatus == .authorized,
            speechAuthorized: speechStatus == .authorized,
            hasInputDevice: AudioInputDeviceObserver.hasUsableDefaultInputDevice())
    }

    static func hasPrivacyStrings() -> Bool {
        let speech = Bundle.main.object(forInfoDictionaryKey: "NSSpeechRecognitionUsageDescription") as? String
        let mic = Bundle.main.object(forInfoDictionaryKey: "NSMicrophoneUsageDescription") as? String
        return speech?.isEmpty == false && mic?.isEmpty == false
    }
}

struct VoiceWakeReadinessBanner: View {
    let readiness: VoiceWakeReadiness

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: self.readiness.symbolName)
                .font(.title3.weight(.semibold))
                .foregroundStyle(self.readiness.tint)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 3) {
                Text(self.readiness.headline)
                    .font(.callout.weight(.semibold))
                Text(self.readiness.detail)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer(minLength: 0)
        }
        .padding(12)
        .background(self.readiness.background)
        .overlay(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .stroke(self.readiness.border, lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}
