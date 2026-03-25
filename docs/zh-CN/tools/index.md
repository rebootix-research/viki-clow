---
read_when:
  - æ·»åŠ æˆ–ä¿®æ”¹æ™ºèƒ½ä½“å·¥å…·
  - åœç”¨æˆ–æ›´æ”¹ `vikiclow-*` Skills
summary: VikiClow çš„æ™ºèƒ½ä½“å·¥å…·æŽ¥å£ï¼ˆbrowserã€canvasã€nodesã€messageã€cronï¼‰ï¼Œæ›¿ä»£æ—§ç‰ˆ `vikiclow-*` Skills
title: å·¥å…·
x-i18n:
  generated_at: "2026-02-03T10:12:41Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: a1ec62a9c9bea4c1d2cebfb88509739a3b48b451ab3e378193c620832e2aa07b
  source_path: tools/index.md
  workflow: 15
---

# å·¥å…·ï¼ˆVikiClowï¼‰

VikiClow ä¸º browserã€canvasã€nodes å’Œ cron æš´éœ²**ä¸€æµçš„æ™ºèƒ½ä½“å·¥å…·**ã€‚
è¿™äº›å·¥å…·å–ä»£äº†æ—§çš„ `vikiclow-*` Skillsï¼šå·¥å…·æ˜¯ç±»åž‹åŒ–çš„ï¼Œæ— éœ€è°ƒç”¨ shellï¼Œ
æ™ºèƒ½ä½“åº”è¯¥ç›´æŽ¥ä¾èµ–å®ƒä»¬ã€‚

## ç¦ç”¨å·¥å…·

ä½ å¯ä»¥é€šè¿‡ `vikiclow.json` ä¸­çš„ `tools.allow` / `tools.deny` å…¨å±€å…è®¸/æ‹’ç»å·¥å…·
ï¼ˆdeny ä¼˜å…ˆï¼‰ã€‚è¿™ä¼šé˜»æ­¢ä¸å…è®¸çš„å·¥å…·è¢«å‘é€åˆ°æ¨¡åž‹æä¾›å•†ã€‚

```json5
{
  tools: { deny: ["browser"] },
}
```

æ³¨æ„ï¼š

- åŒ¹é…ä¸åŒºåˆ†å¤§å°å†™ã€‚
- æ”¯æŒ `*` é€šé…ç¬¦ï¼ˆ`"*"` è¡¨ç¤ºæ‰€æœ‰å·¥å…·ï¼‰ã€‚
- å¦‚æžœ `tools.allow` ä»…å¼•ç”¨æœªçŸ¥æˆ–æœªåŠ è½½çš„æ’ä»¶å·¥å…·åç§°ï¼ŒVikiClow ä¼šè®°å½•è­¦å‘Šå¹¶å¿½ç•¥å…è®¸åˆ—è¡¨ï¼Œä»¥ç¡®ä¿æ ¸å¿ƒå·¥å…·ä¿æŒå¯ç”¨ã€‚

## å·¥å…·é…ç½®æ–‡ä»¶ï¼ˆåŸºç¡€å…è®¸åˆ—è¡¨ï¼‰

`tools.profile` åœ¨ `tools.allow`/`tools.deny` ä¹‹å‰è®¾ç½®**åŸºç¡€å·¥å…·å…è®¸åˆ—è¡¨**ã€‚
æŒ‰æ™ºèƒ½ä½“è¦†ç›–ï¼š`agents.list[].tools.profile`ã€‚

é…ç½®æ–‡ä»¶ï¼š

- `minimal`ï¼šä»… `session_status`
- `coding`ï¼š`group:fs`ã€`group:runtime`ã€`group:sessions`ã€`group:memory`ã€`image`
- `messaging`ï¼š`group:messaging`ã€`sessions_list`ã€`sessions_history`ã€`sessions_send`ã€`session_status`
- `full`ï¼šæ— é™åˆ¶ï¼ˆä¸Žæœªè®¾ç½®ç›¸åŒï¼‰

ç¤ºä¾‹ï¼ˆé»˜è®¤ä»…æ¶ˆæ¯ï¼ŒåŒæ—¶å…è®¸ Slack + Discord å·¥å…·ï¼‰ï¼š

```json5
{
  tools: {
    profile: "messaging",
    allow: ["slack", "discord"],
  },
}
```

ç¤ºä¾‹ï¼ˆcoding é…ç½®æ–‡ä»¶ï¼Œä½†åœ¨æ‰€æœ‰åœ°æ–¹æ‹’ç» exec/processï¼‰ï¼š

```json5
{
  tools: {
    profile: "coding",
    deny: ["group:runtime"],
  },
}
```

ç¤ºä¾‹ï¼ˆå…¨å±€ coding é…ç½®æ–‡ä»¶ï¼Œä»…æ¶ˆæ¯çš„æ”¯æŒæ™ºèƒ½ä½“ï¼‰ï¼š

```json5
{
  tools: { profile: "coding" },
  agents: {
    list: [
      {
        id: "support",
        tools: { profile: "messaging", allow: ["slack"] },
      },
    ],
  },
}
```

## ç‰¹å®šæä¾›å•†çš„å·¥å…·ç­–ç•¥

ä½¿ç”¨ `tools.byProvider` ä¸ºç‰¹å®šæä¾›å•†ï¼ˆæˆ–å•ä¸ª `provider/model`ï¼‰**è¿›ä¸€æ­¥é™åˆ¶**å·¥å…·ï¼Œ
è€Œä¸æ›´æ”¹ä½ çš„å…¨å±€é»˜è®¤å€¼ã€‚
æŒ‰æ™ºèƒ½ä½“è¦†ç›–ï¼š`agents.list[].tools.byProvider`ã€‚

è¿™åœ¨åŸºç¡€å·¥å…·é…ç½®æ–‡ä»¶**ä¹‹åŽ**å’Œå…è®¸/æ‹’ç»åˆ—è¡¨**ä¹‹å‰**åº”ç”¨ï¼Œ
å› æ­¤å®ƒåªèƒ½ç¼©å°å·¥å…·é›†ã€‚
æä¾›å•†é”®æŽ¥å— `provider`ï¼ˆä¾‹å¦‚ `google-antigravity`ï¼‰æˆ–
`provider/model`ï¼ˆä¾‹å¦‚ `openai/gpt-5.2`ï¼‰ã€‚

ç¤ºä¾‹ï¼ˆä¿æŒå…¨å±€ coding é…ç½®æ–‡ä»¶ï¼Œä½† Google Antigravity ä½¿ç”¨æœ€å°å·¥å…·ï¼‰ï¼š

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```

ç¤ºä¾‹ï¼ˆé’ˆå¯¹ä¸ç¨³å®šç«¯ç‚¹çš„ provider/model ç‰¹å®šå…è®¸åˆ—è¡¨ï¼‰ï¼š

```json5
{
  tools: {
    allow: ["group:fs", "group:runtime", "sessions_list"],
    byProvider: {
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

ç¤ºä¾‹ï¼ˆé’ˆå¯¹å•ä¸ªæä¾›å•†çš„æ™ºèƒ½ä½“ç‰¹å®šè¦†ç›–ï¼‰ï¼š

```json5
{
  agents: {
    list: [
      {
        id: "support",
        tools: {
          byProvider: {
            "google-antigravity": { allow: ["message", "sessions_list"] },
          },
        },
      },
    ],
  },
}
```

## å·¥å…·ç»„ï¼ˆç®€å†™ï¼‰

å·¥å…·ç­–ç•¥ï¼ˆå…¨å±€ã€æ™ºèƒ½ä½“ã€æ²™ç®±ï¼‰æ”¯æŒ `group:*` æ¡ç›®ï¼Œå®ƒä»¬ä¼šå±•å¼€ä¸ºå¤šä¸ªå·¥å…·ã€‚
åœ¨ `tools.allow` / `tools.deny` ä¸­ä½¿ç”¨è¿™äº›ã€‚

å¯ç”¨çš„ç»„ï¼š

- `group:runtime`ï¼š`exec`ã€`bash`ã€`process`
- `group:fs`ï¼š`read`ã€`write`ã€`edit`ã€`apply_patch`
- `group:sessions`ï¼š`sessions_list`ã€`sessions_history`ã€`sessions_send`ã€`sessions_spawn`ã€`session_status`
- `group:memory`ï¼š`memory_search`ã€`memory_get`
- `group:web`ï¼š`web_search`ã€`web_fetch`
- `group:ui`ï¼š`browser`ã€`canvas`
- `group:automation`ï¼š`cron`ã€`gateway`
- `group:messaging`ï¼š`message`
- `group:nodes`ï¼š`nodes`
- `group:vikiclow`ï¼šæ‰€æœ‰å†…ç½® VikiClow å·¥å…·ï¼ˆä¸åŒ…æ‹¬æä¾›å•†æ’ä»¶ï¼‰

ç¤ºä¾‹ï¼ˆä»…å…è®¸æ–‡ä»¶å·¥å…· + browserï¼‰ï¼š

```json5
{
  tools: {
    allow: ["group:fs", "browser"],
  },
}
```

## æ’ä»¶ + å·¥å…·

æ’ä»¶å¯ä»¥åœ¨æ ¸å¿ƒé›†ä¹‹å¤–æ³¨å†Œ**é¢å¤–çš„å·¥å…·**ï¼ˆå’Œ CLI å‘½ä»¤ï¼‰ã€‚
å‚è§[æ’ä»¶](/tools/plugin)äº†è§£å®‰è£… + é…ç½®ï¼Œä»¥åŠ [Skills](/tools/skills) äº†è§£
å·¥å…·ä½¿ç”¨æŒ‡å¯¼å¦‚ä½•è¢«æ³¨å…¥åˆ°æç¤ºä¸­ã€‚ä¸€äº›æ’ä»¶éšå·¥å…·ä¸€èµ·æä¾›è‡ªå·±çš„ Skills
ï¼ˆä¾‹å¦‚ï¼Œvoice-call æ’ä»¶ï¼‰ã€‚

å¯é€‰çš„æ’ä»¶å·¥å…·ï¼š

- [Viki Workflow](/tools/workflow)ï¼šå¸¦æœ‰å¯æ¢å¤å®¡æ‰¹çš„ç±»åž‹åŒ–å·¥ä½œæµè¿è¡Œæ—¶ï¼ˆéœ€è¦ Gateway ç½‘å…³ä¸»æœºä¸Šçš„ Viki Workflow CLIï¼‰ã€‚
- [LLM Task](/tools/llm-task)ï¼šç”¨äºŽç»“æž„åŒ–å·¥ä½œæµè¾“å‡ºçš„ JSON-only LLM æ­¥éª¤ï¼ˆå¯é€‰ schema éªŒè¯ï¼‰ã€‚

## å·¥å…·æ¸…å•

### `apply_patch`

è·¨ä¸€ä¸ªæˆ–å¤šä¸ªæ–‡ä»¶åº”ç”¨ç»“æž„åŒ–è¡¥ä¸ã€‚ç”¨äºŽå¤šå—ç¼–è¾‘ã€‚
å®žéªŒæ€§ï¼šé€šè¿‡ `tools.exec.applyPatch.enabled` å¯ç”¨ï¼ˆä»… OpenAI æ¨¡åž‹ï¼‰ã€‚

### `exec`

åœ¨å·¥ä½œåŒºä¸­è¿è¡Œ shell å‘½ä»¤ã€‚

æ ¸å¿ƒå‚æ•°ï¼š

- `command`ï¼ˆå¿…éœ€ï¼‰
- `yieldMs`ï¼ˆè¶…æ—¶åŽè‡ªåŠ¨åŽå°è¿è¡Œï¼Œé»˜è®¤ 10000ï¼‰
- `background`ï¼ˆç«‹å³åŽå°è¿è¡Œï¼‰
- `timeout`ï¼ˆç§’ï¼›è¶…è¿‡åˆ™ç»ˆæ­¢è¿›ç¨‹ï¼Œé»˜è®¤ 1800ï¼‰
- `elevated`ï¼ˆå¸ƒå°”å€¼ï¼›å¦‚æžœå¯ç”¨/å…è®¸æå‡æ¨¡å¼ï¼Œåˆ™åœ¨ä¸»æœºä¸Šè¿è¡Œï¼›ä»…åœ¨æ™ºèƒ½ä½“è¢«æ²™ç®±éš”ç¦»æ—¶æ”¹å˜è¡Œä¸ºï¼‰
- `host`ï¼ˆ`sandbox | gateway | node`ï¼‰
- `security`ï¼ˆ`deny | allowlist | full`ï¼‰
- `ask`ï¼ˆ`off | on-miss | always`ï¼‰
- `node`ï¼ˆ`host=node` æ—¶çš„èŠ‚ç‚¹ id/åç§°ï¼‰
- éœ€è¦çœŸæ­£çš„ TTYï¼Ÿè®¾ç½® `pty: true`ã€‚

æ³¨æ„ï¼š

- åŽå°è¿è¡Œæ—¶è¿”å›žå¸¦æœ‰ `sessionId` çš„ `status: "running"`ã€‚
- ä½¿ç”¨ `process` æ¥è½®è¯¢/æ—¥å¿—/å†™å…¥/ç»ˆæ­¢/æ¸…é™¤åŽå°ä¼šè¯ã€‚
- å¦‚æžœä¸å…è®¸ `process`ï¼Œ`exec` ä¼šåŒæ­¥è¿è¡Œå¹¶å¿½ç•¥ `yieldMs`/`background`ã€‚
- `elevated` å— `tools.elevated` åŠ ä¸Šä»»ä½• `agents.list[].tools.elevated` è¦†ç›–çš„é—¨æŽ§ï¼ˆä¸¤è€…éƒ½å¿…é¡»å…è®¸ï¼‰ï¼Œæ˜¯ `host=gateway` + `security=full` çš„åˆ«åã€‚
- `elevated` ä»…åœ¨æ™ºèƒ½ä½“è¢«æ²™ç®±éš”ç¦»æ—¶æ”¹å˜è¡Œä¸ºï¼ˆå¦åˆ™æ˜¯ç©ºæ“ä½œï¼‰ã€‚
- `host=node` å¯ä»¥é’ˆå¯¹ macOS é…å¥—åº”ç”¨æˆ–æ— å¤´èŠ‚ç‚¹ä¸»æœºï¼ˆ`vikiclow node run`ï¼‰ã€‚
- Gateway ç½‘å…³/èŠ‚ç‚¹å®¡æ‰¹å’Œå…è®¸åˆ—è¡¨ï¼š[æ‰§è¡Œå®¡æ‰¹](/tools/exec-approvals)ã€‚

### `process`

ç®¡ç†åŽå° exec ä¼šè¯ã€‚

æ ¸å¿ƒæ“ä½œï¼š

- `list`ã€`poll`ã€`log`ã€`write`ã€`kill`ã€`clear`ã€`remove`

æ³¨æ„ï¼š

- `poll` è¿”å›žæ–°è¾“å‡ºï¼Œå®Œæˆæ—¶è¿”å›žé€€å‡ºçŠ¶æ€ã€‚
- `log` æ”¯æŒåŸºäºŽè¡Œçš„ `offset`/`limit`ï¼ˆçœç•¥ `offset` ä»¥èŽ·å–æœ€åŽ N è¡Œï¼‰ã€‚
- `process` æŒ‰æ™ºèƒ½ä½“ä½œç”¨åŸŸï¼›æ¥è‡ªå…¶ä»–æ™ºèƒ½ä½“çš„ä¼šè¯ä¸å¯è§ã€‚

### `web_search`

ä½¿ç”¨ Brave Search API æœç´¢ç½‘ç»œã€‚

æ ¸å¿ƒå‚æ•°ï¼š

- `query`ï¼ˆå¿…éœ€ï¼‰
- `count`ï¼ˆ1-10ï¼›é»˜è®¤æ¥è‡ª `tools.web.search.maxResults`ï¼‰

æ³¨æ„ï¼š

- éœ€è¦ Brave API å¯†é’¥ï¼ˆæŽ¨èï¼š`vikiclow configure --section web`ï¼Œæˆ–è®¾ç½® `BRAVE_API_KEY`ï¼‰ã€‚
- é€šè¿‡ `tools.web.search.enabled` å¯ç”¨ã€‚
- å“åº”è¢«ç¼“å­˜ï¼ˆé»˜è®¤ 15 åˆ†é’Ÿï¼‰ã€‚
- å‚è§ [Web å·¥å…·](/tools/web) äº†è§£è®¾ç½®ã€‚

### `web_fetch`

ä»Ž URL èŽ·å–å¹¶æå–å¯è¯»å†…å®¹ï¼ˆHTML â†’ markdown/textï¼‰ã€‚

æ ¸å¿ƒå‚æ•°ï¼š

- `url`ï¼ˆå¿…éœ€ï¼‰
- `extractMode`ï¼ˆ`markdown` | `text`ï¼‰
- `maxChars`ï¼ˆæˆªæ–­é•¿é¡µé¢ï¼‰

æ³¨æ„ï¼š

- é€šè¿‡ `tools.web.fetch.enabled` å¯ç”¨ã€‚
- å“åº”è¢«ç¼“å­˜ï¼ˆé»˜è®¤ 15 åˆ†é’Ÿï¼‰ã€‚
- å¯¹äºŽ JS å¯†é›†åž‹ç½‘ç«™ï¼Œä¼˜å…ˆä½¿ç”¨ browser å·¥å…·ã€‚
- å‚è§ [Web å·¥å…·](/tools/web) äº†è§£è®¾ç½®ã€‚
- å‚è§ [Firecrawl](/tools/firecrawl) äº†è§£å¯é€‰çš„åæœºå™¨äººå›žé€€ã€‚

### `browser`

æŽ§åˆ¶ä¸“ç”¨çš„ VikiClow ç®¡ç†çš„æµè§ˆå™¨ã€‚

æ ¸å¿ƒæ“ä½œï¼š

- `status`ã€`start`ã€`stop`ã€`tabs`ã€`open`ã€`focus`ã€`close`
- `snapshot`ï¼ˆaria/aiï¼‰
- `screenshot`ï¼ˆè¿”å›žå›¾åƒå— + `MEDIA:<path>`ï¼‰
- `act`ï¼ˆUI æ“ä½œï¼šclick/type/press/hover/drag/select/fill/resize/wait/evaluateï¼‰
- `navigate`ã€`console`ã€`pdf`ã€`upload`ã€`dialog`

é…ç½®æ–‡ä»¶ç®¡ç†ï¼š

- `profiles` â€” åˆ—å‡ºæ‰€æœ‰æµè§ˆå™¨é…ç½®æ–‡ä»¶åŠå…¶çŠ¶æ€
- `create-profile` â€” ä½¿ç”¨è‡ªåŠ¨åˆ†é…çš„ç«¯å£ï¼ˆæˆ– `cdpUrl`ï¼‰åˆ›å»ºæ–°é…ç½®æ–‡ä»¶
- `delete-profile` â€” åœæ­¢æµè§ˆå™¨ï¼Œåˆ é™¤ç”¨æˆ·æ•°æ®ï¼Œä»Žé…ç½®ä¸­ç§»é™¤ï¼ˆä»…æœ¬åœ°ï¼‰
- `reset-profile` â€” ç»ˆæ­¢é…ç½®æ–‡ä»¶ç«¯å£ä¸Šçš„å­¤å„¿è¿›ç¨‹ï¼ˆä»…æœ¬åœ°ï¼‰

å¸¸ç”¨å‚æ•°ï¼š

- `profile`ï¼ˆå¯é€‰ï¼›é»˜è®¤ä¸º `browser.defaultProfile`ï¼‰
- `target`ï¼ˆ`sandbox` | `host` | `node`ï¼‰
- `node`ï¼ˆå¯é€‰ï¼›é€‰æ‹©ç‰¹å®šçš„èŠ‚ç‚¹ id/åç§°ï¼‰
  æ³¨æ„ï¼š
- éœ€è¦ `browser.enabled=true`ï¼ˆé»˜è®¤ä¸º `true`ï¼›è®¾ç½®ä¸º `false` ä»¥ç¦ç”¨ï¼‰ã€‚
- æ‰€æœ‰æ“ä½œæŽ¥å—å¯é€‰çš„ `profile` å‚æ•°ä»¥æ”¯æŒå¤šå®žä¾‹ã€‚
- å½“çœç•¥ `profile` æ—¶ï¼Œä½¿ç”¨ `browser.defaultProfile`ï¼ˆé»˜è®¤ä¸º"chrome"ï¼‰ã€‚
- é…ç½®æ–‡ä»¶åç§°ï¼šä»…å°å†™å­—æ¯æ•°å­— + è¿žå­—ç¬¦ï¼ˆæœ€å¤š 64 å­—ç¬¦ï¼‰ã€‚
- ç«¯å£èŒƒå›´ï¼š18800-18899ï¼ˆæœ€å¤šçº¦ 100 ä¸ªé…ç½®æ–‡ä»¶ï¼‰ã€‚
- è¿œç¨‹é…ç½®æ–‡ä»¶ä»…æ”¯æŒé™„åŠ ï¼ˆæ—  start/stop/resetï¼‰ã€‚
- å¦‚æžœè¿žæŽ¥äº†æ”¯æŒæµè§ˆå™¨çš„èŠ‚ç‚¹ï¼Œå·¥å…·å¯èƒ½ä¼šè‡ªåŠ¨è·¯ç”±åˆ°å®ƒï¼ˆé™¤éžä½ å›ºå®šäº† `target`ï¼‰ã€‚
- å®‰è£… Playwright æ—¶ `snapshot` é»˜è®¤ä¸º `ai`ï¼›ä½¿ç”¨ `aria` èŽ·å–æ— éšœç¢æ ‘ã€‚
- `snapshot` è¿˜æ”¯æŒè§’è‰²å¿«ç…§é€‰é¡¹ï¼ˆ`interactive`ã€`compact`ã€`depth`ã€`selector`ï¼‰ï¼Œè¿”å›žåƒ `e12` è¿™æ ·çš„å¼•ç”¨ã€‚
- `act` éœ€è¦æ¥è‡ª `snapshot` çš„ `ref`ï¼ˆAI å¿«ç…§ä¸­çš„æ•°å­— `12`ï¼Œæˆ–è§’è‰²å¿«ç…§ä¸­çš„ `e12`ï¼‰ï¼›å¯¹äºŽç½•è§çš„ CSS é€‰æ‹©å™¨éœ€æ±‚ä½¿ç”¨ `evaluate`ã€‚
- é»˜è®¤é¿å… `act` â†’ `wait`ï¼›ä»…åœ¨ç‰¹æ®Šæƒ…å†µä¸‹ä½¿ç”¨ï¼ˆæ²¡æœ‰å¯é çš„ UI çŠ¶æ€å¯ç­‰å¾…ï¼‰ã€‚
- `upload` å¯ä»¥é€‰æ‹©æ€§åœ°ä¼ é€’ `ref` ä»¥åœ¨å‡†å¤‡åŽè‡ªåŠ¨ç‚¹å‡»ã€‚
- `upload` è¿˜æ”¯æŒ `inputRef`ï¼ˆaria å¼•ç”¨ï¼‰æˆ– `element`ï¼ˆCSS é€‰æ‹©å™¨ï¼‰ä»¥ç›´æŽ¥è®¾ç½® `<input type="file">`ã€‚

### `canvas`

é©±åŠ¨èŠ‚ç‚¹ Canvasï¼ˆpresentã€evalã€snapshotã€A2UIï¼‰ã€‚

æ ¸å¿ƒæ“ä½œï¼š

- `present`ã€`hide`ã€`navigate`ã€`eval`
- `snapshot`ï¼ˆè¿”å›žå›¾åƒå— + `MEDIA:<path>`ï¼‰
- `a2ui_push`ã€`a2ui_reset`

æ³¨æ„ï¼š

- åº•å±‚ä½¿ç”¨ Gateway ç½‘å…³ `node.invoke`ã€‚
- å¦‚æžœæœªæä¾› `node`ï¼Œå·¥å…·ä¼šé€‰æ‹©é»˜è®¤å€¼ï¼ˆå•ä¸ªè¿žæŽ¥çš„èŠ‚ç‚¹æˆ–æœ¬åœ° mac èŠ‚ç‚¹ï¼‰ã€‚
- A2UI ä»…é™ v0.8ï¼ˆæ—  `createSurface`ï¼‰ï¼›CLI ä¼šæ‹’ç» v0.9 JSONL å¹¶æ˜¾ç¤ºè¡Œé”™è¯¯ã€‚
- å¿«é€Ÿå†’çƒŸæµ‹è¯•ï¼š`vikiclow nodes canvas a2ui push --node <id> --text "Hello from A2UI"`ã€‚

### `nodes`

å‘çŽ°å’Œå®šä½é…å¯¹çš„èŠ‚ç‚¹ï¼›å‘é€é€šçŸ¥ï¼›æ•èŽ·æ‘„åƒå¤´/å±å¹•ã€‚

æ ¸å¿ƒæ“ä½œï¼š

- `status`ã€`describe`
- `pending`ã€`approve`ã€`reject`ï¼ˆé…å¯¹ï¼‰
- `notify`ï¼ˆmacOS `system.notify`ï¼‰
- `run`ï¼ˆmacOS `system.run`ï¼‰
- `camera_snap`ã€`camera_clip`ã€`screen_record`
- `location_get`

æ³¨æ„ï¼š

- æ‘„åƒå¤´/å±å¹•å‘½ä»¤éœ€è¦èŠ‚ç‚¹åº”ç”¨åœ¨å‰å°ã€‚
- å›¾åƒè¿”å›žå›¾åƒå— + `MEDIA:<path>`ã€‚
- è§†é¢‘è¿”å›ž `FILE:<path>`ï¼ˆmp4ï¼‰ã€‚
- ä½ç½®è¿”å›ž JSON è´Ÿè½½ï¼ˆlat/lon/accuracy/timestampï¼‰ã€‚
- `run` å‚æ•°ï¼š`command` argv æ•°ç»„ï¼›å¯é€‰çš„ `cwd`ã€`env`ï¼ˆ`KEY=VAL`ï¼‰ã€`commandTimeoutMs`ã€`invokeTimeoutMs`ã€`needsScreenRecording`ã€‚

ç¤ºä¾‹ï¼ˆ`run`ï¼‰ï¼š

```json
{
  "action": "run",
  "node": "office-mac",
  "command": ["echo", "Hello"],
  "env": ["FOO=bar"],
  "commandTimeoutMs": 12000,
  "invokeTimeoutMs": 45000,
  "needsScreenRecording": false
}
```

### `image`

ä½¿ç”¨é…ç½®çš„å›¾åƒæ¨¡åž‹åˆ†æžå›¾åƒã€‚

æ ¸å¿ƒå‚æ•°ï¼š

- `image`ï¼ˆå¿…éœ€çš„è·¯å¾„æˆ– URLï¼‰
- `prompt`ï¼ˆå¯é€‰ï¼›é»˜è®¤ä¸º"Describe the image."ï¼‰
- `model`ï¼ˆå¯é€‰è¦†ç›–ï¼‰
- `maxBytesMb`ï¼ˆå¯é€‰å¤§å°ä¸Šé™ï¼‰

æ³¨æ„ï¼š

- ä»…åœ¨é…ç½®äº† `agents.defaults.imageModel`ï¼ˆä¸»è¦æˆ–å›žé€€ï¼‰æ—¶å¯ç”¨ï¼Œæˆ–è€…å½“å¯ä»¥ä»Žä½ çš„é»˜è®¤æ¨¡åž‹ + é…ç½®çš„è®¤è¯æŽ¨æ–­å‡ºéšå¼å›¾åƒæ¨¡åž‹æ—¶ï¼ˆå°½åŠ›é…å¯¹ï¼‰ã€‚
- ç›´æŽ¥ä½¿ç”¨å›¾åƒæ¨¡åž‹ï¼ˆç‹¬ç«‹äºŽä¸»èŠå¤©æ¨¡åž‹ï¼‰ã€‚

### `message`

è·¨ Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/iMessage/MS Teams å‘é€æ¶ˆæ¯å’Œæ¸ é“æ“ä½œã€‚

æ ¸å¿ƒæ“ä½œï¼š

- `send`ï¼ˆæ–‡æœ¬ + å¯é€‰åª’ä½“ï¼›MS Teams è¿˜æ”¯æŒç”¨äºŽ Adaptive Cards çš„ `card`ï¼‰
- `poll`ï¼ˆWhatsApp/Discord/MS Teams æŠ•ç¥¨ï¼‰
- `react` / `reactions` / `read` / `edit` / `delete`
- `pin` / `unpin` / `list-pins`
- `permissions`
- `thread-create` / `thread-list` / `thread-reply`
- `search`
- `sticker`
- `member-info` / `role-info`
- `emoji-list` / `emoji-upload` / `sticker-upload`
- `role-add` / `role-remove`
- `channel-info` / `channel-list`
- `voice-status`
- `event-list` / `event-create`
- `timeout` / `kick` / `ban`

æ³¨æ„ï¼š

- `send` é€šè¿‡ Gateway ç½‘å…³è·¯ç”± WhatsAppï¼›å…¶ä»–æ¸ é“ç›´æŽ¥å‘é€ã€‚
- `poll` å¯¹ WhatsApp å’Œ MS Teams ä½¿ç”¨ Gateway ç½‘å…³ï¼›Discord æŠ•ç¥¨ç›´æŽ¥å‘é€ã€‚
- å½“æ¶ˆæ¯å·¥å…·è°ƒç”¨ç»‘å®šåˆ°æ´»åŠ¨èŠå¤©ä¼šè¯æ—¶ï¼Œå‘é€è¢«é™åˆ¶åˆ°è¯¥ä¼šè¯çš„ç›®æ ‡ä»¥é¿å…è·¨ä¸Šä¸‹æ–‡æ³„éœ²ã€‚

### `cron`

ç®¡ç† Gateway ç½‘å…³å®šæ—¶ä»»åŠ¡å’Œå”¤é†’ã€‚

æ ¸å¿ƒæ“ä½œï¼š

- `status`ã€`list`
- `add`ã€`update`ã€`remove`ã€`run`ã€`runs`
- `wake`ï¼ˆå…¥é˜Ÿç³»ç»Ÿäº‹ä»¶ + å¯é€‰çš„ç«‹å³å¿ƒè·³ï¼‰

æ³¨æ„ï¼š

- `add` æœŸæœ›å®Œæ•´çš„å®šæ—¶ä»»åŠ¡å¯¹è±¡ï¼ˆä¸Ž `cron.add` RPC ç›¸åŒçš„ schemaï¼‰ã€‚
- `update` ä½¿ç”¨ `{ id, patch }`ã€‚

### `gateway`

é‡å¯æˆ–å¯¹è¿è¡Œä¸­çš„ Gateway ç½‘å…³è¿›ç¨‹åº”ç”¨æ›´æ–°ï¼ˆå°±åœ°ï¼‰ã€‚

æ ¸å¿ƒæ“ä½œï¼š

- `restart`ï¼ˆæŽˆæƒ + å‘é€ `SIGUSR1` è¿›è¡Œè¿›ç¨‹å†…é‡å¯ï¼›`vikiclow gateway` å°±åœ°é‡å¯ï¼‰
- `config.get` / `config.schema`
- `config.apply`ï¼ˆéªŒè¯ + å†™å…¥é…ç½® + é‡å¯ + å”¤é†’ï¼‰
- `config.patch`ï¼ˆåˆå¹¶éƒ¨åˆ†æ›´æ–° + é‡å¯ + å”¤é†’ï¼‰
- `update.run`ï¼ˆè¿è¡Œæ›´æ–° + é‡å¯ + å”¤é†’ï¼‰

æ³¨æ„ï¼š

- ä½¿ç”¨ `delayMs`ï¼ˆé»˜è®¤ 2000ï¼‰ä»¥é¿å…ä¸­æ–­è¿›è¡Œä¸­çš„å›žå¤ã€‚
- `restart` é»˜è®¤ç¦ç”¨ï¼›ä½¿ç”¨ `commands.restart: true` å¯ç”¨ã€‚

### `sessions_list` / `sessions_history` / `sessions_send` / `sessions_spawn` / `session_status`

åˆ—å‡ºä¼šè¯ï¼Œæ£€æŸ¥è½¬å½•åŽ†å²ï¼Œæˆ–å‘é€åˆ°å¦ä¸€ä¸ªä¼šè¯ã€‚

æ ¸å¿ƒå‚æ•°ï¼š

- `sessions_list`ï¼š`kinds?`ã€`limit?`ã€`activeMinutes?`ã€`messageLimit?`ï¼ˆ0 = æ— ï¼‰
- `sessions_history`ï¼š`sessionKey`ï¼ˆæˆ– `sessionId`ï¼‰ã€`limit?`ã€`includeTools?`
- `sessions_send`ï¼š`sessionKey`ï¼ˆæˆ– `sessionId`ï¼‰ã€`message`ã€`timeoutSeconds?`ï¼ˆ0 = fire-and-forgetï¼‰
- `sessions_spawn`ï¼š`task`ã€`label?`ã€`agentId?`ã€`model?`ã€`runTimeoutSeconds?`ã€`cleanup?`
- `session_status`ï¼š`sessionKey?`ï¼ˆé»˜è®¤å½“å‰ï¼›æŽ¥å— `sessionId`ï¼‰ã€`model?`ï¼ˆ`default` æ¸…é™¤è¦†ç›–ï¼‰

æ³¨æ„ï¼š

- `main` æ˜¯è§„èŒƒçš„ç§èŠé”®ï¼›global/unknown æ˜¯éšè—çš„ã€‚
- `messageLimit > 0` èŽ·å–æ¯ä¸ªä¼šè¯çš„æœ€åŽ N æ¡æ¶ˆæ¯ï¼ˆå·¥å…·æ¶ˆæ¯è¢«è¿‡æ»¤ï¼‰ã€‚
- å½“ `timeoutSeconds > 0` æ—¶ï¼Œ`sessions_send` ç­‰å¾…æœ€ç»ˆå®Œæˆã€‚
- é€’é€/å®£å‘Šå‘ç”Ÿåœ¨å®ŒæˆåŽï¼Œæ˜¯å°½åŠ›è€Œä¸ºçš„ï¼›`status: "ok"` ç¡®è®¤æ™ºèƒ½ä½“è¿è¡Œå®Œæˆï¼Œè€Œä¸æ˜¯å®£å‘Šå·²é€’é€ã€‚
- `sessions_spawn` å¯åŠ¨å­æ™ºèƒ½ä½“è¿è¡Œå¹¶å°†å®£å‘Šå›žå¤å‘é€å›žè¯·æ±‚è€…èŠå¤©ã€‚
- `sessions_spawn` æ˜¯éžé˜»å¡žçš„ï¼Œç«‹å³è¿”å›ž `status: "accepted"`ã€‚
- `sessions_send` è¿è¡Œå›žå¤å¾€è¿”ä¹’ä¹“ï¼ˆå›žå¤ `REPLY_SKIP` ä»¥åœæ­¢ï¼›æœ€å¤§è½®æ¬¡é€šè¿‡ `session.agentToAgent.maxPingPongTurns`ï¼Œ0-5ï¼‰ã€‚
- ä¹’ä¹“ä¹‹åŽï¼Œç›®æ ‡æ™ºèƒ½ä½“è¿è¡Œä¸€ä¸ª**å®£å‘Šæ­¥éª¤**ï¼›å›žå¤ `ANNOUNCE_SKIP` ä»¥æŠ‘åˆ¶å®£å‘Šã€‚

### `agents_list`

åˆ—å‡ºå½“å‰ä¼šè¯å¯ä»¥ç”¨ `sessions_spawn` å®šä½çš„æ™ºèƒ½ä½“ idã€‚

æ³¨æ„ï¼š

- ç»“æžœå—æ¯æ™ºèƒ½ä½“å…è®¸åˆ—è¡¨é™åˆ¶ï¼ˆ`agents.list[].subagents.allowAgents`ï¼‰ã€‚
- å½“é…ç½®ä¸º `["*"]` æ—¶ï¼Œå·¥å…·åŒ…å«æ‰€æœ‰å·²é…ç½®çš„æ™ºèƒ½ä½“å¹¶æ ‡è®° `allowAny: true`ã€‚

## å‚æ•°ï¼ˆé€šç”¨ï¼‰

Gateway ç½‘å…³æ”¯æŒçš„å·¥å…·ï¼ˆ`canvas`ã€`nodes`ã€`cron`ï¼‰ï¼š

- `gatewayUrl`ï¼ˆé»˜è®¤ `ws://127.0.0.1:18789`ï¼‰
- `gatewayToken`ï¼ˆå¦‚æžœå¯ç”¨äº†è®¤è¯ï¼‰
- `timeoutMs`

Browser å·¥å…·ï¼š

- `profile`ï¼ˆå¯é€‰ï¼›é»˜è®¤ä¸º `browser.defaultProfile`ï¼‰
- `target`ï¼ˆ`sandbox` | `host` | `node`ï¼‰
- `node`ï¼ˆå¯é€‰ï¼›å›ºå®šç‰¹å®šçš„èŠ‚ç‚¹ id/åç§°ï¼‰

## æŽ¨èçš„æ™ºèƒ½ä½“æµç¨‹

æµè§ˆå™¨è‡ªåŠ¨åŒ–ï¼š

1. `browser` â†’ `status` / `start`
2. `snapshot`ï¼ˆai æˆ– ariaï¼‰
3. `act`ï¼ˆclick/type/pressï¼‰
4. `screenshot` å¦‚æžœä½ éœ€è¦è§†è§‰ç¡®è®¤

Canvas æ¸²æŸ“ï¼š

1. `canvas` â†’ `present`
2. `a2ui_push`ï¼ˆå¯é€‰ï¼‰
3. `snapshot`

èŠ‚ç‚¹å®šä½ï¼š

1. `nodes` â†’ `status`
2. åœ¨é€‰å®šçš„èŠ‚ç‚¹ä¸Š `describe`
3. `notify` / `run` / `camera_snap` / `screen_record`

## å®‰å…¨æ€§

- é¿å…ç›´æŽ¥ `system.run`ï¼›ä»…åœ¨ç”¨æˆ·æ˜Žç¡®åŒæ„æ—¶ä½¿ç”¨ `nodes` â†’ `run`ã€‚
- å°Šé‡ç”¨æˆ·å¯¹æ‘„åƒå¤´/å±å¹•æ•èŽ·çš„åŒæ„ã€‚
- åœ¨è°ƒç”¨åª’ä½“å‘½ä»¤å‰ä½¿ç”¨ `status/describe` ç¡®ä¿æƒé™ã€‚

## å·¥å…·å¦‚ä½•å‘ˆçŽ°ç»™æ™ºèƒ½ä½“

å·¥å…·é€šè¿‡ä¸¤ä¸ªå¹¶è¡Œæ¸ é“æš´éœ²ï¼š

1. **ç³»ç»Ÿæç¤ºæ–‡æœ¬**ï¼šäººç±»å¯è¯»çš„åˆ—è¡¨ + æŒ‡å¯¼ã€‚
2. **å·¥å…· schema**ï¼šå‘é€åˆ°æ¨¡åž‹ API çš„ç»“æž„åŒ–å‡½æ•°å®šä¹‰ã€‚

è¿™æ„å‘³ç€æ™ºèƒ½ä½“åŒæ—¶çœ‹åˆ°"å­˜åœ¨å“ªäº›å·¥å…·"å’Œ"å¦‚ä½•è°ƒç”¨å®ƒä»¬"ã€‚å¦‚æžœå·¥å…·
æ²¡æœ‰å‡ºçŽ°åœ¨ç³»ç»Ÿæç¤ºæˆ– schema ä¸­ï¼Œæ¨¡åž‹å°±æ— æ³•è°ƒç”¨å®ƒã€‚
