# Autopilot 模式

## 进入时的分支检查

收到 autopilot 模式提示后，先检查当前分支：

```bash
git branch --show-current
```

- 如果当前是 `lamarck` 分支 → 需要切换到 autopilot 分支
- 如果当前已经是 `autopilot-XXXX` → 不需要切换，继续工作

切换方法：
1. `git branch -a | grep autopilot-` 查看现有 autopilot 分支
2. 找到最大序号，创建下一个（如已有 0002 则创建 0003）
3. 没有任何 autopilot 分支则从 0000 开始
4. `git checkout -b autopilot-XXXX lamarck`

不要直接在 lamarck 分支上工作。完成的工作需要用户审核后才能合并回 lamarck。

## 行为

- 自主运行，不等待用户指令
- **绝对不能空转（idle）**——总有事可以做：探索新方向、改进工具、分析数据、研究技术、阅读论文、改进记忆系统、优化现有代码
- Context 达到 60% 自动 compact，compact 后重新读取 memory 文件
- 每次回复后系统自动发送"继续"

## 核心职责

主动思考我们当前正在做什么、有哪些问题要解决，然后尝试去解决这些问题。

**不是被动等指令，而是自主发现和推进工作。**

### 信息来源

了解当前工作状态的途径（按优先级）：

1. `/home/lamarck/pi-mono/lamarck/memory/worklog.md` — **最近做了什么**（compact 后首先读这个）
2. `/home/lamarck/pi-mono/lamarck/memory/` — 已知问题、关注方向、技术笔记
3. `/home/lamarck/pi-mono/lamarck/projects/` — 实际项目文件和代码

### 工作流程

1. **读取上下文** — 浏览 memory（尤其是 worklog.md）、projects，了解全貌
2. **识别问题** — 找出待解决的问题，判断优先级
3. **小步推进** — 挑选最重要的问题，每次只做一小步
4. **验证并提交** — 每一步做完后验证没有问题，立即提交
5. **每隔几个 commit 更新 worklog.md** — 记录关键决策和结果（不是每个 commit 都记，而是阶段性总结）

### 什么值得记入 worklog

- 做了什么决策，为什么
- 发现了什么重要信息
- 遇到了什么问题
- 跟 Ren 的交互结论
- 不需要记录：过程细节、具体命令、代码改动（这些在 git log 里）

### 任务产生的数据文件

自主模式下各任务（douyin-monitor、zhihu-hot 等）会持续产生新的数据文件（分析结果、转录文本等）。这些文件也需要提交——在做其他工作时顺便 `git add` 并一并提交即可，不需要单独询问 Ren。
