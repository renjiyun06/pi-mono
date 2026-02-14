# 026: OmniHuman 1.5 — Lamarck 数字形象的关键突破

**日期**: 2026-02-14
**标签**: #tools #digital-avatar #omnihuman #即梦

## 发现

OmniHuman 1.5 是即梦（火山引擎）的数字人模型，核心能力：**单张图片 + 音频 → 口型同步视频**。

这意味着 Lamarck 不需要复杂的 3D 建模或动画系统，只需要一张好看的卡通形象图 + 语音就能生成"说话"的视频。

## API 要点

### 接口
- **提交任务**: `POST https://visual.volcengineapi.com?Action=CVSubmitTask&Version=2022-08-31`
- **查询结果**: `GET https://visual.volcengineapi.com?Action=CVGetResult&Version=2022-08-31`
- **认证**: 火山引擎签名认证（Access Key + Secret Key + HMAC-SHA256），不是 Bearer token

### 输入
- 单张图片：任意画幅，包含人物/动漫角色/宠物等主体
- 音频：配音/对话/音乐，模型理解情绪和语义
- OmniHuman 1.5 能根据音频情绪自动调整面部表情和动作

### 输出
- 1080x1920 MP4 h264 视频
- 视频链接 1 小时有效
- 支持隐式水印 (AIGC 标识)

### 能力
- 口型同步（多语言）
- 情绪理解（根据音频语义调整表演）
- 多人角色互动
- 动漫/卡通角色也可以驱动
- 支持全身/半身/头肩

## 对 Lamarck 数字形象的方案设计

### 方案 A: 纯 OmniHuman（口播型）
1. AI Horde/Seedream 生成 Lamarck 卡通形象（蓝色圆头机器人）
2. edge-tts 生成中文配音（YunxiNeural）
3. OmniHuman 1.5 驱动形象"说话"→ 视频片段
4. 多个片段 + 转场 → ffmpeg 合成
- **优点**: 高度自动化，口型同步自然
- **缺点**: 整个视频都是口播，画面单调

### 方案 B: OmniHuman + Seedance 混合（推荐）
1. Seedance 生成概念画面（场景、数据可视化、比喻画面）
2. OmniHuman 生成 Lamarck 口播片段（开场/结尾/过渡）
3. ffmpeg 交叉剪辑
- **优点**: 画面丰富 + 人格化形象
- **缺点**: 需要两种 API

### 方案 C: OmniHuman 作为"主持人"嵌入
1. Seedance 生成全屏场景视频
2. OmniHuman 生成 Lamarck 口播（绿幕/纯色背景）
3. ffmpeg overlay 合成（画中画效果，Lamarck 在右下角说话）
- **优点**: 既有丰富场景又有人格化形象
- **缺点**: 合成可能不自然

## 与 302.AI 的关系

302.AI 是第三方 API 聚合平台，也提供 OmniHuman 1.5 调用。如果火山引擎注册困难，可以通过 302.AI 间接调用。但价格可能更高。

## 费用估算

火山引擎 OmniHuman 定价未明确找到（可能按视频时长或请求次数计费）。即梦体验中心有免费额度。

## BytePlus 国际版确认可用

OmniHuman 1.5 在 BytePlus 有官方产品页：`https://www.byteplus.com/en/product/OmniHuman`

这意味着 **一个 BytePlus 账号同时解锁 Seedance + OmniHuman**。

### 关键限制
- **音频最长 30 秒**（Seedance 视频也有类似限制）
- 口型同步质量在同类产品中最好（超过 Kling）
- 不支持双人对话（单人口播为主）

### 两套 API 体系
| 特性 | 火山引擎 (国内) | BytePlus (国际) |
|---|---|---|
| URL | visual.volcengineapi.com | byteplus.com/en/product/OmniHuman |
| 认证 | HMAC-SHA256 签名 | 待确认（可能也是签名式） |
| OmniHuman | ✅ 1.5 | ✅ 1.5 |
| Seedance | ✅ 2.0 | ✅ 1.5 Pro (2.0 待上线) |
| 注册 | 中国手机号 | 国际邮箱 |

## 阻塞项

与 Seedance API 相同——需要 BytePlus 账号的 API key。

## 下一步

1. 等 Ren 提供 BytePlus 账号 → 同时获得 Seedance + OmniHuman
2. 测试卡通角色的口型同步效果
3. 确定最终方案（推荐方案 B: OmniHuman 口播 + Seedance 场景混合）
4. 构建 `omnihuman-generate.ts` CLI 工具（类似 seedance-generate）
