package ai.vikiclow.app.node

import ai.vikiclow.app.protocol.VikiClowCalendarCommand
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
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class InvokeCommandRegistryTest {
  private val coreCapabilities =
    setOf(
      VikiClowCapability.Canvas.rawValue,
      VikiClowCapability.Device.rawValue,
      VikiClowCapability.Notifications.rawValue,
      VikiClowCapability.System.rawValue,
      VikiClowCapability.Photos.rawValue,
      VikiClowCapability.Contacts.rawValue,
      VikiClowCapability.Calendar.rawValue,
    )

  private val optionalCapabilities =
    setOf(
      VikiClowCapability.Camera.rawValue,
      VikiClowCapability.Location.rawValue,
      VikiClowCapability.Sms.rawValue,
      VikiClowCapability.VoiceWake.rawValue,
      VikiClowCapability.Motion.rawValue,
    )

  private val coreCommands =
    setOf(
      VikiClowDeviceCommand.Status.rawValue,
      VikiClowDeviceCommand.Info.rawValue,
      VikiClowDeviceCommand.Permissions.rawValue,
      VikiClowDeviceCommand.Health.rawValue,
      VikiClowNotificationsCommand.List.rawValue,
      VikiClowNotificationsCommand.Actions.rawValue,
      VikiClowSystemCommand.Notify.rawValue,
      VikiClowPhotosCommand.Latest.rawValue,
      VikiClowContactsCommand.Search.rawValue,
      VikiClowContactsCommand.Add.rawValue,
      VikiClowCalendarCommand.Events.rawValue,
      VikiClowCalendarCommand.Add.rawValue,
    )

  private val optionalCommands =
    setOf(
      VikiClowCameraCommand.Snap.rawValue,
      VikiClowCameraCommand.Clip.rawValue,
      VikiClowCameraCommand.List.rawValue,
      VikiClowLocationCommand.Get.rawValue,
      VikiClowMotionCommand.Activity.rawValue,
      VikiClowMotionCommand.Pedometer.rawValue,
      VikiClowSmsCommand.Send.rawValue,
    )

  private val debugCommands = setOf("debug.logs", "debug.ed25519")

  @Test
  fun advertisedCapabilities_respectsFeatureAvailability() {
    val capabilities = InvokeCommandRegistry.advertisedCapabilities(defaultFlags())

    assertContainsAll(capabilities, coreCapabilities)
    assertMissingAll(capabilities, optionalCapabilities)
  }

  @Test
  fun advertisedCapabilities_includesFeatureCapabilitiesWhenEnabled() {
    val capabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          smsAvailable = true,
          voiceWakeEnabled = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
        ),
      )

    assertContainsAll(capabilities, coreCapabilities + optionalCapabilities)
  }

  @Test
  fun advertisedCommands_respectsFeatureAvailability() {
    val commands = InvokeCommandRegistry.advertisedCommands(defaultFlags())

    assertContainsAll(commands, coreCommands)
    assertMissingAll(commands, optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_includesFeatureCommandsWhenEnabled() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          smsAvailable = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
          debugBuild = true,
        ),
      )

    assertContainsAll(commands, coreCommands + optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_onlyIncludesSupportedMotionCommands() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        NodeRuntimeFlags(
          cameraEnabled = false,
          locationEnabled = false,
          smsAvailable = false,
          voiceWakeEnabled = false,
          motionActivityAvailable = true,
          motionPedometerAvailable = false,
          debugBuild = false,
        ),
      )

    assertTrue(commands.contains(VikiClowMotionCommand.Activity.rawValue))
    assertFalse(commands.contains(VikiClowMotionCommand.Pedometer.rawValue))
  }

  private fun defaultFlags(
    cameraEnabled: Boolean = false,
    locationEnabled: Boolean = false,
    smsAvailable: Boolean = false,
    voiceWakeEnabled: Boolean = false,
    motionActivityAvailable: Boolean = false,
    motionPedometerAvailable: Boolean = false,
    debugBuild: Boolean = false,
  ): NodeRuntimeFlags =
    NodeRuntimeFlags(
      cameraEnabled = cameraEnabled,
      locationEnabled = locationEnabled,
      smsAvailable = smsAvailable,
      voiceWakeEnabled = voiceWakeEnabled,
      motionActivityAvailable = motionActivityAvailable,
      motionPedometerAvailable = motionPedometerAvailable,
      debugBuild = debugBuild,
    )

  private fun assertContainsAll(actual: List<String>, expected: Set<String>) {
    expected.forEach { value -> assertTrue(actual.contains(value)) }
  }

  private fun assertMissingAll(actual: List<String>, forbidden: Set<String>) {
    forbidden.forEach { value -> assertFalse(actual.contains(value)) }
  }
}
