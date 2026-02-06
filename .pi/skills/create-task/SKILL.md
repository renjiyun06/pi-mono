---
name: create-task
description: 创建定时任务。包括任务文件结构、浏览器操作配置等。
---

# 创建任务

任务目录：`/home/lamarck/pi-mono/lamarck/tasks/`

创建任务：新建 `<任务名>/task.md` 文件。

## task.md 格式

```markdown
---
cron: "0 9 * * *"
enabled: yes
provider: anthropic
model: claude-sonnet-4-5
---

任务描述（作为 prompt）
```

- `cron`: cron 表达式
- `enabled`: yes/no
- `provider` 和 `model`: 可选，不填用默认

## 浏览器操作

如果任务需要操作浏览器，必须配置专属的 MCP server，避免多任务冲突。

### 1. 在 mcporter.json 添加配置

文件：`/home/lamarck/pi-mono/config/mcporter.json`

```json
{
  "mcpServers": {
    "chrome-devtools-<任务名>": {
      "command": "npx -y chrome-devtools-mcp --browser-url http://172.30.144.1:19222"
    }
  }
}
```

### 2. 在 task.md 中指定

```markdown
## 浏览器操作

必须使用 `chrome-devtools-<任务名>` 这个 MCP server 操作浏览器。
```

## 临时文件

在 task.md 末尾加上：

```markdown
## 临时文件

临时文件写到 `/tmp/` 目录下。
```
