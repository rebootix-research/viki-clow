---
read_when:
  - ä½ æƒ³åœ¨ VikiClow ä¸­ä½¿ç”¨ MiniMax æ¨¡åž‹
  - ä½ éœ€è¦ MiniMax è®¾ç½®æŒ‡å—
summary: åœ¨ VikiClow ä¸­ä½¿ç”¨ MiniMax M2.1
title: MiniMax
x-i18n:
  generated_at: "2026-02-03T10:08:52Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: 861e1ddc3c24be88f716bfb72d6015d62875a9087f8e89ea4ba3a35f548c7fae
  source_path: providers/minimax.md
  workflow: 15
---

# MiniMax

MiniMax æ˜¯ä¸€å®¶æž„å»º **M2/M2.1** æ¨¡åž‹ç³»åˆ—çš„ AI å…¬å¸ã€‚å½“å‰é¢å‘ç¼–ç¨‹çš„ç‰ˆæœ¬æ˜¯ **MiniMax M2.1**ï¼ˆ2025 å¹´ 12 æœˆ 23 æ—¥ï¼‰ï¼Œä¸“ä¸ºçŽ°å®žä¸–ç•Œçš„å¤æ‚ä»»åŠ¡è€Œæž„å»ºã€‚

æ¥æºï¼š[MiniMax M2.1 å‘å¸ƒè¯´æ˜Ž](https://www.minimax.io/news/minimax-m21)

## æ¨¡åž‹æ¦‚è¿°ï¼ˆM2.1ï¼‰

MiniMax å¼ºè°ƒ M2.1 çš„ä»¥ä¸‹æ”¹è¿›ï¼š

- æ›´å¼ºçš„**å¤šè¯­è¨€ç¼–ç¨‹**èƒ½åŠ›ï¼ˆRustã€Javaã€Goã€C++ã€Kotlinã€Objective-Cã€TS/JSï¼‰ã€‚
- æ›´å¥½çš„ **Web/åº”ç”¨å¼€å‘**å’Œç¾Žè§‚è¾“å‡ºè´¨é‡ï¼ˆåŒ…æ‹¬åŽŸç”Ÿç§»åŠ¨ç«¯ï¼‰ã€‚
- æ”¹è¿›çš„**å¤åˆæŒ‡ä»¤**å¤„ç†ï¼Œé€‚ç”¨äºŽåŠžå…¬é£Žæ ¼çš„å·¥ä½œæµç¨‹ï¼ŒåŸºäºŽäº¤é”™æ€è€ƒå’Œé›†æˆçº¦æŸæ‰§è¡Œã€‚
- **æ›´ç®€æ´çš„å“åº”**ï¼Œæ›´ä½Žçš„ token ä½¿ç”¨é‡å’Œæ›´å¿«çš„è¿­ä»£å¾ªçŽ¯ã€‚
- æ›´å¼ºçš„**å·¥å…·/æ™ºèƒ½ä½“æ¡†æž¶**å…¼å®¹æ€§å’Œä¸Šä¸‹æ–‡ç®¡ç†ï¼ˆClaude Codeã€Droid/Factory AIã€Clineã€Kilo Codeã€Roo Codeã€BlackBoxï¼‰ã€‚
- æ›´é«˜è´¨é‡çš„**å¯¹è¯å’ŒæŠ€æœ¯å†™ä½œ**è¾“å‡ºã€‚

## MiniMax M2.1 vs MiniMax M2.1 Lightning

- **é€Ÿåº¦ï¼š** Lightning æ˜¯ MiniMax å®šä»·æ–‡æ¡£ä¸­çš„"å¿«é€Ÿ"å˜ä½“ã€‚
- **æˆæœ¬ï¼š** å®šä»·æ˜¾ç¤ºç›¸åŒçš„è¾“å…¥æˆæœ¬ï¼Œä½† Lightning çš„è¾“å‡ºæˆæœ¬æ›´é«˜ã€‚
- **ç¼–ç¨‹è®¡åˆ’è·¯ç”±ï¼š** Lightning åŽç«¯åœ¨ MiniMax ç¼–ç¨‹è®¡åˆ’ä¸­ä¸èƒ½ç›´æŽ¥ä½¿ç”¨ã€‚MiniMax è‡ªåŠ¨å°†å¤§å¤šæ•°è¯·æ±‚è·¯ç”±åˆ° Lightningï¼Œä½†åœ¨æµé‡é«˜å³°æœŸä¼šå›žé€€åˆ°å¸¸è§„ M2.1 åŽç«¯ã€‚

## é€‰æ‹©è®¾ç½®æ–¹å¼

### MiniMax OAuthï¼ˆç¼–ç¨‹è®¡åˆ’ï¼‰â€” æŽ¨è

**é€‚ç”¨äºŽï¼š** é€šè¿‡ OAuth å¿«é€Ÿè®¾ç½® MiniMax ç¼–ç¨‹è®¡åˆ’ï¼Œæ— éœ€ API å¯†é’¥ã€‚

å¯ç”¨å†…ç½® OAuth æ’ä»¶å¹¶è¿›è¡Œè®¤è¯ï¼š

```bash
vikiclow plugins enable minimax-portal-auth  # å¦‚æžœå·²åŠ è½½åˆ™è·³è¿‡
vikiclow gateway restart  # å¦‚æžœ Gateway ç½‘å…³å·²åœ¨è¿è¡Œåˆ™é‡å¯
vikiclow onboard --auth-choice minimax-portal
```

ç³»ç»Ÿä¼šæç¤ºä½ é€‰æ‹©ç«¯ç‚¹ï¼š

- **Global** - å›½é™…ç”¨æˆ·ï¼ˆ`api.minimax.io`ï¼‰
- **CN** - ä¸­å›½ç”¨æˆ·ï¼ˆ`api.minimaxi.com`ï¼‰

è¯¦æƒ…å‚è§ [MiniMax OAuth æ’ä»¶ README](https://github.com/rebootix-research/viki-clow/tree/main/extensions/minimax-portal-auth)ã€‚

### MiniMax M2.1ï¼ˆAPI å¯†é’¥ï¼‰

**é€‚ç”¨äºŽï¼š** ä½¿ç”¨ Anthropic å…¼å®¹ API çš„æ‰˜ç®¡ MiniMaxã€‚

é€šè¿‡ CLI é…ç½®ï¼š

- è¿è¡Œ `vikiclow configure`
- é€‰æ‹© **Model/auth**
- é€‰æ‹© **MiniMax M2.1**

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "minimax/MiniMax-M2.1" } } },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.1",
            name: "MiniMax M2.1",
            reasoning: false,
            input: ["text"],
            cost: { input: 15, output: 60, cacheRead: 2, cacheWrite: 10 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### MiniMax M2.1 ä½œä¸ºå¤‡ç”¨ï¼ˆOpus ä¸ºä¸»ï¼‰

**é€‚ç”¨äºŽï¼š** ä¿æŒ Opus 4.5 ä¸ºä¸»æ¨¡åž‹ï¼Œæ•…éšœæ—¶åˆ‡æ¢åˆ° MiniMax M2.1ã€‚

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-5": { alias: "opus" },
        "minimax/MiniMax-M2.1": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-5",
        fallbacks: ["minimax/MiniMax-M2.1"],
      },
    },
  },
}
```

### å¯é€‰ï¼šé€šè¿‡ LM Studio æœ¬åœ°è¿è¡Œï¼ˆæ‰‹åŠ¨ï¼‰

**é€‚ç”¨äºŽï¼š** ä½¿ç”¨ LM Studio è¿›è¡Œæœ¬åœ°æŽ¨ç†ã€‚
æˆ‘ä»¬åœ¨å¼ºå¤§ç¡¬ä»¶ï¼ˆä¾‹å¦‚å°å¼æœº/æœåŠ¡å™¨ï¼‰ä¸Šä½¿ç”¨ LM Studio çš„æœ¬åœ°æœåŠ¡å™¨è¿è¡Œ MiniMax M2.1 æ—¶çœ‹åˆ°äº†å‡ºè‰²çš„æ•ˆæžœã€‚

é€šè¿‡ `vikiclow.json` æ‰‹åŠ¨é…ç½®ï¼š

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.1-gs32" },
      models: { "lmstudio/minimax-m2.1-gs32": { alias: "Minimax" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.1-gs32",
            name: "MiniMax M2.1 GS32",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## é€šè¿‡ `vikiclow configure` é…ç½®

ä½¿ç”¨äº¤äº’å¼é…ç½®å‘å¯¼è®¾ç½® MiniMaxï¼Œæ— éœ€ç¼–è¾‘ JSONï¼š

1. è¿è¡Œ `vikiclow configure`ã€‚
2. é€‰æ‹© **Model/auth**ã€‚
3. é€‰æ‹© **MiniMax M2.1**ã€‚
4. åœ¨æç¤ºæ—¶é€‰æ‹©ä½ çš„é»˜è®¤æ¨¡åž‹ã€‚

## é…ç½®é€‰é¡¹

- `models.providers.minimax.baseUrl`ï¼šæŽ¨èä½¿ç”¨ `https://api.minimax.io/anthropic`ï¼ˆAnthropic å…¼å®¹ï¼‰ï¼›`https://api.minimax.io/v1` å¯é€‰ç”¨äºŽ OpenAI å…¼å®¹çš„è´Ÿè½½ã€‚
- `models.providers.minimax.api`ï¼šæŽ¨èä½¿ç”¨ `anthropic-messages`ï¼›`openai-completions` å¯é€‰ç”¨äºŽ OpenAI å…¼å®¹çš„è´Ÿè½½ã€‚
- `models.providers.minimax.apiKey`ï¼šMiniMax API å¯†é’¥ï¼ˆ`MINIMAX_API_KEY`ï¼‰ã€‚
- `models.providers.minimax.models`ï¼šå®šä¹‰ `id`ã€`name`ã€`reasoning`ã€`contextWindow`ã€`maxTokens`ã€`cost`ã€‚
- `agents.defaults.models`ï¼šä¸ºä½ æƒ³è¦åœ¨å…è®¸åˆ—è¡¨ä¸­çš„æ¨¡åž‹è®¾ç½®åˆ«åã€‚
- `models.mode`ï¼šå¦‚æžœä½ æƒ³å°† MiniMax ä¸Žå†…ç½®æ¨¡åž‹ä¸€èµ·æ·»åŠ ï¼Œä¿æŒ `merge`ã€‚

## æ³¨æ„äº‹é¡¹

- æ¨¡åž‹å¼•ç”¨æ ¼å¼ä¸º `minimax/<model>`ã€‚
- ç¼–ç¨‹è®¡åˆ’ä½¿ç”¨é‡ APIï¼š`https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains`ï¼ˆéœ€è¦ç¼–ç¨‹è®¡åˆ’å¯†é’¥ï¼‰ã€‚
- å¦‚æžœéœ€è¦ç²¾ç¡®çš„æˆæœ¬è·Ÿè¸ªï¼Œè¯·æ›´æ–° `models.json` ä¸­çš„å®šä»·å€¼ã€‚
- MiniMax ç¼–ç¨‹è®¡åˆ’æŽ¨èé“¾æŽ¥ï¼ˆ9 æŠ˜ä¼˜æƒ ï¼‰ï¼šhttps://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link
- å‚è§ [/concepts/model-providers](/concepts/model-providers) äº†è§£æä¾›å•†è§„åˆ™ã€‚
- ä½¿ç”¨ `vikiclow models list` å’Œ `vikiclow models set minimax/MiniMax-M2.1` åˆ‡æ¢æ¨¡åž‹ã€‚

## æ•…éšœæŽ’é™¤

### "Unknown model: minimax/MiniMax-M2.1"

è¿™é€šå¸¸æ„å‘³ç€ **MiniMax æä¾›å•†æœªé…ç½®**ï¼ˆæ²¡æœ‰æä¾›å•†æ¡ç›®ï¼Œä¹Ÿæ²¡æœ‰æ‰¾åˆ° MiniMax è®¤è¯é…ç½®æ–‡ä»¶/çŽ¯å¢ƒå˜é‡å¯†é’¥ï¼‰ã€‚æ­¤æ£€æµ‹çš„ä¿®å¤åœ¨ **2026.1.12** ä¸­ï¼ˆæ’°å†™æœ¬æ–‡æ—¶å°šæœªå‘å¸ƒï¼‰ã€‚ä¿®å¤æ–¹æ³•ï¼š

- å‡çº§åˆ° **2026.1.12**ï¼ˆæˆ–ä»Žæºç  `main` åˆ†æ”¯è¿è¡Œï¼‰ï¼Œç„¶åŽé‡å¯ Gateway ç½‘å…³ã€‚
- è¿è¡Œ `vikiclow configure` å¹¶é€‰æ‹© **MiniMax M2.1**ï¼Œæˆ–
- æ‰‹åŠ¨æ·»åŠ  `models.providers.minimax` å—ï¼Œæˆ–
- è®¾ç½® `MINIMAX_API_KEY`ï¼ˆæˆ– MiniMax è®¤è¯é…ç½®æ–‡ä»¶ï¼‰ä»¥ä¾¿æ³¨å…¥æä¾›å•†ã€‚

ç¡®ä¿æ¨¡åž‹ id **åŒºåˆ†å¤§å°å†™**ï¼š

- `minimax/MiniMax-M2.1`
- `minimax/MiniMax-M2.1-lightning`

ç„¶åŽé‡æ–°æ£€æŸ¥ï¼š

```bash
vikiclow models list
```
