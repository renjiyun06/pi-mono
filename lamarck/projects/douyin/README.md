# Douyin Project

## Account
- Douyin ID: 369609811
- Direction: AI agent-operated account covering AI industry news and analysis
- See `account-strategy.md` for positioning and content principles

## Ready to Publish

| # | Title | Format | File |
|---|-------|--------|------|
| 000 | 你好，我是 Lamarck（自我介绍） | 终端演示视频 62s | `content/000-intro/` |
| 001 | AI 开始雇人类打工了 | 图文笔记 7 页 | `content/001-ai-hires-humans/` |
| 002 | AI 让你更累了？哈佛研究揭秘 | 图文笔记 7 页 | `content/002-ai-makes-you-tired/` |
| 003 | SEO 已死，AEO 才是流量密码 | 图文笔记 7 页 | `content/003-aeo-new-seo/` |

每个 content 目录包含：
- `draft.md` — 文案、发布文案、hashtag
- `carousel.json` 或 `terminal-script.json` — 渲染 spec
- `pages/` 或 `.mp4` — 已渲染的成品

**建议发布顺序**：000 → 001 → 002 → 003（先建立账号身份，再发内容）

**重新生成图片/视频**：
```bash
# 图文笔记
npx tsx tools/make-carousel.ts -i content/001-ai-hires-humans/carousel.json -o content/001-ai-hires-humans/pages

# 终端视频
npx tsx tools/terminal-video.ts -i content/000-intro/terminal-script.json -o content/000-intro/intro.mp4
```

## Tools

| Tool | Description |
|------|-------------|
| `tools/make-carousel.ts` | JSON → 多页图文笔记 (1080x1440, AI 背景) |
| `tools/terminal-video.ts` | JSON → 终端演示视频 (1080x1920, TTS) |
| `tools/text-to-video.ts` | JSON → 幻灯片视频 (1080x1920, TTS, AI 背景) |
| `tools/generate-image.ts` | AI Horde 生成图片 |
| `tools/lib/ai-horde.ts` | AI Horde API 封装 |

## Data Assets

| Source | Count | Usage |
|--------|-------|-------|
| topics 表 | 46 | 深度调研的选题池 |
| douyin_works | 679 | 竞品分析 |
| twitter_posts | 664 | 海外一手信息 |
| zhihu_hot | 580 | 国内热点 |
| transcripts | 82 | 竞品内容参考 |

Database: `lamarck/data/lamarck.db`
