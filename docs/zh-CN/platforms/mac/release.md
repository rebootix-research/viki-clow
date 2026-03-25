---
read_when:
  - åˆ¶ä½œæˆ–éªŒè¯ VikiClow macOS å‘å¸ƒç‰ˆæœ¬
  - æ›´æ–° Sparkle appcast æˆ–è®¢é˜…æºèµ„æº
summary: VikiClow macOS å‘å¸ƒæ¸…å•ï¼ˆSparkle è®¢é˜…æºã€æ‰“åŒ…ã€ç­¾åï¼‰
title: macOS å‘å¸ƒ
x-i18n:
  generated_at: "2026-02-01T21:33:17Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: 703c08c13793cd8c96bd4c31fb4904cdf4ffff35576e7ea48a362560d371cb30
  source_path: platforms/mac/release.md
  workflow: 15
---

# VikiClow macOS å‘å¸ƒï¼ˆSparkleï¼‰

æœ¬åº”ç”¨çŽ°å·²æ”¯æŒ Sparkle è‡ªåŠ¨æ›´æ–°ã€‚å‘å¸ƒæž„å»ºå¿…é¡»ç»è¿‡ Developer ID ç­¾åã€åŽ‹ç¼©ï¼Œå¹¶å‘å¸ƒåŒ…å«ç­¾åçš„ appcast æ¡ç›®ã€‚

## å‰ææ¡ä»¶

- å·²å®‰è£… Developer ID Application è¯ä¹¦ï¼ˆç¤ºä¾‹ï¼š`Developer ID Application: <Developer Name> (<TEAMID>)`ï¼‰ã€‚
- çŽ¯å¢ƒå˜é‡ `SPARKLE_PRIVATE_KEY_FILE` å·²è®¾ç½®ä¸º Sparkle ed25519 ç§é’¥è·¯å¾„ï¼ˆå…¬é’¥å·²åµŒå…¥ Info.plistï¼‰ã€‚å¦‚æžœç¼ºå¤±ï¼Œè¯·æ£€æŸ¥ `~/.profile`ã€‚
- ç”¨äºŽ `xcrun notarytool` çš„å…¬è¯å‡­æ®ï¼ˆé’¥åŒ™ä¸²é…ç½®æ–‡ä»¶æˆ– API å¯†é’¥ï¼‰ï¼Œä»¥å®žçŽ°é€šè¿‡ Gatekeeper å®‰å…¨åˆ†å‘çš„ DMG/zipã€‚
  - æˆ‘ä»¬ä½¿ç”¨åä¸º `vikiclow-notary` çš„é’¥åŒ™ä¸²é…ç½®æ–‡ä»¶ï¼Œç”± shell é…ç½®æ–‡ä»¶ä¸­çš„ App Store Connect API å¯†é’¥çŽ¯å¢ƒå˜é‡åˆ›å»ºï¼š
    - `APP_STORE_CONNECT_API_KEY_P8`ã€`APP_STORE_CONNECT_KEY_ID`ã€`APP_STORE_CONNECT_ISSUER_ID`
    - `echo "$APP_STORE_CONNECT_API_KEY_P8" | sed 's/\\n/\n/g' > /tmp/vikiclow-notary.p8`
    - `xcrun notarytool store-credentials "vikiclow-notary" --key /tmp/vikiclow-notary.p8 --key-id "$APP_STORE_CONNECT_KEY_ID" --issuer "$APP_STORE_CONNECT_ISSUER_ID"`
- å·²å®‰è£… `pnpm` ä¾èµ–ï¼ˆ`pnpm install --config.node-linker=hoisted`ï¼‰ã€‚
- Sparkle å·¥å…·é€šè¿‡ SwiftPM è‡ªåŠ¨èŽ·å–ï¼Œä½äºŽ `apps/macos/.build/artifacts/sparkle/Sparkle/bin/`ï¼ˆ`sign_update`ã€`generate_appcast` ç­‰ï¼‰ã€‚

## æž„å»ºä¸Žæ‰“åŒ…

æ³¨æ„äº‹é¡¹ï¼š

- `APP_BUILD` æ˜ å°„åˆ° `CFBundleVersion`/`sparkle:version`ï¼›ä¿æŒçº¯æ•°å­—ä¸”å•è°ƒé€’å¢žï¼ˆä¸å« `-beta`ï¼‰ï¼Œå¦åˆ™ Sparkle ä¼šå°†å…¶è§†ä¸ºç›¸åŒç‰ˆæœ¬ã€‚
- é»˜è®¤ä¸ºå½“å‰æž¶æž„ï¼ˆ`$(uname -m)`ï¼‰ã€‚å¯¹äºŽå‘å¸ƒ/é€šç”¨æž„å»ºï¼Œè®¾ç½® `BUILD_ARCHS="arm64 x86_64"`ï¼ˆæˆ– `BUILD_ARCHS=all`ï¼‰ã€‚
- ä½¿ç”¨ `scripts/package-mac-dist.sh` ç”Ÿæˆå‘å¸ƒäº§ç‰©ï¼ˆzip + DMG + å…¬è¯ï¼‰ã€‚ä½¿ç”¨ `scripts/package-mac-app.sh` è¿›è¡Œæœ¬åœ°/å¼€å‘æ‰“åŒ…ã€‚

```bash
# ä»Žä»“åº“æ ¹ç›®å½•è¿è¡Œï¼›è®¾ç½®å‘å¸ƒ ID ä»¥å¯ç”¨ Sparkle è®¢é˜…æºã€‚
# APP_BUILD å¿…é¡»ä¸ºçº¯æ•°å­—ä¸”å•è°ƒé€’å¢žï¼Œä»¥ä¾¿ Sparkle æ­£ç¡®æ¯”è¾ƒã€‚
BUNDLE_ID=bot.molt.mac \
APP_VERSION=2026.1.27-beta.1 \
APP_BUILD="$(git rev-list --count HEAD)" \
BUILD_CONFIG=release \
SIGN_IDENTITY="Developer ID Application: <Developer Name> (<TEAMID>)" \
scripts/package-mac-app.sh

# æ‰“åŒ…ç”¨äºŽåˆ†å‘çš„ zipï¼ˆåŒ…å«èµ„æºåˆ†æ”¯ä»¥æ”¯æŒ Sparkle å¢žé‡æ›´æ–°ï¼‰
ditto -c -k --sequesterRsrc --keepParent dist/VikiClow.app dist/VikiClow-2026.1.27-beta.1.zip

# å¯é€‰ï¼šåŒæ—¶æž„å»ºé€‚åˆç”¨æˆ·ä½¿ç”¨çš„æ ·å¼åŒ– DMGï¼ˆæ‹–æ‹½åˆ° /Applicationsï¼‰
scripts/create-dmg.sh dist/VikiClow.app dist/VikiClow-2026.1.27-beta.1.dmg

# æŽ¨èï¼šæž„å»º + å…¬è¯/è£…è®¢ zip + DMG
# é¦–å…ˆï¼Œåˆ›å»ºä¸€æ¬¡é’¥åŒ™ä¸²é…ç½®æ–‡ä»¶ï¼š
#   xcrun notarytool store-credentials "vikiclow-notary" \
#     --apple-id "<apple-id>" --team-id "<team-id>" --password "<app-specific-password>"
NOTARIZE=1 NOTARYTOOL_PROFILE=vikiclow-notary \
BUNDLE_ID=bot.molt.mac \
APP_VERSION=2026.1.27-beta.1 \
APP_BUILD="$(git rev-list --count HEAD)" \
BUILD_CONFIG=release \
SIGN_IDENTITY="Developer ID Application: <Developer Name> (<TEAMID>)" \
scripts/package-mac-dist.sh

# å¯é€‰ï¼šéšå‘å¸ƒä¸€èµ·æä¾› dSYM
ditto -c -k --keepParent apps/macos/.build/release/VikiClow.app.dSYM dist/VikiClow-2026.1.27-beta.1.dSYM.zip
```

## Appcast æ¡ç›®

ä½¿ç”¨å‘å¸ƒè¯´æ˜Žç”Ÿæˆå™¨ï¼Œä»¥ä¾¿ Sparkle æ¸²æŸ“æ ¼å¼åŒ–çš„ HTML è¯´æ˜Žï¼š

```bash
SPARKLE_PRIVATE_KEY_FILE=/path/to/ed25519-private-key scripts/make_appcast.sh dist/VikiClow-2026.1.27-beta.1.zip https://raw.githubusercontent.com/rebootix-research/viki-clow/main/appcast.xml
```

ä»Ž `CHANGELOG.md`ï¼ˆé€šè¿‡ [`scripts/changelog-to-html.sh`](https://github.com/rebootix-research/viki-clow/blob/main/scripts/changelog-to-html.sh)ï¼‰ç”Ÿæˆ HTML å‘å¸ƒè¯´æ˜Žï¼Œå¹¶å°†å…¶åµŒå…¥ appcast æ¡ç›®ã€‚
å‘å¸ƒæ—¶ï¼Œå°†æ›´æ–°åŽçš„ `appcast.xml` ä¸Žå‘å¸ƒèµ„æºï¼ˆzip + dSYMï¼‰ä¸€èµ·æäº¤ã€‚

## å‘å¸ƒä¸ŽéªŒè¯

- å°† `VikiClow-2026.1.27-beta.1.zip`ï¼ˆå’Œ `VikiClow-2026.1.27-beta.1.dSYM.zip`ï¼‰ä¸Šä¼ åˆ°æ ‡ç­¾ `v2026.1.27-beta.1` å¯¹åº”çš„ GitHub å‘å¸ƒã€‚
- ç¡®ä¿åŽŸå§‹ appcast URL ä¸Žå†…ç½®çš„è®¢é˜…æºåŒ¹é…ï¼š`https://raw.githubusercontent.com/rebootix-research/viki-clow/main/appcast.xml`ã€‚
- å®Œæ•´æ€§æ£€æŸ¥ï¼š
  - `curl -I https://raw.githubusercontent.com/rebootix-research/viki-clow/main/appcast.xml` è¿”å›ž 200ã€‚
  - `curl -I <enclosure url>` åœ¨èµ„æºä¸Šä¼ åŽè¿”å›ž 200ã€‚
  - åœ¨ä¹‹å‰çš„å…¬å¼€æž„å»ºç‰ˆæœ¬ä¸Šï¼Œä»Ž About é€‰é¡¹å¡è¿è¡Œ"Check for Updatesâ€¦"ï¼ŒéªŒè¯ Sparkle èƒ½æ­£å¸¸å®‰è£…æ–°æž„å»ºã€‚

å®Œæˆå®šä¹‰ï¼šå·²ç­¾åçš„åº”ç”¨ + appcast å·²å‘å¸ƒï¼Œä»Žæ—§ç‰ˆæœ¬çš„æ›´æ–°æµç¨‹æ­£å¸¸å·¥ä½œï¼Œä¸”å‘å¸ƒèµ„æºå·²é™„åŠ åˆ° GitHub å‘å¸ƒã€‚
