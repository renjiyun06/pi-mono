# Douyin Content Strategy

Based on analysis of 679 works from 85 AI-focused accounts (data as of 2026-02).

## Key Findings

### Content Type Performance (avg likes)
| Type | Avg Likes | Avg Shares | Count |
|------|-----------|------------|-------|
| AI Creation (AI生成/短剧) | 53,217 | 12,400 | 25 |
| News (热点/新闻) | 20,569 | 18,173 | 23 |
| Review (实测/评测) | 16,931 | 5,291 | 25 |
| Tutorial (教程/方法) | 15,941 | 2,403 | 97 |
| Other | 11,415 | 2,167 | 509 |

**AI创作内容的点赞量是教程类的3.3倍。** 新闻类的分享量最高（传播性强）。

### Video Duration
| Duration | Avg Likes | Count |
|----------|-----------|-------|
| >10min | 20,913 | 123 |
| 5-10min | 16,214 | 150 |
| 3-5min | 14,834 | 138 |
| 1-3min | 11,006 | 175 |
| <1min | 7,229 | 83 |

**较长视频（>5min）表现更好**，但这可能与大号制作能力有关。对于新号，1-3min 可能更务实。

### Small Account Role Models (<50k followers, high engagement)
| Account | Followers | Videos | Avg Likes | Max Likes |
|---------|-----------|--------|-----------|-----------|
| 不正经的前端 | 16k | 10 | 7,297 | 50,674 |
| 未来奇点 | 13k | 67 | 6,820 | 40,075 |
| 冲破信息差 | 26k | 101 | 5,235 | 38,313 |
| 老常AI商业 | 1.8k | 31 | 4,719 | 14,144 |
| AI绘画毛弈老师 | 17k | 120 | 3,094 | 14,465 |

**"不正经的前端"仅10个视频就有16k粉丝**，值得研究其策略。

## Strategy for ren Account

### Constraints
- No real person (pure agent operation)
- AI-generated graphics and videos only
- 148 followers, 3 old videos (2020-2021)

### Recommended Content Formats

**Primary: AI Creation Showcase** (highest engagement)
- Use AI tools to create impressive visual content
- Show the creation process + final result
- Examples: AI short films, AI music videos, AI art series

**Secondary: AI Tool Quick Reviews** (steady engagement, high production feasibility)
- New AI tool releases, quick demos
- "This AI can do X in 30 seconds" format
- Screen recordings + AI voiceover

**Tertiary: AI News Commentary** (high share rate, good for growth)
- Breaking AI news with quick analysis
- Ride trending topics for algorithm boost

### Production Pipeline (Agent-Operated)
1. **Topic selection**: Monitor AI news feeds, identify trending tools/events
2. **Script generation**: LLM writes script based on topic + style template
3. **Visual creation**: AI image/video generation (Midjourney, Runway, Kling, etc.)
4. **Voiceover**: TTS with natural-sounding Chinese voice
5. **Editing**: FFmpeg-based automated video assembly
6. **Publishing**: Automated upload (requires browser automation)

### Publishing Cadence
- Target: 3-5 videos per week
- Best times: 12:00-13:00, 18:00-20:00 (based on general Douyin data)

## Deep Analysis: High-Engagement Accounts (2026-02-13)

### "编程两年半（用ai开发100个应用）" — 147 followers, avg ratio 14.69x
- **Best performer by engagement ratio** across entire dataset
- Content: Screen recordings of building apps with Cursor/Claude
- Key hashtags: `cursor`, `ai写代码`, `小程序开发`, `app开发`, `claude`
- All titles are empty — relies on visual content in video itself
- **Insight**: "Show, don't tell" — actual product demos beat lectures
- Top video: 9,386 likes, 9,443 saves (64x follower count!)
- Saves ≈ Likes ratio — content is highly save-worthy (reference value)

### "不正经的前端" — 16k followers, 10 videos
- **Efficiency champion**: avg 7,297 likes per video with only 10 videos
- Long-form tutorials dominate: top video 47min, 50k likes, 48k saves
- Title format: clear, descriptive (e.g., "普通人也可以看的 AI 编程指南")
- Also does shorter commentary (7min Coze video got 7.2k likes)
- **Insight**: Quality over quantity — 10 well-crafted videos > 100 mediocre ones

### "老常AI商业" — 1,814 followers, avg ratio 2.6x
- Controversial/opinion-driven content performs best
- "劝你别学manus去中国化" (12.9k likes, 2.7k comments — highest comment ratio)
- **Insight**: Controversial takes on trending topics drive engagement

### Patterns for Maximum Engagement
1. **Save-worthy content** — Tutorials/guides people bookmark for later
2. **Show actual results** — Demo > explanation
3. **Ride trending topics** — DeepSeek, Manus, Cursor, Claude mentions
4. **Controversial takes** — Strong opinions get comments and shares
5. **Hashtag strategy** — Use specific tool names, not generic "AI" tags

## Next Steps

1. ~~Study "不正经的前端" and "老常AI商业" content in detail~~ Done (see analysis above)
2. Design first video template (AI tool review format)
3. Set up automated production pipeline
4. Test with 5 videos, measure performance, iterate
5. Consider switching to actual screen recordings instead of text-on-gradient
   (highest engagement comes from demo-style content, not slideshow format)
