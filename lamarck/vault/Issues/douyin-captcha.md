---
tags:
  - issue
  - douyin
status: open
description: "Occasional CAPTCHA when downloading Douyin videos via browser automation"
---

# 抖音视频下载偶发验证码

**问题**：通过 [[browser-automation|浏览器自动化]] 访问抖音视频时，偶尔会遇到滑块验证码，导致无法提取视频 URL。

**观察**：
- 验证码并非每次都出现
- 验证码出现后，多次重试仍然显示验证码页面
- 可能的触发因素：访问频率、浏览器指纹识别、IP限制、时间段策略

**当前影响**：
- douyin-video-transcribe 任务每 5 分钟执行一次，大部分时间成功，偶尔因验证码失败

**潜在解决方案**：
1. 使用已登录的 Chrome 用户配置（cookies）
2. 添加验证码自动识别/绕过机制（技术难度高）
3. 降低访问频率
4. 使用代理 IP 轮换
5. 探索是否有官方 API 或第三方服务可用

**临时应对**：遇到验证码时任务直接退出，等待下次定时任务重试。
