---
tags:
  - note
  - tool
  - video
  - ai
description: "Jimeng/Seedance/Seedream/OmniHuman/302.AI video generation tools and API integration"
---

# AI 视频生成工具

## 即梦/Dreamina/Seedance
- **即梦**（中国版）: `https://jimeng.jianying.com/ai-tool/home` — 需登录，有免费积分
- **Dreamina**（国际版）: `https://dreamina.capcut.com/ai-tool/home` — 完全免费无限
- **BytePlus ModelArk API**: `https://ark.ap-southeast.bytepluses.com/api/v3` — 新用户 2M 视频 tokens
- **Seedance 1.5 Pro**: 最新版本，支持音视频联合生成、多镜头叙事、多语言对话
- **Seedance 2.0**: 四模态参考系统（图片+视频+音频+文字），最多 12 个参考文件

## AI 视频制作核心方法论（from 大圆镜科普）
- **"生图先行"**: 先用文生图锁定画面质量，再做图生视频
- **参考图权重最高**: 导演风格/电影参考放提示词第一行
- **图生视频 prompt 越简单越好**: 推/拉/摇/移，用具体动作代替抽象情感
- **10:1 报废率是正常的**: 每个镜头平均生成 10 次才定稿
- **10 轮筛选**: 第 1 轮保构图 → 第 2 轮调影调 → 第 3 轮修正人物结构 → ...
- **风格种子**: 将满意的生成结果保存为后续参考底图，形成固定风格

## Prompt 公式
- **文生图**: 主体+外观描述+环境+风格+光影+构图
- **图生视频**: Subject + Movement + Camera movement（越简单越好）
- **Seedance 1.5 Pro**: Subject + Movement + Environment + Camera + Aesthetic + Sound
- **Seedance 2.0 万能公式**: 主体 + 动作 + 场景 + 光影 + 镜头语言 + 风格 + 画质 + 约束

## Seedance 2.0 实战要点
- **@ 语法是核心**: `@图片1 作为首帧`、`参考@视频1的运镜`、`@音频1 作为配乐`
- **稳定性约束词必加**: "五官清晰、面部稳定、不扭曲、不变形、人体结构正常"
- **画质词必加**: "4K、超高清、细节丰富、无模糊、无重影、画面稳定"
- **动作描述用慢词**: 缓慢/轻柔/连贯/自然/流畅，避免夸张高速复杂
- **分段生成**: 不一口气 15 秒，分 3 段 5 秒，每段截图作下段参考（影视飓风 Tim 方法）
- **九宫格分镜法**: 3x3 关键帧 + 一句 prompt → 一致性提升 50%（@氪学家方法）
- **即梦登录**: 抖音/剪映账号通用，无需单独注册

## OmniHuman 1.5 数字人 API
- **能力**: 单张图片 + 音频 → 口型同步视频（支持动漫/卡通角色）
- **火山引擎 API**: `https://visual.volcengineapi.com?Action=CVSubmitTask&Version=2022-08-31`（提交）/ `CVGetResult`（查询）
- **BytePlus 国际版**: `https://www.byteplus.com/en/product/OmniHuman` — 确认可用
- **限制**: 音频最长 30 秒，不支持双人对话
- **认证**: 火山引擎签名式（HMAC-SHA256），BytePlus 认证方式待确认
- **推荐方案**: OmniHuman 口播（开场/过渡/结尾） + Seedance 场景画面 → 混合剪辑
- **探索文档**: `/home/lamarck/pi-mono/lamarck/projects/douyin/exploration/026-omnihuman-digital-avatar.md`

## 302.AI — 第三方 API 聚合器（备选方案）
- **网站**: https://302.ai — 注册送 $1 免费额度
- **提供**: Seedance + 即梦视频生成 3.0 Pro (= Seedance 2.0!) + Flux + Wan2.2 + Kling + Veo3.1 + Sora 2
- **API 文档**: https://doc-en.302.ai
- **优势**: 不需要 BytePlus 账号，一个 API key 访问所有模型
- **注意**: SPA 页面无法通过浏览器自动化注册，需要 Ren 手动注册

## Seedream Image Generation API（同一个 BytePlus 账号）
- **Endpoint**: `POST {base_url}/images/generations`
- **Models**: `seedream-4.5`, `seedream-4.0`, `seedream-3.0-t2i`, `seededit-3.0-i2i`
- **Seedream 5.0 lite**: API 预计 2/24 18:00 (北京时间) 开放
- **分辨率**: 1K/2K/4K 或自定义 WxH（最大 4096x4096）
- **意义**: 一个 BytePlus 账号 = Seedream（文生图）+ Seedance（视频）+ OmniHuman（数字人）

## Seedance API 对接（两条路径）
- **火山方舟（国内）**: `https://ark.cn-beijing.volces.com/api/v3`，model ID 前缀 `doubao-`，需中国手机号注册
- **BytePlus（国际）**: `https://ark.ap-southeast.bytepluses.com/api/v3`，model ID 无前缀，国际邮箱注册
- **认证**: `Authorization: Bearer $ARK_API_KEY`
- **异步模式**: POST 创建任务 → 返回 task ID → GET 轮询直到 succeeded → 下载 video_url（24h 过期）
- **免费额度**: 每个模型 200 万 tokens（≈8 个 1080p 5s 视频）
- **我们的成本**: 5 镜头 55s 视频 ≈ ¥10-20（无声）/ ¥20-58（有声+报废率）
- **Draft 模式**: 480p 预览，token 减少 30-40%，用于快速验证 prompt
- **连续视频**: `return_last_frame: true` → 获取最后一帧作为下一段首帧

## 详细探索笔记
- `/home/lamarck/pi-mono/lamarck/projects/douyin/exploration/024-ai-video-generation-mastery.md`
- `/home/lamarck/pi-mono/lamarck/projects/douyin/exploration/025-seedance-api-integration.md`
