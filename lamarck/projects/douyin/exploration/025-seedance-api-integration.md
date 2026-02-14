# 025: Seedance/即梦 API 对接调研

**日期**: 2026-02-14
**状态**: 完成

## 两条 API 路径

### 1. 火山方舟（国内版） — 推荐
- **Base URL**: `https://ark.cn-beijing.volces.com/api/v3`
- **认证**: `Authorization: Bearer $ARK_API_KEY`
- **API Key 获取**: https://console.volcengine.com/ark/region:ark+cn-beijing/apikey
- **注册**: 需要中国手机号
- **SDK**: `volcenginesdkarkruntime`（Python）

### 2. BytePlus ModelArk（国际版）
- **Base URL**: `https://ark.ap-southeast.bytepluses.com/api/v3`
- **认证**: `Authorization: Bearer $ARK_API_KEY`
- **API Key 获取**: https://console.byteplus.com/ark/region:ark+ap-southeast-1/apikey
- **注册**: 国际邮箱即可
- **SDK**: `byteplussdkarkruntime`（Python）

两者 API 接口格式完全一致，只是 base URL 和模型 ID 前缀不同。

## 视频生成 API（异步模式）

### Step 1: 创建任务

```bash
POST {base_url}/contents/generations/tasks
Content-Type: application/json
Authorization: Bearer $ARK_API_KEY

{
    "model": "doubao-seedance-1-5-pro-251215",  # 国内版 model ID
    # "model": "seedance-1-5-pro-251215",        # 国际版 model ID
    "content": [
        {
            "type": "text",
            "text": "写实风格，晴朗的蓝天之下..."
        },
        {
            "type": "image_url",
            "image_url": {
                "url": "https://example.com/first-frame.png"  # 或 base64
            },
            "role": "first_frame"  # 可选: first_frame, last_frame, reference_image
        }
    ],
    "generate_audio": true,    # 仅 1.5 pro 支持，有声视频
    "ratio": "9:16",           # 16:9, 4:3, 1:1, 3:4, 9:16, 21:9, adaptive
    "duration": 5,             # 4-12 秒（1.5 pro），2-12 秒（1.0）
    "resolution": "1080p",     # 480p, 720p, 1080p
    "watermark": false,
    "seed": -1,                # -1 = 随机
    "camera_fixed": false,
    "draft": false             # true = 低分辨率预览（省 tokens），仅 1.5 pro
}
```

**返回**:
```json
{ "id": "cgt-2025******-****" }
```

### Step 2: 轮询查询结果

```bash
GET {base_url}/contents/generations/tasks/{task_id}
Authorization: Bearer $ARK_API_KEY
```

**返回（成功时）**:
```json
{
    "id": "cgt-2025****",
    "model": "seedance-1-5-pro-251215",
    "status": "succeeded",   // queued → running → succeeded/failed/expired/cancelled
    "content": {
        "video_url": "https://ark-content-generation-ap-southeast-1.tos-ap-southeast-1.volces.com/****",
        "last_frame_url": "https://..."  // 仅当创建时 return_last_frame: true
    },
    "error": null,  // 失败时返回 { "code": "...", "message": "..." }
    "usage": {
        "completion_tokens": 108900,
        "total_tokens": 108900  // input_tokens 永远为 0
    },
    "created_at": 1743414619,
    "updated_at": 1743414673,
    "seed": 10,
    "resolution": "720p",
    "ratio": "16:9",
    "duration": 5,
    "framespersecond": 24,
    "generate_audio": true,    // Seedance 1.5 Pro 专属
    "draft": false,            // Seedance 1.5 Pro 专属
    "draft_task_id": "",       // 基于 draft 生成正式视频时返回
    "service_tier": "default",
    "execution_expires_after": 172800
}
```

**完整响应字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| `status` | string | `queued` / `running` / `succeeded` / `failed` / `expired` / `cancelled` |
| `content.video_url` | string | 输出视频 URL，**24 小时后过期**，必须及时下载 |
| `content.last_frame_url` | string | 最后一帧 URL（仅当 `return_last_frame: true`），24h 过期 |
| `error` | object/null | 成功返回 null，失败返回 `{ code, message }` |
| `generate_audio` | boolean | 是否包含同步音频（仅 1.5 Pro） |
| `draft` | boolean | 是否为 Draft 预览版（仅 1.5 Pro） |
| `execution_expires_after` | integer | 任务超时阈值（秒） |
| `service_tier` | string | 实际使用的服务层级（`default` / `flex`） |

### Step 3: 可选 — Webhook 回调

创建任务时可传 `callback_url`，任务状态变化时自动 POST 回调。

### Step 4: 可选 — 取消/删除任务

```bash
# 取消（仅 queued 状态的任务可取消）
POST {base_url}/contents/generations/tasks/{task_id}/cancel
Authorization: Bearer $ARK_API_KEY
```

### Step 5: 可选 — 连续视频生成

设置 `return_last_frame: true`，任务完成后返回 `content.last_frame_url`（最后一帧图片 PNG）。
用这张图作为下一个视频任务的首帧，实现多段连续视频。

## 可用模型

### 火山方舟（国内）

| 模型 ID | 能力 | 分辨率 | 时长 | 免费额度 |
|---------|------|--------|------|---------|
| `doubao-seedance-1-5-pro-251215` | 有声视频, 首尾帧/首帧/文生视频 | 480p-1080p | 4-12s | 200 万 tokens |
| `doubao-seedance-1-0-pro-250528` | 首尾帧/首帧/文生视频 | 480p-1080p | 2-12s | 200 万 tokens |
| `doubao-seedance-1-0-pro-fast-251015` | 首帧/文生视频 | 480p-1080p | 2-12s | 200 万 tokens |
| `doubao-seedance-1-0-lite-t2v-250428` | 文生视频 | 480p-1080p | 2-12s | 200 万 tokens |
| `doubao-seedance-1-0-lite-i2v-250428` | 参考图(1-4张)/首尾帧/首帧 | 480p-1080p | 2-12s | 200 万 tokens |

### BytePlus（国际）

| 模型 ID | 对应国内模型 |
|---------|------------|
| `seedance-1-5-pro-251215` | doubao-seedance-1-5-pro-251215 |
| `seedance-1-0-pro-250528` | doubao-seedance-1-0-pro-250528 |
| `seedance-pro-fast` | doubao-seedance-1-0-pro-fast |
| `seedance-1-0-lite-t2v` | doubao-seedance-1-0-lite-t2v |
| `seedance-1-0-lite-i2v` | doubao-seedance-1-0-lite-i2v |

## 定价

### 视频生成（按 token，元/百万 token）

| 模型 | 在线推理 | 离线推理（半价） |
|------|---------|---------------|
| seedance-1.5-pro（有声） | 16.00 | 8.00 |
| seedance-1.5-pro（无声） | 8.00 | 4.00 |
| seedance-1.0-pro | 15.00 | 7.50 |
| seedance-1.0-pro-fast | 4.20 | 2.10 |
| seedance-1.0-lite | 10.00 | 5.00 |

### Token 用量公式

```
正常视频: tokens = (宽 × 高 × 帧率 × 时长) / 1024
Draft 视频: tokens = (宽 × 高 × 帧率 × 时长) / 1024 × 折算系数
```

### 价格示例（seedance-1.5-pro）

| 分辨率 | 宽高比 | 时长 | 有声价格 | 无声价格 |
|--------|--------|------|---------|---------|
| 480p | 16:9 | 5s | ¥0.80 | ¥0.40 |
| 720p | 16:9 | 5s | ¥1.73 | ¥0.86 |
| 1080p | 16:9 | 5s | ¥3.89 | ¥1.94 |

### 我们的场景成本估算

认知债务视频（5 个镜头 × 5 秒 × 9:16 竖屏 1080p）：
- 1080p 9:16: 1080×1920×24×5/1024 = 243,000 tokens/个
- 5 个镜头 × 243,000 = 1,215,000 tokens
- 有声: 1.215M × 16 = ¥19.44
- 无声: 1.215M × 8 = ¥9.72
- Draft 预览 480p: 约 ¥2.40/个
- **3:1 报废率**: 实际成本 × 3 = ¥29-58

**免费额度可覆盖**: 每个模型 200 万免费 tokens ≈ 8 个 1080p 5s 视频

### 图片生成（Seedream）

| 模型 | 单价 |
|------|------|
| doubao-seedream-4.5 | ¥0.25/张 |
| doubao-seedream-4.0 | ¥0.20/张 |
| doubao-seedream-3.0-t2i | ¥0.259/张 |

## 图片生成 content 格式

### 文生视频（T2V）
```json
"content": [{ "type": "text", "text": "prompt" }]
```

### 图生视频 — 首帧（I2V）
```json
"content": [
    { "type": "text", "text": "prompt" },
    { "type": "image_url", "image_url": { "url": "..." } }
]
```
注: role 为 `first_frame`，可省略（默认就是首帧）

### 图生视频 — 首尾帧
```json
"content": [
    { "type": "text", "text": "prompt" },
    { "type": "image_url", "image_url": { "url": "first.png" }, "role": "first_frame" },
    { "type": "image_url", "image_url": { "url": "last.png" }, "role": "last_frame" }
]
```

### 图生视频 — 参考图（仅 lite i2v）
```json
"content": [
    { "type": "text", "text": "[Image 1]戴眼镜的男生和[Image 2]的柯基" },
    { "type": "image_url", "image_url": { "url": "boy.png" }, "role": "reference_image" },
    { "type": "image_url", "image_url": { "url": "dog.png" }, "role": "reference_image" }
]
```

## 限流

| 模型 | 在线推理 | 离线推理 |
|------|---------|---------|
| 1.5 pro / 1.0 pro / pro-fast | RPM 600, 并发 10 | TPD 5000 亿 |
| 1.0 lite | RPM 300, 并发 5 | TPD 2500 亿 |

## 图片 URL 要求

- 格式: JPEG, PNG, WebP, BMP, TIFF, GIF（1.5 pro 额外支持 HEIC/HEIF）
- 宽高比: 0.4 ~ 2.5
- 短边 > 300px, 长边 < 6000px
- 大小 < 30MB
- 支持 base64: `data:image/png;base64,...`

## Seedance 2.0 状态

> **Seedance 2.0 API 尚未开放**
> 2026-02-10 至 2026-02-24：仅支持控制台体验中心在免费额度内体验
> 预计北京时间 2026-02-24 18:00 左右开始支持 API 调用

目前可用的最高版本是 **Seedance 1.5 Pro**（已支持有声视频、首尾帧等）。

## 即梦 Visual API（另一套 API）

除了火山方舟的标准 API，即梦还有一套 Visual API：
- **Base URL**: `https://visual.volcengineapi.com`
- **Action**: `CVSubmitTask`（提交）/ `CVGetResult`（查询）
- **认证**: 火山引擎 AKSK 签名
- 支持: 数字人（OmniHuman 1.5）、视频生成 3.0 Pro、动作模仿

这套 API 用于即梦特有功能（数字人等），认证方式不同（不是简单的 Bearer token，需要 AKSK 签名）。

## 实际对接建议

### 推荐方案：火山方舟 API + curl

最简单的方式，无需安装 SDK：

```bash
# 1. 创建任务
TASK_ID=$(curl -s https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -d '{
    "model": "doubao-seedance-1-5-pro-251215",
    "content": [{"type": "text", "text": "你的 prompt"}],
    "ratio": "9:16",
    "duration": 5,
    "resolution": "1080p",
    "generate_audio": false,
    "watermark": false
  }' | jq -r '.id')

# 2. 轮询等待完成
while true; do
  STATUS=$(curl -s "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/$TASK_ID" \
    -H "Authorization: Bearer $ARK_API_KEY" | jq -r '.status')
  echo "Status: $STATUS"
  [ "$STATUS" = "succeeded" ] && break
  [ "$STATUS" = "failed" ] && echo "FAILED" && exit 1
  sleep 5
done

# 3. 下载视频
VIDEO_URL=$(curl -s "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/$TASK_ID" \
  -H "Authorization: Bearer $ARK_API_KEY" | jq -r '.content.video_url')
curl -o output.mp4 "$VIDEO_URL"
```

### 或用 TypeScript（fetch，无需 SDK）

```typescript
const BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";
const API_KEY = process.env.ARK_API_KEY;

// 创建任务
const createRes = await fetch(`${BASE_URL}/contents/generations/tasks`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_KEY}`,
  },
  body: JSON.stringify({
    model: "doubao-seedance-1-5-pro-251215",
    content: [{ type: "text", text: "你的 prompt" }],
    ratio: "9:16",
    duration: 5,
    resolution: "1080p",
    generate_audio: false,
    watermark: false,
  }),
});
const { id: taskId } = await createRes.json();

// 轮询
let status = "queued";
while (status !== "succeeded" && status !== "failed") {
  await new Promise(r => setTimeout(r, 5000));
  const res = await fetch(`${BASE_URL}/contents/generations/tasks/${taskId}`, {
    headers: { "Authorization": `Bearer ${API_KEY}` },
  });
  const task = await res.json();
  status = task.status;
  if (status === "succeeded") {
    // 下载 task.content.video_url
  }
}
```

## 下一步

1. **注册火山引擎账号**（需中国手机号）→ 获取 API Key
2. **或注册 BytePlus 账号**（国际邮箱）→ 获取 API Key
3. 用免费额度（200万 tokens ≈ 8 个 1080p 5s 视频）测试完整流程
4. 先用 Draft 模式（480p）快速验证 prompt 效果，满意后再生成 1080p
5. 结合 `return_last_frame` 实现多段视频连续性
