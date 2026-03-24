package ai.vikiclow.app.protocol

import org.junit.Assert.assertEquals
import org.junit.Test

class VikiClowProtocolConstantsTest {
  @Test
  fun canvasCommandsUseStableStrings() {
    assertEquals("canvas.present", VikiClowCanvasCommand.Present.rawValue)
    assertEquals("canvas.hide", VikiClowCanvasCommand.Hide.rawValue)
    assertEquals("canvas.navigate", VikiClowCanvasCommand.Navigate.rawValue)
    assertEquals("canvas.eval", VikiClowCanvasCommand.Eval.rawValue)
    assertEquals("canvas.snapshot", VikiClowCanvasCommand.Snapshot.rawValue)
  }

  @Test
  fun a2uiCommandsUseStableStrings() {
    assertEquals("canvas.a2ui.push", VikiClowCanvasA2UICommand.Push.rawValue)
    assertEquals("canvas.a2ui.pushJSONL", VikiClowCanvasA2UICommand.PushJSONL.rawValue)
    assertEquals("canvas.a2ui.reset", VikiClowCanvasA2UICommand.Reset.rawValue)
  }

  @Test
  fun capabilitiesUseStableStrings() {
    assertEquals("canvas", VikiClowCapability.Canvas.rawValue)
    assertEquals("camera", VikiClowCapability.Camera.rawValue)
    assertEquals("voiceWake", VikiClowCapability.VoiceWake.rawValue)
    assertEquals("location", VikiClowCapability.Location.rawValue)
    assertEquals("sms", VikiClowCapability.Sms.rawValue)
    assertEquals("device", VikiClowCapability.Device.rawValue)
    assertEquals("notifications", VikiClowCapability.Notifications.rawValue)
    assertEquals("system", VikiClowCapability.System.rawValue)
    assertEquals("photos", VikiClowCapability.Photos.rawValue)
    assertEquals("contacts", VikiClowCapability.Contacts.rawValue)
    assertEquals("calendar", VikiClowCapability.Calendar.rawValue)
    assertEquals("motion", VikiClowCapability.Motion.rawValue)
  }

  @Test
  fun cameraCommandsUseStableStrings() {
    assertEquals("camera.list", VikiClowCameraCommand.List.rawValue)
    assertEquals("camera.snap", VikiClowCameraCommand.Snap.rawValue)
    assertEquals("camera.clip", VikiClowCameraCommand.Clip.rawValue)
  }

  @Test
  fun notificationsCommandsUseStableStrings() {
    assertEquals("notifications.list", VikiClowNotificationsCommand.List.rawValue)
    assertEquals("notifications.actions", VikiClowNotificationsCommand.Actions.rawValue)
  }

  @Test
  fun deviceCommandsUseStableStrings() {
    assertEquals("device.status", VikiClowDeviceCommand.Status.rawValue)
    assertEquals("device.info", VikiClowDeviceCommand.Info.rawValue)
    assertEquals("device.permissions", VikiClowDeviceCommand.Permissions.rawValue)
    assertEquals("device.health", VikiClowDeviceCommand.Health.rawValue)
  }

  @Test
  fun systemCommandsUseStableStrings() {
    assertEquals("system.notify", VikiClowSystemCommand.Notify.rawValue)
  }

  @Test
  fun photosCommandsUseStableStrings() {
    assertEquals("photos.latest", VikiClowPhotosCommand.Latest.rawValue)
  }

  @Test
  fun contactsCommandsUseStableStrings() {
    assertEquals("contacts.search", VikiClowContactsCommand.Search.rawValue)
    assertEquals("contacts.add", VikiClowContactsCommand.Add.rawValue)
  }

  @Test
  fun calendarCommandsUseStableStrings() {
    assertEquals("calendar.events", VikiClowCalendarCommand.Events.rawValue)
    assertEquals("calendar.add", VikiClowCalendarCommand.Add.rawValue)
  }

  @Test
  fun motionCommandsUseStableStrings() {
    assertEquals("motion.activity", VikiClowMotionCommand.Activity.rawValue)
    assertEquals("motion.pedometer", VikiClowMotionCommand.Pedometer.rawValue)
  }
}
