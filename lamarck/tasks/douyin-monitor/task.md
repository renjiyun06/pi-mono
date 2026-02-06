---
cron: "0 9 * * *"
enabled: yes
provider: anthropic
model: claude-sonnet-4-5
---

# 抖音账号监控

## 执行方式
使用 `sub-agent` 技能分解执行。每个账号启动一个子 agent 处理，串行执行。

## 浏览器操作
**必须使用 `chrome-devtools-douyin-monitor` 这个 MCP server 操作浏览器。**

## 目标
每天扫描种子账号，发现新视频，下载并转录，记录到数据库。

## 路径

- 数据库：`/home/lamarck/pi-mono/lamarck/data/lamarck.db`
- 视频目录：`/home/lamarck/pi-mono/lamarck/data/videos/`
- 转录目录：`/home/lamarck/pi-mono/lamarck/data/transcripts/`
- 工具目录：`/home/lamarck/pi-mono/lamarck/tools/`
- CDP 端点：`http://172.30.144.1:19222`

## 操作流程

### 1. 读取账号列表
```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db \
  "SELECT account_id, account_name, profile_url FROM douyin_accounts;"
```

### 2. 逐个扫描账号主页

对于每个账号：
- 使用 mcporter 调用 chrome-devtools.navigate_page 访问主页
- 从页面中提取视频列表（video_id, title, video_url）
- **跳过置顶视频**：带"置顶"标签的视频不是最新的，要过滤掉
- 取过滤后的第一条作为"最近视频"
- 每个账号之间 sleep 5-10 秒，避免触发验证码

**识别置顶视频**：
- 页面上置顶视频通常带有"置顶"文字标签
- 在 snapshot 中查找视频卡片，检查是否包含"置顶"字样
- 有"置顶"标签的 → 跳过
- 没有的 → 这才是真正按时间排序的视频

### 3. 检查新视频

对于每个视频，检查是否已存在：
```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db \
  "SELECT 1 FROM douyin_videos WHERE video_id = '<video_id>';"
```
- 已存在 → 跳过
- 不存在 → 继续处理

### 4. 处理新视频

#### 4.1 下载视频
```bash
cd /home/lamarck/pi-mono/lamarck/tools
npx tsx download-video.ts "<video_url>" \
  -o /home/lamarck/pi-mono/lamarck/data/videos \
  --cdp http://172.30.144.1:19222
```
文件会保存为 `videos/<title>.mp4`，重命名为 `videos/<video_id>.mp4`

#### 4.2 提取音频
```bash
npx tsx extract-audio.ts /home/lamarck/pi-mono/lamarck/data/videos/<video_id>.mp4
```
输出 `videos/<video_id>.mp3`

#### 4.3 转录
```bash
npx tsx transcribe-audio.ts /home/lamarck/pi-mono/lamarck/data/videos/<video_id>.mp3 \
  -l zh -t \
  -o /home/lamarck/pi-mono/lamarck/data/transcripts/<video_id>.txt
```

#### 4.4 生成摘要

读取转录文件，理解内容，生成详细摘要。摘要应包含：

- **主题**：这个视频讲了什么
- **要点**：核心观点或信息（3-5条）
- **价值分析**：
  - 对我们账号的参考价值（选题、形式、风格）
  - 有没有可以借鉴的点
  - 是否值得深入研究
- **标签**：2-3个关键词标签

摘要格式示例：
```
主题：年度 AI 工具盘点，推荐各领域首选工具

要点：
- 文本领域首选 Gemini，平替豆包，开源千问
- 图像生成首选 Midjourney，平替即梦
- 视频生成首选 Veo，平替豆包 Seaweed
- 编程工具首选 Cursor，平替 Windsurf

价值分析：
- 选题参考：年度盘点类内容，适合年底发布
- 形式借鉴：分领域横向对比，给出首选/平替/开源三档
- 可深入：各领域工具可以单独做专题

标签：AI工具、年度盘点、效率提升
```

#### 4.5 入库
```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db \
  "INSERT INTO douyin_videos (video_id, account_id, title, video_url, video_path, transcript_path, summary)
   VALUES ('<video_id>', '<account_id>', '<title>', '<video_url>', 
           'lamarck/data/videos/<video_id>.mp4',
           'lamarck/data/transcripts/<video_id>.txt',
           '<summary>');"
```

### 5. 清理

- 删除中间文件（mp3 音频）
- 关闭自己打开的浏览器标签页

## 注意事项

### 浏览器是共享资源
- 用 new_page 新开标签页
- 用 close_page 关闭自己的标签页
- 不要动别人的标签页

### 抖音反爬
- 账号之间 sleep 10-15 秒
- 遇到验证码 → 暂停 60 秒后继续下一个账号
- 每次任务扫描所有账号（30个），预计耗时 10-15 分钟

### 错误处理
- 下载失败 → 在输出中说明原因，跳过该视频
- 转录失败 → 入库时 transcript_path 留空，summary 用标题
- 验证码 → 在输出中说明，跳过该账号
- 不要因为单个视频失败就中断整个任务

### 输出格式

任务运行结束后，在输出中汇报：

```
## 执行摘要
- 扫描账号：X 个
- 发现新视频：X 个
- 成功处理：X 个
- 失败：X 个

## 新视频

### [账号名] 视频标题
- 链接：...
- 摘要：...

## 问题

- [账号名] 遇到验证码，跳过
- [视频ID] 下载失败：超时
```

## 临时文件

临时文件写到 `/tmp/` 目录下。
