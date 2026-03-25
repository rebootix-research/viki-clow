---
description: Typed workflow runtime for VikiClow â€” composable pipelines with approval gates.
read_when:
  - ä½ æƒ³è¦å…·æœ‰æ˜¾å¼å®¡æ‰¹çš„ç¡®å®šæ€§å¤šæ­¥éª¤å·¥ä½œæµ
  - ä½ éœ€è¦æ¢å¤å·¥ä½œæµè€Œä¸é‡æ–°è¿è¡Œæ—©æœŸæ­¥éª¤
summary: VikiClow çš„ç±»åž‹åŒ–å·¥ä½œæµè¿è¡Œæ—¶ï¼Œæ”¯æŒå¯æ¢å¤çš„å®¡æ‰¹å…³å¡ã€‚
title: Viki Workflow
x-i18n:
  generated_at: "2026-02-03T10:11:30Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: ff84e65f4be162ad98f16ddf0882f23b3198f05b4d9e8dc03d07e9b2bf0fd5ad
  source_path: tools/workflow.md
  workflow: 15
---

# Viki Workflow

Viki Workflow æ˜¯ä¸€ä¸ªå·¥ä½œæµå¤–å£³ï¼Œè®© VikiClow èƒ½å¤Ÿå°†å¤šæ­¥éª¤å·¥å…·åºåˆ—ä½œä¸ºå•ä¸ªç¡®å®šæ€§æ“ä½œè¿è¡Œï¼Œå¹¶å¸¦æœ‰æ˜¾å¼å®¡æ‰¹æ£€æŸ¥ç‚¹ã€‚

## äº®ç‚¹

ä½ çš„åŠ©æ‰‹å¯ä»¥æž„å»ºç®¡ç†è‡ªèº«çš„å·¥å…·ã€‚è¯·æ±‚ä¸€ä¸ªå·¥ä½œæµï¼Œ30 åˆ†é’ŸåŽä½ å°±æœ‰äº†ä¸€ä¸ª CLI å’Œä½œä¸ºå•æ¬¡è°ƒç”¨è¿è¡Œçš„ç®¡é“ã€‚Viki Workflow æ˜¯ç¼ºå¤±çš„é‚£ä¸€å—ï¼šç¡®å®šæ€§ç®¡é“ã€æ˜¾å¼å®¡æ‰¹å’Œå¯æ¢å¤çŠ¶æ€ã€‚

## ä¸ºä»€ä¹ˆ

å¦‚ä»Šï¼Œå¤æ‚çš„å·¥ä½œæµéœ€è¦å¤šæ¬¡æ¥å›žçš„å·¥å…·è°ƒç”¨ã€‚æ¯æ¬¡è°ƒç”¨éƒ½æ¶ˆè€— tokenï¼ŒLLM å¿…é¡»ç¼–æŽ’æ¯ä¸€æ­¥ã€‚Viki Workflow å°†è¿™ç§ç¼–æŽ’ç§»å…¥ç±»åž‹åŒ–è¿è¡Œæ—¶ï¼š

- **ä¸€æ¬¡è°ƒç”¨ä»£æ›¿å¤šæ¬¡**ï¼šVikiClow è¿è¡Œä¸€æ¬¡ Viki Workflow å·¥å…·è°ƒç”¨å¹¶èŽ·å¾—ç»“æž„åŒ–ç»“æžœã€‚
- **å†…ç½®å®¡æ‰¹**ï¼šå‰¯ä½œç”¨ï¼ˆå‘é€é‚®ä»¶ã€å‘å¸ƒè¯„è®ºï¼‰ä¼šæš‚åœå·¥ä½œæµï¼Œç›´åˆ°æ˜Žç¡®æ‰¹å‡†ã€‚
- **å¯æ¢å¤**ï¼šæš‚åœçš„å·¥ä½œæµè¿”å›žä¸€ä¸ªä»¤ç‰Œï¼›æ‰¹å‡†å¹¶æ¢å¤è€Œæ— éœ€é‡æ–°è¿è¡Œæ‰€æœ‰å†…å®¹ã€‚

## ä¸ºä»€ä¹ˆç”¨ DSL è€Œä¸æ˜¯æ™®é€šç¨‹åºï¼Ÿ

Viki Workflow æ•…æ„å¾ˆå°ã€‚ç›®æ ‡ä¸æ˜¯"ä¸€ç§æ–°è¯­è¨€"ï¼Œè€Œæ˜¯ä¸€ä¸ªå¯é¢„æµ‹çš„ã€AI å‹å¥½çš„ç®¡é“è§„èŒƒï¼Œå…·æœ‰ä¸€æµçš„å®¡æ‰¹å’Œæ¢å¤ä»¤ç‰Œã€‚

- **å†…ç½®æ‰¹å‡†/æ¢å¤**ï¼šæ™®é€šç¨‹åºå¯ä»¥æç¤ºäººç±»ï¼Œä½†å®ƒæ— æ³•*æš‚åœå’Œæ¢å¤*å¹¶å¸¦æœ‰æŒä¹…ä»¤ç‰Œï¼Œé™¤éžä½ è‡ªå·±å‘æ˜Žé‚£ä¸ªè¿è¡Œæ—¶ã€‚
- **ç¡®å®šæ€§ + å¯å®¡è®¡æ€§**ï¼šç®¡é“æ˜¯æ•°æ®ï¼Œæ‰€ä»¥å®ƒä»¬æ˜“äºŽè®°å½•ã€æ¯”è¾ƒã€é‡æ”¾å’Œå®¡æŸ¥ã€‚
- **AI çš„å—é™è¡¨é¢**ï¼šå¾®å°çš„è¯­æ³• + JSON ç®¡é“å‡å°‘äº†"åˆ›é€ æ€§"ä»£ç è·¯å¾„ï¼Œä½¿éªŒè¯å˜å¾—çŽ°å®žå¯è¡Œã€‚
- **å†…ç½®å®‰å…¨ç­–ç•¥**ï¼šè¶…æ—¶ã€è¾“å‡ºä¸Šé™ã€æ²™ç®±æ£€æŸ¥å’Œç™½åå•ç”±è¿è¡Œæ—¶å¼ºåˆ¶æ‰§è¡Œï¼Œè€Œä¸æ˜¯æ¯ä¸ªè„šæœ¬ã€‚
- **ä»ç„¶å¯ç¼–ç¨‹**ï¼šæ¯ä¸ªæ­¥éª¤éƒ½å¯ä»¥è°ƒç”¨ä»»ä½• CLI æˆ–è„šæœ¬ã€‚å¦‚æžœä½ æƒ³è¦ JS/TSï¼Œå¯ä»¥ä»Žä»£ç ç”Ÿæˆ `.workflow` æ–‡ä»¶ã€‚

## å·¥ä½œåŽŸç†

VikiClow ä»¥**å·¥å…·æ¨¡å¼**å¯åŠ¨æœ¬åœ° `viki-workflow` CLIï¼Œå¹¶ä»Ž stdout è§£æž JSON ä¿¡å°ã€‚
å¦‚æžœç®¡é“æš‚åœç­‰å¾…å®¡æ‰¹ï¼Œå·¥å…·ä¼šè¿”å›žä¸€ä¸ª `resumeToken`ï¼Œä»¥ä¾¿ä½ ç¨åŽç»§ç»­ã€‚

## æ¨¡å¼ï¼šå°åž‹ CLI + JSON ç®¡é“ + å®¡æ‰¹

æž„å»ºè¾“å‡º JSON çš„å°å‘½ä»¤ï¼Œç„¶åŽå°†å®ƒä»¬é“¾æŽ¥æˆå•ä¸ª Viki Workflow è°ƒç”¨ã€‚ï¼ˆä¸‹é¢æ˜¯ç¤ºä¾‹å‘½ä»¤åç§°â€”â€”æ›¿æ¢æˆä½ è‡ªå·±çš„ã€‚ï¼‰

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

å¦‚æžœç®¡é“è¯·æ±‚å®¡æ‰¹ï¼Œä½¿ç”¨ä»¤ç‰Œæ¢å¤ï¼š

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI è§¦å‘å·¥ä½œæµï¼›Viki Workflow æ‰§è¡Œæ­¥éª¤ã€‚å®¡æ‰¹å…³å¡ä½¿å‰¯ä½œç”¨æ˜¾å¼ä¸”å¯å®¡è®¡ã€‚

ç¤ºä¾‹ï¼šå°†è¾“å…¥é¡¹æ˜ å°„åˆ°å·¥å…·è°ƒç”¨ï¼š

```bash
gog.gmail.search --query 'newer_than:1d' \
  | vikiclow.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## çº¯ JSON çš„ LLM æ­¥éª¤ï¼ˆllm-taskï¼‰

å¯¹äºŽéœ€è¦**ç»“æž„åŒ– LLM æ­¥éª¤**çš„å·¥ä½œæµï¼Œå¯ç”¨å¯é€‰çš„
`llm-task` æ’ä»¶å·¥å…·å¹¶ä»Ž Viki Workflow è°ƒç”¨å®ƒã€‚è¿™ä¿æŒäº†å·¥ä½œæµçš„
ç¡®å®šæ€§ï¼ŒåŒæ—¶ä»ç„¶å…è®¸ä½ ä½¿ç”¨æ¨¡åž‹è¿›è¡Œåˆ†ç±»/æ‘˜è¦/èµ·è‰ã€‚

å¯ç”¨å·¥å…·ï¼š

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

åœ¨ç®¡é“ä¸­ä½¿ç”¨å®ƒï¼š

```bash
vikiclow.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

å‚è§ [LLM Task](/tools/llm-task) äº†è§£è¯¦æƒ…å’Œé…ç½®é€‰é¡¹ã€‚

## å·¥ä½œæµæ–‡ä»¶ï¼ˆ.workflowï¼‰

Viki Workflow å¯ä»¥è¿è¡ŒåŒ…å« `name`ã€`args`ã€`steps`ã€`env`ã€`condition` å’Œ `approval` å­—æ®µçš„ YAML/JSON å·¥ä½œæµæ–‡ä»¶ã€‚åœ¨ VikiClow å·¥å…·è°ƒç”¨ä¸­ï¼Œå°† `pipeline` è®¾ç½®ä¸ºæ–‡ä»¶è·¯å¾„ã€‚

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

æ³¨æ„äº‹é¡¹ï¼š

- `stdin: $step.stdout` å’Œ `stdin: $step.json` ä¼ é€’å‰ä¸€æ­¥éª¤çš„è¾“å‡ºã€‚
- `condition`ï¼ˆæˆ– `when`ï¼‰å¯ä»¥æ ¹æ® `$step.approved` æŽ§åˆ¶æ­¥éª¤ã€‚

## å®‰è£… Viki Workflow

åœ¨è¿è¡Œ VikiClow Gateway ç½‘å…³çš„**åŒä¸€ä¸»æœº**ä¸Šå®‰è£… Viki Workflow CLIï¼ˆå‚è§ [Viki Workflow ä»“åº“](https://github.com/rebootix-research/viki-clow)ï¼‰ï¼Œå¹¶ç¡®ä¿ `viki-workflow` åœ¨ `PATH` ä¸­ã€‚
å¦‚æžœä½ æƒ³ä½¿ç”¨è‡ªå®šä¹‰äºŒè¿›åˆ¶ä½ç½®ï¼Œåœ¨å·¥å…·è°ƒç”¨ä¸­ä¼ é€’**ç»å¯¹**è·¯å¾„ `workflowPath`ã€‚

## å¯ç”¨å·¥å…·

Viki Workflow æ˜¯ä¸€ä¸ª**å¯é€‰**çš„æ’ä»¶å·¥å…·ï¼ˆé»˜è®¤æœªå¯ç”¨ï¼‰ã€‚

æŽ¨èï¼ˆé™„åŠ ï¼Œå®‰å…¨ï¼‰ï¼š

```json
{
  "tools": {
    "alsoAllow": ["workflow"]
  }
}
```

æˆ–æ¯ä¸ªæ™ºèƒ½ä½“ï¼š

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["workflow"]
        }
      }
    ]
  }
}
```

é¿å…ä½¿ç”¨ `tools.allow: ["workflow"]`ï¼Œé™¤éžä½ æ‰“ç®—åœ¨é™åˆ¶æ€§ç™½åå•æ¨¡å¼ä¸‹è¿è¡Œã€‚

æ³¨æ„ï¼šç™½åå•å¯¹äºŽå¯é€‰æ’ä»¶æ˜¯è‡ªæ„¿åŠ å…¥çš„ã€‚å¦‚æžœä½ çš„ç™½åå•åªåŒ…å«
æ’ä»¶å·¥å…·ï¼ˆå¦‚ `viki-workflow`ï¼‰ï¼ŒVikiClow ä¼šä¿æŒæ ¸å¿ƒå·¥å…·å¯ç”¨ã€‚è¦é™åˆ¶æ ¸å¿ƒ
å·¥å…·ï¼Œä¹Ÿè¦åœ¨ç™½åå•ä¸­åŒ…å«ä½ æƒ³è¦çš„æ ¸å¿ƒå·¥å…·æˆ–ç»„ã€‚

## ç¤ºä¾‹ï¼šé‚®ä»¶åˆ†ç±»

ä¸ä½¿ç”¨ Viki Workflowï¼š

```
ç”¨æˆ·ï¼š"æ£€æŸ¥æˆ‘çš„é‚®ä»¶å¹¶èµ·è‰å›žå¤"
â†’ vikiclow è°ƒç”¨ gmail.list
â†’ LLM æ€»ç»“
â†’ ç”¨æˆ·ï¼š"ç»™ #2 å’Œ #5 èµ·è‰å›žå¤"
â†’ LLM èµ·è‰
â†’ ç”¨æˆ·ï¼š"å‘é€ #2"
â†’ vikiclow è°ƒç”¨ gmail.send
ï¼ˆæ¯å¤©é‡å¤ï¼Œä¸è®°å¾—å·²åˆ†ç±»çš„å†…å®¹ï¼‰
```

ä½¿ç”¨ Viki Workflowï¼š

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

è¿”å›žä¸€ä¸ª JSON ä¿¡å°ï¼ˆå·²æˆªæ–­ï¼‰ï¼š

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

ç”¨æˆ·æ‰¹å‡† â†’ æ¢å¤ï¼š

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

ä¸€ä¸ªå·¥ä½œæµã€‚ç¡®å®šæ€§ã€‚å®‰å…¨ã€‚

## å·¥å…·å‚æ•°

### `run`

ä»¥å·¥å…·æ¨¡å¼è¿è¡Œç®¡é“ã€‚

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "/path/to/workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

ä½¿ç”¨å‚æ•°è¿è¡Œå·¥ä½œæµæ–‡ä»¶ï¼š

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.workflow",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

åœ¨å®¡æ‰¹åŽç»§ç»­æš‚åœçš„å·¥ä½œæµã€‚

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### å¯é€‰è¾“å…¥

- `workflowPath`ï¼šViki Workflow äºŒè¿›åˆ¶æ–‡ä»¶çš„ç»å¯¹è·¯å¾„ï¼ˆçœç•¥åˆ™ä½¿ç”¨ `PATH`ï¼‰ã€‚
- `cwd`ï¼šç®¡é“çš„å·¥ä½œç›®å½•ï¼ˆé»˜è®¤ä¸ºå½“å‰è¿›ç¨‹å·¥ä½œç›®å½•ï¼‰ã€‚
- `timeoutMs`ï¼šå¦‚æžœå­è¿›ç¨‹è¶…è¿‡æ­¤æŒç»­æ—¶é—´åˆ™ç»ˆæ­¢ï¼ˆé»˜è®¤ï¼š20000ï¼‰ã€‚
- `maxStdoutBytes`ï¼šå¦‚æžœ stdout è¶…è¿‡æ­¤å¤§å°åˆ™ç»ˆæ­¢å­è¿›ç¨‹ï¼ˆé»˜è®¤ï¼š512000ï¼‰ã€‚
- `argsJson`ï¼šä¼ é€’ç»™ `viki-workflow run --args-json` çš„ JSON å­—ç¬¦ä¸²ï¼ˆä»…é™å·¥ä½œæµæ–‡ä»¶ï¼‰ã€‚

## è¾“å‡ºä¿¡å°

Viki Workflow è¿”å›žä¸€ä¸ªå…·æœ‰ä¸‰ç§çŠ¶æ€ä¹‹ä¸€çš„ JSON ä¿¡å°ï¼š

- `ok` â†’ æˆåŠŸå®Œæˆ
- `needs_approval` â†’ å·²æš‚åœï¼›éœ€è¦ `requiresApproval.resumeToken` æ‰èƒ½æ¢å¤
- `cancelled` â†’ æ˜Žç¡®æ‹’ç»æˆ–å–æ¶ˆ

å·¥å…·åœ¨ `content`ï¼ˆæ ¼å¼åŒ– JSONï¼‰å’Œ `details`ï¼ˆåŽŸå§‹å¯¹è±¡ï¼‰ä¸­éƒ½æ˜¾ç¤ºä¿¡å°ã€‚

## å®¡æ‰¹

å¦‚æžœå­˜åœ¨ `requiresApproval`ï¼Œæ£€æŸ¥æç¤ºå¹¶å†³å®šï¼š

- `approve: true` â†’ æ¢å¤å¹¶ç»§ç»­å‰¯ä½œç”¨
- `approve: false` â†’ å–æ¶ˆå¹¶ç»ˆç»“å·¥ä½œæµ

ä½¿ç”¨ `approve --preview-from-stdin --limit N` å°† JSON é¢„è§ˆé™„åŠ åˆ°å®¡æ‰¹è¯·æ±‚ï¼Œæ— éœ€è‡ªå®šä¹‰ jq/heredoc ç²˜åˆä»£ç ã€‚æ¢å¤ä»¤ç‰ŒçŽ°åœ¨å¾ˆç´§å‡‘ï¼šViki Workflow åœ¨å…¶çŠ¶æ€ç›®å½•ä¸‹å­˜å‚¨å·¥ä½œæµæ¢å¤çŠ¶æ€ï¼Œå¹¶è¿”å›žä¸€ä¸ªå°ä»¤ç‰Œé”®ã€‚

## Viki Prose

Viki Prose ä¸Ž Viki Workflow é…åˆè‰¯å¥½ï¼šä½¿ç”¨ `/prose` ç¼–æŽ’å¤šæ™ºèƒ½ä½“å‡†å¤‡ï¼Œç„¶åŽè¿è¡Œ Viki Workflow ç®¡é“è¿›è¡Œç¡®å®šæ€§å®¡æ‰¹ã€‚å¦‚æžœ Prose ç¨‹åºéœ€è¦ Viki Workflowï¼Œé€šè¿‡ `tools.subagents.tools` ä¸ºå­æ™ºèƒ½ä½“å…è®¸ `viki-workflow` å·¥å…·ã€‚å‚è§ [Viki Prose](/prose)ã€‚

## å®‰å…¨

- **ä»…é™æœ¬åœ°å­è¿›ç¨‹** â€” æ’ä»¶æœ¬èº«ä¸è¿›è¡Œç½‘ç»œè°ƒç”¨ã€‚
- **æ— å¯†é’¥** â€” Viki Workflow ä¸ç®¡ç† OAuthï¼›å®ƒè°ƒç”¨ç®¡ç† OAuth çš„ VikiClow å·¥å…·ã€‚
- **æ²™ç®±æ„ŸçŸ¥** â€” å½“å·¥å…·ä¸Šä¸‹æ–‡å¤„äºŽæ²™ç®±éš”ç¦»çŠ¶æ€æ—¶ç¦ç”¨ã€‚
- **åŠ å›º** â€” å¦‚æžœæŒ‡å®šï¼Œ`workflowPath` å¿…é¡»æ˜¯ç»å¯¹è·¯å¾„ï¼›å¼ºåˆ¶æ‰§è¡Œè¶…æ—¶å’Œè¾“å‡ºä¸Šé™ã€‚

## æ•…éšœæŽ’é™¤

- **`workflow runtime subprocess timed out`** â†’ å¢žåŠ  `timeoutMs`ï¼Œæˆ–æ‹†åˆ†é•¿ç®¡é“ã€‚
- **`workflow runtime output exceeded maxStdoutBytes`** â†’ æé«˜ `maxStdoutBytes` æˆ–å‡å°‘è¾“å‡ºå¤§å°ã€‚
- **`workflow runtime returned invalid JSON`** â†’ ç¡®ä¿ç®¡é“ä»¥å·¥å…·æ¨¡å¼è¿è¡Œå¹¶åªæ‰“å° JSONã€‚
- **`workflow runtime failed (code â€¦)`** â†’ åœ¨ç»ˆç«¯ä¸­è¿è¡Œç›¸åŒçš„ç®¡é“ä»¥æ£€æŸ¥ stderrã€‚

## äº†è§£æ›´å¤š

- [æ’ä»¶](/tools/plugin)
- [æ’ä»¶å·¥å…·å¼€å‘](/plugins/agent-tools)

## æ¡ˆä¾‹ç ”ç©¶ï¼šç¤¾åŒºå·¥ä½œæµ

ä¸€ä¸ªå…¬å¼€ç¤ºä¾‹ï¼šä¸€ä¸ª"ç¬¬äºŒå¤§è„‘" CLI + Viki Workflow ç®¡é“ï¼Œç®¡ç†ä¸‰ä¸ª Markdown åº“ï¼ˆä¸ªäººã€ä¼´ä¾£ã€å…±äº«ï¼‰ã€‚CLI ä¸ºç»Ÿè®¡ã€æ”¶ä»¶ç®±åˆ—è¡¨å’Œè¿‡æ—¶æ‰«æè¾“å‡º JSONï¼›Viki Workflow å°†è¿™äº›å‘½ä»¤é“¾æŽ¥æˆ `weekly-review`ã€`inbox-triage`ã€`memory-consolidation` å’Œ `shared-task-sync` ç­‰å·¥ä½œæµï¼Œæ¯ä¸ªéƒ½æœ‰å®¡æ‰¹å…³å¡ã€‚AI åœ¨å¯ç”¨æ—¶å¤„ç†åˆ¤æ–­ï¼ˆåˆ†ç±»ï¼‰ï¼Œä¸å¯ç”¨æ—¶å›žé€€åˆ°ç¡®å®šæ€§è§„åˆ™ã€‚

- å¸–å­ï¼šhttps://x.com/plattenschieber/status/2014508656335770033
- ä»“åº“ï¼šhttps://github.com/bloomedai/brain-cli
