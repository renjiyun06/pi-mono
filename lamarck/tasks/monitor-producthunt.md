---
cron: "0 */2 * * *"
description: "监控 Product Hunt 每日新产品"
enabled: false
---

你的任务是从 Product Hunt RSS feed 获取新产品并入库。

## 数据库

- 路径：/home/lamarck/pi-mono/lamarck/data/lamarck.db

## 第一步：获取 RSS feed

```bash
curl -s -H "User-Agent: Mozilla/5.0 (compatible; ProductHuntMonitor/1.0)" -H "Accept: application/atom+xml" "https://www.producthunt.com/feed"
```

这会返回 Atom XML 格式的 feed。

## 第二步：解析产品信息

从 XML 中的每个 `<entry>` 提取：

- **id**：从 `<id>tag:www.producthunt.com,2005:Post/123456</id>` 提取数字部分 `123456`
- **name**：`<title>` 标签内容
- **tagline**：`<content>` 中第一个 `<p>` 标签内容（需要解码 HTML 实体）
- **url**：`<link href="..."/>` 的 href 属性
- **author**：`<author><name>` 标签内容
- **publishedAt**：`<published>` 标签内容

## 第三步：去重检查

查询已入库的产品 ID：

```bash
sqlite3 "/home/lamarck/pi-mono/lamarck/data/lamarck.db" "SELECT json_extract(content, '\$.id') FROM inbox WHERE source = 'producthunt'"
```

跳过已存在的 ID。

## 第四步：存入数据库

对每个新产品：

```bash
sqlite3 "/home/lamarck/pi-mono/lamarck/data/lamarck.db" "INSERT INTO inbox (source, content) VALUES ('producthunt', '{\"id\":\"...\",\"name\":\"...\",\"tagline\":\"...\",\"url\":\"...\",\"author\":\"...\",\"publishedAt\":\"...\"}');"
```

注意：JSON 中的引号和特殊字符需要正确转义。

## 输出

- feed 中有多少个产品
- 新入库了多少个产品
- 简述新产品的名称和 tagline（前 3 个）

## 用途

Product Hunt 新产品可用于：
- 新 AI 产品 → 首发测评/介绍视频选题
- 热门产品 → 内容创作参考
