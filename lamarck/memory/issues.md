# Known Issues

## 多智能体反馈机制不够优雅

**背景**：在 douyin-growth 实验中，我们需要给 agent 建立反馈机制。比如它生成的视频内容是否受欢迎、质量是否合格，都需要反馈来纠偏。

**当前方案**：
- 通过任务系统创建审查任务（如 douyin-growth-review）
- 审查任务运行后，将反馈写入被审查任务的 `feedback/` 目录
- 被审查任务下次唤醒时读取 feedback

**局限性**：
1. **静态** — 任务需要提前写好 .md 文件，不能动态创建
2. **重量级** — 每个反馈视角都需要一个完整的任务文档
3. **不灵活** — 不能"随手捏一个智能体看某方面"
4. **异步** — 通过文件系统通信，不是即时反馈
5. **单向** — A → feedback → B，而不是多个 agent 自然讨论

**理想的机制**：
- 像 Artificial Societies 那样，可以灵活地创建模拟用户/评审者
- Agent 在做事过程中可以随时获得反馈，不需要等下次唤醒
- 可以针对特定方面快速创建临时评审者

**参考**：
- Artificial Societies (YC W25)：500K+ AI personas 数据库，模拟社会网络反应
- Claude Code Agent Teams：Team lead + teammates，共享任务列表，直接消息通信
- Berkeley 研究：多智能体系统三大失败类型（设计37%、协调31%、验证31%）

**可能的改进方向**：
1. 内置评审工具 — `get_feedback(content, perspective)`
2. 轻量级子 agent — 临时 spawn，用完即销毁
3. 多视角自省 — agent 自己切换角色思考
4. 评审即服务 — MCP 服务，接收内容 + 评审 prompt，返回反馈

**状态**：待探索，短期内继续使用任务系统方案

## 抖音视频下载偶发验证码

**问题**：通过浏览器自动化（mcporter + chrome-devtools 或 download-video.ts + Playwright）访问抖音视频时，偶尔会遇到滑块验证码（"请完成下列验证后继续"），导致无法提取视频URL。

**观察**：
- 验证码并非每次都出现，之前多次成功（如2026-02-12 11:56最后一次成功）
- 验证码出现后，多次重试仍然显示验证码页面
- 可能的触发因素：访问频率、浏览器指纹识别、IP限制、时间段策略

**当前影响**：
- douyin-video-transcribe 任务每5分钟执行一次，大部分时间成功，偶尔因验证码失败
- 失败后需要等待下次定时任务重试（可能自动恢复）

**潜在解决方案**：
1. 使用已登录的Chrome用户配置（cookies）—— 需要手动维护登录状态
2. 添加验证码自动识别/绕过机制（技术难度高，且可能违反ToS）
3. 降低访问频率（但会降低数据采集效率）
4. 使用代理IP轮换（需要额外基础设施）
5. 探索是否有官方API或第三方服务可用

**临时应对**：遇到验证码时，任务直接退出，等待下次定时任务重试。由于定时任务每5分钟执行一次，通常会在几次内恢复。

## OpenRouter API Key 失效

**发现时间**：2026-02-13

**问题**：`.env` 中的 `OPENROUTER_API_KEY` 返回 401 "User not found"，已无法使用。

**影响**：
- debt-call-shield 项目的 LLM provider 无法调用
- 所有依赖 OpenRouter 的功能不可用

**可能的替代方案**：
1. Ren 更新 OpenRouter API key（最简单）
2. OpenRouter 有免费模型 `deepseek/deepseek-chat-v3-0324:free`（但仍需有效 key）
3. 本地 Ollama（15GB RAM 可跑小模型，不需要 key，但需要安装 ~4GB）
4. Groq 免费层（需要注册获取 key，但免费额度高）

**需要**：Ren 决定用哪个方案。

## GitHub CLI 未认证

**发现时间**：2026-02-13

**问题**：`gh auth status` 显示未登录。无法查看 issue、PR 等。

**需要**：Ren 运行 `gh auth login` 完成认证。

## Noto Color Emoji 字体未安装

**发现时间**：2026-02-14

**问题**：终端视频中如果包含 emoji 字符会显示为方框（⊠）。需要安装 `fonts-noto-color-emoji`。

**安装命令**：`sudo apt-get install -y fonts-noto-color-emoji`

**影响**：低优先级——当前所有脚本已避免使用 emoji，但未来可能需要。

## Ollama 未安装

**发现时间**：2026-02-14

**需求**：本地 LLM 运行能力。16GB RAM 足够跑 7B 模型（如 Qwen2.5-7B、Llama 3.1-8B）。可作为 OpenRouter 的备选方案，也可用于 debt-call-shield 低延迟对话。

**安装命令**：`curl -fsSL https://ollama.com/install.sh | sh`（需要 sudo）

**优先级**：中。OpenRouter key 失效期间是唯一的 LLM 方案。

## debt-call-shield 缺少端到端测试能力

**发现时间**：2026-02-14

~~**问题**：`createProviders()` 硬编码使用真实 provider。~~

**已解决**：
- [x] `USE_STUBS=true` 环境变量（commit 73b0493f）
- [x] `test-ws-client.ts` WebSocket 测试客户端（commit d3d383c2）
- 完整离线 e2e 测试现在可行，等 Ren 注册 Twilio 后做真实集成测试
