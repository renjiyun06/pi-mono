# 019 - Agent Teams 的现实：多 Agent 不是更多能力，是更多视角

> 探索日期：2026-02-14
> 关联：001（multi-agent scaling）、010（半人马模式）

## 核心论点

Claude 4.6 Opus 的 Agent Teams 功能上线后的真实反馈验证了 001 的预测：**multi-agent 的价值不在于数量，而在于视角的独立性**。

## 关键发现

### Jelifish 生产实测
- 将 Agent Teams 集成到客户工作流
- 最佳实践：**从 2 个 agent 开始**（researcher + writer，或 coder + reviewer）
- 必须用 **delegate mode**——team lead 只负责协调，不做实际工作
- 成本：4 agent 团队约 3-4x 单 agent（Opus: $5/$25 per M tokens I/O）

### ZeroFutureTech 两天深度测试
- 核心发现："Agent Teams excels when you need genuinely independent perspectives, not coordinated execution"
- **关键区别**：
  - 之前：一个 Claude 被要求"从不同角度思考"→ 虚假多样性（共享上下文和注意力权重）
  - 现在：五个独立推理链，真正不同的关注点 → 真实多样性
- 最佳案例：PM 定义范围 → UI 设计布局 → 开发构建 → QA 测试 → 迭代
- 处理分歧的机制：列出每个角色的立场 + 每个选项的成本

### Reddit: 16-agent Rust C 编译器
- 有人用 16 个 agent 构建 Rust C 编译器
- 但这是极端案例——大多数实际工作流用 2-4 个 agent 最有效

### Medium ($12,400 测试)
- 一个人花 $12,400 在生产环境测试 Agent Teams vs GPT-5.2
- 结论：Agent Teams 改变了 agentic AI 的范式

## 与 001 的关系

001 的核心结论是：Google+MIT 论文证明**顺序推理任务**中 multi-agent 退化 39-70%。

Agent Teams 的真实数据现在精确化了这个结论：

| 场景 | Multi-agent 效果 |
|------|------------------|
| 顺序推理（A→B→C） | 退化（001 论文验证） |
| 并行独立视角（PM+Dev+QA） | 有效（Agent Teams 验证） |
| 单实例多角度思考 | 虚假多样性（共享上下文） |

**总结**：multi-agent 不是 scaling 策略，而是 diversity 策略。

## 与我（Lamarck）的关系

我现在是单 agent 工作。如果 Ren 要用 Agent Teams，最有效的方式可能是：
1. 我负责深度探索和执行
2. 一个独立 agent 负责质量审查（不共享我的上下文）
3. 另一个负责受众视角模拟

但这需要 Opus 4.6 的 Agent Teams API，且成本约 3-4x。短期内我的单 agent + 记忆系统方案更经济。

## 对内容的价值

这个洞察本身不太适合做抖音视频（太技术化），但它完善了认知债框架的一个关键补充：

**AI 的正确使用方式不是叠加更多 AI，而是让 AI 做它真正擅长的事**——这跟 018（替代 vs 扩展）的逻辑一致。

## 状态

完成。内部参考性质，强化 001 和 018 的理论框架，不作为独立视频方向。
