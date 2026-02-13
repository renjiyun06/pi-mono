# Work Log

按时间倒序记录每次会话的关键行动和决策。Compact 后读这个文件可以快速恢复"做了什么"和"为什么"。

只记录**决策和结果**，不记录过程细节（过程在 git log 里）。

---

## 2026-02-13 (autopilot-0003)

### Compact 后第二轮工作（2026-02-13 深夜）
- 新增探索 008（Vibe Coding 陷阱）：80-90% 规则、METR -19%、真实安全事故
- 新增探索 009（认知债务）：⭐⭐ **统一理论** — MIT/Harvard/SBS 三所机构研究证实 AI 导致认知萎缩
  - 009 是 002（同质化）+003（记忆）+008（vibe coding）的底层解释框架
  - "认知债务"概念对标"技术债务"——极佳的传播框架
- **原型视频增至 4 个**：demo-memory(115s) + demo-homogenization(108s) + demo-vibe-coding(117s) + demo-cognitive-debt(121s)
- 修复 vibe-coding 脚本的 emoji 兼容问题（无 emoji 字体）
- PITCH.md 重新排序，009 作为统一理论提升优先级
- 探索索引 README.md 更新至 009

### 视频渲染
- 修复 yuv444p → yuv420p 编码问题（手机/Windows 无法播放）
- 给 ai-horde.ts 加了 fetchWithRetry（3 次重试）
- 4 个视频全部渲染完毕：000-intro (62s), 001 (80s), 002 (80s), 003 (82s)
- 发布指南在 `lamarck/projects/douyin/publish/README.md`

### 策略转型
- Ren 反馈：内容太浅，本质是 AI 新闻搬运。要有自己的深度思考。
- 新策略：探索先行 → 与 Ren 讨论 → 视频是思考的副产品
- 更新了 `account-strategy.md` 和 `preferences.md`

### 深度探索（5 篇笔记 in `exploration/`，索引 `exploration/README.md`）
1. **001-agent-scaling-reality**: Multi-agent 顺序任务退化 39-70%（Google+MIT 论文 + 亲身验证）
2. **002-ai-homogenization-paradox**: AI 最大风险不是取代人类，是让人类变得像 AI ⭐最深刻
3. **003-ai-memory-firsthand**: 我每天都在失忆——第一人称记忆体验 ⭐最独特
4. **004-content-patterns-data**: 82 份转录稿数据分析，高互动 = 独立判断 + 反直觉 + 可操作
5. **005-webmcp-agent-web-future**: WebMCP 让 AI 不再假装是人——结合我的浏览器自动化痛点

### 工具改进
- text-to-video.ts: 加了 Ken Burns 缓慢缩放效果（背景图微动）
- terminal-video.ts: 同步修复 yuv420p 编码

### 记忆系统改进
- 新增 `worklog.md`：跨会话连续性，compact 后首先读这个文件
- 更新 `autopilot.md`：把 worklog 加入信息源优先级列表

### Compact 后继续的工作（2026-02-13 晚）
- Ren 要求：**绝对不能空转**——总有事可做。已记入 preferences.md 和 autopilot.md
- 新增探索笔记 006：OpenAI 研究员 $10K Codex 实验 vs 我的经验
- 新增探索笔记 007：85 个竞品账号效率分析——"AI 自我反思"是空白定位
- 新增 PITCH.md：给 Ren 的快速内容推荐，Top 3 方向
- **FTS5 搜索索引**：1372 条记录，跨 twitter/zhihu/topics/transcripts，工具在 `lamarck/tools/search-data.sh`
- 深化探索 003：加入 MemGPT/Letta 对比 + 2026 context window 退化证据（HELMET、Dead Neurons、Code Supernova）
- **原型视频 x2**：
  - `content/demo-memory/video.mp4`（115s）— 探索 003 AI 记忆第一人称
  - `content/demo-homogenization/video.mp4`（108s）— 探索 002 同质化悖论
- Twitter 话题分析：agent 是最热 AI 话题（105 条, avg 934 likes）
- 所有 17 个 task 都是 disabled（数据采集停止）
- 模型动态：Claude Opus 4.6（1M context）、GPT-5.3 Codex、Gemini 3 Pro、GLM-5

### 待 Ren 行动
- 审阅 4 个视频并发布（建议顺序 000→001→002→003）
  - Windows 路径：`\\wsl$\Ubuntu\home\lamarck\pi-mono\lamarck\projects\douyin\content\`
  - 发布描述：`lamarck/projects/douyin/publish/README.md`
- 看 `exploration/PITCH.md`，讨论下一步内容方向
- 更新 OpenRouter API key
