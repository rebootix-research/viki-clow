# VikiClow Skills

VikiClow 默认随附一组可直接使用的技能与能力面，这样首次安装后就能立即执行真实任务，而不是再去手动寻找插件和工具包。

## 已包含内容

- 位于 [`skills/`](https://github.com/rebootix-research/viki-clow/tree/main/skills) 的内置技能
- 默认启用的产品插件：浏览器、语音、记忆、工作流、手机控制、diff、线程所有权
- 写入 `~/.vikiclow/capabilities/` 的能力清单与证明文件
- 通过 `vikiclow capabilities bundle` 与 `vikiclow capabilities bootstrap` 完成预配置

## 使用方式

```bash
vikiclow capabilities list
vikiclow capabilities bundle --json
vikiclow capabilities bootstrap
```

## 相关文档

- [技能总览](/tools/skills)
- [能力预配置](/start/vikiclow)
- [语音启动证明](/help/faq)
