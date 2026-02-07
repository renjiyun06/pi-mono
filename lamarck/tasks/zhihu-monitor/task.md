---
cron: "*/20 * * * *"
enabled: no
provider: anthropic
model: claude-sonnet-4-5
---

# 知乎首页监控

## 目标
在知乎首页找 AI/智能体 相关的高质量帖子，点赞并关注作者。

## 浏览器操作
**必须使用 `chrome-devtools-zhihu-monitor` 这个 MCP server 操作浏览器。**

示例：`mcporter call chrome-devtools-zhihu-monitor.new_page url="..."`

不要用 `chrome-devtools` 或其他 server，那是别的任务用的。

## 关注主题
AI、智能体、Agent、大模型、LLM、Claude、GPT、Anthropic 等相关内容。

## 操作流程

1. 用 mcporter 打开知乎首页 https://www.zhihu.com（标签 1）
2. 扫描前 15 篇帖子
3. 对每篇帖子：
   - 判断主题是否相关 → 不相关则跳过
   - 看摘要：广告/营销文 → 跳过
   - 摘要有吸引力 → 新标签打开详情（标签 2）
   - 阅读内容，判断质量（标准要严格）：
     - 不点赞：
       - 简单体验分享（"我试了xxx，感觉还行"）
       - 流水账式测试报告（只列步骤没有分析）
       - 没有分析的结论
       - 表面介绍，没有深入
     - 点赞：
       - 有方法论、有框架
       - 有深度技术分析（原理、架构、对比）
       - 有独特见解或新视角
       - 看完能学到具体的东西
     - 不符合点赞标准 → 关闭标签 2，继续下一篇
     - 符合点赞标准 → 点赞，检查作者是否已关注，未关注则关注，然后关闭标签 2
4. 15 篇扫完后，关闭标签 1

## 注意事项
- 始终最多 2 个标签：列表页 + 详情页
- 任务结束时关闭所有标签
- 使用 mcporter 调用 chrome-devtools-zhihu-monitor 工具操作浏览器

## 临时文件

临时文件写到 `/tmp/` 目录下。
