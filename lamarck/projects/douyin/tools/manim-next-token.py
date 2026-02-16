"""
Manim animation: Next Token Prediction — probability bars for candidate words.
Shows the model choosing the next word from a distribution.
Vertical format (1080x1920).

Usage:
  manim -ql --resolution 1080,1920 manim-next-token.py NextToken
"""
from manim import *


class NextToken(Scene):
    def construct(self):
        self.camera.background_color = "#0a0a1a"

        title = Text(
            "下一个词是什么？",
            font="Noto Sans CJK SC",
            font_size=32,
            color=WHITE,
        ).to_edge(UP, buff=1.0)

        context = Text(
            "今天天气___",
            font="Noto Sans CJK SC",
            font_size=28,
            color=GREY_B,
        ).next_to(title, DOWN, buff=0.5)

        self.play(Write(title), run_time=0.5)
        self.play(Write(context), run_time=0.3)

        # Candidate words with probabilities
        candidates = [
            ("晴朗", 0.42, "#00d4ff"),
            ("不错", 0.23, "#22c55e"),
            ("多云", 0.15, "#f7b733"),
            ("很好", 0.11, "#a855f7"),
            ("我不", 0.05, "#e94560"),
            ("据我", 0.04, "#666666"),
        ]

        bar_width = 5.0
        bar_height = 0.6
        start_y = 1.5

        bars = VGroup()
        for i, (word, prob, color) in enumerate(candidates):
            y = start_y - i * (bar_height + 0.35)

            # Label
            label = Text(
                word, font="Noto Sans CJK SC", font_size=22, color=WHITE,
            ).move_to(LEFT * 3.5 + UP * y)

            # Background bar
            bg = Rectangle(
                width=bar_width, height=bar_height,
                fill_color="#1a1a2e", fill_opacity=0.5,
                stroke_width=0,
            ).move_to(RIGHT * 0.5 + UP * y)

            # Filled bar (will animate)
            filled = Rectangle(
                width=bar_width * prob, height=bar_height,
                fill_color=color, fill_opacity=0.7,
                stroke_width=0,
            )
            filled.align_to(bg, LEFT)
            filled.move_to(
                bg.get_left() + RIGHT * bar_width * prob / 2 + UP * 0
            )
            filled.shift(UP * y - filled.get_center()[1] * UP + UP * y)
            # Simpler positioning
            filled.move_to(bg.get_center())
            filled.stretch_to_fit_width(0.01)
            filled.align_to(bg, LEFT)

            # Percentage
            pct = Text(
                f"{prob:.0%}",
                font_size=18,
                color=WHITE,
            ).next_to(bg, RIGHT, buff=0.2)

            bar_group = VGroup(label, bg, filled, pct)
            bars.add(bar_group)

        # Show all backgrounds first
        for bar_group in bars:
            self.play(
                FadeIn(bar_group[0]),  # label
                FadeIn(bar_group[1]),  # bg
                FadeIn(bar_group[3]),  # pct
                run_time=0.15,
            )

        # Animate bars growing
        for i, (bar_group, (word, prob, color)) in enumerate(
            zip(bars, candidates)
        ):
            bg = bar_group[1]
            filled = bar_group[2]
            target = Rectangle(
                width=bar_width * prob, height=bar_height,
                fill_color=color, fill_opacity=0.7,
                stroke_width=0,
            )
            target.align_to(bg, LEFT)
            target.set_y(bg.get_y())
            self.play(
                Transform(filled, target),
                run_time=0.2,
            )

        self.wait(0.5)

        # Highlight the winner
        winner_box = SurroundingRectangle(
            bars[0], color="#00d4ff", buff=0.15,
            stroke_width=2, corner_radius=0.1,
        )
        chosen = Text(
            "→ 选中",
            font="Noto Sans CJK SC",
            font_size=20,
            color="#00d4ff",
        ).next_to(bars[0], RIGHT, buff=0.8)

        self.play(Create(winner_box), Write(chosen), run_time=0.4)
        self.wait(0.3)

        # Result
        result = Text(
            "今天天气晴朗",
            font="Noto Sans CJK SC",
            font_size=36,
            color="#00d4ff",
        ).shift(DOWN * 4)
        self.play(Write(result), run_time=0.5)
        self.wait(2)
