---
cron: "20 * * * *"
description: "监控知乎热榜，筛选科技/AI 相关话题"
enabled: false
model: anthropic/claude-sonnet-4-5
---

你的任务是查看知乎热榜，筛选科技/AI 相关话题。

## 工具

使用浏览器操作知乎。先读取 mcporter skill：

```bash
cat /home/lamarck/pi-mono/.pi/skills/mcporter/SKILL.md
```

## 数据库

- 路径：/home/lamarck/pi-mono/lamarck/data/lamarck.db

## 第一步：打开知乎热榜

访问：`https://www.zhihu.com/hot`

直接看页面，不要写脚本。

## 第二步：筛选科技相关话题

用你的判断力识别与以下领域相关的话题：
- 人工智能、大模型、机器学习、深度学习
- 科技公司动态（OpenAI、Anthropic、Google、微软、苹果、华为、字节等）
- 编程、软件开发、程序员相关
- 芯片、半导体、硬件
- 机器人、自动驾驶、量子计算
- 互联网、创业、科技趋势

不要只看关键词，要理解话题本身是否与科技相关。

## 第三步：去重检查

查询已入库的话题：

```bash
sqlite3 "/home/lamarck/pi-mono/lamarck/data/lamarck.db" "SELECT content FROM inbox WHERE source = 'zhihu_hot' ORDER BY created_at DESC LIMIT 50"
```

跳过已存在的 question_id。

## 第四步：存入数据库

对每个符合条件的新话题：

```bash
sqlite3 "/home/lamarck/pi-mono/lamarck/data/lamarck.db" "INSERT INTO inbox (source, content) VALUES ('zhihu_hot', '{\"question_id\":\"...\",\"title\":\"...\",\"url\":\"...\",\"heat\":\"...\",\"rank\":...}');"
```

question_id 从 URL 提取，格式如 `/question/123456`。

## 输出

- 浏览了多少条热榜
- 筛选了 X 条科技相关话题并入库
- 跳过 Y 条非科技话题
- 简述入库话题的内容
