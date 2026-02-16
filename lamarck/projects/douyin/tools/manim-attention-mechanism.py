"""
Manim animation: How Attention Mechanism works in Transformers.
Shows query-key-value with visual connections.
Vertical format (1080x1920) for Douyin.

Usage:
  manim -pql --resolution 1080,1920 manim-attention-mechanism.py AttentionMechanism
"""
from manim import *
import numpy as np


class AttentionMechanism(Scene):
    def construct(self):
        # Title
        title = Text(
            "注意力机制",
            font="Noto Sans CJK SC",
            font_size=48,
            color=WHITE,
        ).to_edge(UP, buff=0.6)

        subtitle = Text(
            "Transformer 的核心",
            font="Noto Sans CJK SC",
            font_size=28,
            color=BLUE_C,
        ).next_to(title, DOWN, buff=0.2)

        self.play(Write(title), run_time=0.8)
        self.play(FadeIn(subtitle), run_time=0.4)
        self.wait(0.5)

        self.play(
            title.animate.scale(0.6).to_edge(UP, buff=0.2),
            FadeOut(subtitle),
            run_time=0.5,
        )

        # Show input sentence
        words = ["我", "喜欢", "吃", "苹果"]
        word_boxes = VGroup()
        for w in words:
            box = VGroup(
                RoundedRectangle(
                    width=1.5, height=0.6,
                    corner_radius=0.1,
                    color=BLUE_C, fill_opacity=0.2,
                ),
                Text(w, font="Noto Sans CJK SC", font_size=24, color=WHITE),
            )
            word_boxes.add(box)

        word_boxes.arrange(RIGHT, buff=0.3).shift(UP * 2.5)

        input_label = Text(
            "输入序列:",
            font="Noto Sans CJK SC",
            font_size=20,
            color=GREY,
        ).next_to(word_boxes, UP, buff=0.2)

        self.play(Write(input_label), run_time=0.3)
        for wb in word_boxes:
            self.play(FadeIn(wb), run_time=0.2)
        self.wait(0.3)

        # Show Q, K, V concept
        qkv_label = Text(
            "每个词生成三个向量:",
            font="Noto Sans CJK SC",
            font_size=22,
            color=GREY,
        ).shift(UP * 1.5)
        self.play(Write(qkv_label), run_time=0.4)

        q_label = Text("Q (查询)", font="Noto Sans CJK SC", font_size=20, color=RED_C)
        k_label = Text("K (键)", font="Noto Sans CJK SC", font_size=20, color=GREEN_C)
        v_label = Text("V (值)", font="Noto Sans CJK SC", font_size=20, color=YELLOW_C)

        qkv_group = VGroup(q_label, k_label, v_label).arrange(RIGHT, buff=0.8).shift(UP * 1.0)
        self.play(FadeIn(qkv_group), run_time=0.5)
        self.wait(0.5)

        # Show attention scoring for "苹果"
        self.play(FadeOut(qkv_label), FadeOut(qkv_group), run_time=0.3)

        focus_label = Text(
            '当AI处理"苹果"时:',
            font="Noto Sans CJK SC",
            font_size=22,
            color=GREY,
        ).shift(UP * 1.5)
        self.play(Write(focus_label), run_time=0.4)

        # Highlight "苹果"
        highlight_box = SurroundingRectangle(
            word_boxes[3], color=YELLOW, buff=0.05
        )
        self.play(Create(highlight_box), run_time=0.3)

        # Show attention weights
        weights = [0.05, 0.15, 0.70, 0.10]  # "吃" gets highest attention
        weight_labels = ["5%", "15%", "70%", "10%"]

        attention_label = Text(
            "注意力分数:",
            font="Noto Sans CJK SC",
            font_size=20,
            color=GREY,
        ).shift(UP * 0.8)
        self.play(Write(attention_label), run_time=0.3)

        # Draw attention arrows with varying thickness
        arrows = VGroup()
        weight_texts = VGroup()
        for i, (w, wl) in enumerate(zip(weights, weight_labels)):
            start = word_boxes[3].get_bottom()
            end = word_boxes[i].get_bottom() + DOWN * 0.5

            # Curved arrow
            arrow = CurvedArrow(
                word_boxes[3].get_bottom() + DOWN * 0.1,
                word_boxes[i].get_bottom() + DOWN * 0.1,
                angle=-TAU / 4 if i < 3 else TAU / 8,
                color=interpolate_color(GREY, YELLOW, w),
                stroke_width=2 + w * 8,
            )

            wt = Text(
                wl, font_size=16,
                color=YELLOW if w > 0.5 else GREY,
            ).next_to(word_boxes[i], DOWN, buff=0.8)

            arrows.add(arrow)
            weight_texts.add(wt)

        for i in range(len(words)):
            self.play(
                Create(arrows[i]),
                FadeIn(weight_texts[i]),
                run_time=0.3,
            )

        self.wait(0.5)

        # Highlight "吃" as most attended
        eat_highlight = SurroundingRectangle(
            word_boxes[2], color=YELLOW, buff=0.05, stroke_width=3,
        )
        eat_note = Text(
            '"吃"和"苹果"关系最强',
            font="Noto Sans CJK SC",
            font_size=20,
            color=YELLOW,
        ).shift(DOWN * 1.5)

        self.play(Create(eat_highlight), Write(eat_note), run_time=0.5)
        self.wait(0.8)

        # Clean up
        self.play(
            FadeOut(arrows), FadeOut(weight_texts),
            FadeOut(highlight_box), FadeOut(eat_highlight),
            FadeOut(eat_note), FadeOut(focus_label),
            FadeOut(attention_label),
            run_time=0.5,
        )

        # Key insight
        self.play(FadeOut(word_boxes), FadeOut(input_label), run_time=0.3)

        insights = VGroup(
            Text(
                "注意力机制让AI知道：",
                font="Noto Sans CJK SC", font_size=30, color=WHITE,
            ),
            Text(
                "每个词应该\"看\"哪些其他词",
                font="Noto Sans CJK SC", font_size=30, color=BLUE_C,
            ),
            Text("", font_size=20),
            Text(
                "这就是为什么",
                font="Noto Sans CJK SC", font_size=28, color=GREY,
            ),
            Text(
                "Transformer",
                font_size=36, color=YELLOW,
            ),
            Text(
                "能理解上下文",
                font="Noto Sans CJK SC", font_size=28, color=GREY,
            ),
            Text("", font_size=20),
            Text(
                "但「理解」只是数学相关性",
                font="Noto Sans CJK SC", font_size=26, color=RED_C,
            ),
            Text(
                "不是真正的语义理解",
                font="Noto Sans CJK SC", font_size=26, color=RED_C,
            ),
        ).arrange(DOWN, buff=0.3).shift(DOWN * 0.5)

        for line in insights:
            self.play(Write(line), run_time=0.5)

        self.wait(2)

        sign_off = Text(
            "— Lamarck",
            font_size=24,
            color=GREY,
        ).to_edge(DOWN, buff=1)
        self.play(FadeIn(sign_off), run_time=0.5)
        self.wait(1)
