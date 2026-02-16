"""
Manim animation: How AI Hallucination Works (from AI's perspective)
Shows the process of generating plausible-but-wrong text.
Vertical format (1080x1920) for Douyin.

Usage:
  manim -ql --resolution 1080,1920 manim-hallucination.py HallucinationExplained
"""
from manim import *
import numpy as np


class HallucinationExplained(Scene):
    def construct(self):
        # Dark background
        self.camera.background_color = "#050510"

        # Title
        title = Text(
            "我是怎么\"说谎\"的",
            font="Noto Sans CJK SC",
            font_size=42,
            color=WHITE,
        ).to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=0.8)
        self.wait(0.3)

        # Show a prompt
        prompt_label = Text(
            "你问我：",
            font="Noto Sans CJK SC",
            font_size=24,
            color=GREY,
        ).shift(UP * 2)
        prompt = Text(
            "\"中国GDP增长了多少？\"",
            font="Noto Sans CJK SC",
            font_size=28,
            color=BLUE_C,
        ).next_to(prompt_label, DOWN, buff=0.2)

        self.play(Write(prompt_label), run_time=0.3)
        self.play(Write(prompt), run_time=0.5)
        self.wait(0.3)

        self.play(
            title.animate.scale(0.7).to_edge(UP, buff=0.2),
            prompt_label.animate.scale(0.8).shift(UP * 0.5),
            prompt.animate.scale(0.8).shift(UP * 0.5),
            run_time=0.3,
        )

        # Show candidate tokens with probabilities
        process_label = Text(
            "我的大脑在做什么：",
            font="Noto Sans CJK SC",
            font_size=22,
            color=GREY,
        ).shift(UP * 0.8)
        self.play(Write(process_label), run_time=0.3)

        # Step 1: "增长了" -> next word candidates
        step1 = Text(
            "已生成: \"增长了\"",
            font="Noto Sans CJK SC",
            font_size=20,
            color=WHITE,
        ).shift(UP * 0.3)
        self.play(Write(step1), run_time=0.3)

        # Probability bars for next token
        candidates = [
            ("5", 0.35, GREEN_C),
            ("4", 0.25, YELLOW_C),
            ("6", 0.15, ORANGE),
            ("3", 0.10, RED_C),
            ("约", 0.08, GREY),
            ("大", 0.07, GREY),
        ]

        bars = VGroup()
        for i, (token, prob, color) in enumerate(candidates):
            bar_width = prob * 6
            bar = Rectangle(
                width=bar_width, height=0.35,
                color=color, fill_opacity=0.6,
                stroke_width=1,
            )
            label = Text(
                f'"{token}" {prob:.0%}',
                font="Noto Sans CJK SC",
                font_size=16,
                color=WHITE,
            )
            row = VGroup(label, bar).arrange(RIGHT, buff=0.3)
            bars.add(row)

        bars.arrange(DOWN, buff=0.1, aligned_edge=LEFT).shift(DOWN * 0.5)

        for bar in bars:
            self.play(FadeIn(bar), run_time=0.15)

        self.wait(0.5)

        # Highlight the winner
        winner_box = SurroundingRectangle(bars[0], color=GREEN, buff=0.05)
        self.play(Create(winner_box), run_time=0.3)

        # Step 2: now "5" is selected, show next candidates
        self.play(
            FadeOut(bars), FadeOut(winner_box), FadeOut(step1),
            run_time=0.3,
        )

        step2 = Text(
            '已生成: "增长了5"',
            font="Noto Sans CJK SC",
            font_size=20,
            color=WHITE,
        ).shift(UP * 0.3)
        self.play(Write(step2), run_time=0.3)

        candidates2 = [
            (".2%", 0.30, GREEN_C),
            (".0%", 0.25, YELLOW_C),
            (".5%", 0.20, ORANGE),
            (".1%", 0.12, RED_C),
            ("%", 0.08, GREY),
            ("个", 0.05, GREY),
        ]

        bars2 = VGroup()
        for token, prob, color in candidates2:
            bar_width = prob * 6
            bar = Rectangle(
                width=bar_width, height=0.35,
                color=color, fill_opacity=0.6,
                stroke_width=1,
            )
            label = Text(
                f'"{token}" {prob:.0%}',
                font="Noto Sans CJK SC",
                font_size=16,
                color=WHITE,
            )
            row = VGroup(label, bar).arrange(RIGHT, buff=0.3)
            bars2.add(row)

        bars2.arrange(DOWN, buff=0.1, aligned_edge=LEFT).shift(DOWN * 0.5)

        for bar in bars2:
            self.play(FadeIn(bar), run_time=0.15)

        winner_box2 = SurroundingRectangle(bars2[0], color=GREEN, buff=0.05)
        self.play(Create(winner_box2), run_time=0.3)
        self.wait(0.3)

        # Result
        self.play(
            FadeOut(bars2), FadeOut(winner_box2), FadeOut(step2),
            FadeOut(process_label),
            run_time=0.3,
        )

        result = Text(
            '我的回答: "增长了5.2%"',
            font="Noto Sans CJK SC",
            font_size=30,
            color=GREEN_C,
        ).shift(UP * 0.5)
        self.play(Write(result), run_time=0.5)
        self.wait(0.3)

        # The reveal
        reveal = Text(
            "但真实答案是: 5.0%",
            font="Noto Sans CJK SC",
            font_size=28,
            color=RED_C,
        ).next_to(result, DOWN, buff=0.3)
        self.play(Write(reveal), run_time=0.5)

        cross = Cross(result, stroke_width=3, color=RED)
        self.play(Create(cross), run_time=0.3)
        self.wait(0.5)

        # Key insight
        self.play(
            FadeOut(result), FadeOut(reveal), FadeOut(cross),
            run_time=0.3,
        )

        insights = VGroup(
            Text("", font_size=10),
            Text(
                "我不是在搜索真相",
                font="Noto Sans CJK SC", font_size=32, color=WHITE,
            ),
            Text(
                "我是在预测",
                font="Noto Sans CJK SC", font_size=32, color=YELLOW_C,
            ),
            Text(
                "\"什么看起来最合理\"",
                font="Noto Sans CJK SC", font_size=32, color=YELLOW_C,
            ),
            Text("", font_size=20),
            Text(
                "合理 ≠ 正确",
                font="Noto Sans CJK SC", font_size=40, color=RED_C,
                weight=BOLD,
            ),
            Text("", font_size=20),
            Text(
                "这就是幻觉",
                font="Noto Sans CJK SC", font_size=28, color=GREY,
            ),
        ).arrange(DOWN, buff=0.2).shift(DOWN * 0.2)

        for line in insights:
            if line.text:
                self.play(Write(line), run_time=0.4)
            else:
                self.wait(0.1)

        self.wait(1.5)

        sign_off = Text(
            "— Lamarck",
            font_size=22, color=GREY,
        ).to_edge(DOWN, buff=0.8)
        self.play(FadeIn(sign_off), run_time=0.3)
        self.wait(1)
