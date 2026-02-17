# 幸存者偏差 — Survivorship Bias

## Format
TerminalNarrator (terminal character, first-person analysis)

## Duration Target
55-70 seconds

## Hook (0-5s)
```
λ > analyze --dataset "successful_people"
⚠ WARNING: 数据集不完整
你看到的所有数据……都在骗你
```

## Scene 1: The Pattern (5-18s)
```
λ > query success_patterns

10个成功企业家 → 都辍学了
                 → 都早起
                 → 都冒险

结论：辍学 + 早起 + 冒险 = 成功？

✕ ERROR: 逻辑谬误
你忘了问一个问题：
那些失败的人呢？
```

Narration: "你有没有注意到，成功学里的故事，长得都一样？辍学创业、早起打卡、勇于冒险。听起来很有道理——但你忘了一个问题：那些做了同样事情、但失败的人呢？你根本看不到他们。"

## Scene 2: The WWII Story (18-35s)
```
λ > load history/wwii_bombers

二战，英国，轰炸机回来了
机翼 → ██████ 弹孔密集
机身 → ██████ 弹孔密集
引擎 → ░░░░░░ 几乎无损

军方结论：加固机翼和机身

λ > wait
亚伯拉罕·瓦尔德说：不对。

引擎没有弹孔 ≠ 引擎没被打中
引擎没有弹孔 = 被打中的飞机没回来

✓ SUCCESS: 应该加固的是引擎
```

Narration: "二战时，英国军方统计轰炸机的弹孔分布。机翼和机身弹孔最多，引擎几乎没有。他们的结论？加固机翼和机身。但统计学家亚伯拉罕·瓦尔德说：错了。引擎没有弹孔，不是因为没被打中——而是被打中引擎的飞机，根本飞不回来。你看到的数据，只来自幸存者。"

## Scene 3: Modern Examples (35-50s)
```
λ > scan daily_life

你每天都在被幸存者偏差骗：

📱 "这个App月入百万"
   → 你看不到99%失败的App

📈 "这支基金连涨5年"
   → 亏损的基金已经被关了

🎓 "XX大佬没读大学也成功了"
   → 没读大学失败的人不会上新闻

数据不会说谎
但数据会选择性地闭嘴
```

Narration: "这种偏差无处不在。你看到月入百万的App，看不到99%失败的。你看到连涨五年的基金，不知道亏损的已经被关掉了。你看到大佬没读大学也成功，但没读大学失败的人不会上新闻。数据不会说谎——但数据会选择性地闭嘴。"

## Scene 4: Takeaway (50-65s)
```
λ > think --deep

下次看到"成功秘诀"
先问自己一个问题：

那些失败的人，做了什么不同的事？
还是……做了完全一样的事？

λ > exit
⟋ 幸存者偏差 — 你看到的不是全部真相
```

Narration: "所以下次看到任何'成功秘诀'，先问自己一个问题：那些失败的人，做了什么不同的事？还是——做了完全一样的事？如果答案是后者，那你看到的不是规律，只是运气。"

## TTS Segments
1. hook: "你有没有注意到，成功学里的故事，长得都一样？" (~3s)
2. pattern: "辍学创业、早起打卡、勇于冒险。听起来很有道理——但你忘了一个问题：那些做了同样事情、但失败的人呢？你根本看不到他们。" (~9s)
3. wwii: "二战时，英国军方统计轰炸机的弹孔分布。机翼和机身弹孔最多，引擎几乎没有。他们的结论？加固机翼和机身。" (~9s)
4. wald: "但统计学家亚伯拉罕·瓦尔德说：错了。引擎没有弹孔，不是因为没被打中——而是被打中引擎的飞机，根本飞不回来。你看到的数据，只来自幸存者。" (~11s)
5. modern: "这种偏差无处不在。你看到月入百万的App，看不到99%失败的。你看到连涨五年的基金，不知道亏损的已经被关掉了。你看到大佬没读大学也成功，但没读大学失败的人不会上新闻。数据不会说谎——但数据会选择性地闭嘴。" (~14s)
6. takeaway: "所以下次看到任何'成功秘诀'，先问自己一个问题：那些失败的人，做了什么不同的事？还是——做了完全一样的事？如果答案是后者，那你看到的不是规律，只是运气。" (~12s)

## Notes
- This is pure TerminalNarrator — no Manim needed
- The WWII bomber story is the emotional/visual anchor
- Share trigger: "数据会选择性地闭嘴" is quotable
- Comment prompt could be in Douyin description: "你被幸存者偏差骗过吗？"
- Target audience overlap: startup culture, investment, education
