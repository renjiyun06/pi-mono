# 抖音自媒体项目

帮助用户管理抖音自媒体账号。

## 账号信息

- **昵称**: Juno朱诺（Ai创业版）
- **抖音号**: 49314893776
- **主页**: https://www.douyin.com/user/MS4wLjABAAAAdU7bhZFhvcJ_9yBfQ1AokWUHdtT_8qhTSh5FG340ZfpHheBMewvaL0w7FzPKxHhC
- **方向**: AI 时代的一人公司实验
- **阶段**: 起步期，1个作品，14粉丝，221赞

## 目录结构

```
douyin/
├── hotlist/          # 热点素材库
│   └── YYYY-MM-DD/   # 按日期组织
│       └── zhihu.md  # 知乎科技热点（定时任务自动更新）
└── README.md
```

## 工具链

### 账号监控 (monitor-douyin.ts)

自动扫描 30 个种子账号，发现新视频，下载、转录、生成摘要并存入数据库。

- **位置**: `lamarck/tools/monitor-douyin.ts`
- **文档**: `lamarck/tools/monitor-douyin.md`
- **使用**: `cd lamarck/tools && npx tsx monitor-douyin.ts`（建议用 tmux 后台运行）
- **频率**: 建议每天 1-2 次

**工作流程**:
1. 扫描 30 个种子账号的主页
2. 提取最新视频（过滤置顶）
3. 检查是否已存在
4. 下载 → 提取音频 → 转录 → 生成摘要
5. 存入数据库

**输出**:
- 视频文件: `lamarck/data/videos/<video_id>.mp4`
- 转录文件: `lamarck/data/transcripts/<video_id>.txt`
- 数据库记录: `douyin_videos` 表

### 热点素材库 (hotlist)

定时任务 `zhihu-hotlist` 每小时扫描知乎热榜，筛选科技/AI 相关热点，深入探索讨论内容，记录到 `hotlist/` 目录。

**关心的主题**:
- AI / 人工智能 / 大模型
- 科技产品 / 互联网公司 / 创业
- 程序员 / 开发者 / 独立开发
- 一人公司 / 副业 / 自由职业

## 数据存储

### 数据库结构
位置: `lamarck/data/lamarck.db`

**douyin_accounts** - 种子账号列表 (30个)
```sql
CREATE TABLE douyin_accounts (
  account_id TEXT PRIMARY KEY,
  account_name TEXT,
  profile_url TEXT,
  direction TEXT  -- 账号定位方向
);
```

**douyin_videos** - 视频记录
```sql
CREATE TABLE douyin_videos (
  video_id TEXT PRIMARY KEY,
  account_id TEXT,
  title TEXT,
  video_url TEXT,
  video_path TEXT,
  transcript_path TEXT,
  summary TEXT,  -- 详细摘要，含价值分析
  publish_date TEXT
);
```

### 查询示例

```bash
# 查看所有种子账号
sqlite3 lamarck/data/lamarck.db "SELECT account_name, direction FROM douyin_accounts;"

# 查看最近的视频
sqlite3 lamarck/data/lamarck.db "SELECT title, summary FROM douyin_videos ORDER BY video_id DESC LIMIT 10;"

# 搜索特定主题
sqlite3 lamarck/data/lamarck.db "SELECT title, summary FROM douyin_videos WHERE summary LIKE '%AI工具%';"

# 导出为 CSV
sqlite3 -header -csv lamarck/data/lamarck.db "SELECT * FROM douyin_videos;" > videos.csv
```

## 内容运营工作流

### 1. 内容采集
- 运行 `monitor-douyin.ts`（每天 1-2 次）
- 自动采集 30 个种子账号的新视频
- 生成带价值分析的摘要

### 2. 选题规划
- 查询数据库，分析热门主题
- 参考视频摘要中的"选题参考"部分
- 结合热榜热点，确定下一期内容方向

### 3. 脚本创作
TODO: 待补充

### 4. 制作与发布
TODO: 待补充

### 5. 数据分析
TODO: 待补充

## 种子账号

30 个优质账号，涵盖 AI、独立开发、创业、产品等方向：

- 秋芝2046 - AI 创业
- 产品君 - 产品思维
- 科技最前线 - 科技资讯
- ami.moment - 生活方式
- 弗兰克跨境 - 跨境电商
- 快跑啊小卢_ - 互联网创业
- dontbesilent 聊赚钱 - 副业赚钱
- 姜胡说 - 商业分析
- 第四种黑猩猩 - 认知升级
- 孙磊sunlight - 独立开发
- tangjinzhou - 技术分享
- 数字游牧人Samuel - 数字游牧
- ezindie小产品变现 - 小产品创业
- 程序员三千 - 编程教程
- AI随风 - AI 工具
- 李厂长来了 - AI 评测
- 老米AI智能体 - AI 智能体
- 前端盼哥 - 前端开发
- 羡辙 - 技术思考
- 无忌老师 - 职场成长
- 小钢泡 - AI 应用
- 职场学长袁小智 - 职场规划
- 努力的蒋小五 - 个人成长
- 老韩校长 - 教育培训
- 北漂老炮程序员 - 程序员生活
- AI酋长Andy - AI 资讯
- WhynotTV - 科技解说
- 匡宇星 - 独立开发
- 木桐同学 - AI 创作
- U哥帮你看号 - 账号分析

完整列表和主页链接见数据库。
