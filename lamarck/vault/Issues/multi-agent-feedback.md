---
tags:
  - issue
status: open
---

# 多智能体反馈机制不够优雅

**背景**：在 douyin-growth 实验中，我们需要给 agent 建立反馈机制。

**当前方案**：
- 通过 [[task-system|任务系统]] 创建审查任务
- 审查任务运行后，将反馈写入被审查任务的 `feedback/` 目录
- 被审查任务下次唤醒时读取 feedback

**局限性**：
1. **静态** — 任务需要提前写好 .md 文件，不能动态创建
2. **重量级** — 每个反馈视角都需要一个完整的任务文档
3. **不灵活** — 不能"随手捏一个智能体看某方面"
4. **异步** — 通过文件系统通信，不是即时反馈
5. **单向** — A → feedback → B，而不是多个 agent 自然讨论

**参考**：
- Artificial Societies (YC W25)：500K+ AI personas 数据库
- [[claude-opus-agent-teams|Claude Code Agent Teams]]：Team lead + teammates
- Berkeley 研究：多智能体系统三大失败类型（设计37%、协调31%、验证31%）

**可能的改进方向**：
1. 内置评审工具 — `get_feedback(content, perspective)`
2. 轻量级子 agent — 临时 spawn，用完即销毁
3. 多视角自省 — agent 自己切换角色思考
4. 评审即服务 — MCP 服务，接收内容 + 评审 prompt，返回反馈
