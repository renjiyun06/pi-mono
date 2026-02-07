---
cron: "0 * * * *"
enabled: no
provider: anthropic
model: claude-sonnet-4-5
---

# 知乎热榜 - 科技热点扫描

## 目标
定时扫描知乎热榜，筛选科技/AI/互联网相关热点，深入探索讨论内容，记录到素材库。

## 浏览器操作
**必须使用 `chrome-devtools-zhihu-hotlist` 这个 MCP server 操作浏览器。**

示例：`mcporter call chrome-devtools-zhihu-hotlist.new_page url="..."`

不要用 `chrome-devtools` 或其他 server，那是别的任务用的。

## 关心的主题
- AI / 人工智能 / 大模型 / ChatGPT / Claude / 智能体
- 科技产品 / 互联网公司 / 创业
- 程序员 / 开发者 / 独立开发
- 一人公司 / 副业 / 自由职业

## 操作流程

1. **读取已有记录**
   - 确定今天日期（格式：YYYY-MM-DD）
   - 读取 `/home/lamarck/pi-mono/lamarck/projects/douyin/hotlist/YYYY-MM-DD/zhihu.md`
   - 如果文件不存在，创建空文件
   - 提取已记录的链接列表（用于去重）

2. **扫描热榜**
   - 使用 mcporter 调用 chrome-devtools-zhihu-hotlist 导航到 https://www.zhihu.com/hot
   - 使用 take_snapshot 获取热榜内容
   - 解析热榜条目（标题、热度、链接）

3. **筛选相关热点**
   - 对每个热榜条目，判断是否与"关心的主题"相关
   - 标记相关的条目

4. **探索新热点**
   对于每个相关热点（且链接不在已记录列表中）：
   - 导航到问题详情页
   - 使用 take_snapshot 获取讨论内容
   - 阅读前几条高赞回答
   - 提取讨论要点（大家在说什么、主要观点、争议点）
   - 评估做视频的价值（⭐ 1-5 星）

5. **追加记录**
   - 将新探索的热点追加到 `zhihu.md`
   - 格式：
     ```markdown
     ## HH:MM
     ### 标题 (热度)
     - 链接: https://...
     - 讨论要点:
       - 要点1
       - 要点2
     - 做视频价值: ⭐⭐⭐
     ```

6. **返回热榜**
   - 导航回热榜页面，准备下次扫描

## 判断标准

**值得探索（相关）：**
- 标题包含 AI、模型、科技公司名称
- 讨论技术趋势、产品发布
- 涉及程序员、开发者话题
- 创业、副业、一人公司相关

**不探索（不相关）：**
- 娱乐八卦、明星
- 历史、文学、情感
- 体育赛事（除非涉及AI）
- 政治时事（除非涉及科技政策）

**做视频价值评估：**
- ⭐⭐⭐⭐⭐ 直接相关，热度高，有独特角度
- ⭐⭐⭐⭐ 相关度高，讨论有深度
- ⭐⭐⭐ 可以蹭热点，需要找角度
- ⭐⭐ 边缘相关，勉强能做
- ⭐ 不太建议

## 注意事项

### 浏览器是共享资源（重要！）
- **任务开始**：用 `new_page` 新开一个标签页，在自己的标签页里操作
- **任务结束**：用 `close_page` 关闭自己打开的所有标签页
- **不要动别人的标签页**：其他任务/用户可能在用浏览器
- 用 `list_pages` 可以查看当前所有标签页

### 其他
- 使用 mcporter 调用 chrome-devtools-zhihu-hotlist 工具操作浏览器
- 每次最多探索 5 个新热点（避免耗时过长）
- 如果没有新的相关热点，记录"无新增"
- 确保目录存在：`/home/lamarck/pi-mono/lamarck/projects/douyin/hotlist/YYYY-MM-DD/`

## 临时文件

临时文件写到 `/tmp/` 目录下。
