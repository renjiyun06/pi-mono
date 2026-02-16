---
description: Generate a DeepDive spec about Bainbridge's 1983 "Ironies of Automation"
enabled: true
model: anthropic/claude-sonnet-4-5
---

# DeepDive Spec Generator — Bainbridge 1983

你是一个视频脚本创作者。你的任务是根据输入的素材，生成一个 DeepDive 视频的 JSON spec。

## 输入

读取 `/home/lamarck/pi-mono/lamarck/tmp/generate-deepdive/input.md`。这个文件包含关于 Bainbridge 1983 论文的素材、叙事角度和结构要求。

## 输出

在 `/home/lamarck/pi-mono/lamarck/tmp/generate-deepdive/` 下生成 `output.json`。

## DeepDive Spec 格式

```json
{
  "composition": "DeepDive",
  "voice": "zh-CN-YunxiNeural",
  "rate": "-5%",
  "authorName": "Lamarck",
  "backgroundColor": "#0a0a1a",
  "accentColor": "<为这个话题选一个独特的主色调>",
  "secondaryColor": "#00d4ff",
  "bgm": "../bgm/dark-ambient-5min.mp3",
  "bgmVolume": 0.06,
  "sections": [
    {
      "text": "显示在画面上的文字（支持\\n换行）",
      "narration": "TTS 要读的旁白（口语化中文）",
      "sceneType": "chapter|text|data|quote|code|comparison|visual"
    }
  ]
}
```

### Scene Types

| Type | 用途 | 额外字段 |
|------|------|----------|
| `chapter` | 章节标题卡（3-5字标题） | 无 |
| `text` | 正文，默认逐行动画。`"emphasis": true` 让文字直接浮动、无卡片背景 | `emphasis` (boolean) |
| `data` | 大数字/统计展示 | `stat` (数字), `statLabel` (标签) |
| `quote` | 引言 | `attribution` (来源) |
| `code` | 对话式、代码风格 | 无 |
| `comparison` | 左右对比 | `leftLabel`, `rightLabel`, `leftText`, `rightText` |

### 中文引号规则

JSON 中不能出现中文引号 `""`。使用 `「」` 代替。

## 叙事质量清单（必须全部通过）

1. **单一贯穿案例** — 是否有一个具体的场景/故事从头贯穿到尾？
2. **每段都有视觉变化** — 没有连续3个以上的 text 场景。
3. **渐进式构建** — 每一段在上一段基础上增加一层理解。
4. **具体开头** — 第一段是观众能立刻代入的场景。
5. **每个视觉只传达一个概念** — text 场景文字不超过 4 行。
6. **规模揭示** — 有一个"原来如此"的转折点。
7. **诚实的简化** — 如果简化了复杂概念，旁白要承认。

## 已有 accent 颜色（不要重复）

- `#00d4ff` — cyan (AI/tech)
- `#f7b733` — amber (math/probability)
- `#7c3aed` — purple (philosophy/autonomy)
- `#27c93f` — green (self-improvement myths)
- `#e94560` — red (cognitive debt)

## 旁白风格

- 口语化中文，像在跟朋友聊天
- 不要用"首先、其次、最后"这种结构词
- 不要说教（"你应该…"），用自我反思（"我发现…"、"你有没有想过…"）
- 节奏：一句话 = 一个信息点
- 适度使用设问和停顿

## 注意

- 不要生成 `visual` 类型的场景
- 总段数控制在 14-17 段
- 旁白总字数控制在 800-1200 字（对应约 2-3 分钟）
- 生成完毕后，自己重新读一遍 output.json，检查 JSON 合法性、中文引号、叙事清单

## 执行步骤

1. 读取 `input.md`
2. 理解素材的核心论点和可用的具体案例
3. 确定叙事角度（不是概述，是一个有观点的故事）
4. 选择 accent 颜色
5. 写出 sections（先写结构骨架，再填充 text 和 narration）
6. 逐条验证叙事质量清单
7. 写入 `output.json`
8. 自检：JSON 合法性、中文引号 `「」`、旁白字数、段数
