"""
AI的三个悖论 — Three AI Paradoxes
Phase 0: Triple Hook scenes
Phase 1: Lost in the Middle (U-curve attention)
Phase 2: Confidence/Hallucination (exam incentive)
Phase 3: Model Collapse (distribution narrowing)
Phase 4: Unification (Goodhart's Law)

Vertical Douyin format: 1080x1920
"""

from manim import *
import numpy as np

config.pixel_width = 1080
config.pixel_height = 1920
config.frame_width = 9
config.frame_height = 16

COLORS = {
    "bg": "#0c0c14",
    "accent": "#4ade80",
    "accent2": "#60a5fa",
    "accent3": "#a78bfa",
    "warn": "#fbbf24",
    "danger": "#f87171",
    "text": "#e0e0e0",
    "dim": "#555555",
    "bright": "#ffffff",
}

FONT = "Noto Sans SC"


# ─── Scene 1: The U-Curve (Lost in the Middle) ───────────────────

class Scene1_UCurve(Scene):
    """Visualize the attention U-curve: bright at ends, dim in middle."""

    def construct(self):
        self.camera.background_color = COLORS["bg"]

        # Title
        title = Text("悖论一：遗忘曲线", font=FONT, font_size=42,
                      color=COLORS["accent"]).move_to(UP * 6.5)
        self.play(Write(title))
        self.wait(0.5)

        # Context window: row of blocks representing tokens
        n_blocks = 20
        block_w = 0.35
        block_h = 0.5
        gap = 0.04
        total_w = n_blocks * (block_w + gap)

        blocks = VGroup()
        for i in range(n_blocks):
            rect = Rectangle(
                width=block_w, height=block_h,
                stroke_width=1, stroke_color=COLORS["dim"],
                fill_opacity=0.3, fill_color=COLORS["accent2"],
            )
            x = -total_w / 2 + i * (block_w + gap) + block_w / 2
            rect.move_to(RIGHT * x + UP * 3)
            blocks.add(rect)

        label_ctx = Text("上下文窗口（你的输入）", font=FONT, font_size=22,
                         color=COLORS["dim"]).next_to(blocks, UP, buff=0.3)
        self.play(FadeIn(blocks, lag_ratio=0.03), Write(label_ctx))
        self.wait(0.5)

        # Highlight a "target fact" at three positions: start, middle, end
        # First: show the fact at position 2 (near start)
        fact_label = Text("📌 关键信息", font=FONT, font_size=22,
                          color=COLORS["warn"]).move_to(UP * 1.5)
        self.play(Write(fact_label))

        # Highlight block 2
        self.play(blocks[2].animate.set_fill(COLORS["warn"], opacity=0.9),
                  blocks[2].animate.set_stroke(COLORS["warn"]))
        found_text = Text("✓ 找到了！", font=FONT, font_size=28,
                          color=COLORS["accent"]).next_to(blocks[2], DOWN, buff=1.5)
        self.play(Write(found_text))
        self.wait(1)

        # Reset
        self.play(FadeOut(found_text),
                  blocks[2].animate.set_fill(COLORS["accent2"], opacity=0.3),
                  blocks[2].animate.set_stroke(COLORS["dim"]))

        # Now show fact in middle (position 10)
        self.play(blocks[10].animate.set_fill(COLORS["warn"], opacity=0.9),
                  blocks[10].animate.set_stroke(COLORS["warn"]))
        miss_text = Text("✗ 忽略了...", font=FONT, font_size=28,
                         color=COLORS["danger"]).next_to(blocks[10], DOWN, buff=1.5)
        self.play(Write(miss_text))
        self.wait(1)

        # Reset
        self.play(FadeOut(miss_text),
                  blocks[10].animate.set_fill(COLORS["accent2"], opacity=0.3),
                  blocks[10].animate.set_stroke(COLORS["dim"]))

        # Now show fact at end (position 18)
        self.play(blocks[18].animate.set_fill(COLORS["warn"], opacity=0.9),
                  blocks[18].animate.set_stroke(COLORS["warn"]))
        found_text2 = Text("✓ 找到了！", font=FONT, font_size=28,
                           color=COLORS["accent"]).next_to(blocks[18], DOWN, buff=1.5)
        self.play(Write(found_text2))
        self.wait(1)

        self.play(FadeOut(found_text2), FadeOut(fact_label),
                  blocks[18].animate.set_fill(COLORS["accent2"], opacity=0.3),
                  blocks[18].animate.set_stroke(COLORS["dim"]))

        # Now show the U-curve
        subtitle = Text("AI的注意力分布", font=FONT, font_size=28,
                        color=COLORS["text"]).move_to(UP * 0.5)
        self.play(Write(subtitle))

        # Draw U-curve axes
        axes = Axes(
            x_range=[0, 1, 0.25],
            y_range=[0, 1, 0.25],
            x_length=7,
            y_length=4,
            axis_config={
                "color": COLORS["dim"],
                "stroke_width": 2,
                "include_ticks": False,
            },
        ).move_to(DOWN * 2.5)

        x_label = Text("文本位置", font=FONT, font_size=18,
                        color=COLORS["dim"]).next_to(axes, DOWN, buff=0.3)
        y_label = Text("注意力", font=FONT, font_size=18,
                        color=COLORS["dim"]).next_to(axes, LEFT, buff=0.3).rotate(PI / 2)

        start_label = Text("开头", font=FONT, font_size=16,
                           color=COLORS["accent"]).next_to(axes.c2p(0, 0), DOWN, buff=0.5)
        mid_label = Text("中间", font=FONT, font_size=16,
                         color=COLORS["danger"]).next_to(axes.c2p(0.5, 0), DOWN, buff=0.5)
        end_label = Text("结尾", font=FONT, font_size=16,
                         color=COLORS["accent"]).next_to(axes.c2p(1, 0), DOWN, buff=0.5)

        self.play(Create(axes), Write(x_label), Write(y_label))
        self.play(Write(start_label), Write(mid_label), Write(end_label))

        # U-curve function: high at 0 and 1, low in middle
        def u_curve(x):
            return 0.15 + 0.85 * (4 * (x - 0.5) ** 2)

        curve = axes.plot(u_curve, x_range=[0.01, 0.99], color=COLORS["accent"])
        self.play(Create(curve), run_time=2)

        # Fill area under curve with gradient (red in middle, green at ends)
        # Simplified: just shade the "dead zone"
        dead_zone = axes.get_area(
            curve, x_range=[0.25, 0.75],
            color=COLORS["danger"],
            opacity=0.2,
        )
        dead_label = Text("「死区」", font=FONT, font_size=24,
                          color=COLORS["danger"]).move_to(axes.c2p(0.5, 0.35))
        self.play(FadeIn(dead_zone), Write(dead_label))
        self.wait(1)

        # Question
        question = Text("为什么AI处理所有文字\n偏偏中间最容易忽略？",
                        font=FONT, font_size=28, color=COLORS["warn"],
                        line_spacing=1.3).move_to(DOWN * 6)
        self.play(Write(question))
        self.wait(2)


# ─── Scene 2: The Exam Hall (Hallucination Paradox) ───────────────

class Scene2_ExamHall(Scene):
    """Why AI guesses instead of saying 'I don't know' — exam incentive."""

    def construct(self):
        self.camera.background_color = COLORS["bg"]

        title = Text("悖论二：自信的谎言", font=FONT, font_size=42,
                      color=COLORS["accent3"]).move_to(UP * 6.5)
        self.play(Write(title))
        self.wait(0.5)

        # Show a question
        q_box = Rectangle(width=7.5, height=2, stroke_color=COLORS["dim"],
                          fill_color="#1a1a2e", fill_opacity=0.8).move_to(UP * 4)
        q_text = Text("Adam Kalai的生日是几月几号？", font=FONT, font_size=24,
                      color=COLORS["text"]).move_to(q_box)
        self.play(FadeIn(q_box), Write(q_text))
        self.wait(0.5)

        # Three different AI answers — all wrong, all confident
        answers = [
            ("回答1: 7月3日", COLORS["accent2"]),
            ("回答2: 6月15日", COLORS["accent3"]),
            ("回答3: 1月1日", COLORS["danger"]),
        ]
        answer_groups = VGroup()
        for i, (ans, color) in enumerate(answers):
            box = Rectangle(width=6, height=0.9, stroke_color=color,
                            fill_color=color, fill_opacity=0.15)
            text = Text(ans, font=FONT, font_size=22, color=color)
            text.move_to(box)
            g = VGroup(box, text).move_to(UP * (2 - i * 1.2))
            answer_groups.add(g)

        for g in answer_groups:
            self.play(FadeIn(g), run_time=0.6)
            self.wait(0.3)

        # All wrong indicator
        wrong = Text("全部自信。全部错误。", font=FONT, font_size=30,
                     color=COLORS["danger"]).move_to(DOWN * 0.5)
        self.play(Write(wrong))
        self.wait(1)

        # Transition to exam analogy
        self.play(*[FadeOut(m) for m in [q_box, q_text, answer_groups, wrong]])

        # Exam scenario
        exam_title = Text("考试策略", font=FONT, font_size=32,
                          color=COLORS["warn"]).move_to(UP * 4)
        self.play(Write(exam_title))

        # Two strategies side by side
        # Strategy A: honest
        box_a = Rectangle(width=3.5, height=5, stroke_color=COLORS["accent"],
                          fill_color=COLORS["accent"], fill_opacity=0.05
                          ).move_to(LEFT * 2.3 + DOWN * 0)
        label_a = Text("策略A\n诚实", font=FONT, font_size=22,
                       color=COLORS["accent"]).next_to(box_a, UP, buff=0.2)
        text_a = Text('"我不知道"', font=FONT, font_size=20,
                      color=COLORS["text"]).move_to(box_a.get_center() + UP * 0.8)
        score_a = Text("得分: 0", font=FONT, font_size=28,
                       color=COLORS["danger"]).move_to(box_a.get_center() + DOWN * 0.8)

        # Strategy B: guess
        box_b = Rectangle(width=3.5, height=5, stroke_color=COLORS["accent3"],
                          fill_color=COLORS["accent3"], fill_opacity=0.05
                          ).move_to(RIGHT * 2.3 + DOWN * 0)
        label_b = Text("策略B\n猜测", font=FONT, font_size=22,
                       color=COLORS["accent3"]).next_to(box_b, UP, buff=0.2)
        text_b = Text('"7月3日"', font=FONT, font_size=20,
                      color=COLORS["text"]).move_to(box_b.get_center() + UP * 0.8)
        score_b = Text("得分: ?", font=FONT, font_size=28,
                       color=COLORS["warn"]).move_to(box_b.get_center() + DOWN * 0.8)

        self.play(FadeIn(box_a), Write(label_a), Write(text_a))
        self.play(FadeIn(box_b), Write(label_b), Write(text_b))
        self.wait(0.5)
        self.play(Write(score_a), Write(score_b))
        self.wait(1)

        # Score B changes to show expected value
        new_score_b = Text("得分: 0.3", font=FONT, font_size=28,
                           color=COLORS["accent"]).move_to(score_b)
        self.play(Transform(score_b, new_score_b))

        # Winner highlight
        winner = Text("猜测 > 诚实\nAI被训练成猜测者", font=FONT, font_size=26,
                      color=COLORS["warn"], line_spacing=1.3).move_to(DOWN * 4)
        self.play(Write(winner))
        self.wait(1)

        insight = Text("基准测试惩罚「不知道」\nAI被优化成自信的撒谎者",
                       font=FONT, font_size=24, color=COLORS["danger"],
                       line_spacing=1.3).move_to(DOWN * 6)
        self.play(Write(insight))
        self.wait(2)


# ─── Scene 3: Photocopy Effect (Model Collapse) ──────────────────

class Scene3_Photocopy(Scene):
    """Training on AI output → progressive distribution narrowing."""

    def construct(self):
        self.camera.background_color = COLORS["bg"]

        title = Text("悖论三：自我吞噬", font=FONT, font_size=42,
                      color=COLORS["warn"]).move_to(UP * 6.5)
        self.play(Write(title))
        self.wait(0.5)

        # Show 5 generations of Gaussian distributions narrowing
        axes = Axes(
            x_range=[-4, 4, 1],
            y_range=[0, 1, 0.25],
            x_length=7.5,
            y_length=3.5,
            axis_config={
                "color": COLORS["dim"],
                "stroke_width": 2,
                "include_ticks": False,
            },
        ).move_to(UP * 1.5)

        x_label = Text("语言多样性", font=FONT, font_size=18,
                        color=COLORS["dim"]).next_to(axes, DOWN, buff=0.3)
        y_label = Text("概率", font=FONT, font_size=18,
                        color=COLORS["dim"]).next_to(axes, LEFT, buff=0.3).rotate(PI / 2)

        self.play(Create(axes), Write(x_label), Write(y_label))

        generations = [
            (2.0, COLORS["accent"], "第0代（人类数据）"),
            (1.5, COLORS["accent2"], "第1代"),
            (1.0, COLORS["accent3"], "第2代"),
            (0.6, COLORS["warn"], "第3代"),
            (0.3, COLORS["danger"], "第5代"),
        ]

        curves = []
        labels_gen = []

        for sigma, color, label_text in generations:
            def gaussian(x, s=sigma):
                return np.exp(-x**2 / (2 * s**2)) / (s * np.sqrt(2 * np.pi)) * s * 2.5

            curve = axes.plot(gaussian, x_range=[-3.8, 3.8], color=color)
            label = Text(label_text, font=FONT, font_size=18,
                         color=color)
            curves.append(curve)
            labels_gen.append(label)

        # Show generation 0
        labels_gen[0].next_to(axes, UP, buff=0.3)
        self.play(Create(curves[0]), Write(labels_gen[0]))
        self.wait(1)

        # Progressively narrow
        for i in range(1, len(curves)):
            labels_gen[i].next_to(axes, UP, buff=0.3)
            self.play(
                Transform(curves[0], curves[i]),
                Transform(labels_gen[0], labels_gen[i]),
                run_time=1.5,
            )
            self.wait(0.5)

        self.wait(1)

        # Text samples showing degradation
        sample_title = Text("文本输出的变化", font=FONT, font_size=24,
                            color=COLORS["text"]).move_to(DOWN * 1.5)
        self.play(Write(sample_title))

        samples = [
            ("第0代", "落日余晖洒在湖面\n像碎金在水中跳舞", COLORS["accent"]),
            ("第3代", "太阳照在湖上\n湖面很漂亮", COLORS["warn"]),
            ("第5代", "一个美丽的场景\n一个美丽的场景", COLORS["danger"]),
        ]

        sample_groups = VGroup()
        for i, (gen, text, color) in enumerate(samples):
            gen_label = Text(gen, font=FONT, font_size=18, color=color)
            content = Text(text, font=FONT, font_size=18, color=COLORS["text"],
                           line_spacing=1.2)
            gen_label.move_to(DOWN * (3 + i * 1.8) + LEFT * 3)
            content.next_to(gen_label, RIGHT, buff=0.5)
            sample_groups.add(VGroup(gen_label, content))

        for g in sample_groups:
            self.play(FadeIn(g), run_time=0.8)
            self.wait(0.5)

        # Question
        question = Text("更多数据应该让AI更好\n为什么AI数据反而让AI更差？",
                        font=FONT, font_size=26, color=COLORS["danger"],
                        line_spacing=1.3).move_to(DOWN * 7)
        self.play(Write(question))
        self.wait(2)


# ─── Scene 4: Unification — Goodhart's Law ────────────────────────

class Scene4_Goodhart(Scene):
    """The unifying principle: proxy ≠ reality."""

    def construct(self):
        self.camera.background_color = COLORS["bg"]

        title = Text("一个核心", font=FONT, font_size=48,
                      color=COLORS["bright"]).move_to(UP * 6.5)
        self.play(Write(title))
        self.wait(0.5)

        # Three paradox labels converging
        labels = [
            Text("遗忘曲线", font=FONT, font_size=28, color=COLORS["accent"]),
            Text("自信谎言", font=FONT, font_size=28, color=COLORS["accent3"]),
            Text("自我吞噬", font=FONT, font_size=28, color=COLORS["warn"]),
        ]
        labels[0].move_to(UP * 4 + LEFT * 3)
        labels[1].move_to(UP * 4)
        labels[2].move_to(UP * 4 + RIGHT * 3)

        for label in labels:
            self.play(Write(label), run_time=0.5)

        # Arrows converging to center
        center = UP * 1.5
        arrows = VGroup()
        for label in labels:
            arrow = Arrow(label.get_bottom(), center, color=COLORS["dim"],
                          stroke_width=2, buff=0.3)
            arrows.add(arrow)

        self.play(*[Create(a) for a in arrows])

        # Core principle
        core_box = Rectangle(width=7, height=2, stroke_color=COLORS["warn"],
                             fill_color=COLORS["warn"], fill_opacity=0.1
                             ).move_to(center)
        core_text = Text("AI优化的是代理指标\n而不是你真正想要的",
                         font=FONT, font_size=30, color=COLORS["warn"],
                         line_spacing=1.3).move_to(core_box)
        self.play(FadeIn(core_box), Write(core_text))
        self.wait(1)

        # Three specific mappings
        mappings = [
            ("优化：预测下一个词", "现实：深度理解", COLORS["accent"]),
            ("优化：考试高分", "现实：诚实回答", COLORS["accent3"]),
            ("优化：匹配训练分布", "现实：真正的洞察", COLORS["warn"]),
        ]

        for i, (proxy, reality, color) in enumerate(mappings):
            y = DOWN * (1 + i * 1.5)
            proxy_t = Text(proxy, font=FONT, font_size=20, color=color).move_to(y + LEFT * 2.2)
            ne = Text("≠", font=FONT, font_size=36, color=COLORS["danger"]).move_to(y)
            reality_t = Text(reality, font=FONT, font_size=20,
                             color=COLORS["dim"]).move_to(y + RIGHT * 2.2)
            self.play(Write(proxy_t), Write(ne), Write(reality_t), run_time=0.8)
            self.wait(0.3)

        # Goodhart's Law
        goodhart = Text("古德哈特定律", font=FONT, font_size=36,
                        color=COLORS["bright"]).move_to(DOWN * 5.5)
        goodhart_sub = Text('"当一个指标成为目标\n它就不再是好指标"',
                            font=FONT, font_size=24, color=COLORS["text"],
                            line_spacing=1.3).next_to(goodhart, DOWN, buff=0.3)
        self.play(Write(goodhart), run_time=1)
        self.play(Write(goodhart_sub), run_time=1)
        self.wait(2)
