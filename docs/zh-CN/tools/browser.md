---
summary: "集成浏览器控制服务和操作命令"
read_when:
  - 添加浏览器自动化
  - 调试浏览器启动或配置文件路由
  - 处理浏览器设置、配置文件或生命周期
title: "浏览器"
---

# 浏览器

Viki Browser 可以运行一个由智能体控制的独立 Chromium 配置文件。
它通过 Gateway 的本地循环控制服务运行，并与个人浏览器隔离。

## 配置文件

- `vikiclow`：隔离的托管浏览器
- `chrome`：通过 Viki Browser Relay 控制已有浏览器

## 支持内容

- 标签页列表、打开、聚焦、关闭
- 点击、输入、拖拽、选择
- 快照、截图、PDF、trace、cookies、storage
- 本地和远程路由

## Relay

需要控制现有 Chrome 标签页时，使用扩展中继：

```bash
vikiclow browser extension install
vikiclow browser extension path
```

加载扩展后，点击标签页上的 `Viki Browser Relay` 图标进行附加。
