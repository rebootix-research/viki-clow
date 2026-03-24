import Foundation

public enum VikiClowDeviceCommand: String, Codable, Sendable {
    case status = "device.status"
    case info = "device.info"
}

public enum VikiClowBatteryState: String, Codable, Sendable {
    case unknown
    case unplugged
    case charging
    case full
}

public enum VikiClowThermalState: String, Codable, Sendable {
    case nominal
    case fair
    case serious
    case critical
}

public enum VikiClowNetworkPathStatus: String, Codable, Sendable {
    case satisfied
    case unsatisfied
    case requiresConnection
}

public enum VikiClowNetworkInterfaceType: String, Codable, Sendable {
    case wifi
    case cellular
    case wired
    case other
}

public struct VikiClowBatteryStatusPayload: Codable, Sendable, Equatable {
    public var level: Double?
    public var state: VikiClowBatteryState
    public var lowPowerModeEnabled: Bool

    public init(level: Double?, state: VikiClowBatteryState, lowPowerModeEnabled: Bool) {
        self.level = level
        self.state = state
        self.lowPowerModeEnabled = lowPowerModeEnabled
    }
}

public struct VikiClowThermalStatusPayload: Codable, Sendable, Equatable {
    public var state: VikiClowThermalState

    public init(state: VikiClowThermalState) {
        self.state = state
    }
}

public struct VikiClowStorageStatusPayload: Codable, Sendable, Equatable {
    public var totalBytes: Int64
    public var freeBytes: Int64
    public var usedBytes: Int64

    public init(totalBytes: Int64, freeBytes: Int64, usedBytes: Int64) {
        self.totalBytes = totalBytes
        self.freeBytes = freeBytes
        self.usedBytes = usedBytes
    }
}

public struct VikiClowNetworkStatusPayload: Codable, Sendable, Equatable {
    public var status: VikiClowNetworkPathStatus
    public var isExpensive: Bool
    public var isConstrained: Bool
    public var interfaces: [VikiClowNetworkInterfaceType]

    public init(
        status: VikiClowNetworkPathStatus,
        isExpensive: Bool,
        isConstrained: Bool,
        interfaces: [VikiClowNetworkInterfaceType])
    {
        self.status = status
        self.isExpensive = isExpensive
        self.isConstrained = isConstrained
        self.interfaces = interfaces
    }
}

public struct VikiClowDeviceStatusPayload: Codable, Sendable, Equatable {
    public var battery: VikiClowBatteryStatusPayload
    public var thermal: VikiClowThermalStatusPayload
    public var storage: VikiClowStorageStatusPayload
    public var network: VikiClowNetworkStatusPayload
    public var uptimeSeconds: Double

    public init(
        battery: VikiClowBatteryStatusPayload,
        thermal: VikiClowThermalStatusPayload,
        storage: VikiClowStorageStatusPayload,
        network: VikiClowNetworkStatusPayload,
        uptimeSeconds: Double)
    {
        self.battery = battery
        self.thermal = thermal
        self.storage = storage
        self.network = network
        self.uptimeSeconds = uptimeSeconds
    }
}

public struct VikiClowDeviceInfoPayload: Codable, Sendable, Equatable {
    public var deviceName: String
    public var modelIdentifier: String
    public var systemName: String
    public var systemVersion: String
    public var appVersion: String
    public var appBuild: String
    public var locale: String

    public init(
        deviceName: String,
        modelIdentifier: String,
        systemName: String,
        systemVersion: String,
        appVersion: String,
        appBuild: String,
        locale: String)
    {
        self.deviceName = deviceName
        self.modelIdentifier = modelIdentifier
        self.systemName = systemName
        self.systemVersion = systemVersion
        self.appVersion = appVersion
        self.appBuild = appBuild
        self.locale = locale
    }
}
