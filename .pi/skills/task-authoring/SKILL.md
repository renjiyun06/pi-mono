---
name: task-authoring
description: 编写和维护 lamarck/tasks/ 下的任务文档。当需要创建新任务、修改任务配置、或为任务添加反馈机制时使用。
---

# 任务文档编写指南

任务文档位于 `/home/lamarck/pi-mono/lamarck/tasks/*.md`，可以由调度系统按 cron 自动执行，也可以通过 `task run <name>` 手动触发。

## Frontmatter

每个任务文档必须以 YAML frontmatter 开头：

```yaml
---
description: 任务的简短描述（必填，调度系统据此判断是否为有效任务）
enabled: false              # 是否启用（必填）
model: provider/model-id    # 使用的模型（可选，默认 anthropic/claude-sonnet-4-5）
cron: "*/30 * * * *"        # cron 表达式（可选，与 after 二选一）
after: other-task/3          # 在指定任务每产生 N 个新 session 后触发（可选，与 cron 二选一）
overlap: skip               # 上一次还在跑时：skip（默认）、parallel、kill
---
```

### 字段说明

- **description**：必填。没有 description 或 enabled 不为 true 的文档不会被加载。
- **cron**：标准 5 段格式（分 时 日 月 周）。按时间周期触发。
- **after**：格式为 `<任务名>/<次数>`。监视目标任务的 session 目录，每产生指定数量的新 session 就触发一次。适用于审查任务。
- **overlap**：上一次调度还在跑时的行为。`skip`（默认，跳过本次）、`parallel`（并行跑新实例）、`kill`（杀掉上一次，重新跑）。默认不需要显式写。

不设 `cron` 也不设 `after` 的任务只能通过 `task run <name>` 手动触发。

## 工作目录

每个任务的产出放在独立的工作目录下：

```
/home/lamarck/pi-mono/lamarck/tmp/<任务名>/
```

在 prompt 中明确告知 Agent 这个路径，并约束它只在此目录下操作。

## 会话目录

每个任务的会话记录自动存储在：

```
/home/lamarck/pi-mono/lamarck/tasks/.sessions/<任务名>/
```

每个 `.jsonl` 文件是一次会话。其他任务（如审查任务）可以通过此路径读取会话记录。

## 反馈协议

任务之间可以通过 `feedback/` 目录进行单向通信：一个任务（审查方）向另一个任务（被审查方）的工作目录写入反馈，被审查方读取并处理后归档。

这套协议用于在不修改任务 prompt 的前提下，从外部纠正一个正在运行的任务的行为。典型场景：一个长期自主运行的任务陷入了低效循环，部署一个审查任务定期检查它的工作并写入反馈。

### 目录结构（收件箱模式）

每个反馈者有自己的目录，类似邮箱：

```
<被审查方工作目录>/
└── feedback/
    ├── <审查者A>/
    │   └── <反馈文件>.md
    ├── <审查者B>/
    │   └── <反馈文件>.md
    ├── user/
    │   └── <反馈文件>.md
    └── archived/            # 统一的归档目录
```

审查者目录名建议使用任务名（如 `douyin-growth-review`）或角色名（如 `behavior-coach`、`user`）。

### 被审查方

在任务 prompt 中加入以下说明：

```markdown
工作目录下可能存在 `feedback/` 目录，里面是对你工作的审查反馈。每次唤醒后：

1. 检查 `feedback/` 下的各个子目录（每个子目录代表一个反馈者，跳过 `archived/`）
2. 读取每个子目录下的 `.md` 文件
3. 针对反馈中的问题采取行动
4. 处理完一条反馈后，将该文件移入 `feedback/archived/`
```

### 审查方

审查任务本身也是一个普通任务。在其 prompt 中指定：

- 被审查任务的提示词路径（让审查方理解被审查方被要求做什么）
- 被审查任务的工作目录（查看产出）
- 被审查任务的会话目录（查看实际行为）

将反馈写入被审查方工作目录下的 `feedback/<自己的目录名>/<文件名>.md`。建议使用任务名作为目录名。只操作自己目录下的文件，不修改其他目录。如果之前的反馈已被移入 `archived/`，说明已被处理，写新的即可。

### 反馈文件格式

```markdown
# <标题>

## 时间
YYYY-MM-DD

## 判断
一句话总结当前状态。

## 问题
- 问题1
- 问题2

## 建议
- 建议1
- 建议2
```
