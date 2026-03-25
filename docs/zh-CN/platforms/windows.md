---
read_when:
  - åœ¨ Windows ä¸Šå®‰è£… VikiClow
  - æŸ¥æ‰¾ Windows é…å¥—åº”ç”¨çŠ¶æ€
summary: Windowsï¼ˆWSL2ï¼‰æ”¯æŒ + é…å¥—åº”ç”¨çŠ¶æ€
title: Windows (WSL2)
x-i18n:
  generated_at: "2026-02-03T07:53:19Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: c93d2263b4e5b60cb6fbe9adcb1a0ca95b70cd6feb6e63cfc4459cb18b229da0
  source_path: platforms/windows.md
  workflow: 15
---

# Windows (WSL2)

Windows ä¸Šçš„ VikiClow æŽ¨è**é€šè¿‡ WSL2**ï¼ˆæŽ¨è Ubuntuï¼‰ã€‚CLI + Gateway ç½‘å…³åœ¨ Linux å†…è¿è¡Œï¼Œè¿™ä¿æŒäº†è¿è¡Œæ—¶çš„ä¸€è‡´æ€§å¹¶ä½¿å·¥å…·å…¼å®¹æ€§å¤§å¤§æé«˜ï¼ˆNode/Bun/pnpmã€Linux äºŒè¿›åˆ¶æ–‡ä»¶ã€Skillsï¼‰ã€‚åŽŸç”Ÿ Windows å¯èƒ½æ›´æ£˜æ‰‹ã€‚WSL2 ç»™ä½ å®Œæ•´çš„ Linux ä½“éªŒâ€”â€”ä¸€æ¡å‘½ä»¤å®‰è£…ï¼š`wsl --install`ã€‚

åŽŸç”Ÿ Windows é…å¥—åº”ç”¨å·²åœ¨è®¡åˆ’ä¸­ã€‚

## å®‰è£…ï¼ˆWSL2ï¼‰

- [å…¥é—¨æŒ‡å—](/start/getting-started)ï¼ˆåœ¨ WSL å†…ä½¿ç”¨ï¼‰
- [å®‰è£…å’Œæ›´æ–°](/install/updating)
- å®˜æ–¹ WSL2 æŒ‡å—ï¼ˆMicrosoftï¼‰ï¼šhttps://learn.microsoft.com/windows/wsl/install

## Gateway ç½‘å…³

- [Gateway ç½‘å…³æ“ä½œæ‰‹å†Œ](/gateway)
- [é…ç½®](/gateway/configuration)

## Gateway ç½‘å…³æœåŠ¡å®‰è£…ï¼ˆCLIï¼‰

åœ¨ WSL2 å†…ï¼š

```
vikiclow onboard --install-daemon
```

æˆ–ï¼š

```
vikiclow gateway install
```

æˆ–ï¼š

```
vikiclow configure
```

å‡ºçŽ°æç¤ºæ—¶é€‰æ‹© **Gateway service**ã€‚

ä¿®å¤/è¿ç§»ï¼š

```
vikiclow doctor
```

## é«˜çº§ï¼šé€šè¿‡ LAN æš´éœ² WSL æœåŠ¡ï¼ˆportproxyï¼‰

WSL æœ‰è‡ªå·±çš„è™šæ‹Ÿç½‘ç»œã€‚å¦‚æžœå¦ä¸€å°æœºå™¨éœ€è¦è®¿é—®**åœ¨ WSL å†…**è¿è¡Œçš„æœåŠ¡ï¼ˆSSHã€æœ¬åœ° TTS æœåŠ¡å™¨æˆ– Gateway ç½‘å…³ï¼‰ï¼Œä½ å¿…é¡»å°† Windows ç«¯å£è½¬å‘åˆ°å½“å‰çš„ WSL IPã€‚WSL IP åœ¨é‡å¯åŽä¼šæ”¹å˜ï¼Œå› æ­¤ä½ å¯èƒ½éœ€è¦åˆ·æ–°è½¬å‘è§„åˆ™ã€‚

ç¤ºä¾‹ï¼ˆä»¥**ç®¡ç†å‘˜èº«ä»½**è¿è¡Œ PowerShellï¼‰ï¼š

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

å…è®¸ç«¯å£é€šè¿‡ Windows é˜²ç«å¢™ï¼ˆä¸€æ¬¡æ€§ï¼‰ï¼š

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

åœ¨ WSL é‡å¯åŽåˆ·æ–° portproxyï¼š

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

æ³¨æ„äº‹é¡¹ï¼š

- ä»Žå¦ä¸€å°æœºå™¨ SSH ç›®æ ‡æ˜¯ **Windows ä¸»æœº IP**ï¼ˆç¤ºä¾‹ï¼š`ssh user@windows-host -p 2222`ï¼‰ã€‚
- è¿œç¨‹èŠ‚ç‚¹å¿…é¡»æŒ‡å‘**å¯è®¿é—®çš„** Gateway ç½‘å…³ URLï¼ˆä¸æ˜¯ `127.0.0.1`ï¼‰ï¼›ä½¿ç”¨ `vikiclow status --all` ç¡®è®¤ã€‚
- ä½¿ç”¨ `listenaddress=0.0.0.0` è¿›è¡Œ LAN è®¿é—®ï¼›`127.0.0.1` ä»…ä¿æŒæœ¬åœ°è®¿é—®ã€‚
- å¦‚æžœä½ æƒ³è‡ªåŠ¨åŒ–ï¼Œæ³¨å†Œä¸€ä¸ªè®¡åˆ’ä»»åŠ¡åœ¨ç™»å½•æ—¶è¿è¡Œåˆ·æ–°æ­¥éª¤ã€‚

## WSL2 åˆ†æ­¥å®‰è£…

### 1ï¼‰å®‰è£… WSL2 + Ubuntu

æ‰“å¼€ PowerShellï¼ˆç®¡ç†å‘˜ï¼‰ï¼š

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

å¦‚æžœ Windows è¦æ±‚åˆ™é‡å¯ã€‚

### 2ï¼‰å¯ç”¨ systemdï¼ˆGateway ç½‘å…³å®‰è£…æ‰€éœ€ï¼‰

åœ¨ä½ çš„ WSL ç»ˆç«¯ä¸­ï¼š

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

ç„¶åŽä»Ž PowerShellï¼š

```powershell
wsl --shutdown
```

é‡æ–°æ‰“å¼€ Ubuntuï¼Œç„¶åŽéªŒè¯ï¼š

```bash
systemctl --user status
```

### 3ï¼‰å®‰è£… VikiClowï¼ˆåœ¨ WSL å†…ï¼‰

åœ¨ WSL å†…æŒ‰ç…§ Linux å…¥é—¨æŒ‡å—æµç¨‹ï¼š

```bash
git clone https://github.com/rebootix-research/viki-clow.git
cd vikiclow
pnpm install
pnpm ui:build # auto-installs UI deps on first run
pnpm build
vikiclow onboard
```

å®Œæ•´æŒ‡å—ï¼š[å…¥é—¨æŒ‡å—](/start/getting-started)

## Windows é…å¥—åº”ç”¨

æˆ‘ä»¬è¿˜æ²¡æœ‰ Windows é…å¥—åº”ç”¨ã€‚å¦‚æžœä½ æƒ³è®©å®ƒå®žçŽ°ï¼Œæ¬¢è¿Žè´¡çŒ®ã€‚
