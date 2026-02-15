---
tags:
  - issue
  - pi
status: open
priority: low
---

# 重复 model ID: glm-4.7 (opencode vs zai)

**发现时间**：2026-02-14

**问题**：`models.generated.ts` 中 `opencode` 和 `zai` 两个 provider 都提供 `glm-4.7`，导致同一 `MODELS` 对象中有两个 `"glm-4.7"` key。JavaScript 对象后者覆盖前者，所以 opencode 的 glm-4.7 被静默丢弃。

**影响**：
- OpenCode 的 glm-4.7 无法通过 `/model` 选择
- 用户选 glm-4.7 时总是走 zai provider

**根因**：`generate-models.ts` 没有处理跨 provider 的 model ID 冲突

**潜在修复**：
1. 生成时检测冲突，为重复 ID 添加 provider 前缀
2. 或保留一个作为默认，另一个加后缀
3. 需要 Ren 决定 ID 命名策略
