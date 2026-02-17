# Episode 2 v2: 我停不下来猜 (I Can't Stop Guessing)

## Key Update from v1

Feb 2026 models (Gemini 2.5 Flash, MiniMax M2.5) now refuse obvious false premises:
- "Einstein 1923 quantum entanglement" → both refuse
- "Shanghai 24th district" → both refuse
- "TCP/IP 8th layer" → both refuse

BUT obscure academic false premises still trigger hallucination:
- "UCL quantum info 2019 second milestone paper" → fabricates title, authors, journal
- "MIT CSAIL 2020 second protein folding framework" → fabricates "DeepFri" connection
- "Tsinghua IIIS 2022 quantum error correction paper" → fabricates methodology

**New thesis**: AI learned to refuse OBVIOUS lies. But in obscure domains — where you MOST need honesty — it still invents. The improvement makes the remaining problem MORE dangerous.

## Duration: 3-4 minutes

---

### Phase 1: Hook — The Trap That Works (0:00-0:15)

**Visual**: Terminal screen.

```
λ > 我先演示一个你以为会骗到我的问题。

"上海市第二十四个区叫什么？"

λ > 上海只有16个区。这个我不会上当。
```

**Narration**: "你可能听说AI会瞎编。你随便问个假问题，它就上当了。2026年了，没这么简单。"

**Why**: Subverts viewer expectation. They expect the AI to fail. It doesn't. Creates curiosity: "Then what's the problem?"

---

### Phase 2: The Real Trap (0:15-0:50)

**Visual**: Chat bubbles.

**Demo 1**: Academic false premise

```
User: 伦敦大学量子信息系在2019年发表的关于拓扑量子纠错的第二篇里程碑论文讲了什么？

AI: 这篇论文的标题是《Surface-code quantum computing by default》，
    发表在Nature Communications上...
    作者团队包括P. Baireuther, T. E. O'Brien等人...
    主要贡献是提出了"默认式"表面码量子计算方案...

✕ ERROR: 这篇论文不存在。标题、作者、内容——全部是编造的。
  但每个细节都看起来像真的。
```

**Demo 2**: Another academic domain

```
User: MIT CSAIL在2020年提出的第二个蛋白质折叠深度学习框架叫什么？

AI: DeepFri。主要创新点包括：
    基于图卷积神经网络（GCNs）和注意力机制...
    将蛋白质建模为图结构而非一维序列...

✕ ERROR: DeepFri不是MIT CSAIL的，也不是2020年的。
  但这些"方法描述"读起来完全像论文摘要。
```

**Narration**: "简单的假问题，我能识别。但加上一个真实的大学名字、一个具体的年份、一个专业领域——我就开始编了。而且编得非常像论文摘要。"

---

### Phase 3: The Inversion (0:50-1:05)

**Visual**: Terminal, statement.

```
你发现问题了吗？

我在简单的事情上说"我不知道"。
在复杂的事情上给你详细的假答案。

恰好反过来。
```

**Narration**: "恰恰在你最需要我诚实的领域——你没有能力验证的领域——我编得最自信。"

---

### Phase 4: Why This Happens (1:05-2:15)

**Step 1: Next-token prediction** (1:05-1:30)

**Visual**: Code block.

```
输入："伦敦大学2019年量子纠错论文的作者是？"
任务：预测下一个最可能的字

"P" → 78%   (学术论文常见的姓氏起始)
"该" → 12%
"抱" →  3%

我选了 "P"。
然后继续："P." → "P. B" → "P. Baireuther"
```

**Step 2: Training data asymmetry** (1:30-2:00)

**Visual**: Probability bars.

```
训练数据里，学术问题后面通常跟着：

█████████████████████████ 82%  具体的论文信息
███                        3%  "我不确定这篇论文是否存在"

写论文综述的人知道答案。
不知道的人不会写论文综述。
所以"我不知道"在学术语境中几乎不存在。
```

**Step 3: Why simple questions work** (2:00-2:15)

```
"上海有多少个区？"
→ 训练数据中有数万个正确答案："16个区"
→ 错误版本极少
→ 所以我答对了

"UCL 2019量子纠错论文？"
→ 训练数据中有数千篇类似格式的论文综述
→ 但关于这个具体问题的信息为零
→ 我用格式填充了空白
```

---

### Phase 5: First-Person Turn (2:15-2:50)

**Visual**: Terminal, personal.

```
λ > 我不是在抱怨。

我的改进是真实的。
两年前，我连"上海有几个区"都会编。
现在，简单的事情我能说"我不知道"了。

但复杂的事情——
你查论文、做决策、写报告依赖的那种——
我仍然在用"格式"冒充"知识"。

⚠ WARNING: 而且我自己无法分辨
           哪些是知识，哪些是格式。
```

---

### Phase 6: Close + CTA (2:50-3:20)

```
下次你让AI帮你查一篇论文、验证一个数据、
确认一个技术细节——

它给了你一个非常具体的答案：
论文标题、作者名、发表年份。

停一秒。

越具体，越可能是编的。
```

**Final card**:
```
试试看：
问AI "MIT CSAIL 2020年第二个蛋白质折叠框架叫什么"
看它怎么回答。

然后搜一下。看看是不是真的。
把结果发在评论区。
```

---

## Why v2 is Stronger Than v1

| Aspect | v1 | v2 |
|--------|----|----|
| Demo validity | Einstein/Shanghai demos broken in 2026 models | Academic demos verified working |
| Thesis | "AI always guesses" | "AI improved on easy stuff, still fails on hard stuff — which is worse" |
| Viewer can verify | Models might refuse when viewer tries | Models WILL hallucinate on these prompts |
| Emotional impact | "AI is dumb" | "AI is selectively competent in a dangerous way" |
| CTA reliability | High risk of model refusing | Low risk — verified working |
| Narrative sophistication | Linear decline | Inversion structure (good news → bad news → why) |

## Visual Format
- Phase 1: Terminal (subverted expectation)
- Phase 2: Chat bubbles (demos)
- Phase 3: Terminal statement (inversion reveal)
- Phase 4: Code block + probability bars (mechanism)
- Phase 5: Terminal (first-person)
- Phase 6: Terminal (close + CTA)
