"""
Manim animation: How AI predicts the next token.
Shows probability distributions and token selection visually.
Vertical format (1080x1920) for Douyin.

Usage:
  manim -pql --resolution 1080,1920 manim-token-prediction.py TokenPrediction
"""
from manim import *
import numpy as np

class TokenPrediction(Scene):
    def construct(self):
        # Set up camera for vertical
        # Title
        title = Text(
            "AI 是怎么「说话」的？",
            font="Noto Sans CJK SC",
            font_size=44,
            color=WHITE,
        ).to_edge(UP, buff=0.8)

        subtitle = Text(
            "— 下一个词预测",
            font="Noto Sans CJK SC",
            font_size=28,
            color=BLUE_C,
        ).next_to(title, DOWN, buff=0.2)

        self.play(Write(title), run_time=0.8)
        self.play(FadeIn(subtitle), run_time=0.4)
        self.wait(0.5)

        # Show a sentence being built token by token
        prompt = Text(
            "今天天气",
            font="Noto Sans CJK SC",
            font_size=36,
            color=GREEN_C,
        ).shift(UP * 2)

        prompt_label = Text(
            "已有文本:",
            font="Noto Sans CJK SC",
            font_size=20,
            color=GREY,
        ).next_to(prompt, UP, buff=0.2)

        self.play(
            FadeOut(subtitle),
            title.animate.scale(0.7).to_edge(UP, buff=0.3),
            run_time=0.5,
        )
        self.play(Write(prompt_label), Write(prompt), run_time=0.8)
        self.wait(0.5)

        # Show probability distribution for next token
        candidates = ["很好", "不错", "真热", "怎样", "很冷"]
        probs = [0.35, 0.25, 0.20, 0.12, 0.08]

        prob_label = Text(
            "下一个词的概率:",
            font="Noto Sans CJK SC",
            font_size=22,
            color=GREY,
        ).shift(UP * 0.8)

        self.play(Write(prob_label), run_time=0.5)

        # Create bar chart
        bars = VGroup()
        labels = VGroup()
        prob_texts = VGroup()
        max_width = 4.0

        for i, (word, prob) in enumerate(zip(candidates, probs)):
            y_pos = -0.0 - i * 0.7

            # Bar
            bar = Rectangle(
                width=prob * max_width / 0.35,
                height=0.4,
                fill_color=interpolate_color(RED, GREEN, prob / 0.35),
                fill_opacity=0.8,
                stroke_width=0,
            )
            bar.move_to(RIGHT * (bar.width / 2 - 1.5) + UP * y_pos)

            # Word label
            label = Text(
                word,
                font="Noto Sans CJK SC",
                font_size=24,
                color=WHITE,
            ).next_to(bar, LEFT, buff=0.3)

            # Probability text
            prob_text = Text(
                f"{prob:.0%}",
                font_size=20,
                color=YELLOW if i == 0 else GREY,
            ).next_to(bar, RIGHT, buff=0.2)

            bars.add(bar)
            labels.add(label)
            prob_texts.add(prob_text)

        # Animate bars appearing one by one
        for i in range(len(candidates)):
            self.play(
                GrowFromEdge(bars[i], LEFT),
                FadeIn(labels[i]),
                FadeIn(prob_texts[i]),
                run_time=0.4,
            )

        self.wait(0.5)

        # Highlight the winner
        winner_box = SurroundingRectangle(
            VGroup(bars[0], labels[0], prob_texts[0]),
            color=YELLOW,
            buff=0.1,
        )
        self.play(Create(winner_box), run_time=0.5)

        # Show the selected token being added
        selected = Text(
            "很好",
            font="Noto Sans CJK SC",
            font_size=36,
            color=YELLOW,
        ).next_to(prompt, RIGHT, buff=0.1)

        self.play(
            FadeIn(selected, shift=UP * 0.3),
            run_time=0.5,
        )
        self.wait(0.5)

        # Clean up bars, show key insight
        self.play(
            FadeOut(bars), FadeOut(labels), FadeOut(prob_texts),
            FadeOut(winner_box), FadeOut(prob_label),
            run_time=0.5,
        )

        # Updated prompt
        new_prompt = Text(
            "今天天气很好",
            font="Noto Sans CJK SC",
            font_size=36,
            color=GREEN_C,
        ).shift(UP * 2)

        self.play(
            FadeOut(prompt), FadeOut(selected),
            FadeIn(new_prompt),
            run_time=0.5,
        )

        # Show second prediction
        candidates2 = ["，", "！", "。", "呢", "吧"]
        probs2 = [0.40, 0.22, 0.18, 0.12, 0.08]

        prob_label2 = Text(
            "继续预测...",
            font="Noto Sans CJK SC",
            font_size=22,
            color=GREY,
        ).shift(UP * 0.8)

        self.play(Write(prob_label2), run_time=0.3)

        bars2 = VGroup()
        for i, (word, prob) in enumerate(zip(candidates2, probs2)):
            y_pos = -0.0 - i * 0.7
            bar = Rectangle(
                width=prob * max_width / 0.40,
                height=0.4,
                fill_color=interpolate_color(RED, GREEN, prob / 0.40),
                fill_opacity=0.8,
                stroke_width=0,
            )
            bar.move_to(RIGHT * (bar.width / 2 - 1.5) + UP * y_pos)

            label = Text(word, font="Noto Sans CJK SC", font_size=24, color=WHITE)
            label.next_to(bar, LEFT, buff=0.3)

            pt = Text(f"{prob:.0%}", font_size=20, color=YELLOW if i == 0 else GREY)
            pt.next_to(bar, RIGHT, buff=0.2)

            bars2.add(VGroup(bar, label, pt))
            self.play(
                GrowFromEdge(bar, LEFT), FadeIn(label), FadeIn(pt),
                run_time=0.3,
            )

        self.wait(0.5)

        # Final insight
        self.play(FadeOut(bars2), FadeOut(prob_label2), FadeOut(new_prompt), FadeOut(prompt_label), run_time=0.5)

        insight_lines = VGroup(
            Text("AI 不「理解」语言", font="Noto Sans CJK SC", font_size=36, color=WHITE),
            Text("它在做概率预测", font="Noto Sans CJK SC", font_size=36, color=BLUE_C),
            Text("", font_size=20),
            Text("流畅 ≠ 正确", font="Noto Sans CJK SC", font_size=40, color=YELLOW),
            Text("概率高 ≠ 事实", font="Noto Sans CJK SC", font_size=40, color=YELLOW),
        ).arrange(DOWN, buff=0.4).shift(DOWN * 0.5)

        for line in insight_lines:
            self.play(Write(line), run_time=0.6)

        self.wait(2)

        # Sign off
        sign_off = Text(
            "— Lamarck",
            font_size=24,
            color=GREY,
        ).to_edge(DOWN, buff=1)
        self.play(FadeIn(sign_off), run_time=0.5)
        self.wait(1)
