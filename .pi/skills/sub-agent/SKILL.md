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

### 2. 启动子 agent

```bash
tmux new-session -d -s <session-name> "cd /home/lamarck/pi-mono && pi"
sleep 2
tmux send-keys -t <session-name> "<任务描述>" Enter
```

### 3. 记录任务

派发完成后记录到数据库：

```bash
sqlite3 lamarck/data/lamarck.db "INSERT INTO tasks VALUES ('<session-name>', '任务目的简述', '<关联任务>', datetime('now', 'localtime'))"
```

**tasks 表结构**：
| 字段 | 说明 |
|------|------|
| tmux_session_name | 主键，tmux session 名 |
| purpose | 任务目的简述 |
| related_tmux_session_names | 关联的其他任务 session 名，逗号分隔，无则留空 |
| created_at | 创建时间 |

### 4. 派发后立即返回

不要等待子任务完成，继续主对话。

## 任务描述模板

任务描述必须**自包含**，子 agent 没有当前会话上下文。包含：

1. **背景**：为什么要做这个任务
2. **具体步骤**：要做什么
3. **输出要求**：结果放哪里、什么格式
4. **工作目录**：`lamarck/tmp/<session-name>/`

## 监控和追加

```bash
# 查看进度
tmux capture-pane -t <session-name> -p -S -30

# 追加指令
tmux send-keys -t <session-name> "继续..." Enter

# 查看任务是否还在运行
tmux has-session -t <session-name> 2>/dev/null && echo "运行中" || echo "已结束"
```

## 结束和清理

### 正常关闭（推荐）

**必须用 Ctrl+D 让 pi 正常退出**，这样 `session_shutdown` 事件会触发，浏览器实例会自动清理：

```bash
# 正常关闭 - 触发清理钩子
tmux send-keys -t <session-name> C-d
sleep 3
tmux kill-session -t <session-name> 2>/dev/null
```

### 强制终止（不推荐）

直接 kill session 会跳过清理，导致浏览器残留：

```bash
# 不推荐 - 浏览器不会自动关闭
tmux kill-session -t <session-name>

# 如果已经这样做了，运行清理脚本
browser-cleanup
```

### 删除任务记录

```bash
sqlite3 lamarck/data/lamarck.db "DELETE FROM tasks WHERE tmux_session_name = '<session-name>'"
```

**注意**：工作目录 `lamarck/tmp/<session-name>/` 保留，不删除。

---

## 注意事项

1. **子 agent 无上下文** — prompt 必须自包含所有信息
2. **共享资源要小心** — 文件系统、数据库是共享的（浏览器已隔离，每个 pi 进程独立实例）
3. **不要等待** — 派发后立即返回，通过 capture-pane 查进度
