import CoreLocation
import Foundation
import VikiClowKit
import UIKit

typealias VikiClowCameraSnapResult = (format: String, base64: String, width: Int, height: Int)
typealias VikiClowCameraClipResult = (format: String, base64: String, durationMs: Int, hasAudio: Bool)

protocol CameraServicing: Sendable {
    func listDevices() async -> [CameraController.CameraDeviceInfo]
    func snap(params: VikiClowCameraSnapParams) async throws -> VikiClowCameraSnapResult
    func clip(params: VikiClowCameraClipParams) async throws -> VikiClowCameraClipResult
}

protocol ScreenRecordingServicing: Sendable {
    func record(
        screenIndex: Int?,
        durationMs: Int?,
        fps: Double?,
        includeAudio: Bool?,
        outPath: String?) async throws -> String
}

@MainActor
protocol LocationServicing: Sendable {
    func authorizationStatus() -> CLAuthorizationStatus
    func accuracyAuthorization() -> CLAccuracyAuthorization
    func ensureAuthorization(mode: VikiClowLocationMode) async -> CLAuthorizationStatus
    func currentLocation(
        params: VikiClowLocationGetParams,
        desiredAccuracy: VikiClowLocationAccuracy,
        maxAgeMs: Int?,
        timeoutMs: Int?) async throws -> CLLocation
    func startLocationUpdates(
        desiredAccuracy: VikiClowLocationAccuracy,
        significantChangesOnly: Bool) -> AsyncStream<CLLocation>
    func stopLocationUpdates()
    func startMonitoringSignificantLocationChanges(onUpdate: @escaping @Sendable (CLLocation) -> Void)
    func stopMonitoringSignificantLocationChanges()
}

@MainActor
protocol DeviceStatusServicing: Sendable {
    func status() async throws -> VikiClowDeviceStatusPayload
    func info() -> VikiClowDeviceInfoPayload
}

protocol PhotosServicing: Sendable {
    func latest(params: VikiClowPhotosLatestParams) async throws -> VikiClowPhotosLatestPayload
}

protocol ContactsServicing: Sendable {
    func search(params: VikiClowContactsSearchParams) async throws -> VikiClowContactsSearchPayload
    func add(params: VikiClowContactsAddParams) async throws -> VikiClowContactsAddPayload
}

protocol CalendarServicing: Sendable {
    func events(params: VikiClowCalendarEventsParams) async throws -> VikiClowCalendarEventsPayload
    func add(params: VikiClowCalendarAddParams) async throws -> VikiClowCalendarAddPayload
}

protocol RemindersServicing: Sendable {
    func list(params: VikiClowRemindersListParams) async throws -> VikiClowRemindersListPayload
    func add(params: VikiClowRemindersAddParams) async throws -> VikiClowRemindersAddPayload
}

protocol MotionServicing: Sendable {
    func activities(params: VikiClowMotionActivityParams) async throws -> VikiClowMotionActivityPayload
    func pedometer(params: VikiClowPedometerParams) async throws -> VikiClowPedometerPayload
}

struct WatchMessagingStatus: Sendable, Equatable {
    var supported: Bool
    var paired: Bool
    var appInstalled: Bool
    var reachable: Bool
    var activationState: String
}

struct WatchQuickReplyEvent: Sendable, Equatable {
    var replyId: String
    var promptId: String
    var actionId: String
    var actionLabel: String?
    var sessionKey: String?
    var note: String?
    var sentAtMs: Int?
    var transport: String
}

struct WatchNotificationSendResult: Sendable, Equatable {
    var deliveredImmediately: Bool
    var queuedForDelivery: Bool
    var transport: String
}

protocol WatchMessagingServicing: AnyObject, Sendable {
    func status() async -> WatchMessagingStatus
    func setReplyHandler(_ handler: (@Sendable (WatchQuickReplyEvent) -> Void)?)
    func sendNotification(
        id: String,
        params: VikiClowWatchNotifyParams) async throws -> WatchNotificationSendResult
}

extension CameraController: CameraServicing {}
extension ScreenRecordService: ScreenRecordingServicing {}
extension LocationService: LocationServicing {}
