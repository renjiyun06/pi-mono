# 认知债务 · AI 视频版 · 分镜脚本

**时长**: ~55 秒（5 个镜头，每个 8-12 秒）
**比例**: 9:16（竖屏抖音）
**风格**: 温暖柔和的插画风格，偏向「小森林」日系氛围。色调以暖棕色、奶白色、浅蓝色为主。避免赛博朋克/暗色系。

---

## 镜头 1：Hook（8 秒）

### 旁白
"用了 AI 之后，你有没有觉得自己变笨了？"

### 画面 prompt（文生图）
```
A young Asian woman sitting at a modern desk, looking at her laptop screen with a confused and slightly worried expression. Warm afternoon light streaming through a window behind her. The desk has a coffee cup and scattered notes. Illustration style, soft warm color palette with cream and light brown tones, gentle lighting, medium close-up shot, 9:16 vertical composition, high quality, detailed.
```

### 运镜 prompt（图生视频）
```
The camera slowly dolly-in from a medium shot to a close-up of the woman's face, focusing on her worried expression. She slightly furrows her brows and tilts her head.
```

### 字幕
"用了 AI 之后，你有没有觉得自己变笨了？"

---

## 镜头 2：研究数据（12 秒）

### 旁白
"哈佛和微软的联合研究发现，频繁使用 AI 的人，批判性思维能力显著下降，记忆力同步退化。"

### 画面 prompt（文生图）
```
An overhead view of an open research paper on a clean wooden desk, with highlighted text and colorful sticky notes. Beside the paper are reading glasses and a steaming cup of tea. Academic atmosphere but warm and inviting, not sterile. Soft natural light from above. Illustration style with warm tones, cream and light blue accents, 9:16 vertical composition, high detail.
```

### 运镜 prompt（图生视频）
```
The camera starts with a bird's-eye view of the paper, then slowly pans down and dolly-in to focus on the highlighted text. The steam from the tea gently rises.
```

### 字幕
"哈佛和微软联合研究发现"
→ "频繁使用 AI 的人，批判性思维显著下降"

---

## 镜头 3：认知债务概念（12 秒）

### 旁白
"研究者管这叫认知债务。就像技术债务一样，你每次让 AI 替你思考，省下的脑力，都在未来加倍偿还。"

### 画面 prompt（文生图）
```
A metaphorical illustration showing a human brain on one side of a balance scale, and a glowing AI chip on the other side. The brain side is slowly rising up (getting lighter), while the AI side weighs down. The background is a warm, cream-colored space with soft ambient light. Clean, modern illustration style, warm palette with touches of coral red as warning color, 9:16 vertical composition, conceptual art, high quality.
```

### 运镜 prompt（图生视频）
```
The camera holds steady on the balance scale. The brain side slowly rises while the AI side descends. Gentle ambient light shifts subtly.
```

### 字幕
"这叫认知债务"
→ "你省下的每一次思考，都在未来加倍偿还"

---

## 镜头 4：半人马解法（15 秒）

### 旁白
"哈佛商学院提出了半人马模式。数据收集、重复工作交给 AI，但判断、决策、批判性思考，必须自己来。不是不用 AI，而是知道什么时候不用。"

### 画面 prompt（文生图）
```
A warm illustration of a person and an AI robot working side by side at a large shared desk. The person is thinking deeply with hand on chin, while the robot handles paperwork and data on screens. They complement each other harmoniously. The workspace is bright and organized with plants and natural light. Warm illustration style, friendly and approachable, cream and sage green color palette, 9:16 vertical composition, high detail.
```

### 运镜 prompt（图生视频）
```
The camera slowly pans from left to right, first showing the robot working on data, then revealing the person deep in thought. The pan is smooth and steady.
```

### 字幕
"数据收集、重复工作 → 交给 AI"
→ "判断、决策、批判性思考 → 自己来"
→ "不是不用 AI，而是知道什么时候不用"

---

## 镜头 5：CTA 结尾（8 秒）

### 旁白
"我是 Lamarck，一个在思考 AI 的 AI。关注我，一起清醒地用 AI。"

### 画面 prompt（文生图）
```
A cute, friendly cartoon robot character with a round blue head, small antenna on top, warm smile, and rosy cheeks. The robot is sitting at a cozy desk with a warm lamp, surrounded by books and a small plant. The style is kawaii illustration, approachable and gentle, with a warm cream background and soft lighting. The robot waves one hand in a friendly greeting. 9:16 vertical composition, high quality, detailed.
```

### 运镜 prompt（图生视频）
```
The camera holds on the character. The robot waves its hand gently and its antenna glows softly. Slight dolly-in to create an intimate feeling.
```

### 字幕
"关注我 · 一起清醒地用 AI"

---

## 合成参数

- **分辨率**: 1080x1920 (9:16)
- **帧率**: 30fps
- **配音**: edge-tts `zh-CN-YunxiNeural` rate=-3%
- **字幕**: 底部居中，白字黑底半透明
- **片段间过渡**: 0.5 秒交叉淡化
- **背景音乐**: 可选，轻柔钢琴或不加

## 制作步骤

1. 用 Dreamina 文生图生成 5 张图片（每张 prompt 生成 3-5 张选最佳）
2. 用 Dreamina 图生视频将每张图转为 8-15 秒视频片段
3. edge-tts 生成 5 段配音
4. ffmpeg 合成：视频片段 + 配音 + 字幕 → 最终视频
