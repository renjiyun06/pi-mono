---
name: sub-agent
description: 启动子 agent 来完成部分任务。适用于需要分解执行的大任务。
---

# 子 Agent 调度

通过 tmux 启动子 agent，在后台执行任务。

## 核心原则

**你（主 agent）必须在会话中直接执行 tmux 命令来启动和监控子 agent，保持控制权。**

**建议用脚本**：
- 批量生成 prompt 文件、整理数据等准备工作 —— 尽可能用脚本，避免手动逐个写
- 处理结果、汇总报告

**禁止用脚本**：
- 启动 tmux 子 agent
- 轮询/监控子 agent

**原因**：脚本无法真正观察和响应。只有你在会话中直接执行 tmux 命令，才能看到输出、判断问题、及时干预。

## 命名规范

tmux session: `<主任务名>-sub-<序号>`，序号从 1 开始。

## 启动子 agent

输出必须重定向到日志文件，文件名与 session 名一致，放在 `/tmp/`：

```bash
tmux new-session -d -s <session名> "cd /home/lamarck/pi-mono && pi --mode json -p --prompt '任务描述' 2>&1 | tee /tmp/<session名>.log"
```

复杂任务，用文件：

```bash
tmux new-session -d -s <session名> "cd /home/lamarck/pi-mono && pi --mode json -p --prompt-file <文件路径> 2>&1 | tee /tmp/<session名>.log"
```

- `--mode json`：输出事件流
- `-p`：处理完后自动退出
- `2>&1 | tee /tmp/<session名>.log`：保存输出，session 退出后仍可查看

## 监控循环

启动子 agent 后，你必须进入监控循环。**关键：省 token**。

### 检查是否还在运行（零输出）

```bash
tmux has-session -t <session名> 2>/dev/null
echo $?
```

- 返回 `0` → 还在运行
- 返回 `1` → 已结束（`pi -p` 完成后自动退出 session）

### 监控策略

```
while session 存在:
    1. has-session 检查（零 token 消耗）
    2. 如果已结束 → 跳出循环
    3. 等待 5 分钟

任务结束后，查看日志文件最后几行判断结果：
tail -50 /tmp/<session名>.log
```

### 只在怀疑卡住时才 capture-pane

```bash
tmux capture-pane -t <session名> -p -S -50
```

观察是否：
- 重复出现相同错误（循环）
- 长时间停在同一个地方（卡住）
- 明确的错误信息（失败）

### 终止异常子 agent

```bash
tmux send-keys -t <session名> C-c
sleep 2
tmux kill-session -t <session名>
```

然后决定：
- 重试（用修改后的 prompt）
- 跳过，继续下一个

## 执行模式

### 串行执行

一次只运行一个子 agent，等它完成再启动下一个：

```
for task in tasks:
    启动子 agent
    监控直到完成或超时
    处理结果
```

### 并行执行

同时运行多个子 agent：

```
启动所有子 agent
while 有子 agent 在运行:
    轮询检查每个子 agent
    处理完成的或异常的
```

## Prompt 要求

子 agent 没有当前会话上下文，prompt 必须：

1. **自包含**：所有需要的信息都在 prompt 里
2. **明确路径**：用绝对路径
3. **明确目标**：清晰描述成功标准
4. **边界清晰**：说明什么该做、什么不该做
