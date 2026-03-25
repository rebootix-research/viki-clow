# AGENTS.md - zh-CN æ–‡æ¡£ç¿»è¯‘å·¥ä½œåŒº

## Read When

- ç»´æŠ¤ `docs/zh-CN/**`
- æ›´æ–°ä¸­æ–‡ç¿»è¯‘æµæ°´çº¿ï¼ˆglossary/TM/promptï¼‰
- å¤„ç†ä¸­æ–‡ç¿»è¯‘åé¦ˆæˆ–å›žå½’

## Pipelineï¼ˆdocs-i18nï¼‰

- æºæ–‡æ¡£ï¼š`docs/**/*.md`
- ç›®æ ‡æ–‡æ¡£ï¼š`docs/zh-CN/**/*.md`
- æœ¯è¯­è¡¨ï¼š`docs/.i18n/glossary.zh-CN.json`
- ç¿»è¯‘è®°å¿†åº“ï¼š`docs/.i18n/zh-CN.tm.jsonl`
- æç¤ºè¯è§„åˆ™ï¼š`scripts/docs-i18n/translator.go`

å¸¸ç”¨è¿è¡Œæ–¹å¼ï¼š

```bash
# æ‰¹é‡ï¼ˆdoc æ¨¡å¼ï¼Œå¯å¹¶è¡Œï¼‰
go run scripts/docs-i18n/main.go -mode doc -parallel 6 docs/**/*.md

# å•æ–‡ä»¶

go run scripts/docs-i18n/main.go -mode doc docs/channels/matrix.md

# å°èŒƒå›´è¡¥ä¸ï¼ˆsegment æ¨¡å¼ï¼Œä½¿ç”¨ TMï¼›ä¸æ”¯æŒå¹¶è¡Œï¼‰
go run scripts/docs-i18n/main.go -mode segment docs/channels/matrix.md
```

æ³¨æ„äº‹é¡¹ï¼š

- doc æ¨¡å¼ç”¨äºŽæ•´é¡µç¿»è¯‘ï¼›segment æ¨¡å¼ç”¨äºŽå°èŒƒå›´ä¿®è¡¥ï¼ˆä¾èµ– TMï¼‰ã€‚
- è¶…å¤§æ–‡ä»¶è‹¥è¶…æ—¶ï¼Œä¼˜å…ˆåš**å®šç‚¹æ›¿æ¢**æˆ–æ‹†åˆ†åŽå†è·‘ã€‚
- ç¿»è¯‘åŽæ£€æŸ¥ä¸­æ–‡å¼•å·ã€CJK-Latin é—´è·å’Œæœ¯è¯­ä¸€è‡´æ€§ã€‚

## zh-CN æ ·å¼è§„åˆ™

- CJK-Latin é—´è·ï¼šéµå¾ª W3C CLREQï¼ˆå¦‚ `Gateway ç½‘å…³`ã€`Skills é…ç½®`ï¼‰ã€‚
- ä¸­æ–‡å¼•å·ï¼šæ­£æ–‡/æ ‡é¢˜ä½¿ç”¨ `â€œâ€`ï¼›ä»£ç /CLI/é”®åä¿æŒ ASCII å¼•å·ã€‚
- æœ¯è¯­ä¿ç•™è‹±æ–‡ï¼š`Skills`ã€`local loopback`ã€`Tailscale`ã€‚
- ä»£ç å—/å†…è”ä»£ç ï¼šä¿æŒåŽŸæ ·ï¼Œä¸åœ¨ä»£ç å†…æ’å…¥ç©ºæ ¼æˆ–å¼•å·æ›¿æ¢ã€‚

## å…³é”®æœ¯è¯­ï¼ˆ#6995 ä¿®å¤ï¼‰

- `Gateway ç½‘å…³`
- `Skills é…ç½®`
- `æ²™ç®±`
- `é¢„æœŸé”®å`
- `é…å¥—åº”ç”¨`
- `åˆ†å—æµå¼ä¼ è¾“`
- `è®¾å¤‡å‘çŽ°`

## åé¦ˆä¸Žå˜æ›´è®°å½•

- åé¦ˆæ¥æºï¼šGitHub issue #6995
- åé¦ˆç”¨æˆ·ï¼š@AaronWanderã€@taiyi747ã€@Explorer1092ã€@rendaoyuan
- å˜æ›´è¦ç‚¹ï¼šæ›´æ–° prompt è§„åˆ™ã€æ‰©å…… glossaryã€æ¸…ç† TMã€æ‰¹é‡å†ç”Ÿæˆ + å®šç‚¹ä¿®å¤
- å‚è€ƒé“¾æŽ¥ï¼šhttps://github.com/rebootix-research/viki-clow/issues/6995
