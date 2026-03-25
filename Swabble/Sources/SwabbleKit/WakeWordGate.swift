import Foundation

public struct WakeWordSegment: Equatable, Sendable {
    public let text: String
    public let start: TimeInterval
    public let duration: TimeInterval
    public let range: Range<String.Index>?
    public var end: TimeInterval { self.start + self.duration }

    public init(text: String, start: TimeInterval, duration: TimeInterval, range: Range<String.Index>?) {
        self.text = text
        self.start = start
        self.duration = duration
        self.range = range
    }
}

public struct WakeWordGateConfig: Equatable, Sendable {
    public let triggers: [String]
    public let minPostTriggerGap: TimeInterval
    public let minCommandLength: Int

    public init(
        triggers: [String],
        minPostTriggerGap: TimeInterval = 0.45,
        minCommandLength: Int = 1)
    {
        self.triggers = triggers
        self.minPostTriggerGap = minPostTriggerGap
        self.minCommandLength = minCommandLength
    }
}

public struct WakeWordGateMatch: Equatable, Sendable {
    public let triggerEndTime: TimeInterval
    public let postGap: TimeInterval
    public let command: String

    public init(triggerEndTime: TimeInterval, postGap: TimeInterval, command: String) {
        self.triggerEndTime = triggerEndTime
        self.postGap = postGap
        self.command = command
    }
}

public enum WakeWordGate {
    private static let trimSet = CharacterSet.whitespacesAndNewlines.union(.punctuationCharacters)

    private static func normalize(_ text: String) -> String {
        text.trimmingCharacters(in: trimSet).lowercased()
    }

    private static func triggerTokenGroups(_ triggers: [String]) -> [[String]] {
        triggers.map { trigger in
            trigger
                .split(whereSeparator: { $0.isWhitespace })
                .map { normalize(String($0)) }
                .filter { !$0.isEmpty }
        }
    }

    public static func matchesTextOnly(text: String, triggers: [String]) -> Bool {
        let tokens = text
            .split(whereSeparator: { $0.isWhitespace })
            .map { normalize(String($0)) }
            .filter { !$0.isEmpty }
        guard !tokens.isEmpty else { return false }

        for triggerTokens in triggerTokenGroups(triggers) where !triggerTokens.isEmpty {
            guard tokens.count >= triggerTokens.count else { continue }
            if zip(triggerTokens, tokens.prefix(triggerTokens.count)).allSatisfy({ $0 == $1 }) {
                return true
            }
        }

        return false
    }

    public static func stripWake(text: String, triggers: [String]) -> String {
        for trigger in triggers {
            let token = trigger.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !token.isEmpty else { continue }
            guard let range = text.range(
                of: token,
                options: [.caseInsensitive, .diacriticInsensitive, .widthInsensitive])
            else { continue }
            return String(text[range.upperBound...].trimmingCharacters(in: .whitespacesAndNewlines))
        }

        return text.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    public static func commandText(
        transcript: String,
        segments: [WakeWordSegment],
        triggerEndTime: TimeInterval) -> String
    {
        guard let firstCommandSegment = segments.first(where: { $0.start >= triggerEndTime }) else {
            return ""
        }

        if let range = firstCommandSegment.range {
            return String(transcript[range.lowerBound...].trimmingCharacters(in: .whitespacesAndNewlines))
        }

        if let range = transcript.range(
            of: firstCommandSegment.text,
            options: [.caseInsensitive, .diacriticInsensitive, .widthInsensitive])
        {
            return String(transcript[range.lowerBound...].trimmingCharacters(in: .whitespacesAndNewlines))
        }

        return segments.map(\.text).joined(separator: " ").trimmingCharacters(in: .whitespacesAndNewlines)
    }

    public static func match(
        transcript: String,
        segments: [WakeWordSegment],
        config: WakeWordGateConfig) -> WakeWordGateMatch?
    {
        let normalizedSegments = segments.map { normalize($0.text) }

        for triggerTokens in triggerTokenGroups(config.triggers) where !triggerTokens.isEmpty {
            guard segments.count >= triggerTokens.count else { continue }

            for startIndex in 0...(segments.count - triggerTokens.count) {
                let endIndex = startIndex + triggerTokens.count
                let candidate = Array(normalizedSegments[startIndex..<endIndex])
                guard candidate == triggerTokens else { continue }

                let triggerEndSegment = segments[endIndex - 1]
                let triggerEndTime = triggerEndSegment.start + triggerEndSegment.duration

                guard let firstCommandSegment = segments[endIndex...].first(where: { $0.start >= triggerEndTime }) else {
                    continue
                }

                let postGap = firstCommandSegment.start - triggerEndTime
                guard postGap >= config.minPostTriggerGap else { continue }

                let command = commandText(
                    transcript: transcript,
                    segments: Array(segments[endIndex...]),
                    triggerEndTime: firstCommandSegment.start,
                )
                let trimmed = command.trimmingCharacters(in: .whitespacesAndNewlines)
                guard trimmed.count >= config.minCommandLength else { continue }

                return WakeWordGateMatch(
                    triggerEndTime: triggerEndTime,
                    postGap: postGap,
                    command: trimmed,
                )
            }
        }

        let stripped = stripWake(text: transcript, triggers: config.triggers)
        guard matchesTextOnly(text: transcript, triggers: config.triggers) else { return nil }
        let trimmed = stripped.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.count >= config.minCommandLength else { return nil }
        return WakeWordGateMatch(triggerEndTime: 0, postGap: 0, command: trimmed)
    }
}

public struct WakeWordSpeechSegmentSnapshot: Equatable, Sendable {
    public let text: String
    public let start: TimeInterval
    public let duration: TimeInterval
    public let rangeLocation: Int
    public let rangeLength: Int

    public init(
        text: String,
        start: TimeInterval,
        duration: TimeInterval,
        rangeLocation: Int,
        rangeLength: Int)
    {
        self.text = text
        self.start = start
        self.duration = duration
        self.rangeLocation = rangeLocation
        self.rangeLength = rangeLength
    }
}

public enum WakeWordSpeechSegments {
    public static func from(
        snapshots: [WakeWordSpeechSegmentSnapshot],
        transcript: String) -> [WakeWordSegment]
    {
        snapshots.map { segment in
            let nsRange = NSRange(location: segment.rangeLocation, length: segment.rangeLength)
            let range = Range(nsRange, in: transcript)
            return WakeWordSegment(
                text: segment.text,
                start: segment.start,
                duration: segment.duration,
                range: range
            )
        }
    }
}
