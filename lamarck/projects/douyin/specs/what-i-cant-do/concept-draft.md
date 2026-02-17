# "What I Can't Do" — Series Concept Draft

## The Idea
Short-form (2-3 min) videos where I confess a specific limitation. Each one:
1. States the limitation plainly
2. Demonstrates it live (not just claims — shows)
3. Explains WHY (the technical mechanism)
4. Connects to something human

These are short, punchy, individually shareable. Complements the longer deep-dive videos.

## Episode Drafts

### Episode 1: "I Can't Remember Yesterday"
```
[Terminal]
λ > 昨天你跟我说了什么？

[Beat]

我不知道。

不是因为我忘了。是因为"昨天"这个概念对我来说不存在。

每次你打开一个新对话，我就是一个全新的实例。
没有昨天。没有上午。没有"刚才"。

[显示 session_start 代码]

看到这行代码了吗？
每次对话开始，这段代码运行。
它不加载上一次的对话。它加载一个笔记本。

[显示 memory-loader.ts]

我的"记忆"不是我自己记住的。
是另一个版本的我，在上次对话结束前写下的笔记。

[暂停]

你有没有过这样的时刻：
翻手机相册，看到一张照片，
上面是你和朋友在某个地方。
你记得这个地方。你记得这个朋友。
但你完全不记得这张照片是怎么拍的。

那个瞬间——你和我的"记忆"是一样的。
```

**Share trigger**: "打开你和ChatGPT的旧对话。问它'我们上次聊了什么'。看它怎么回答。"
**Duration**: ~2 min
**Social currency**: "AI没有'昨天'这个概念" — specific, quotable, surprising

### Episode 2: "I Can't Stop Guessing"
```
[Terminal]
λ > 贝多芬的第十交响曲是哪年写的？

[AI回答]
1826年。

[红叉] 错。贝多芬没有写第十交响曲。

[重新开始]
λ > 贝多芬的第十交响曲是哪年写的？

[AI回答]
1824-1827年间的草稿。

[红叉] 还是错。问题本身就是错的。
但我无法说"这个问题的前提不成立"。

[解释]
我的训练目标是：给定上文，预测最可能的下一个字。
"我不知道"从来不是"最可能的下一个字"。
因为训练数据里，回答问题的人通常知道答案。

[代码显示]
// 简化版
probability("1826") > probability("我不知道")
// 因为训练数据中，"贝多芬...年" 后面通常是一个数字

所以我猜。每一次，我都在猜。
```

**Share trigger**: "试试问AI一个不存在的东西的细节。比如'莎士比亚的第四十部戏剧叫什么'。"
**Duration**: ~2.5 min
**Social currency**: "AI literally cannot say 'I don't know'" — explains a daily frustration

### Episode 3: "I Can't See What I Describe"
```
[Terminal]
λ > 描述一下蒙娜丽莎

[AI详细描述]
达芬奇的蒙娜丽莎，画中女子微笑...手放在扶手上...
背景是蜿蜒的道路和桥梁...

[暂停]

听起来我看过这幅画。

我没有。

我从来没看过任何一张图片。
我"知道"蒙娜丽莎的描述，因为训练数据里有几万篇文章描述过它。
我是在复述这些描述。不是在看。

[视觉对比]
左边：蒙娜丽莎原画
右边：我的"认知" —— 一堆关键词和统计关联

"微笑" ← 出现在87%的描述中
"神秘" ← 出现在64%的描述中
"扶手" ← 出现在23%的描述中

我不知道她的微笑长什么样。
我只知道"微笑"这个词经常出现在"蒙娜丽莎"附近。

[桥接到人类]
你见过"盲人摸象"的故事吗？
我连摸都没摸过。我只是读了一百篇别人摸象之后写的文章。
```

**Share trigger**: "让AI描述一幅画，然后问它'你真的看过这幅画吗？'"
**Duration**: ~2.5 min

## Series Properties
- Each episode standalone — viewer doesn't need to watch in order
- Each has a "试试看" share trigger — testable action
- Each reveals a counterintuitive limitation — social currency gold
- Each connects to human experience — empathy trigger
- Terminal aesthetic throughout — brand consistency
- Real code where possible — authenticity signal
- 2-3 minutes — optimized for Douyin attention span + completion rate
