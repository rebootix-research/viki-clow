---
read_when:
  - ä»Žé›¶å¼€å§‹é¦–æ¬¡è®¾ç½®
  - ä½ æƒ³è¦ä»Žå®‰è£… â†’ æ–°æ‰‹å¼•å¯¼ â†’ ç¬¬ä¸€æ¡æ¶ˆæ¯çš„æœ€å¿«è·¯å¾„
summary: æ–°æ‰‹æŒ‡å—ï¼šä»Žé›¶åˆ°ç¬¬ä¸€æ¡æ¶ˆæ¯ï¼ˆå‘å¯¼ã€è®¤è¯ã€æ¸ é“ã€é…å¯¹ï¼‰
title: å…¥é—¨æŒ‡å—
x-i18n:
  generated_at: "2026-02-03T07:54:14Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: 78cfa02eb2e4ea1a83e18edd99d142dbae707ec063e8d74c9a54f94581aa067f
  source_path: start/getting-started.md
  workflow: 15
---

# å…¥é—¨æŒ‡å—

ç›®æ ‡ï¼šå°½å¿«ä»Ž**é›¶**åˆ°**ç¬¬ä¸€ä¸ªå¯ç”¨èŠå¤©**ï¼ˆä½¿ç”¨åˆç†çš„é»˜è®¤å€¼ï¼‰ã€‚

æœ€å¿«èŠå¤©ï¼šæ‰“å¼€ Control UIï¼ˆæ— éœ€æ¸ é“è®¾ç½®ï¼‰ã€‚è¿è¡Œ `vikiclow dashboard` å¹¶åœ¨æµè§ˆå™¨ä¸­èŠå¤©ï¼Œæˆ–åœ¨ Gateway ç½‘å…³ä¸»æœºä¸Šæ‰“å¼€ `http://127.0.0.1:18789/`ã€‚æ–‡æ¡£ï¼š[Dashboard](/web/dashboard) å’Œ [Control UI](/web/control-ui)ã€‚

æŽ¨èè·¯å¾„ï¼šä½¿ç”¨ **CLI æ–°æ‰‹å¼•å¯¼å‘å¯¼**ï¼ˆ`vikiclow onboard`ï¼‰ã€‚å®ƒè®¾ç½®ï¼š

- æ¨¡åž‹/è®¤è¯ï¼ˆæŽ¨è OAuthï¼‰
- Gateway ç½‘å…³è®¾ç½®
- æ¸ é“ï¼ˆWhatsApp/Telegram/Discord/Mattermostï¼ˆæ’ä»¶ï¼‰/...ï¼‰
- é…å¯¹é»˜è®¤å€¼ï¼ˆå®‰å…¨ç§ä¿¡ï¼‰
- å·¥ä½œåŒºå¼•å¯¼ + Skills
- å¯é€‰çš„åŽå°æœåŠ¡

å¦‚æžœä½ æƒ³è¦æ›´æ·±å…¥çš„å‚è€ƒé¡µé¢ï¼Œè·³è½¬åˆ°ï¼š[å‘å¯¼](/start/wizard)ã€[è®¾ç½®](/start/setup)ã€[é…å¯¹](/channels/pairing)ã€[å®‰å…¨](/gateway/security)ã€‚

æ²™ç®±æ³¨æ„äº‹é¡¹ï¼š`agents.defaults.sandbox.mode: "non-main"` ä½¿ç”¨ `session.mainKey`ï¼ˆé»˜è®¤ `"main"`ï¼‰ï¼Œå› æ­¤ç¾¤ç»„/æ¸ é“ä¼šè¯ä¼šè¢«æ²™ç®±éš”ç¦»ã€‚å¦‚æžœä½ æƒ³è¦ä¸»æ™ºèƒ½ä½“å§‹ç»ˆåœ¨ä¸»æœºä¸Šè¿è¡Œï¼Œè®¾ç½®æ˜¾å¼çš„æ¯æ™ºèƒ½ä½“è¦†ç›–ï¼š

```json
{
  "routing": {
    "agents": {
      "main": {
        "workspace": "~/.vikiclow/workspace",
        "sandbox": { "mode": "off" }
      }
    }
  }
}
```

## 0) å‰ç½®æ¡ä»¶

- Node `>=22`
- `pnpm`ï¼ˆå¯é€‰ï¼›å¦‚æžœä»Žæºä»£ç æž„å»ºåˆ™æŽ¨èï¼‰
- **æŽ¨èï¼š**Brave Search API å¯†é’¥ç”¨äºŽç½‘é¡µæœç´¢ã€‚æœ€ç®€å•çš„æ–¹å¼ï¼š`vikiclow configure --section web`ï¼ˆå­˜å‚¨ `tools.web.search.apiKey`ï¼‰ã€‚å‚è§ [Web å·¥å…·](/tools/web)ã€‚

macOSï¼šå¦‚æžœä½ è®¡åˆ’æž„å»ºåº”ç”¨ï¼Œå®‰è£… Xcode / CLTã€‚ä»…ç”¨äºŽ CLI + Gateway ç½‘å…³çš„è¯ï¼ŒNode å°±è¶³å¤Ÿäº†ã€‚
Windowsï¼šä½¿ç”¨ **WSL2**ï¼ˆæŽ¨è Ubuntuï¼‰ã€‚å¼ºçƒˆæŽ¨è WSL2ï¼›åŽŸç”Ÿ Windows æœªç»æµ‹è¯•ï¼Œé—®é¢˜æ›´å¤šï¼Œå·¥å…·å…¼å®¹æ€§æ›´å·®ã€‚å…ˆå®‰è£… WSL2ï¼Œç„¶åŽåœ¨ WSL å†…è¿è¡Œ Linux æ­¥éª¤ã€‚å‚è§ [Windows (WSL2)](/platforms/windows)ã€‚

## 1) å®‰è£… CLIï¼ˆæŽ¨èï¼‰

```bash
curl -fsSL https://vikiclow.ai/install.sh | bash
```

å®‰è£…ç¨‹åºé€‰é¡¹ï¼ˆå®‰è£…æ–¹æ³•ã€éžäº¤äº’å¼ã€ä»Ž GitHubï¼‰ï¼š[å®‰è£…](/install)ã€‚

Windows (PowerShell)ï¼š

```powershell
iwr -useb https://vikiclow.ai/install.ps1 | iex
```

æ›¿ä»£æ–¹æ¡ˆï¼ˆå…¨å±€å®‰è£…ï¼‰ï¼š

```bash
npm install -g vikiclow@latest
```

```bash
pnpm add -g vikiclow@latest
```

## 2) è¿è¡Œæ–°æ‰‹å¼•å¯¼å‘å¯¼ï¼ˆå¹¶å®‰è£…æœåŠ¡ï¼‰

```bash
vikiclow onboard --install-daemon
```

ä½ å°†é€‰æ‹©ï¼š

- **æœ¬åœ° vs è¿œç¨‹** Gateway ç½‘å…³
- **è®¤è¯**ï¼šOpenAI Code (Codex) è®¢é˜…ï¼ˆOAuthï¼‰æˆ– API å¯†é’¥ã€‚å¯¹äºŽ Anthropic æˆ‘ä»¬æŽ¨è API å¯†é’¥ï¼›ä¹Ÿæ”¯æŒ `claude setup-token`ã€‚
- **æä¾›å•†**ï¼šWhatsApp QR ç™»å½•ã€Telegram/Discord æœºå™¨äººä»¤ç‰Œã€Mattermost æ’ä»¶ä»¤ç‰Œç­‰ã€‚
- **å®ˆæŠ¤è¿›ç¨‹**ï¼šåŽå°å®‰è£…ï¼ˆlaunchd/systemdï¼›WSL2 ä½¿ç”¨ systemdï¼‰
  - **è¿è¡Œæ—¶**ï¼šNodeï¼ˆæŽ¨èï¼›WhatsApp/Telegram å¿…éœ€ï¼‰ã€‚**ä¸æŽ¨è** Bunã€‚
- **Gateway ç½‘å…³ä»¤ç‰Œ**ï¼šå‘å¯¼é»˜è®¤ç”Ÿæˆä¸€ä¸ªï¼ˆå³ä½¿åœ¨ loopback ä¸Šï¼‰å¹¶å­˜å‚¨åœ¨ `gateway.auth.token`ã€‚

å‘å¯¼æ–‡æ¡£ï¼š[å‘å¯¼](/start/wizard)

### å‡­è¯ï¼šå­˜å‚¨ä½ç½®ï¼ˆé‡è¦ï¼‰

- **æŽ¨èçš„ Anthropic è·¯å¾„ï¼š**è®¾ç½® API å¯†é’¥ï¼ˆå‘å¯¼å¯ä»¥ä¸ºæœåŠ¡ä½¿ç”¨å­˜å‚¨å®ƒï¼‰ã€‚å¦‚æžœä½ æƒ³å¤ç”¨ Claude Code å‡­è¯ï¼Œä¹Ÿæ”¯æŒ `claude setup-token`ã€‚

- OAuth å‡­è¯ï¼ˆæ—§ç‰ˆå¯¼å…¥ï¼‰ï¼š`~/.vikiclow/credentials/oauth.json`
- è®¤è¯é…ç½®æ–‡ä»¶ï¼ˆOAuth + API å¯†é’¥ï¼‰ï¼š`~/.vikiclow/agents/<agentId>/agent/auth-profiles.json`

æ— å¤´/æœåŠ¡å™¨æç¤ºï¼šå…ˆåœ¨æ™®é€šæœºå™¨ä¸Šå®Œæˆ OAuthï¼Œç„¶åŽå°† `oauth.json` å¤åˆ¶åˆ° Gateway ç½‘å…³ä¸»æœºã€‚

## 3) å¯åŠ¨ Gateway ç½‘å…³

å¦‚æžœä½ åœ¨æ–°æ‰‹å¼•å¯¼æœŸé—´å®‰è£…äº†æœåŠ¡ï¼ŒGateway ç½‘å…³åº”è¯¥å·²ç»åœ¨è¿è¡Œï¼š

```bash
vikiclow gateway status
```

æ‰‹åŠ¨è¿è¡Œï¼ˆå‰å°ï¼‰ï¼š

```bash
vikiclow gateway --port 18789 --verbose
```

Dashboardï¼ˆlocal loopbackï¼‰ï¼š`http://127.0.0.1:18789/`
å¦‚æžœé…ç½®äº†ä»¤ç‰Œï¼Œå°†å…¶ç²˜è´´åˆ° Control UI è®¾ç½®ä¸­ï¼ˆå­˜å‚¨ä¸º `connect.params.auth.token`ï¼‰ã€‚

âš ï¸ **Bun è­¦å‘Šï¼ˆWhatsApp + Telegramï¼‰ï¼š**Bun ä¸Žè¿™äº›æ¸ é“å­˜åœ¨å·²çŸ¥é—®é¢˜ã€‚å¦‚æžœä½ ä½¿ç”¨ WhatsApp æˆ– Telegramï¼Œè¯·ä½¿ç”¨ **Node** è¿è¡Œ Gateway ç½‘å…³ã€‚

## 3.5) å¿«é€ŸéªŒè¯ï¼ˆ2 åˆ†é’Ÿï¼‰

```bash
vikiclow status
vikiclow health
vikiclow security audit --deep
```

## 4) é…å¯¹ + è¿žæŽ¥ä½ çš„ç¬¬ä¸€ä¸ªèŠå¤©ç•Œé¢

### WhatsAppï¼ˆQR ç™»å½•ï¼‰

```bash
vikiclow channels login
```

é€šè¿‡ WhatsApp â†’ è®¾ç½® â†’ é“¾æŽ¥è®¾å¤‡æ‰«æã€‚

WhatsApp æ–‡æ¡£ï¼š[WhatsApp](/channels/whatsapp)

### Telegram / Discord / å…¶ä»–

å‘å¯¼å¯ä»¥ä¸ºä½ å†™å…¥ä»¤ç‰Œ/é…ç½®ã€‚å¦‚æžœä½ æ›´å–œæ¬¢æ‰‹åŠ¨é…ç½®ï¼Œä»Žè¿™é‡Œå¼€å§‹ï¼š

- Telegramï¼š[Telegram](/channels/telegram)
- Discordï¼š[Discord](/channels/discord)
- Mattermostï¼ˆæ’ä»¶ï¼‰ï¼š[Mattermost](/channels/mattermost)

**Telegram ç§ä¿¡æç¤ºï¼š**ä½ çš„ç¬¬ä¸€æ¡ç§ä¿¡ä¼šè¿”å›žé…å¯¹ç ã€‚æ‰¹å‡†å®ƒï¼ˆè§ä¸‹ä¸€æ­¥ï¼‰ï¼Œå¦åˆ™æœºå™¨äººä¸ä¼šå“åº”ã€‚

## 5) ç§ä¿¡å®‰å…¨ï¼ˆé…å¯¹å®¡æ‰¹ï¼‰

é»˜è®¤å§¿æ€ï¼šæœªçŸ¥ç§ä¿¡ä¼šèŽ·å¾—ä¸€ä¸ªçŸ­ä»£ç ï¼Œæ¶ˆæ¯åœ¨æ‰¹å‡†ä¹‹å‰ä¸ä¼šè¢«å¤„ç†ã€‚å¦‚æžœä½ çš„ç¬¬ä¸€æ¡ç§ä¿¡æ²¡æœ‰æ”¶åˆ°å›žå¤ï¼Œæ‰¹å‡†é…å¯¹ï¼š

```bash
vikiclow pairing list whatsapp
vikiclow pairing approve whatsapp <code>
```

é…å¯¹æ–‡æ¡£ï¼š[é…å¯¹](/channels/pairing)

## ä»Žæºä»£ç ï¼ˆå¼€å‘ï¼‰

å¦‚æžœä½ æ­£åœ¨å¼€å‘ VikiClow æœ¬èº«ï¼Œä»Žæºä»£ç è¿è¡Œï¼š

```bash
git clone https://github.com/rebootix-research/viki-clow.git
cd vikiclow
pnpm install
pnpm ui:build # é¦–æ¬¡è¿è¡Œæ—¶è‡ªåŠ¨å®‰è£… UI ä¾èµ–
pnpm build
vikiclow onboard --install-daemon
```

å¦‚æžœä½ è¿˜æ²¡æœ‰å…¨å±€å®‰è£…ï¼Œä»Žä»“åº“é€šè¿‡ `pnpm vikiclow ...` è¿è¡Œæ–°æ‰‹å¼•å¯¼æ­¥éª¤ã€‚`pnpm build` ä¹Ÿä¼šæ‰“åŒ… A2UI èµ„æºï¼›å¦‚æžœä½ åªéœ€è¦è¿è¡Œé‚£ä¸ªæ­¥éª¤ï¼Œä½¿ç”¨ `pnpm canvas:a2ui:bundle`ã€‚

Gateway ç½‘å…³ï¼ˆä»Žæ­¤ä»“åº“ï¼‰ï¼š

```bash
node vikiclow.mjs gateway --port 18789 --verbose
```

## 7) éªŒè¯ç«¯åˆ°ç«¯

åœ¨æ–°ç»ˆç«¯ä¸­ï¼Œå‘é€æµ‹è¯•æ¶ˆæ¯ï¼š

```bash
vikiclow message send --target +15555550123 --message "Hello from VikiClow"
```

å¦‚æžœ `vikiclow health` æ˜¾ç¤º"æœªé…ç½®è®¤è¯"ï¼Œå›žåˆ°å‘å¯¼è®¾ç½® OAuth/å¯†é’¥è®¤è¯â€”â€”æ²¡æœ‰å®ƒæ™ºèƒ½ä½“å°†æ— æ³•å“åº”ã€‚

æç¤ºï¼š`vikiclow status --all` æ˜¯æœ€ä½³çš„å¯ç²˜è´´ã€åªè¯»è°ƒè¯•æŠ¥å‘Šã€‚
å¥åº·æŽ¢æµ‹ï¼š`vikiclow health`ï¼ˆæˆ– `vikiclow status --deep`ï¼‰å‘è¿è¡Œä¸­çš„ Gateway ç½‘å…³è¯·æ±‚å¥åº·å¿«ç…§ã€‚

## ä¸‹ä¸€æ­¥ï¼ˆå¯é€‰ï¼Œä½†å¾ˆæ£’ï¼‰

- macOS èœå•æ åº”ç”¨ + è¯­éŸ³å”¤é†’ï¼š[macOS åº”ç”¨](/platforms/macos)
- iOS/Android èŠ‚ç‚¹ï¼ˆCanvas/ç›¸æœº/è¯­éŸ³ï¼‰ï¼š[èŠ‚ç‚¹](/nodes)
- è¿œç¨‹è®¿é—®ï¼ˆSSH éš§é“ / Tailscale Serveï¼‰ï¼š[è¿œç¨‹è®¿é—®](/gateway/remote) å’Œ [Tailscale](/gateway/tailscale)
- å¸¸å¼€ / VPN è®¾ç½®ï¼š[è¿œç¨‹è®¿é—®](/gateway/remote)ã€[exe.dev](/install/exe-dev)ã€[Hetzner](/install/hetzner)ã€[macOS è¿œç¨‹](/platforms/mac/remote)
