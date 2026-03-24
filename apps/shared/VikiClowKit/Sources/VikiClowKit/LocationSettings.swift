import Foundation

public enum VikiClowLocationMode: String, Codable, Sendable, CaseIterable {
    case off
    case whileUsing
    case always
}
