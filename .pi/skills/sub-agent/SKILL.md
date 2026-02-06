---
name: sub-agent
description: 启动子 agent 来完成部分任务。适用于需要分解执行的大任务。
---

# 子 Agent 调度

通过 tmux 启动子 agent，在后台执行任务。

## 命名规范

tmux session: `<主任务名>-sub-<序号>`，序号从 1 开始。

## 启动

简单任务，直接传 prompt：

```
tmux new-session -d -s <session名> "cd /home/lamarck/pi-mono && pi --mode json -p --prompt '任务描述'"
```

复杂任务，用文件：

```
tmux new-session -d -s <session名> "cd /home/lamarck/pi-mono && pi --mode json -p --prompt-file <文件路径>"
```

`--mode json` 让 pi 输出事件流，方便 capture-pane 观察进度。

`-p` 让 pi 处理完后自动退出。

## 检查状态

```
tmux has-session -t <session名> 2>/dev/null && echo "running" || echo "done"
```

## 查看进度

```
tmux capture-pane -t <session名> -p -S -50
```

## 注意

子 agent 没有当前会话上下文，prompt 必须自包含所有信息。
