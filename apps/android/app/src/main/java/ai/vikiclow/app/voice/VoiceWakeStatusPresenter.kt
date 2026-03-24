package ai.vikiclow.app.voice

internal data class VoiceWakeStatusCard(
  val title: String,
  val detail: String,
  val iconKey: String,
  val tone: Tone,
) {
  enum class Tone {
    READY,
    ATTENTION,
    IDLE,
    BUSY,
  }
}

internal object VoiceWakeStatusPresenter {
  fun summarize(
    micEnabled: Boolean,
    micCooldown: Boolean,
    micStatusText: String,
    micIsSending: Boolean,
    hasMicPermission: Boolean,
  ): VoiceWakeStatusCard {
    val status = micStatusText.trim()
    val statusLower = status.lowercase()

    if (!hasMicPermission || statusLower.contains("permission")) {
      return VoiceWakeStatusCard(
        title = "Voice permission needed",
        detail =
          if (status.isNotBlank()) status else "Grant microphone access in system settings before enabling voice.",
        iconKey = "mic.slash",
        tone = VoiceWakeStatusCard.Tone.ATTENTION,
      )
    }

    if (micIsSending) {
      return VoiceWakeStatusCard(
        title = "Sending voice command",
        detail = "Your transcript is leaving the device now.",
        iconKey = "send",
        tone = VoiceWakeStatusCard.Tone.BUSY,
      )
    }

    if (micCooldown) {
      return VoiceWakeStatusCard(
        title = "Voice cooldown",
        detail = "Waiting a moment before the next capture starts.",
        iconKey = "schedule",
        tone = VoiceWakeStatusCard.Tone.IDLE,
      )
    }

    if (micEnabled) {
      return if (statusLower.contains("unavailable") || statusLower.contains("failed")) {
        VoiceWakeStatusCard(
          title = "Voice needs attention",
          detail = status.ifBlank { "The wake listener could not start." },
          iconKey = "warning",
          tone = VoiceWakeStatusCard.Tone.ATTENTION,
        )
      } else {
        VoiceWakeStatusCard(
          title = "Voice ready",
          detail = "Listening for wake words. Speak the trigger phrase to capture a command.",
          iconKey = "mic",
          tone = VoiceWakeStatusCard.Tone.READY,
        )
      }
    }

    return VoiceWakeStatusCard(
      title = "Voice off",
      detail = "Tap the mic button to start the wake listener.",
      iconKey = "mic-off",
      tone = VoiceWakeStatusCard.Tone.IDLE,
    )
  }
}
