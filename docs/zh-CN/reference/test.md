---
read_when:
  - è¿è¡Œæˆ–ä¿®å¤æµ‹è¯•
summary: å¦‚ä½•åœ¨æœ¬åœ°è¿è¡Œæµ‹è¯•ï¼ˆvitestï¼‰ä»¥åŠä½•æ—¶ä½¿ç”¨ force/coverage æ¨¡å¼
title: æµ‹è¯•
x-i18n:
  generated_at: "2026-02-03T10:09:52Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: be7b751fb81c8c94b1293624bdca6582e60a26084960d1df9558061969502e6f
  source_path: reference/test.md
  workflow: 15
---

# æµ‹è¯•

- å®Œæ•´æµ‹è¯•å¥—ä»¶ï¼ˆæµ‹è¯•é›†ã€å®žæ—¶æµ‹è¯•ã€Dockerï¼‰ï¼š[æµ‹è¯•](/help/testing)

- `pnpm test:force`ï¼šç»ˆæ­¢ä»»ä½•å ç”¨é»˜è®¤æŽ§åˆ¶ç«¯å£çš„é—ç•™ Gateway ç½‘å…³è¿›ç¨‹ï¼Œç„¶åŽä½¿ç”¨éš”ç¦»çš„ Gateway ç½‘å…³ç«¯å£è¿è¡Œå®Œæ•´çš„ Vitest å¥—ä»¶ï¼Œè¿™æ ·æœåŠ¡å™¨æµ‹è¯•ä¸ä¼šä¸Žæ­£åœ¨è¿è¡Œçš„å®žä¾‹å†²çªã€‚å½“ä¹‹å‰çš„ Gateway ç½‘å…³è¿è¡Œå ç”¨äº†ç«¯å£ 18789 æ—¶ä½¿ç”¨æ­¤å‘½ä»¤ã€‚
- `pnpm test:coverage`ï¼šä½¿ç”¨ V8 è¦†ç›–çŽ‡è¿è¡Œ Vitestã€‚å…¨å±€é˜ˆå€¼ä¸º 70% çš„è¡Œ/åˆ†æ”¯/å‡½æ•°/è¯­å¥è¦†ç›–çŽ‡ã€‚è¦†ç›–çŽ‡æŽ’é™¤äº†é›†æˆå¯†é›†åž‹å…¥å£ç‚¹ï¼ˆCLI è¿žæŽ¥ã€gateway/telegram æ¡¥æŽ¥ã€webchat é™æ€æœåŠ¡å™¨ï¼‰ï¼Œä»¥ä¿æŒç›®æ ‡é›†ä¸­åœ¨å¯å•å…ƒæµ‹è¯•çš„é€»è¾‘ä¸Šã€‚
- `pnpm test:e2e`ï¼šè¿è¡Œ Gateway ç½‘å…³ç«¯åˆ°ç«¯å†’çƒŸæµ‹è¯•ï¼ˆå¤šå®žä¾‹ WS/HTTP/èŠ‚ç‚¹é…å¯¹ï¼‰ã€‚
- `pnpm test:live`ï¼šè¿è¡Œæä¾›å•†å®žæ—¶æµ‹è¯•ï¼ˆminimax/zaiï¼‰ã€‚éœ€è¦ API å¯†é’¥å’Œ `LIVE=1`ï¼ˆæˆ–æä¾›å•†ç‰¹å®šçš„ `*_LIVE_TEST=1`ï¼‰æ‰èƒ½å–æ¶ˆè·³è¿‡ã€‚

## æ¨¡åž‹å»¶è¿ŸåŸºå‡†æµ‹è¯•ï¼ˆæœ¬åœ°å¯†é’¥ï¼‰

è„šæœ¬ï¼š[`scripts/bench-model.ts`](https://github.com/rebootix-research/viki-clow/blob/main/scripts/bench-model.ts)

ç”¨æ³•ï¼š

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- å¯é€‰çŽ¯å¢ƒå˜é‡ï¼š`MINIMAX_API_KEY`ã€`MINIMAX_BASE_URL`ã€`MINIMAX_MODEL`ã€`ANTHROPIC_API_KEY`
- é»˜è®¤æç¤ºè¯ï¼š"Reply with a single word: ok. No punctuation or extra text."

ä¸Šæ¬¡è¿è¡Œï¼ˆ2025-12-31ï¼Œ20 æ¬¡ï¼‰ï¼š

- minimax ä¸­ä½æ•° 1279msï¼ˆæœ€å° 1114ï¼Œæœ€å¤§ 2431ï¼‰
- opus ä¸­ä½æ•° 2454msï¼ˆæœ€å° 1224ï¼Œæœ€å¤§ 3170ï¼‰

## æ–°æ‰‹å¼•å¯¼ E2Eï¼ˆDockerï¼‰

Docker æ˜¯å¯é€‰çš„ï¼›è¿™ä»…ç”¨äºŽå®¹å™¨åŒ–çš„æ–°æ‰‹å¼•å¯¼å†’çƒŸæµ‹è¯•ã€‚

åœ¨å¹²å‡€çš„ Linux å®¹å™¨ä¸­å®Œæ•´çš„å†·å¯åŠ¨æµç¨‹ï¼š

```bash
scripts/e2e/onboard-docker.sh
```

æ­¤è„šæœ¬é€šè¿‡ä¼ªç»ˆç«¯é©±åŠ¨äº¤äº’å¼å‘å¯¼ï¼ŒéªŒè¯é…ç½®/å·¥ä½œåŒº/ä¼šè¯æ–‡ä»¶ï¼Œç„¶åŽå¯åŠ¨ Gateway ç½‘å…³å¹¶è¿è¡Œ `vikiclow health`ã€‚

## QR å¯¼å…¥å†’çƒŸæµ‹è¯•ï¼ˆDockerï¼‰

ç¡®ä¿ `qrcode-terminal` åœ¨ Docker ä¸­çš„ Node 22+ ä¸‹åŠ è½½ï¼š

```bash
pnpm test:docker:qr
```
