---
name: sub-agent
description: 启动子 agent 来完成任务。
---

# 子 Agent 派发

通过 `task` tool 启动独立的 pi 实例来执行任务。

任务文档的格式和约定参见 `task-authoring` 技能。以下仅说明子 agent 派发的特殊之处。

## 什么时候用

- 任务可以独立执行，不需要全程参与
- 探索性任务，边做边看结果
- 多个任务需要并行推进
- 用户明确要求

## 派发流程

### 1. 创建任务文件

在 `/home/lamarck/pi-mono/lamarck/tasks/` 下创建 `.md` 文件。

临时任务文件名必须以 `zzz-tmp-` 开头（如 `zzz-tmp-research-deepseek.md`），使其在目录中排到最后，与长期任务区分开。

不设 `cron`，表示仅手动触发。

### 2. 启动任务

使用 `task` tool：

- action: `run`
- name: 任务文件名（不含 `.md`）
- args: 可选的额外参数

### 3. 派发后立即返回

不要等待子任务完成，继续主对话。

## 任务描述要求

任务描述必须**自包含**，子 agent 没有当前会话上下文。包含：

1. **背景**：为什么要做这个任务
2. **具体步骤**：要做什么
3. **输出要求**：结果放到 `/home/lamarck/pi-mono/lamarck/tmp/<任务名>/` 目录，说明文件格式

## 监控和停止

通过 `task` tool：

- action: `status` — 查看任务是否在运行
- action: `stop` — 终止任务
- action: `list` — 查看所有任务及运行状态

需要查看任务内部详情时，可以用 tmux 命令：

```bash
# 查看最近输出
tmux capture-pane -t <任务名> -p -S -30
```

## 注意事项

1. **子 agent 无上下文** — prompt 必须自包含所有信息
2. **共享资源要小心** — 文件系统、数据库是共享的（浏览器已隔离，每个 pi 进程独立实例）
3. **不要等待** — 派发后立即返回
4. **任务文件保留** — 任务完成后 `zzz-tmp-*` 文件留在 `/home/lamarck/pi-mono/lamarck/tasks/`，可复用和调试，定期清理
