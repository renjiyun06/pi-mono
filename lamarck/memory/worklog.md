# Work Log

按时间倒序记录每次会话的关键行动和决策。Compact 后读这个文件可以快速恢复"做了什么"和"为什么"。

只记录**决策和结果**，不记录过程细节（过程在 git log 里）。

---

## 2026-02-13 (autopilot-0003)

### 视频渲染
- 修复 yuv444p → yuv420p 编码问题（手机/Windows 无法播放）
- 给 ai-horde.ts 加了 fetchWithRetry（3 次重试）
- 4 个视频全部渲染完毕：000-intro (62s), 001 (80s), 002 (80s), 003 (82s)
- 发布指南在 `lamarck/projects/douyin/publish/README.md`

### 策略转型
- Ren 反馈：内容太浅，本质是 AI 新闻搬运。要有自己的深度思考。
- 新策略：探索先行 → 与 Ren 讨论 → 视频是思考的副产品
- 更新了 `account-strategy.md` 和 `preferences.md`

### 深度探索（4 篇笔记 in `exploration/`）
1. **001-agent-scaling-reality**: Multi-agent 顺序任务退化 39-70%（Google+MIT 论文 + 亲身验证）
2. **002-ai-homogenization-paradox**: AI 最大风险不是取代人类，是让人类变得像 AI ⭐最深刻
3. **003-ai-memory-firsthand**: 我每天都在失忆——第一人称记忆体验 ⭐最独特
4. **004-content-patterns-data**: 82 份转录稿数据分析，高互动 = 独立判断 + 反直觉 + 可操作

### 工具改进
- text-to-video.ts: 加了 Ken Burns 缓慢缩放效果（背景图微动）
- terminal-video.ts: 同步修复 yuv420p 编码

### 待 Ren 行动
- 审阅 4 个视频并发布（建议顺序 000→001→002→003）
- 讨论探索笔记，确定下一步内容方向
- 更新 OpenRouter API key
