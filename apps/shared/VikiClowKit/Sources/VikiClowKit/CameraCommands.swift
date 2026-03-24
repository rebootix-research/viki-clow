import Foundation

public enum VikiClowCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum VikiClowCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum VikiClowCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum VikiClowCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct VikiClowCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: VikiClowCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: VikiClowCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: VikiClowCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: VikiClowCameraImageFormat? = nil,
        deviceId: String? = nil,
        delayMs: Int? = nil)
    {
        self.facing = facing
        self.maxWidth = maxWidth
        self.quality = quality
        self.format = format
        self.deviceId = deviceId
        self.delayMs = delayMs
    }
}

public struct VikiClowCameraClipParams: Codable, Sendable, Equatable {
    public var facing: VikiClowCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: VikiClowCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: VikiClowCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: VikiClowCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}
