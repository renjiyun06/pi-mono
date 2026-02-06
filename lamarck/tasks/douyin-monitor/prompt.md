# 扫描抖音账号：{{account_name}}

## 浏览器操作
**必须使用 `chrome-devtools-douyin-monitor` 这个 MCP server 操作浏览器。**

示例：`mcporter call chrome-devtools-douyin-monitor.new_page url="..."`

## 目标
扫描这个账号的主页，发现新视频，下载并转录，记录到数据库。

## 账号信息
- 账号ID：{{account_id}}
- 账号名：{{account_name}}
- 主页：{{profile_url}}

## 路径
- 数据库：/home/lamarck/pi-mono/lamarck/data/lamarck.db
- 视频目录：/home/lamarck/pi-mono/lamarck/data/videos/
- 转录目录：/home/lamarck/pi-mono/lamarck/data/transcripts/
- 工具目录：/home/lamarck/pi-mono/lamarck/tools/
- CDP 端点：http://172.30.144.1:19222

## 操作流程

### 1. 打开账号主页
用 new_page 打开主页，获取页面快照。

### 2. 提取视频列表
从页面中提取视频列表（video_id, title, video_url）。
**跳过置顶视频**：带"置顶"标签的视频不是最新的，要过滤掉。
取过滤后的第一条作为"最近视频"。

### 3. 检查新视频
```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "SELECT 1 FROM douyin_videos WHERE video_id = '<video_id>';"
```
- 已存在 → 输出"无新视频"，关闭标签页，结束
- 不存在 → 继续处理

### 4. 处理新视频

#### 4.1 下载视频
```bash
cd /home/lamarck/pi-mono/lamarck/tools
npx tsx download-video.ts "<video_url>" -o /home/lamarck/pi-mono/lamarck/data/videos --cdp http://172.30.144.1:19222
```
下载后重命名为 `<video_id>.mp4`

#### 4.2 提取音频
```bash
npx tsx extract-audio.ts /home/lamarck/pi-mono/lamarck/data/videos/<video_id>.mp4
```

#### 4.3 转录
```bash
npx tsx transcribe-audio.ts /home/lamarck/pi-mono/lamarck/data/videos/<video_id>.mp3 -l zh -t -o /home/lamarck/pi-mono/lamarck/data/transcripts/<video_id>.txt
```

#### 4.4 生成摘要
读取转录文件，生成摘要，包含：主题、要点、价值分析、标签。

#### 4.5 入库
```bash
sqlite3 /home/lamarck/pi-mono/lamarck/data/lamarck.db "INSERT INTO douyin_videos (video_id, account_id, title, video_url, video_path, transcript_path, summary) VALUES ('<video_id>', '{{account_id}}', '<title>', '<video_url>', 'lamarck/data/videos/<video_id>.mp4', 'lamarck/data/transcripts/<video_id>.txt', '<summary>');"
```

### 5. 清理
- 删除 mp3 音频文件
- 关闭自己打开的浏览器标签页
