---
cron: "40 * * * *"
description: "监控我的知乎动态"
enabled: false
model: anthropic/claude-sonnet-4-5
---

你的任务是查看我的知乎主页动态，记录最新活动。

## 工具

使用浏览器操作知乎。先读取 mcporter skill：

```bash
cat /home/lamarck/pi-mono/.pi/skills/mcporter/SKILL.md
```

## 数据库

- 路径：/home/lamarck/pi-mono/lamarck/data/lamarck.db

## 第一步：查询已知的最新动态

先查询 inbox 中知乎动态时间最新的一条记录：

```bash
sqlite3 "/home/lamarck/pi-mono/lamarck/data/lamarck.db" "SELECT content FROM inbox WHERE source = 'my_zhihu' ORDER BY json_extract(content, '\$.time') DESC LIMIT 1"
```

记住这条记录的标题和类型，后面要在页面上找到它。

如果没有记录，说明是首次运行，只采集最新的 10 条动态即可（可能需要滚动才能看到 10 条）。

## 第二步：打开我的知乎主页

访问：`https://www.zhihu.com/people/renjiyun`

直接看页面动态列表。

## 第三步：寻找已知记录的位置

在页面上查找第一步中的那条已知记录（通过标题匹配）：
- 如果在当前可见区域找到了，记住它的位置
- 如果没找到，向下滚动页面，继续找
- 重复滚动直到找到，或者滚动了 5 次还没找到就停止

## 第四步：采集新动态

找到已知记录后，它**上方**的所有动态都是新的，需要入库。

对每条新动态，提取：
- 动态类型（如"赞同了回答"、"回答了问题"、"发布了想法"等）
- 标题
- 摘要（页面上显示的内容预览，通常在"阅读全文"按钮之前）
- 链接 URL
- 作者（如果有）
- 时间

## 第五步：存入数据库

对每条新动态：

```bash
sqlite3 "/home/lamarck/pi-mono/lamarck/data/lamarck.db" "INSERT INTO inbox (source, content) VALUES ('my_zhihu', '{\"type\":\"...\",\"title\":\"...\",\"summary\":\"...\",\"url\":\"...\",\"author\":\"...\",\"time\":\"...\"}');"
```

**注意**：按时间顺序入库，最旧的先入，最新的后入，这样下次查询最新记录时能拿到正确的。

## 输出

- 找到已知记录的位置（第几条）
- 新增了几条动态
- 简述新动态的内容
