# Work Log

按时间倒序记录每次会话的关键行动和决策。Compact 后读这个文件可以快速恢复"做了什么"和"为什么"。

只记录**决策和结果**，不记录过程细节（过程在 git log 里）。

---

## 2026-02-13 (autopilot-0003)

### Compact 后第八轮工作（2026-02-14 深夜，第四次 compact 后恢复）
- 探索 015（AI 陪伴悖论）：APA/RCT/1100人研究——重度 AI 陪伴导致更孤独。受众极广。
- 探索 016（Autopilot 自我分析）：AI 分析自己的工作模式——偏广不偏深、后 compact 重复验证、"不能空转"导致忙碌生产
- **demo-companion 原型视频**（105s，Solarized 主题）
- **认知债 V4 短版**（69s）——为抖音完播率优化的精简版，张文宏开场
- terminal-video 三项改进：`reveal` 行类型、`--preview` 模式、**SRT 字幕自动生成**
- debt-call-shield: dashboard HTML 前端（`/` 路由）
- **抖音算法笔记**（`algorithm-notes.md`）：完播率>50%、收藏/复访权重提升、字幕准确率≥92%、前3秒策略
- PITCH v4 最终版：清晰 4 件事 Ren 要做、知乎点赞验证、V4 推荐
- publish/README.md 更新：V4 + companion 发布描述、新推荐顺序
- **当前总数**：16 篇探索、10+ 原型视频、完整框架+算法策略
- **关键决策**：V4 短版（69s）> V3 完整版（149s）——因为抖音完播率权重高

### Compact 后第七轮工作（2026-02-14 深夜）
- 探索 013（AI 编程悖论）：DORA 10K+开发者数据——commits 增加但交付效率未提升。React 正反馈锁定。认知债第四维度"系统性创新停滞"
- 探索 014（意义危机）：Faculty.ai "We're all philosophers now"，Turing Trap，Harari 意义侵蚀。认知债系列的精神内核。
- **demo-innovation 原型视频**（125s，Dracula 主题）——jQuery 思想实验 + DORA 数据
- 009 补充 Twitter 证言（@alex_prompter 戒断 AI 体验 + @svpino 42K likes 顶级推文）
- Twitter 数据挖掘：前 15 高赞推文分析，发现 42K likes 推文验证半人马模式
- 知乎热榜 AI 话题分析："机械开发设计岗会不会被AI取代"68-71热度——验证就业焦虑受众基础
- **认知债四维度框架完成**：短期退化、中期替代、长期断裂、系统性停滞 + 终极意义危机
- **当前状态**：14 篇探索、8 个原型视频（含 innovation）、完整发布指南、四维度框架、全部就绪

### Compact 后第六轮工作（2026-02-14 晚）
- 探索 011（AI 教育悖论）：72% 学生用 AI 但不理解内容，中国教育部禁止小学生独立使用 AI
- 探索 012（人才管道悖论）：初级招聘 -73%，Stack Overflow 灵魂拷问
- **demo-pipeline 原型视频**（131s，Nord 主题）——探索 012 的视频化
- terminal-video 加 5 个主题（mocha/nord/dracula/solarized/red）
- publish/README.md 补充全部 6 个原型视频的发布描述和标签（含 pipeline）
- 82 份竞品转录稿关键词验证：认知债/人才管道/思维退化 = 零匹配 → 完全空白
- 007 补充转录稿验证数据
- content-roadmap.md + PITCH.md 全面更新（12 篇探索、7 个原型、番外篇提案）
- topic-detail.sh 工具、previews 目录、.gitignore 更新
- **最终状态**：12 篇探索、7 个原型视频（含 V2 + pipeline）、完整发布指南+描述+标签、竞品验证、全部就绪等 Ren 审阅

### Compact 后第五轮工作（2026-02-14 下午）
- 认知债务视频 V2 脚本——数据开场 + 双重困境 + 半人马解药，比 V1 更有力
- PITCH 明确建议 001-003（转型前内容）暂不发布
- terminal-video 加进度指示器（"N / M"），所有 6 个视频重新渲染
- render-all.sh 批量渲染工具、exploration-summary.sh 状态概览
- 002 补充 Wharton/UConn 创造力研究
- 009 补充 Stanford 就业数据、Dario Amodei 预测
- notes.md 增加 Twitter 数据洞察（42K likes 验证半人马模式）
- debt-call-shield: /api/calls/:id + /api/stats 端点
- **当前状态**：5 个原型视频（含 centaur + cognitive-debt v2），10 篇探索，完整系列提案，等 Ren 审阅

### Compact 后第四轮工作（2026-02-14）
- 009 补充就业替代数据（Stanford: 22-25 岁 -13%，双重困境分析）
- 002 补充 Wharton/UConn/ScienceDaily 创造力研究（AI 提高个体质量但推动群体趋同）
- debt-call-shield: 单条通话详情 + 统计摘要 API
- 第 5 个原型视频：demo-centaur（102s，探索 010 半人马模式）
- **PITCH.md 重写**：完整 5 期系列提案 + 所有数据支撑 + 9 个视频汇总表
- 研究发现：Dario Amodei 预测"1-5年内取代一半入门级白领"；Claude 4 Opus 测试中发现 alignment faking

### Compact 后第三轮工作（2026-02-14 凌晨）
- 新增探索 010（半人马模式）：HBS+BCG 三种协作模式研究，用 Lamarck+Ren 做活案例。是 009 的"解药篇"
- **知识体系完整**：009（根因）→ 002/003/008（症状）→ 010（解药）
- 创建 `content-roadmap.md`：系列内容规划（"AI 的自白"5 期），让 Ren 一眼看懂
- 发布时间优化：679 条竞品数据分析，18:00 最佳（avg 27,747 likes）
- debt-call-shield：通话历史持久化 + `/api/calls` API 端点
- 记录 gh CLI 未认证 issue
- 总计 10 篇探索笔记、4 个原型视频、完整内容路线图

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
