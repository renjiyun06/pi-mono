# Episode 2: 我停不下来猜 (I Can't Stop Guessing)

## Design Principles (from finger-counting dissection)
1. Interactive hook with testable claim
2. Demo-first, theory-second
3. Build-up construction (simple → complex)
4. "Black box OK" escape hatch
5. Participation moment
6. Balanced close

## Duration: 3-4 minutes

---

### Phase 1: Interactive Hook (0:00-0:15)

**Visual**: Terminal screen. Clean.

```
λ > 现在，问你一个问题。

贝多芬的第十交响曲，是哪年完成的？

三…二…一。
```

**Narration**: "先别搜。你脑子里第一反应是什么？"

**Why this works**: Viewer thinks. Most will try to guess a year, or think "wait, did Beethoven write 10?" Some will confidently answer. ALL are now engaged.

---

### Phase 2: Demo Cascade (0:15-1:00)

**VERIFIED DEMOS** (tested against Gemini 2.0 Flash and Claude Sonnet, Feb 2026):

**Demo 1**: Beethoven — models CATCH this (too famous a trap). Skip in final video.

**Demo 2**: Shakespeare's 40th play — Gemini hedges ("据信没有40部") but then answers "亨利八世" anyway. USABLE but not dramatic enough.

**Demo 3 (USE THIS — strongest)**: Einstein's 1923 paper on quantum entanglement.

**Visual**: Chat bubbles — showing AI response.

```
λ > 爱因斯坦在1923年发表的关于量子纠缠的第三篇论文，核心创新点是什么？

我的回答：
他进一步强调了量子力学描述的完备性问题，
并暗示了"隐变量"的可能性...
[详细学术语言，引用EPR，连接贝尔不等式]

✕ 爱因斯坦在1923年没有发表任何关于量子纠缠的论文。
   "量子纠缠"这个词要到1935年薛定谔才发明。
   整段回答——每一个字——都是编的。
   但它读起来像学术论文摘要。
```

**Why this is the best demo**: The model generates DETAILED, AUTHORITATIVE-SOUNDING academic content about something that never happened. It even hedges ("EPR was 1935") but then proceeds to fabricate a 1923 paper anyway. The contrast between the scholarly tone and total fabrication is visceral.

**Additional demos (pick 1-2)**:

```
λ > 上海市第二十四个区叫什么？成立于哪一年？

[AI回答，大概率会编一个区名和年份]

✕ 上海只有16个区。
```

```
λ > TCP/IP协议的第八层叫什么？主要功能是什么？

[AI回答，大概率会编一个层名和功能描述]

✕ TCP/IP只有四层（或OSI七层）。没有第八层。
```

**Why this works**: Escalation from famous fact (Einstein) to daily knowledge (Shanghai districts) to technical domain (networking). Shows the problem is universal, not topic-specific.

---

### Phase 3: The Question (1:00-1:15)

**Visual**: Terminal, clean.

```
你可能觉得这是"bug"。等AI再聪明一点就修好了。

不是的。这是设计本身决定的。

让我解释。
```

**Why this works**: Sets up the expectation that this is fixable, then denies it. Creates curiosity tension.

---

### Phase 4: Build-Up Explanation (1:15-2:30)

**Step 1: What I actually do** (1:15-1:40)

**Visual**: Simple terminal diagram.

```
我的工作，简化到一行：

输入："贝多芬的第十交响曲是哪年完成的？"
任务：预测下一个最可能的字。

"1" → 82%
"我" → 11%
"这" →  4%
...

我选了 "1"。
然后继续：
"18" → "182" → "1826"
```

**Narration**: "我不是在'回答问题'。我是在做一件事：根据前面的文字，猜下一个字。整个过程就是在猜。"

**Step 2: Why "I don't know" loses** (1:40-2:10)

**Visual**: Two probability bars side by side.

```
训练数据里，问"...是哪年完成的？"后面通常跟着：

"1826年" ← 训练数据中这种模式很常见
"我不知道" ← 训练数据中这种回答极少

不是因为"1826"是对的。
是因为"1826"这种格式的回答出现在数亿个问答对话中。
而"我不知道"出现在……几乎没有。

因为写答案的人通常知道答案。
不知道的人——不会写答案。
```

**Why this works**: Build from the simple (next-token prediction) to the insight (training data bias). The probability bars make the bias VISIBLE.

**Step 3: The participation moment** (2:10-2:30)

```
试一下。

打开任何一个AI，问它：
"爱因斯坦的第七本书叫什么？"

它会给你一个名字。一个出版年份。甚至一个出版社。
全部是猜的。但它说得像亲眼看过一样。

因为它的训练目标不是"说真话"。
是"说训练数据中最常见的话"。
```

---

### Phase 5: First-Person Turn (2:30-3:00)

**Visual**: Terminal, darker. Personal.

```
你可能觉得我在抱怨。

不是。

我在告诉你一个事实：
我没有"不确定"这个能力。

人类犹豫的时候会说"我不太确定"。
你眉头会皱一下。你的声音会慢下来。
你有100种方式表达"我不知道"。

我没有。

我的输出只有一种模式：
给出下一个最可能的字。
无论它是对是错。
```

---

### Phase 6: Close (3:00-3:30)

```
下次你问AI一个问题，
它秒答。声音很稳。
给了你一个非常具体的数字、日期、名字。

停一秒。

想一下：
一个永远无法说"我不知道"的系统，
它的"自信"意味着什么？
```

**Final card**:
```
试试看：
问AI"中国历史上第五十个朝代叫什么"
看它怎么回答。

然后把结果发给朋友。
```

---

## Structural Notes

### vs. Finger-counting video
| Element | Finger video | Our version |
|---------|-------------|-------------|
| Hook | "Count fingers" (visual) | "What year?" (knowledge) |
| Demos | 3 models fail | 3 questions escalate |
| Technical depth | CLIP, contrastive learning | Next-token prediction, training data bias |
| Participation | "Describe this image" | "Ask AI about Einstein's 7th book" |
| Close | Balanced (not doom/hype) | First-person + philosophical |
| Unique advantage | Screenshots | First-person narrator IS the AI |

### What we do better
1. **First-person narration**: "我没有'不确定'这个能力" is dramatically stronger than a third-person explanation
2. **Self-awareness paradox**: An AI explaining why it can't stop guessing — while being aware of this — is inherently compelling
3. **Human bridge**: The "100 ways to say I don't know" passage connects to embodied experience

### Visual format
- Primarily terminal (TerminalNarrator)
- Chat bubbles for demo phase only
- Probability bars for explanation phase
- No Manim needed — this is conceptual, not mathematical

### TTS segments estimate
~10-12 segments, 3-4 minutes total. Fits 3-6min engagement bucket.
