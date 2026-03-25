---
read_when:
  - ä½ æƒ³è¦å¸¦å®‰å…¨åŠ å›ºçš„è‡ªåŠ¨åŒ–æœåŠ¡å™¨éƒ¨ç½²
  - ä½ éœ€è¦å¸¦ VPN è®¿é—®çš„é˜²ç«å¢™éš”ç¦»è®¾ç½®
  - ä½ æ­£åœ¨éƒ¨ç½²åˆ°è¿œç¨‹ Debian/Ubuntu æœåŠ¡å™¨
summary: ä½¿ç”¨ Ansibleã€Tailscale VPN å’Œé˜²ç«å¢™éš”ç¦»è¿›è¡Œè‡ªåŠ¨åŒ–ã€åŠ å›ºçš„ VikiClow å®‰è£…
title: Ansible
x-i18n:
  generated_at: "2026-02-03T07:49:29Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: 896807f344d923f09039f377c13b4bf4a824aa94eec35159fc169596a3493b29
  source_path: install/ansible.md
  workflow: 15
---

# Ansible å®‰è£…

å°† VikiClow éƒ¨ç½²åˆ°ç”Ÿäº§æœåŠ¡å™¨çš„æŽ¨èæ–¹å¼æ˜¯é€šè¿‡ **[vikiclow-ansible](https://github.com/rebootix-research/viki-clow-ansible)** â€” ä¸€ä¸ªå®‰å…¨ä¼˜å…ˆæž¶æž„çš„è‡ªåŠ¨åŒ–å®‰è£…ç¨‹åºã€‚

## å¿«é€Ÿå¼€å§‹

ä¸€æ¡å‘½ä»¤å®‰è£…ï¼š

```bash
curl -fsSL https://raw.githubusercontent.com/rebootix-research/viki-clow-ansible/main/install.sh | bash
```

> **ðŸ“¦ å®Œæ•´æŒ‡å—ï¼š[github.com/vikiclow/vikiclow-ansible](https://github.com/rebootix-research/viki-clow-ansible)**
>
> vikiclow-ansible ä»“åº“æ˜¯ Ansible éƒ¨ç½²çš„æƒå¨æ¥æºã€‚æœ¬é¡µæ˜¯å¿«é€Ÿæ¦‚è¿°ã€‚

## ä½ å°†èŽ·å¾—

- ðŸ”’ **é˜²ç«å¢™ä¼˜å…ˆå®‰å…¨**ï¼šUFW + Docker éš”ç¦»ï¼ˆä»… SSH + Tailscale å¯è®¿é—®ï¼‰
- ðŸ” **Tailscale VPN**ï¼šå®‰å…¨è¿œç¨‹è®¿é—®ï¼Œæ— éœ€å…¬å¼€æš´éœ²æœåŠ¡
- ðŸ³ **Docker**ï¼šéš”ç¦»çš„æ²™ç®±å®¹å™¨ï¼Œä»…ç»‘å®š localhost
- ðŸ›¡ï¸ **çºµæ·±é˜²å¾¡**ï¼š4 å±‚å®‰å…¨æž¶æž„
- ðŸš€ **ä¸€æ¡å‘½ä»¤è®¾ç½®**ï¼šå‡ åˆ†é’Ÿå†…å®Œæˆéƒ¨ç½²
- ðŸ”§ **Systemd é›†æˆ**ï¼šå¸¦åŠ å›ºçš„å¼€æœºè‡ªå¯åŠ¨

## è¦æ±‚

- **æ“ä½œç³»ç»Ÿ**ï¼šDebian 11+ æˆ– Ubuntu 20.04+
- **è®¿é—®æƒé™**ï¼šRoot æˆ– sudo æƒé™
- **ç½‘ç»œ**ï¼šç”¨äºŽåŒ…å®‰è£…çš„äº’è”ç½‘è¿žæŽ¥
- **Ansible**ï¼š2.14+ï¼ˆç”±å¿«é€Ÿå¯åŠ¨è„šæœ¬è‡ªåŠ¨å®‰è£…ï¼‰

## å®‰è£…å†…å®¹

Ansible playbook å®‰è£…å¹¶é…ç½®ï¼š

1. **Tailscale**ï¼ˆç”¨äºŽå®‰å…¨è¿œç¨‹è®¿é—®çš„ mesh VPNï¼‰
2. **UFW é˜²ç«å¢™**ï¼ˆä»…å…è®¸ SSH + Tailscale ç«¯å£ï¼‰
3. **Docker CE + Compose V2**ï¼ˆç”¨äºŽæ™ºèƒ½ä½“æ²™ç®±ï¼‰
4. **Node.js 22.x + pnpm**ï¼ˆè¿è¡Œæ—¶ä¾èµ–ï¼‰
5. **VikiClow**ï¼ˆåŸºäºŽä¸»æœºï¼Œéžå®¹å™¨åŒ–ï¼‰
6. **Systemd æœåŠ¡**ï¼ˆå¸¦å®‰å…¨åŠ å›ºçš„è‡ªåŠ¨å¯åŠ¨ï¼‰

æ³¨æ„ï¼šGateway ç½‘å…³**ç›´æŽ¥åœ¨ä¸»æœºä¸Šè¿è¡Œ**ï¼ˆä¸åœ¨ Docker ä¸­ï¼‰ï¼Œä½†æ™ºèƒ½ä½“æ²™ç®±ä½¿ç”¨ Docker è¿›è¡Œéš”ç¦»ã€‚è¯¦æƒ…å‚è§[æ²™ç®±éš”ç¦»](/gateway/sandboxing)ã€‚

## å®‰è£…åŽè®¾ç½®

å®‰è£…å®ŒæˆåŽï¼Œåˆ‡æ¢åˆ° vikiclow ç”¨æˆ·ï¼š

```bash
sudo -i -u vikiclow
```

å®‰è£…åŽè„šæœ¬å°†å¼•å¯¼ä½ å®Œæˆï¼š

1. **æ–°æ‰‹å¼•å¯¼å‘å¯¼**ï¼šé…ç½® VikiClow è®¾ç½®
2. **æä¾›å•†ç™»å½•**ï¼šè¿žæŽ¥ WhatsApp/Telegram/Discord/Signal
3. **Gateway ç½‘å…³æµ‹è¯•**ï¼šéªŒè¯å®‰è£…
4. **Tailscale è®¾ç½®**ï¼šè¿žæŽ¥åˆ°ä½ çš„ VPN mesh

### å¸¸ç”¨å‘½ä»¤

```bash
# æ£€æŸ¥æœåŠ¡çŠ¶æ€
sudo systemctl status vikiclow

# æŸ¥çœ‹å®žæ—¶æ—¥å¿—
sudo journalctl -u vikiclow -f

# é‡å¯ Gateway ç½‘å…³
sudo systemctl restart vikiclow

# æä¾›å•†ç™»å½•ï¼ˆä»¥ vikiclow ç”¨æˆ·è¿è¡Œï¼‰
sudo -i -u vikiclow
vikiclow channels login
```

## å®‰å…¨æž¶æž„

### 4 å±‚é˜²å¾¡

1. **é˜²ç«å¢™ï¼ˆUFWï¼‰**ï¼šä»…å…¬å¼€æš´éœ² SSHï¼ˆ22ï¼‰+ Tailscaleï¼ˆ41641/udpï¼‰
2. **VPNï¼ˆTailscaleï¼‰**ï¼šGateway ç½‘å…³ä»…é€šè¿‡ VPN mesh å¯è®¿é—®
3. **Docker éš”ç¦»**ï¼šDOCKER-USER iptables é“¾é˜²æ­¢å¤–éƒ¨ç«¯å£æš´éœ²
4. **Systemd åŠ å›º**ï¼šNoNewPrivilegesã€PrivateTmpã€éžç‰¹æƒç”¨æˆ·

### éªŒè¯

æµ‹è¯•å¤–éƒ¨æ”»å‡»é¢ï¼š

```bash
nmap -p- YOUR_SERVER_IP
```

åº”è¯¥æ˜¾ç¤º**ä»…ç«¯å£ 22**ï¼ˆSSHï¼‰å¼€æ”¾ã€‚æ‰€æœ‰å…¶ä»–æœåŠ¡ï¼ˆGateway ç½‘å…³ã€Dockerï¼‰éƒ½è¢«é”å®šã€‚

### Docker å¯ç”¨æ€§

Docker ç”¨äºŽ**æ™ºèƒ½ä½“æ²™ç®±**ï¼ˆéš”ç¦»çš„å·¥å…·æ‰§è¡Œï¼‰ï¼Œè€Œä¸æ˜¯ç”¨äºŽè¿è¡Œ Gateway ç½‘å…³æœ¬èº«ã€‚Gateway ç½‘å…³ä»…ç»‘å®šåˆ° localhostï¼Œé€šè¿‡ Tailscale VPN è®¿é—®ã€‚

æ²™ç®±é…ç½®å‚è§[å¤šæ™ºèƒ½ä½“æ²™ç®±ä¸Žå·¥å…·](/tools/multi-agent-sandbox-tools)ã€‚

## æ‰‹åŠ¨å®‰è£…

å¦‚æžœä½ æ›´å–œæ¬¢æ‰‹åŠ¨æŽ§åˆ¶è€Œéžè‡ªåŠ¨åŒ–ï¼š

```bash
# 1. å®‰è£…å…ˆå†³æ¡ä»¶
sudo apt update && sudo apt install -y ansible git

# 2. å…‹éš†ä»“åº“
git clone https://github.com/rebootix-research/viki-clow-ansible.git
cd vikiclow-ansible

# 3. å®‰è£… Ansible collections
ansible-galaxy collection install -r requirements.yml

# 4. è¿è¡Œ playbook
./run-playbook.sh

# æˆ–ç›´æŽ¥è¿è¡Œï¼ˆç„¶åŽæ‰‹åŠ¨æ‰§è¡Œ /tmp/vikiclow-setup.shï¼‰
# ansible-playbook playbook.yml --ask-become-pass
```

## æ›´æ–° VikiClow

Ansible å®‰è£…ç¨‹åºè®¾ç½® VikiClow ä¸ºæ‰‹åŠ¨æ›´æ–°ã€‚æ ‡å‡†æ›´æ–°æµç¨‹å‚è§[æ›´æ–°](/install/updating)ã€‚

è¦é‡æ–°è¿è¡Œ Ansible playbookï¼ˆä¾‹å¦‚ï¼Œç”¨äºŽé…ç½®æ›´æ”¹ï¼‰ï¼š

```bash
cd vikiclow-ansible
./run-playbook.sh
```

æ³¨æ„ï¼šè¿™æ˜¯å¹‚ç­‰çš„ï¼Œå¯ä»¥å®‰å…¨åœ°å¤šæ¬¡è¿è¡Œã€‚

## æ•…éšœæŽ’é™¤

### é˜²ç«å¢™é˜»æ­¢äº†æˆ‘çš„è¿žæŽ¥

å¦‚æžœä½ è¢«é”å®šï¼š

- ç¡®ä¿ä½ å¯ä»¥å…ˆé€šè¿‡ Tailscale VPN è®¿é—®
- SSH è®¿é—®ï¼ˆç«¯å£ 22ï¼‰å§‹ç»ˆå…è®¸
- Gateway ç½‘å…³**ä»…**é€šè¿‡ Tailscale è®¿é—®ï¼Œè¿™æ˜¯è®¾è®¡å¦‚æ­¤

### æœåŠ¡æ— æ³•å¯åŠ¨

```bash
# æ£€æŸ¥æ—¥å¿—
sudo journalctl -u vikiclow -n 100

# éªŒè¯æƒé™
sudo ls -la /opt/vikiclow

# æµ‹è¯•æ‰‹åŠ¨å¯åŠ¨
sudo -i -u vikiclow
cd ~/vikiclow
pnpm start
```

### Docker æ²™ç®±é—®é¢˜

```bash
# éªŒè¯ Docker æ­£åœ¨è¿è¡Œ
sudo systemctl status docker

# æ£€æŸ¥æ²™ç®±é•œåƒ
sudo docker images | grep vikiclow-sandbox

# å¦‚æžœç¼ºå¤±åˆ™æž„å»ºæ²™ç®±é•œåƒ
cd /opt/vikiclow/vikiclow
sudo -u vikiclow ./scripts/sandbox-setup.sh
```

### æä¾›å•†ç™»å½•å¤±è´¥

ç¡®ä¿ä½ ä»¥ `vikiclow` ç”¨æˆ·è¿è¡Œï¼š

```bash
sudo -i -u vikiclow
vikiclow channels login
```

## é«˜çº§é…ç½®

è¯¦ç»†çš„å®‰å…¨æž¶æž„å’Œæ•…éšœæŽ’é™¤ï¼š

- [å®‰å…¨æž¶æž„](https://github.com/rebootix-research/viki-clow-ansible/blob/main/docs/security.md)
- [æŠ€æœ¯è¯¦æƒ…](https://github.com/rebootix-research/viki-clow-ansible/blob/main/docs/architecture.md)
- [æ•…éšœæŽ’é™¤æŒ‡å—](https://github.com/rebootix-research/viki-clow-ansible/blob/main/docs/troubleshooting.md)

## ç›¸å…³å†…å®¹

- [vikiclow-ansible](https://github.com/rebootix-research/viki-clow-ansible) â€” å®Œæ•´éƒ¨ç½²æŒ‡å—
- [Docker](/install/docker) â€” å®¹å™¨åŒ– Gateway ç½‘å…³è®¾ç½®
- [æ²™ç®±éš”ç¦»](/gateway/sandboxing) â€” æ™ºèƒ½ä½“æ²™ç®±é…ç½®
- [å¤šæ™ºèƒ½ä½“æ²™ç®±ä¸Žå·¥å…·](/tools/multi-agent-sandbox-tools) â€” æ¯ä¸ªæ™ºèƒ½ä½“çš„éš”ç¦»
