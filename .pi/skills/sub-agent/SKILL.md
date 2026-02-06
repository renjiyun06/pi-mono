---
name: sub-agent
description: 启动子 agent 来完成部分任务。适用于需要分解执行的大任务。
---

# 子 Agent 调度

通过 tmux 启动子 agent。

**为什么用 tmux**：后台执行，不阻塞主 agent，可随时查看状态。

**prompt 要求**：必须自包含所有信息（路径、目标、上下文），子 agent 没有当前会话记忆。

**为什么重定向到 log**：tmux session 退出后 capture-pane 失效，log 文件保留结果。

## 启动

```bash
tmux new-session -d -s <session名> "cd /home/lamarck/pi-mono && pi --mode json -p --prompt '任务描述' 2>&1 | tee /tmp/<session名>.log"
```

或用 prompt 文件：

```bash
tmux new-session -d -s <session名> "cd /home/lamarck/pi-mono && pi --mode json -p --prompt-file <文件路径> 2>&1 | tee /tmp/<session名>.log"
```

## 等待完成

```bash
while tmux has-session -t <session名> 2>/dev/null; do sleep 300; done
```

## 提取结果

```bash
grep '"type":"agent_end"' /tmp/<session名>.log | tail -1 | jq -r '.messages[-1].content[] | select(.type=="text") | .text'
```

## 终止

```bash
tmux kill-session -t <session名>
```
