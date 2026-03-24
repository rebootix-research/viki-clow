package ai.vikiclow.app.voice

import org.junit.Assert.assertEquals
import org.junit.Test

class VoiceWakeStatusPresenterTest {
  @Test
  fun reportsReadyWhenEnabledAndListening() {
    val card =
      VoiceWakeStatusPresenter.summarize(
        micEnabled = true,
        micCooldown = false,
        micStatusText = "Listening",
        micIsSending = false,
        hasMicPermission = true,
      )

    assertEquals("Voice ready", card.title)
    assertEquals("mic", card.iconKey)
  }

  @Test
  fun reportsPermissionNeededWhenMicPermissionMissing() {
    val card =
      VoiceWakeStatusPresenter.summarize(
        micEnabled = false,
        micCooldown = false,
        micStatusText = "Off",
        micIsSending = false,
        hasMicPermission = false,
      )

    assertEquals("Voice permission needed", card.title)
    assertEquals(VoiceWakeStatusCard.Tone.ATTENTION, card.tone)
  }

  @Test
  fun reportsSendingWhileTranscribing() {
    val card =
      VoiceWakeStatusPresenter.summarize(
        micEnabled = true,
        micCooldown = false,
        micStatusText = "Listening",
        micIsSending = true,
        hasMicPermission = true,
      )

    assertEquals("Sending voice command", card.title)
    assertEquals("send", card.iconKey)
  }

  @Test
  fun reportsOffWhenDisabled() {
    val card =
      VoiceWakeStatusPresenter.summarize(
        micEnabled = false,
        micCooldown = false,
        micStatusText = "Off",
        micIsSending = false,
        hasMicPermission = true,
      )

    assertEquals("Voice off", card.title)
    assertEquals("mic-off", card.iconKey)
  }
}
