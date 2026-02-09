---
name: sub-agent
description: 启动子 agent 来完成任务。
---

# 子 Agent 派发

通过 tmux 启动独立的 pi 实例来执行任务。

## 什么时候用

- 任务可以独立执行，不需要全程参与
- 探索性任务，边做边看结果
- 多个任务需要并行推进
- 用户明确要求

## 派发流程

### 1. 创建工作目录

每个子任务有独立的工作目录：

```bash
mkdir -p lamarck/tmp/<session-name>
```

### 2. 写入任务描述

把任务描述写入 `lamarck/tmp/<session-name>/prompt.md`。

### 3. 启动子 agent

用固定的启动命令：

```bash
tmux new-session -d -s <session-name> \
  "cd /home/lamarck/pi-mono && pi --one-shot '读取 lamarck/tmp/<session-name>/prompt.md，按其中的指令完成任务'"
```

任务完成后 pi 自动退出，session 随之关闭。

### 4. 派发后立即返回

不要等待子任务完成，继续主对话。任务完成后 session 会自动关闭。

## 任务描述模板

任务描述必须**自包含**，子 agent 没有当前会话上下文。包含：

1. **背景**：为什么要做这个任务
2. **具体步骤**：要做什么
3. **输出要求**：结果放哪里、什么格式
4. **工作目录**：`lamarck/tmp/<session-name>/`

## 监控

```bash
# 查看进度
tmux capture-pane -t <session-name> -p -S -30

# 查看任务是否还在运行
tmux has-session -t <session-name> 2>/dev/null && echo "运行中" || echo "已结束"
```

**注意**：`--one-shot` 模式下无法追加指令，任务描述必须一次性给全。

## 结束和清理

`--one-shot` 模式下，pi 完成任务后会自动退出，tmux session 随之关闭，无需手动清理。

### 中途终止

如果需要提前终止正在运行的任务：

```bash
# 发送 Ctrl+D 让 pi 正常退出（会触发清理钩子）
tmux send-keys -t <session-name> C-d
```

工作目录 `lamarck/tmp/<session-name>/` 保留，包含 `prompt.md` 和任务输出。

---

## 注意事项

1. **子 agent 无上下文** — prompt 必须自包含所有信息
2. **共享资源要小心** — 文件系统、数据库是共享的（浏览器已隔离，每个 pi 进程独立实例）
3. **不要等待** — 派发后立即返回，通过 capture-pane 查进度
