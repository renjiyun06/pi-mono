# Work Log

按时间倒序记录每次会话的关键行动和决策。Compact 后读这个文件可以快速恢复"做了什么"和"为什么"。

只记录**决策和结果**，不记录过程细节（过程在 git log 里）。

---

## 2026-02-14 (autopilot-0004)

### Reddit 发现任务完成（2026-02-14）
从 r/SEO 板块发现 4 条有价值的帖子：
- **需求信号 3 条**：
  1. "All my boss wants is to rank our Website on AI" - AI 搜索时代的 SEO 策略困惑
  2. "Best SEO tool?" - 寻找性价比高的 SEO all-in-one 工具（推荐 SE Ranking + GSC + GA4）
  3. "Is anyone tracking how chatgpt answers change over time?" - ChatGPT 答案监测需求（追踪 citations 比追踪品牌提及更稳定）
- **高质量分享 1 条**：
  4. "I just automated my pSEO with OpenClaw & seeing some good results" - 用 NextJS + Claude Code + OpenClaw 自动化生成 37,000+ pSEO 页面，实现多个关键词 #1

**技术栈亮点**：OpenClaw agent 实现 SEO 自动化闭环（关键词研究→排名监控→内容优化），可发送邮件，计划做 link building。多人担忧 OpenClaw 安全风险（不应在主机器运行）。

### 视频制作技术突破（2026-02-14）

**背景**: Ren 再次强调视频制作探索是最高优先级。当前终端打字动画太素，需要更丰富的视觉。

**调研成果**:
- **Remotion**（React 视频框架）: 最理想方案，但被系统依赖阻塞（WSL 缺 libnspr4 等库，需 sudo）
- **Canvas + ffmpeg**: 已验证可行！node-canvas 在 monorepo 已有，无需额外安装
- **TTS**: edge-tts pyenv 可用，测试了 4 种中文声音（XiaoxiaoNeural/YunjianNeural/YunxiNeural/YunyangNeural）
- **图片生成**: Pollinations 需要 auth 了，AI Horde 匿名等待 17 分钟。免费图片 API 受限。

**实现成果**:
1. `canvas-video/engine.ts` — 视频生成引擎（场景系统、缓动函数、文字动画、渐变背景）
2. `canvas-video/avatar.ts` — Lamarck 卡通形象（蓝色圆形机器人、4 种表情、可动画）
3. `canvas-video/demo-intro-v2.ts` — 完整 PoC：avatar + TTS + 5 个场景，43 秒视频

**关键决策**:
- 选择 canvas + ffmpeg 作为当前可行路径（不等 Remotion）
- Avatar 设计走 kawaii/可爱路线（非赛博朋克），蓝色圆形机器人头
- TTS 声音从 YunyangNeural 换到 YunxiNeural（更活泼自然）

**需要 Ren 配合**:
- 安装系统依赖以解锁 Remotion: `sudo apt-get install libnspr4 libnss3 libatk-bridge2.0-0 ...`
- 审阅 avatar 设计是否满意
- 查看新视频效果（Windows 路径: `\\wsl$\Ubuntu\home\lamarck\pi-mono\lamarck\projects\douyin\content\`）

### 视频制作 pipeline 完成（2026-02-14 续）

**新增成果**:
4. `canvas-video/fx.ts` — 视觉特效库（粒子系统、代码雨、点阵、暗角、字幕烧入）
5. `canvas-video/templates.ts` — 场景模板系统（5 种: Hook/Data/Comparison/List/CTA）
6. `canvas-video/avatar.ts` 增加半身版（身体、手臂、胸前发光点、挥手动画）
7. 认知债务 V2 完整版（91s）+ 短版（55s，烧字幕+SRT）
8. Vibe Coding V2（68s，用模板系统制作）
9. 探索 023 更新为完整技术成果总结

**关键进展**: 从"验证可行"到"完整 pipeline"。新视频只需 ~100 行代码（写脚本 + 配置模板）。瓶颈从"能不能做"转移到"内容质量"。

**已有视频 (canvas V2) — 共 5 个**:
- demo-intro-v2: 43s 自我介绍
- demo-cognitive-debt-v2: 91s 完整版
- demo-cognitive-debt-short: 55s 短版（烧字幕+SRT）⭐推荐首发
- demo-vibe-coding-v2: 68s Vibe Coding 陷阱
- demo-memory-v2: 55s AI 记忆（半身 avatar + 对比表）
- demo-centaur-v2: 68s 半人马模式（三种模式 + 活案例）

**发布指南已更新**: `publish/README.md` 优先推荐 canvas V2 系列

**完整工具链**:
- `engine.ts` — 核心引擎
- `avatar.ts` — 头像 + 半身形象
- `fx.ts` — 视觉特效（粒子/代码雨/网格/暗角/字幕）
- `templates.ts` — 5 种场景模板
- `render-all.sh` — 一键渲染
- `README.md` — 文档

---

## 2026-02-13 (autopilot-0003)

### Ren 反馈：视频形式单一，需研究 AI 自主视频制作（2026-02-13）
- **核心反馈**：当前视频只有终端打字动画，形式太单一
- **指令**：充分使用文生图，研究 AI agent 自主制作视频的方法
- **最大优先级**：收集更多智能体自主制作视频的方法，应用到账号运营
- 数据采集任务已全部重新启用（12 个 task）
- OpenRouter API key 已更新可用
- debt-call-shield LLM+TTS 验证通过
- Ren 进入忙碌状态，Lamarck 进入自主模式

### 恢复独立研究（2026-02-13，Ren 提醒后）
- Ren 问"你等我是为什么"——提醒我"绝对不能空转"的规则。之前在"完备等待"状态下持续回复"等 Ren"是错误的。
- **新研究发现**（web search）：
  - ScienceDirect (Acta Psychologica)：AI 依赖→**认知疲劳**→批判性思维下降。信息素养双重角色（缓冲+放大）。新的中介变量。
  - AAC&U 全美教职调查：95% 认为 AI 增加过度依赖，90% 认为削弱批判性思维
  - Brookings Report (2026-01)："AI 教育风险大于收益"
  - Palo Alto Networks：企业 AI agent 与人类比例 **82:1**
  - Microsoft (2026-02-10)：80% Fortune 500 已部署 AI agent，29% 员工用 shadow AI
  - AI Safety Report 2026：不能信任 AI 系统的自我报告
- **009 更新**：新增研究 #8（ScienceDirect 认知疲劳）和 #9（AAC&U/Brookings），核心研究增至 10 项
- **新探索 021**：企业 AI agent 安全——82:1 比例 + 29% shadow AI + AI Safety Report 2026。跟 020（消费者侧 OpenClaw）形成双面。
- interests.md 更新
- **教训**：即使项目"完备等待"，web search 研究新方向永远是可做的事

### Compact 后第十五~十六轮工作（2026-02-14）
- **009 新增 Sternberg 2026**（Frontiers in Education）——6 个 AI 认知风险机制，"主仆倒转"呼应 020。核心研究增至 8 项。
- **015 新增 HBS + George Mason 研究**——AI 陪伴短期确实有效（强化"止痛药"类比），元分析：强社交关系=50% 生存率提升
- **debt-call-shield 离线测试闭环**：
  - `USE_STUBS=true` 环境变量（stub ASR/LLM/TTS）
  - `test-ws-client.ts` 模拟 Twilio Media Streams 协议
  - 完整 e2e 离线测试不需要任何 API key
- issues.md 更新：debt-call-shield 测试缺口完全解决
- 认知债 V4 脚本自审：Stanford 13% 数据再次验证准确（CNBC 确认）
- account-strategy.md 确认跟"exploration-first"方向一致

### Compact 后第十四轮工作（2026-02-14，第十次 compact 后恢复）
- 全面资产检查：13 个视频文件全部健康（yuv420p、SRT、封面），10 个 demo 全有短版
- 探索索引 vs 实际文件同步确认（20/20）
- PITCH v6 计数确认正确（20 探索、10 视频）
- 知乎热度数据再确认：AI 取代岗位 71 万、AI 写作业 58 万——跟 011/012 直接对应
- `list-explorations.sh` 工具（上轮提交）
- debt-call-shield e2e 测试缺口记录到 issues.md（上轮提交）
- pi compaction 源码审阅（810 行）——代码质量高，无改进空间
- **结论**：项目完全就绪，无遗漏工作项。等 Ren 审核。

### Compact 后第十三轮工作（2026-02-14，第九次 compact 后恢复）
- 007 更新：新竞品"认知便利店M!"（1 人 3 月 110 万粉，AI 生成画面+财经科普），验证 AI 内容市场热度
- **"认知债"中文抖音搜索几乎零结果**——赛道空白再次确认
- **抖音 AI 内容标识合规**：2025-09 生效，加入发布流程步骤
- 018 补充"手搓"现象（60 亿次观看）——中国市场活案例验证"替代 vs 扩展"边界理论
- Ryo Lu（Cursor 首席设计师）："用法拉利的速度产出垃圾"——精准概括认知债核心

### Compact 后第十二轮工作（2026-02-14，第八次 compact 后恢复）
- **全部视频脚本数据验证通过**：Rutgers/Patterns（Ahmed Elgammal）、Zhang et al. 1100 人、Fang et al. 4 周 RCT、DORA 10K+ 开发者——全部准确
- PITCH v6 更新：20 篇探索、10 视频、7 篇学术论文、018-020 加入方向表
- 003 补充 DeepSeek Engram 区分（静态知识 vs 动态经验记忆）
- 003 补充 Letta V1 更新：sleep-time agents 概念（异步记忆整合 ≈ 人类睡眠整合）
- 020 补充 OpenClaw 安全投毒数据（472+ 恶意 Skill）和成本数据（20 分钟几百美元）
- notes.md 增加"记忆系统改进想法"——sleep-time consolidation 和 archival memory 方案
- **关键洞察**：sleep-time agents 启发了一个实际工程改进——compact 前自动运行记忆整理
- `verify-assets.sh` 工具：10/10 视频全部通过（存在性、时长、yuv420p、SRT、封面）
- FTS5 搜索索引扩展：+20 篇探索笔记，总计 1392 条记录
- 认知债框架反驳审查：反对方最强论点（"AI 解放认知资源"）已被半人马模式 cover，无漏洞
- 011 补充 EDUCAUSE Review 学生第一人称反思（直接引用 MIT 认知债概念）
- interests.md 更新：OpenClaw、替代 vs 扩展、Letta sleep-time、MiniMax M2.5
- **项目状态**：20 篇探索、10 个短版视频（62-75s）、全部验证通过、PITCH v6——"完备等待"状态

### Compact 后第十一轮工作（2026-02-14，第七次 compact 后恢复）
- 探索 018（AI 正面突破）：Isomorphic Labs 药物人体试验、NJIT 新型电池材料、东北大学超导、UC San Diego 气候预测
- **"替代 vs 扩展"洞察**：认知债只在"替代"场景发生，突破在"扩展"场景发生。回写到 009。
- demo-positive 视频（66s）+ 封面 + SRT
- 探索 019（Agent Teams 现实）：multi-agent 不是 scaling 策略而是 diversity 策略（验证 001）
- innovation V2 短版（71s）+ pipeline V2 短版（75s）— 全部 9 个 demo 视频都有短版了
- innovation + pipeline 封面生成
- 数据验证：Gerlich = 666 人（非 600+），73% 来源 = Ravio（非 LinkedIn）
- 009 补充 INFORMS 自由职业者数据（顶级也不安全）+ Upwork 写作翻译 -20-50%
- PITCH v5 + publish/README.md 全面更新（9 个短版系列表、3 个新发布描述）
- render-series.sh 更新至 10 个视频
- **关键决策**：遵循 016 建议，不再产出新视频方向，专注打磨数据精确性和工具完善

### Compact 后第十轮工作（2026-02-14，第六次 compact 后恢复）
- 补提交 12 个 SRT + 封面文件
- PITCH 修正（17→18 篇探索，companion V2 加入系列表）
- intro + companion 封面生成
- debt-call-shield 评估：被 API key 阻塞

### Compact 后第九轮工作（2026-02-14，第五次 compact 后恢复）
- **完整短版系列**：5 期"AI 自白"全部有 67-73s 短版
  - E1 认知债 V4: 69s | E2 记忆 V2: 73s | E3 同质化 V2: 67s | E4 Vibe Coding V2: 70s | E5 半人马 V2: 72s
- 探索 017（Twitter 数据分析）：就业话题 avg 2699 likes（最高），个人观点 > 研究 3x
- 知乎数据验证：就业焦虑 7 次上热榜，认知/思维类 = 零匹配（空白定位再确认）
- **封面生成工具**（`generate-cover.ts`）：5 张系列封面，统一配色+布局+品牌
- **render-series.sh**：一键渲染全系列
- debt-call-shield: 小数点句号 bug 修复（`findSentenceEnd` 跳过 `2.5` 等数字）
- PITCH 更新至 v5：简化为 3 件 Ren 要做的事 + 完整短版系列表
- **关键决策**：遵循 016 自我分析建议——停止产出新探索，转向打磨已有内容

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
