---
read_when:
  - ä½ æƒ³è¿è¡Œæˆ–ç¼–å†™ .prose å·¥ä½œæµ
  - ä½ æƒ³å¯ç”¨ Viki Prose æ’ä»¶
  - ä½ éœ€è¦äº†è§£çŠ¶æ€å­˜å‚¨
summary: Viki Proseï¼šVikiClow ä¸­çš„ .prose å·¥ä½œæµã€æ–œæ å‘½ä»¤å’ŒçŠ¶æ€
title: Viki Prose
x-i18n:
  generated_at: "2026-02-03T07:53:38Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: cf7301e927b9a46347b498e264aeaa10dd76e85ff2de04775be57435718339f5
  source_path: prose.md
  workflow: 15
---

# Viki Prose

Viki Prose æ˜¯ä¸€ç§å¯ç§»æ¤çš„ã€ä»¥ Markdown ä¸ºä¸­å¿ƒçš„å·¥ä½œæµæ ¼å¼ï¼Œç”¨äºŽç¼–æŽ’ AI ä¼šè¯ã€‚åœ¨ VikiClow ä¸­ï¼Œå®ƒä½œä¸ºæ’ä»¶å‘å¸ƒï¼Œå®‰è£…ä¸€ä¸ª Viki Prose Skills åŒ…ä»¥åŠä¸€ä¸ª `/prose` æ–œæ å‘½ä»¤ã€‚ç¨‹åºå­˜æ”¾åœ¨ `.prose` æ–‡ä»¶ä¸­ï¼Œå¯ä»¥ç”Ÿæˆå¤šä¸ªå…·æœ‰æ˜¾å¼æŽ§åˆ¶æµçš„å­æ™ºèƒ½ä½“ã€‚

å®˜æ–¹ç½‘ç«™ï¼šhttps://www.prose.md

## å®ƒèƒ½åšä»€ä¹ˆ

- å…·æœ‰æ˜¾å¼å¹¶è¡Œæ€§çš„å¤šæ™ºèƒ½ä½“ç ”ç©¶ + ç»¼åˆã€‚
- å¯é‡å¤çš„æ‰¹å‡†å®‰å…¨å·¥ä½œæµï¼ˆä»£ç å®¡æŸ¥ã€äº‹ä»¶åˆ†ç±»ã€å†…å®¹ç®¡é“ï¼‰ã€‚
- å¯åœ¨æ”¯æŒçš„æ™ºèƒ½ä½“è¿è¡Œæ—¶ä¹‹é—´è¿è¡Œçš„å¯é‡ç”¨ `.prose` ç¨‹åºã€‚

## å®‰è£… + å¯ç”¨

æ†ç»‘çš„æ’ä»¶é»˜è®¤æ˜¯ç¦ç”¨çš„ã€‚å¯ç”¨ Viki Proseï¼š

```bash
vikiclow plugins enable open-prose
```

å¯ç”¨æ’ä»¶åŽé‡å¯ Gateway ç½‘å…³ã€‚

å¼€å‘/æœ¬åœ°æ£€å‡ºï¼š`vikiclow plugins install ./extensions/open-prose`

ç›¸å…³æ–‡æ¡£ï¼š[æ’ä»¶](/tools/plugin)ã€[æ’ä»¶æ¸…å•](/plugins/manifest)ã€[Skills](/tools/skills)ã€‚

## æ–œæ å‘½ä»¤

Viki Prose å°† `/prose` æ³¨å†Œä¸ºç”¨æˆ·å¯è°ƒç”¨çš„ Skills å‘½ä»¤ã€‚å®ƒè·¯ç”±åˆ° Viki Prose VM æŒ‡ä»¤ï¼Œå¹¶åœ¨åº•å±‚ä½¿ç”¨ VikiClow å·¥å…·ã€‚

å¸¸ç”¨å‘½ä»¤ï¼š

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## ç¤ºä¾‹ï¼šä¸€ä¸ªç®€å•çš„ `.prose` æ–‡ä»¶

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
context: { findings, draft }
```

## æ–‡ä»¶ä½ç½®

Viki Prose å°†çŠ¶æ€ä¿å­˜åœ¨å·¥ä½œç©ºé—´çš„ `.prose/` ä¸‹ï¼š

```
.prose/
â”œâ”€â”€ .env
â”œâ”€â”€ runs/
â”‚   â””â”€â”€ {YYYYMMDD}-{HHMMSS}-{random}/
â”‚       â”œâ”€â”€ program.prose
â”‚       â”œâ”€â”€ state.md
â”‚       â”œâ”€â”€ bindings/
â”‚       â””â”€â”€ agents/
â””â”€â”€ agents/
```

ç”¨æˆ·çº§æŒä¹…æ™ºèƒ½ä½“ä½äºŽï¼š

```
~/.prose/agents/
```

## çŠ¶æ€æ¨¡å¼

Viki Prose æ”¯æŒå¤šç§çŠ¶æ€åŽç«¯ï¼š

- **filesystem**ï¼ˆé»˜è®¤ï¼‰ï¼š`.prose/runs/...`
- **in-context**ï¼šçž¬æ€ï¼Œç”¨äºŽå°ç¨‹åº
- **sqlite**ï¼ˆå®žéªŒæ€§ï¼‰ï¼šéœ€è¦ `sqlite3` äºŒè¿›åˆ¶æ–‡ä»¶
- **postgres**ï¼ˆå®žéªŒæ€§ï¼‰ï¼šéœ€è¦ `psql` å’Œè¿žæŽ¥å­—ç¬¦ä¸²

è¯´æ˜Žï¼š

- sqlite/postgres æ˜¯é€‰æ‹©åŠ å…¥çš„ï¼Œä¸”å¤„äºŽå®žéªŒé˜¶æ®µã€‚
- postgres å‡­è¯ä¼šæµå…¥å­æ™ºèƒ½ä½“æ—¥å¿—ï¼›è¯·ä½¿ç”¨ä¸“ç”¨çš„ã€æœ€å°æƒé™çš„æ•°æ®åº“ã€‚

## è¿œç¨‹ç¨‹åº

`/prose run <handle/slug>` è§£æžä¸º `https://p.prose.md/<handle>/<slug>`ã€‚
ç›´æŽ¥ URL æŒ‰åŽŸæ ·èŽ·å–ã€‚è¿™ä½¿ç”¨ `web_fetch` å·¥å…·ï¼ˆæˆ–ç”¨äºŽ POST çš„ `exec`ï¼‰ã€‚

## VikiClow è¿è¡Œæ—¶æ˜ å°„

Viki Prose ç¨‹åºæ˜ å°„åˆ° VikiClow åŽŸè¯­ï¼š

| Viki Prose æ¦‚å¿µ        | VikiClow å·¥å…·  |
| ------------------------ | ---------------- |
| ç”Ÿæˆä¼šè¯ / Task å·¥å…· | `sessions_spawn` |
| æ–‡ä»¶è¯»/å†™            | `read` / `write` |
| Web èŽ·å–                | `web_fetch`      |

å¦‚æžœä½ çš„å·¥å…·ç™½åå•é˜»æ­¢è¿™äº›å·¥å…·ï¼ŒViki Prose ç¨‹åºå°†å¤±è´¥ã€‚å‚è§ [Skills é…ç½®](/tools/skills-config)ã€‚

## å®‰å…¨ + æ‰¹å‡†

å°† `.prose` æ–‡ä»¶è§†ä¸ºä»£ç ã€‚è¿è¡Œå‰è¯·å®¡æŸ¥ã€‚ä½¿ç”¨ VikiClow å·¥å…·ç™½åå•å’Œæ‰¹å‡†é—¨æŽ§æ¥æŽ§åˆ¶å‰¯ä½œç”¨ã€‚

å¯¹äºŽç¡®å®šæ€§çš„ã€æ‰¹å‡†é—¨æŽ§çš„å·¥ä½œæµï¼Œå¯ä¸Ž [Viki Workflow](/tools/workflow) æ¯”è¾ƒã€‚
