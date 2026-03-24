package ai.vikiclow.app.node

import ai.vikiclow.app.protocol.VikiClowCalendarCommand
import ai.vikiclow.app.protocol.VikiClowCanvasA2UICommand
import ai.vikiclow.app.protocol.VikiClowCanvasCommand
import ai.vikiclow.app.protocol.VikiClowCameraCommand
import ai.vikiclow.app.protocol.VikiClowCapability
import ai.vikiclow.app.protocol.VikiClowContactsCommand
import ai.vikiclow.app.protocol.VikiClowDeviceCommand
import ai.vikiclow.app.protocol.VikiClowLocationCommand
import ai.vikiclow.app.protocol.VikiClowMotionCommand
import ai.vikiclow.app.protocol.VikiClowNotificationsCommand
import ai.vikiclow.app.protocol.VikiClowPhotosCommand
import ai.vikiclow.app.protocol.VikiClowSmsCommand
import ai.vikiclow.app.protocol.VikiClowSystemCommand

data class NodeRuntimeFlags(
  val cameraEnabled: Boolean,
  val locationEnabled: Boolean,
  val smsAvailable: Boolean,
  val voiceWakeEnabled: Boolean,
  val motionActivityAvailable: Boolean,
  val motionPedometerAvailable: Boolean,
  val debugBuild: Boolean,
)

enum class InvokeCommandAvailability {
  Always,
  CameraEnabled,
  LocationEnabled,
  SmsAvailable,
  MotionActivityAvailable,
  MotionPedometerAvailable,
  DebugBuild,
}

enum class NodeCapabilityAvailability {
  Always,
  CameraEnabled,
  LocationEnabled,
  SmsAvailable,
  VoiceWakeEnabled,
  MotionAvailable,
}

data class NodeCapabilitySpec(
  val name: String,
  val availability: NodeCapabilityAvailability = NodeCapabilityAvailability.Always,
)

data class InvokeCommandSpec(
  val name: String,
  val requiresForeground: Boolean = false,
  val availability: InvokeCommandAvailability = InvokeCommandAvailability.Always,
)

object InvokeCommandRegistry {
  val capabilityManifest: List<NodeCapabilitySpec> =
    listOf(
      NodeCapabilitySpec(name = VikiClowCapability.Canvas.rawValue),
      NodeCapabilitySpec(name = VikiClowCapability.Device.rawValue),
      NodeCapabilitySpec(name = VikiClowCapability.Notifications.rawValue),
      NodeCapabilitySpec(name = VikiClowCapability.System.rawValue),
      NodeCapabilitySpec(
        name = VikiClowCapability.Camera.rawValue,
        availability = NodeCapabilityAvailability.CameraEnabled,
      ),
      NodeCapabilitySpec(
        name = VikiClowCapability.Sms.rawValue,
        availability = NodeCapabilityAvailability.SmsAvailable,
      ),
      NodeCapabilitySpec(
        name = VikiClowCapability.VoiceWake.rawValue,
        availability = NodeCapabilityAvailability.VoiceWakeEnabled,
      ),
      NodeCapabilitySpec(
        name = VikiClowCapability.Location.rawValue,
        availability = NodeCapabilityAvailability.LocationEnabled,
      ),
      NodeCapabilitySpec(name = VikiClowCapability.Photos.rawValue),
      NodeCapabilitySpec(name = VikiClowCapability.Contacts.rawValue),
      NodeCapabilitySpec(name = VikiClowCapability.Calendar.rawValue),
      NodeCapabilitySpec(
        name = VikiClowCapability.Motion.rawValue,
        availability = NodeCapabilityAvailability.MotionAvailable,
      ),
    )

  val all: List<InvokeCommandSpec> =
    listOf(
      InvokeCommandSpec(
        name = VikiClowCanvasCommand.Present.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = VikiClowCanvasCommand.Hide.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = VikiClowCanvasCommand.Navigate.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = VikiClowCanvasCommand.Eval.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = VikiClowCanvasCommand.Snapshot.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = VikiClowCanvasA2UICommand.Push.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = VikiClowCanvasA2UICommand.PushJSONL.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = VikiClowCanvasA2UICommand.Reset.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = VikiClowSystemCommand.Notify.rawValue,
      ),
      InvokeCommandSpec(
        name = VikiClowCameraCommand.List.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = VikiClowCameraCommand.Snap.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = VikiClowCameraCommand.Clip.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = VikiClowLocationCommand.Get.rawValue,
        availability = InvokeCommandAvailability.LocationEnabled,
      ),
      InvokeCommandSpec(
        name = VikiClowDeviceCommand.Status.rawValue,
      ),
      InvokeCommandSpec(
        name = VikiClowDeviceCommand.Info.rawValue,
      ),
      InvokeCommandSpec(
        name = VikiClowDeviceCommand.Permissions.rawValue,
      ),
      InvokeCommandSpec(
        name = VikiClowDeviceCommand.Health.rawValue,
      ),
      InvokeCommandSpec(
        name = VikiClowNotificationsCommand.List.rawValue,
      ),
      InvokeCommandSpec(
        name = VikiClowNotificationsCommand.Actions.rawValue,
      ),
      InvokeCommandSpec(
        name = VikiClowPhotosCommand.Latest.rawValue,
      ),
      InvokeCommandSpec(
        name = VikiClowContactsCommand.Search.rawValue,
      ),
      InvokeCommandSpec(
        name = VikiClowContactsCommand.Add.rawValue,
      ),
      InvokeCommandSpec(
        name = VikiClowCalendarCommand.Events.rawValue,
      ),
      InvokeCommandSpec(
        name = VikiClowCalendarCommand.Add.rawValue,
      ),
      InvokeCommandSpec(
        name = VikiClowMotionCommand.Activity.rawValue,
        availability = InvokeCommandAvailability.MotionActivityAvailable,
      ),
      InvokeCommandSpec(
        name = VikiClowMotionCommand.Pedometer.rawValue,
        availability = InvokeCommandAvailability.MotionPedometerAvailable,
      ),
      InvokeCommandSpec(
        name = VikiClowSmsCommand.Send.rawValue,
        availability = InvokeCommandAvailability.SmsAvailable,
      ),
      InvokeCommandSpec(
        name = "debug.logs",
        availability = InvokeCommandAvailability.DebugBuild,
      ),
      InvokeCommandSpec(
        name = "debug.ed25519",
        availability = InvokeCommandAvailability.DebugBuild,
      ),
    )

  private val byNameInternal: Map<String, InvokeCommandSpec> = all.associateBy { it.name }

  fun find(command: String): InvokeCommandSpec? = byNameInternal[command]

  fun advertisedCapabilities(flags: NodeRuntimeFlags): List<String> {
    return capabilityManifest
      .filter { spec ->
        when (spec.availability) {
          NodeCapabilityAvailability.Always -> true
          NodeCapabilityAvailability.CameraEnabled -> flags.cameraEnabled
          NodeCapabilityAvailability.LocationEnabled -> flags.locationEnabled
          NodeCapabilityAvailability.SmsAvailable -> flags.smsAvailable
          NodeCapabilityAvailability.VoiceWakeEnabled -> flags.voiceWakeEnabled
          NodeCapabilityAvailability.MotionAvailable -> flags.motionActivityAvailable || flags.motionPedometerAvailable
        }
      }
      .map { it.name }
  }

  fun advertisedCommands(flags: NodeRuntimeFlags): List<String> {
    return all
      .filter { spec ->
        when (spec.availability) {
          InvokeCommandAvailability.Always -> true
          InvokeCommandAvailability.CameraEnabled -> flags.cameraEnabled
          InvokeCommandAvailability.LocationEnabled -> flags.locationEnabled
          InvokeCommandAvailability.SmsAvailable -> flags.smsAvailable
          InvokeCommandAvailability.MotionActivityAvailable -> flags.motionActivityAvailable
          InvokeCommandAvailability.MotionPedometerAvailable -> flags.motionPedometerAvailable
          InvokeCommandAvailability.DebugBuild -> flags.debugBuild
        }
      }
      .map { it.name }
  }
}
