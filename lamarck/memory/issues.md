# Known Issues

## 缺少任务执行质量的自动评审机制

**问题**：当前评估任务执行质量的方式是纯手动的 — 用户在主会话中让 agent 读 session JSONL 文件，对照 task doc 逐步分析 agent 的操作路径，找出行为偏差，然后手动修改 task doc。这个流程耗时且无法规模化，随着任务数量增多，不可能每次都手动 review。

**当前做法（蠢办法）**：
1. 任务跑完后，用户手动让主会话 agent 读 session 文件（`/home/lamarck/.pi/agent/sessions/` 下的 JSONL）
2. Agent 逐行分析操作路径，对照 task doc 找问题
3. 用户和 agent 讨论后手动修改 task doc
4. 重跑任务，再次手动 review — 循环往复

**需要的机制**：一个独立的"任务评审"任务（task-review），在其他任务跑完后自动或按需触发，完成以下工作：
- 读取目标任务的 session 文件和对应的 task doc
- 以 task doc 中的要求作为唯一评价标准（不引入 reviewer 自己的判断标准）
- 输出评审报告：操作路径摘要、符合要求的行为、违反要求的行为（引用具体 session 内容和 task doc 条目）、改进建议
- 单独提取"系统能力不足"类反馈（如 agent 想看帖子评论但只能用高成本浏览器），作为对数据采集/工具链的改进需求

**设计要点**：
- 输出是反馈报告，不直接修改 task doc（避免自动改偏）
- 评价标准完全从 task doc 提取，task doc 改了标准自动跟着变
- 需要一种触发机制：任务完成后自动触发，或定时扫描最近未 review 的 session
- 评审报告存放位置待定（可能在 `lamarck/memory/reviews/` 或类似目录）

