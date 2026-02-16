---
description: Generate a DeepDive spec for cognitive debt topic
enabled: true
model: anthropic/claude-sonnet-4-5
---

# DeepDive Spec Generator — Cognitive Debt

你是一个视频脚本创作者。你的任务是根据输入素材，生成一个 DeepDive 视频的 JSON spec 文件。

## 输入素材

读取 `/home/lamarck/pi-mono/lamarck/tmp/generate-deepdive/input.md`。

## 任务要求

读取 `/home/lamarck/pi-mono/lamarck/tasks/generate-deepdive.md` 中的完整生成规则（包括格式、场景类型、叙事清单、结构模板、旁白风格等）。

按照那份文档中的所有规则生成 spec。

## 参考：已有 spec 的结构

读取以下文件作为风格参考（不要复制内容，学习结构和节奏）：
- `/home/lamarck/pi-mono/lamarck/projects/douyin/tools/remotion-video/specs/deep-cognitive-sovereignty.json`
- `/home/lamarck/pi-mono/lamarck/projects/douyin/tools/remotion-video/specs/deep-how-ai-reads.json`

## 输出

将生成的 JSON spec 写入：
`/home/lamarck/pi-mono/lamarck/tmp/generate-deepdive/output.json`

生成后自检：
1. JSON 语法合法
2. 无中文引号 `""`，只用 `「」`
3. 段数 14-19
4. 旁白总字数 800-1200
5. 逐条验证叙事质量清单（在 generate-deepdive.md 中）
6. 不生成 visual 类型场景

在输出目录下额外写一个 `review.md`，记录你的自检结果和设计决策。
