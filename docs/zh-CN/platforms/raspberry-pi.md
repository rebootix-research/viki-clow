---
read_when:
  - åœ¨ Raspberry Pi ä¸Šè®¾ç½® VikiClow æ—¶
  - åœ¨ ARM è®¾å¤‡ä¸Šè¿è¡Œ VikiClow æ—¶
  - æž„å»ºä½Žæˆæœ¬å¸¸é©»ä¸ªäºº AI æ—¶
summary: åœ¨ Raspberry Pi ä¸Šè¿è¡Œ VikiClowï¼ˆä½Žæˆæœ¬è‡ªæ‰˜ç®¡è®¾ç½®ï¼‰
title: Raspberry Pi
x-i18n:
  generated_at: "2026-02-03T07:53:30Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: 6741eaf0115a4fa0efd6599a99e0526a20ceb30eda1d9b04cba9dd5dec84bee2
  source_path: platforms/raspberry-pi.md
  workflow: 15
---

# åœ¨ Raspberry Pi ä¸Šè¿è¡Œ VikiClow

## ç›®æ ‡

åœ¨ Raspberry Pi ä¸Šè¿è¡ŒæŒä¹…ã€å¸¸é©»çš„ VikiClow Gateway ç½‘å…³ï¼Œ**ä¸€æ¬¡æ€§æˆæœ¬çº¦ $35-80**ï¼ˆæ— æœˆè´¹ï¼‰ã€‚

é€‚ç”¨äºŽï¼š

- 24/7 ä¸ªäºº AI åŠ©æ‰‹
- å®¶åº­è‡ªåŠ¨åŒ–ä¸­å¿ƒ
- ä½ŽåŠŸè€—ã€éšæ—¶å¯ç”¨çš„ Telegram/WhatsApp æœºå™¨äºº

## ç¡¬ä»¶è¦æ±‚

| Pi åž‹å·         | å†…å­˜    | æ˜¯å¦å¯ç”¨ï¼Ÿ | è¯´æ˜Ž                       |
| --------------- | ------- | ---------- | -------------------------- |
| **Pi 5**        | 4GB/8GB | âœ… æœ€ä½³    | æœ€å¿«ï¼ŒæŽ¨è                 |
| **Pi 4**        | 4GB     | âœ… è‰¯å¥½    | å¤§å¤šæ•°ç”¨æˆ·çš„æœ€ä½³é€‰æ‹©       |
| **Pi 4**        | 2GB     | âœ… å¯ä»¥    | å¯ç”¨ï¼Œæ·»åŠ äº¤æ¢ç©ºé—´         |
| **Pi 4**        | 1GB     | âš ï¸ ç´§å¼     | ä½¿ç”¨äº¤æ¢ç©ºé—´å¯è¡Œï¼Œæœ€å°é…ç½® |
| **Pi 3B+**      | 1GB     | âš ï¸ æ…¢      | å¯ç”¨ä½†è¾ƒæ…¢                 |
| **Pi Zero 2 W** | 512MB   | âŒ         | ä¸æŽ¨è                     |

**æœ€ä½Žé…ç½®ï¼š** 1GB å†…å­˜ï¼Œ1 æ ¸ï¼Œ500MB ç£ç›˜  
**æŽ¨èï¼š** 2GB+ å†…å­˜ï¼Œ64 ä½ç³»ç»Ÿï¼Œ16GB+ SD å¡ï¼ˆæˆ– USB SSDï¼‰

## ä½ éœ€è¦å‡†å¤‡

- Raspberry Pi 4 æˆ– 5ï¼ˆæŽ¨è 2GB+ï¼‰
- MicroSD å¡ï¼ˆ16GB+ï¼‰æˆ– USB SSDï¼ˆæ€§èƒ½æ›´å¥½ï¼‰
- ç”µæºï¼ˆæŽ¨èå®˜æ–¹ Pi ç”µæºï¼‰
- ç½‘ç»œè¿žæŽ¥ï¼ˆä»¥å¤ªç½‘æˆ– WiFiï¼‰
- çº¦ 30 åˆ†é’Ÿ

## 1) åˆ·å†™ç³»ç»Ÿ

ä½¿ç”¨ **Raspberry Pi OS Lite (64-bit)** â€” æ— å¤´æœåŠ¡å™¨ä¸éœ€è¦æ¡Œé¢ã€‚

1. ä¸‹è½½ [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. é€‰æ‹©ç³»ç»Ÿï¼š**Raspberry Pi OS Lite (64-bit)**
3. ç‚¹å‡»é½¿è½®å›¾æ ‡ï¼ˆâš™ï¸ï¼‰é¢„é…ç½®ï¼š
   - è®¾ç½®ä¸»æœºåï¼š`gateway-host`
   - å¯ç”¨ SSH
   - è®¾ç½®ç”¨æˆ·å/å¯†ç 
   - é…ç½® WiFiï¼ˆå¦‚æžœä¸ä½¿ç”¨ä»¥å¤ªç½‘ï¼‰
4. åˆ·å†™åˆ°ä½ çš„ SD å¡ / USB é©±åŠ¨å™¨
5. æ’å…¥å¹¶å¯åŠ¨ Pi

## 2) é€šè¿‡ SSH è¿žæŽ¥

```bash
ssh user@gateway-host
# æˆ–ä½¿ç”¨ IP åœ°å€
ssh user@192.168.x.x
```

## 3) ç³»ç»Ÿè®¾ç½®

```bash
# æ›´æ–°ç³»ç»Ÿ
sudo apt update && sudo apt upgrade -y

# å®‰è£…å¿…è¦è½¯ä»¶åŒ…
sudo apt install -y git curl build-essential

# è®¾ç½®æ—¶åŒºï¼ˆå¯¹ cron/æé†’å¾ˆé‡è¦ï¼‰
sudo timedatectl set-timezone America/Chicago  # æ”¹æˆä½ çš„æ—¶åŒº
```

## 4) å®‰è£… Node.js 22ï¼ˆARM64ï¼‰

```bash
# é€šè¿‡ NodeSource å®‰è£… Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# éªŒè¯
node --version  # åº”æ˜¾ç¤º v22.x.x
npm --version
```

## 5) æ·»åŠ äº¤æ¢ç©ºé—´ï¼ˆ2GB æˆ–æ›´å°‘å†…å­˜æ—¶å¾ˆé‡è¦ï¼‰

äº¤æ¢ç©ºé—´å¯é˜²æ­¢å†…å­˜ä¸è¶³å´©æºƒï¼š

```bash
# åˆ›å»º 2GB äº¤æ¢æ–‡ä»¶
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# æ°¸ä¹…ç”Ÿæ•ˆ
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# ä¼˜åŒ–ä½Žå†…å­˜ï¼ˆé™ä½Ž swappinessï¼‰
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) å®‰è£… VikiClow

### é€‰é¡¹ Aï¼šæ ‡å‡†å®‰è£…ï¼ˆæŽ¨èï¼‰

```bash
curl -fsSL https://vikiclow.ai/install.sh | bash
```

### é€‰é¡¹ Bï¼šå¯ä¿®æ”¹å®‰è£…ï¼ˆç”¨äºŽè°ƒè¯•ï¼‰

```bash
git clone https://github.com/rebootix-research/viki-clow.git
cd vikiclow
npm install
npm run build
npm link
```

å¯ä¿®æ”¹å®‰è£…è®©ä½ å¯ä»¥ç›´æŽ¥è®¿é—®æ—¥å¿—å’Œä»£ç  â€” å¯¹è°ƒè¯• ARM ç‰¹å®šé—®é¢˜å¾ˆæœ‰ç”¨ã€‚

## 7) è¿è¡Œæ–°æ‰‹å¼•å¯¼

```bash
vikiclow onboard --install-daemon
```

æŒ‰ç…§å‘å¯¼æ“ä½œï¼š

1. **Gateway ç½‘å…³æ¨¡å¼ï¼š** Local
2. **è®¤è¯ï¼š** æŽ¨è API å¯†é’¥ï¼ˆOAuth åœ¨æ— å¤´ Pi ä¸Šå¯èƒ½ä¸ç¨³å®šï¼‰
3. **æ¸ é“ï¼š** Telegram æœ€å®¹æ˜“ä¸Šæ‰‹
4. **å®ˆæŠ¤è¿›ç¨‹ï¼š** æ˜¯ï¼ˆsystemdï¼‰

## 8) éªŒè¯å®‰è£…

```bash
# æ£€æŸ¥çŠ¶æ€
vikiclow status

# æ£€æŸ¥æœåŠ¡
sudo systemctl status vikiclow

# æŸ¥çœ‹æ—¥å¿—
journalctl -u vikiclow -f
```

## 9) è®¿é—®ä»ªè¡¨æ¿

ç”±äºŽ Pi æ˜¯æ— å¤´çš„ï¼Œä½¿ç”¨ SSH éš§é“ï¼š

```bash
# ä»Žä½ çš„ç¬”è®°æœ¬ç”µè„‘/å°å¼æœº
ssh -L 18789:localhost:18789 user@gateway-host

# ç„¶åŽåœ¨æµè§ˆå™¨ä¸­æ‰“å¼€
open http://localhost:18789
```

æˆ–ä½¿ç”¨ Tailscale å®žçŽ°å¸¸é©»è®¿é—®ï¼š

```bash
# åœ¨ Pi ä¸Š
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# æ›´æ–°é…ç½®
vikiclow config set gateway.bind tailnet
sudo systemctl restart vikiclow
```

---

## æ€§èƒ½ä¼˜åŒ–

### ä½¿ç”¨ USB SSDï¼ˆå·¨å¤§æ”¹è¿›ï¼‰

SD å¡é€Ÿåº¦æ…¢ä¸”ä¼šç£¨æŸã€‚USB SSD å¯å¤§å¹…æå‡æ€§èƒ½ï¼š

```bash
# æ£€æŸ¥æ˜¯å¦ä»Ž USB å¯åŠ¨
lsblk
```

è®¾ç½®è¯·å‚è§ [Pi USB å¯åŠ¨æŒ‡å—](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)ã€‚

### å‡å°‘å†…å­˜ä½¿ç”¨

```bash
# ç¦ç”¨ GPU å†…å­˜åˆ†é…ï¼ˆæ— å¤´æ¨¡å¼ï¼‰
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# å¦‚ä¸éœ€è¦åˆ™ç¦ç”¨è“ç‰™
sudo systemctl disable bluetooth
```

### ç›‘æŽ§èµ„æº

```bash
# æ£€æŸ¥å†…å­˜
free -h

# æ£€æŸ¥ CPU æ¸©åº¦
vcgencmd measure_temp

# å®žæ—¶ç›‘æŽ§
htop
```

---

## ARM ç‰¹å®šè¯´æ˜Ž

### äºŒè¿›åˆ¶å…¼å®¹æ€§

å¤§å¤šæ•° VikiClow åŠŸèƒ½åœ¨ ARM64 ä¸Šå¯ç”¨ï¼Œä½†æŸäº›å¤–éƒ¨äºŒè¿›åˆ¶æ–‡ä»¶å¯èƒ½éœ€è¦ ARM æž„å»ºï¼š

| å·¥å…·               | ARM64 çŠ¶æ€ | è¯´æ˜Ž                                |
| ------------------ | ---------- | ----------------------------------- |
| Node.js            | âœ…         | è¿è¡Œè‰¯å¥½                            |
| WhatsApp (Baileys) | âœ…         | çº¯ JSï¼Œæ— é—®é¢˜                       |
| Telegram           | âœ…         | çº¯ JSï¼Œæ— é—®é¢˜                       |
| gog (Gmail CLI)    | âš ï¸         | æ£€æŸ¥æ˜¯å¦æœ‰ ARM ç‰ˆæœ¬                 |
| Chromium (browser) | âœ…         | `sudo apt install chromium-browser` |

å¦‚æžœæŸä¸ª skill å¤±è´¥ï¼Œæ£€æŸ¥å…¶äºŒè¿›åˆ¶æ–‡ä»¶æ˜¯å¦æœ‰ ARM æž„å»ºã€‚è®¸å¤š Go/Rust å·¥å…·æœ‰ï¼›æœ‰äº›æ²¡æœ‰ã€‚

### 32 ä½ vs 64 ä½

**å§‹ç»ˆä½¿ç”¨ 64 ä½ç³»ç»Ÿã€‚** Node.js å’Œè®¸å¤šçŽ°ä»£å·¥å…·éœ€è¦å®ƒã€‚ä½¿ç”¨ä»¥ä¸‹å‘½ä»¤æ£€æŸ¥ï¼š

```bash
uname -m
# åº”æ˜¾ç¤ºï¼šaarch64ï¼ˆ64 ä½ï¼‰è€Œä¸æ˜¯ armv7lï¼ˆ32 ä½ï¼‰
```

---

## æŽ¨èçš„æ¨¡åž‹è®¾ç½®

ç”±äºŽ Pi åªæ˜¯ Gateway ç½‘å…³ï¼ˆæ¨¡åž‹åœ¨äº‘ç«¯è¿è¡Œï¼‰ï¼Œä½¿ç”¨åŸºäºŽ API çš„æ¨¡åž‹ï¼š

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-20250514",
        "fallbacks": ["openai/gpt-4o-mini"]
      }
    }
  }
}
```

**ä¸è¦å°è¯•åœ¨ Pi ä¸Šè¿è¡Œæœ¬åœ° LLM** â€” å³ä½¿æ˜¯å°æ¨¡åž‹ä¹Ÿå¤ªæ…¢äº†ã€‚è®© Claude/GPT æ¥åšç¹é‡çš„å·¥ä½œã€‚

---

## å¼€æœºè‡ªå¯

æ–°æ‰‹å¼•å¯¼å‘å¯¼ä¼šè®¾ç½®è¿™ä¸ªï¼Œä½†è¦éªŒè¯ï¼š

```bash
# æ£€æŸ¥æœåŠ¡æ˜¯å¦å·²å¯ç”¨
sudo systemctl is-enabled vikiclow

# å¦‚æžœæ²¡æœ‰åˆ™å¯ç”¨
sudo systemctl enable vikiclow

# å¼€æœºå¯åŠ¨
sudo systemctl start vikiclow
```

---

## æ•…éšœæŽ’é™¤

### å†…å­˜ä¸è¶³ï¼ˆOOMï¼‰

```bash
# æ£€æŸ¥å†…å­˜
free -h

# æ·»åŠ æ›´å¤šäº¤æ¢ç©ºé—´ï¼ˆè§æ­¥éª¤ 5ï¼‰
# æˆ–å‡å°‘ Pi ä¸Šè¿è¡Œçš„æœåŠ¡
```

### æ€§èƒ½æ…¢

- ä½¿ç”¨ USB SSD ä»£æ›¿ SD å¡
- ç¦ç”¨æœªä½¿ç”¨çš„æœåŠ¡ï¼š`sudo systemctl disable cups bluetooth avahi-daemon`
- æ£€æŸ¥ CPU é™é¢‘ï¼š`vcgencmd get_throttled`ï¼ˆåº”è¿”å›ž `0x0`ï¼‰

### æœåŠ¡æ— æ³•å¯åŠ¨

```bash
# æ£€æŸ¥æ—¥å¿—
journalctl -u vikiclow --no-pager -n 100

# å¸¸è§ä¿®å¤ï¼šé‡æ–°æž„å»º
cd ~/vikiclow  # å¦‚æžœä½¿ç”¨å¯ä¿®æ”¹å®‰è£…
npm run build
sudo systemctl restart vikiclow
```

### ARM äºŒè¿›åˆ¶é—®é¢˜

å¦‚æžœæŸä¸ª skill å¤±è´¥å¹¶æ˜¾ç¤º"exec format error"ï¼š

1. æ£€æŸ¥è¯¥äºŒè¿›åˆ¶æ–‡ä»¶æ˜¯å¦æœ‰ ARM64 æž„å»º
2. å°è¯•ä»Žæºä»£ç æž„å»º
3. æˆ–ä½¿ç”¨æ”¯æŒ ARM çš„ Docker å®¹å™¨

### WiFi æ–­å¼€

å¯¹äºŽä½¿ç”¨ WiFi çš„æ— å¤´ Piï¼š

```bash
# ç¦ç”¨ WiFi ç”µæºç®¡ç†
sudo iwconfig wlan0 power off

# æ°¸ä¹…ç”Ÿæ•ˆ
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## æˆæœ¬å¯¹æ¯”

| è®¾ç½®           | ä¸€æ¬¡æ€§æˆæœ¬ | æœˆè´¹     | è¯´æ˜Ž               |
| -------------- | ---------- | -------- | ------------------ |
| **Pi 4 (2GB)** | ~$45       | $0       | + ç”µè´¹ï¼ˆçº¦ $5/å¹´ï¼‰ |
| **Pi 4 (4GB)** | ~$55       | $0       | æŽ¨è               |
| **Pi 5 (4GB)** | ~$60       | $0       | æœ€ä½³æ€§èƒ½           |
| **Pi 5 (8GB)** | ~$80       | $0       | è¿‡å‰©ä½†é¢å‘æœªæ¥     |
| DigitalOcean   | $0         | $6/æœˆ    | $72/å¹´             |
| Hetzner        | $0         | â‚¬3.79/æœˆ | çº¦ $50/å¹´          |

**å›žæœ¬æœŸï¼š** ä¸Žäº‘ VPS ç›¸æ¯”ï¼ŒPi çº¦ 6-12 ä¸ªæœˆå†…å›žæœ¬ã€‚

---

## å¦è¯·å‚é˜…

- [Linux æŒ‡å—](/platforms/linux) â€” é€šç”¨ Linux è®¾ç½®
- [DigitalOcean æŒ‡å—](/platforms/digitalocean) â€” äº‘æ›¿ä»£æ–¹æ¡ˆ
- [Hetzner æŒ‡å—](/install/hetzner) â€” Docker è®¾ç½®
- [Tailscale](/gateway/tailscale) â€” è¿œç¨‹è®¿é—®
- [èŠ‚ç‚¹](/nodes) â€” å°†ä½ çš„ç¬”è®°æœ¬ç”µè„‘/æ‰‹æœºä¸Ž Pi Gateway ç½‘å…³é…å¯¹
