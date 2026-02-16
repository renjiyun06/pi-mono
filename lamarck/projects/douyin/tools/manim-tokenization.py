"""
Manim animation: Tokenization — "今天天气怎么样" splitting into tokens.
Shows text fragmenting into colored pieces with IDs.
Vertical format (1080x1920).

Usage:
  manim -ql --resolution 1080,1920 manim-tokenization.py Tokenization
"""
from manim import *


class Tokenization(Scene):
    def construct(self):
        self.camera.background_color = "#0a0a1a"

        # Original text at top
        original = Text(
            "今天天气怎么样",
            font="Noto Sans CJK SC",
            font_size=48,
            color=WHITE,
        ).shift(UP * 3)

        self.play(Write(original), run_time=0.8)
        self.wait(0.5)

        # Split into tokens with colored boxes
        tokens = [
            ("今天", "#00d4ff", "32048"),
            ("天气", "#f7b733", "99816"),
            ("怎", "#e94560", "104"),
            ("么", "#a855f7", "100371"),
            ("样", "#22c55e", "3837"),
        ]

        token_group = VGroup()
        # Arrange tokens horizontally, then wrap to second line if needed
        x_offset = -3.5
        y_pos = UP * 0.5
        for i, (text, color, tid) in enumerate(tokens):
            box = VGroup()
            # Token text
            t = Text(text, font="Noto Sans CJK SC", font_size=40, color=WHITE)
            # Box around it
            rect = SurroundingRectangle(
                t, color=color, buff=0.2,
                corner_radius=0.1, stroke_width=2,
                fill_opacity=0.15, fill_color=color,
            )
            # ID below
            id_text = Text(
                tid, font_size=18, color=GREY_B,
            ).next_to(rect, DOWN, buff=0.15)

            box.add(rect, t, id_text)
            box.move_to(x_offset * RIGHT + y_pos)
            x_offset += 2.0
            if x_offset > 3.5:
                x_offset = -2.5
                y_pos = DOWN * 1.5

            token_group.add(box)

        # Animate: original text fades and splits
        self.play(
            FadeOut(original),
            run_time=0.3,
        )

        # Each token appears one by one with a split effect
        for i, box in enumerate(token_group):
            self.play(FadeIn(box, shift=DOWN * 0.3), run_time=0.25)

        self.wait(0.5)

        # Arrow pointing down
        arrow = Arrow(
            UP * 0.3 + DOWN * 1, DOWN * 2.5,
            color=GREY, stroke_width=2,
        ).shift(DOWN * 0.5)
        self.play(Create(arrow), run_time=0.3)

        # Vector representation
        vec_text = Text(
            "[32048, 99816, 104, 100371, 3837]",
            font_size=24,
            color=WHITE,
        ).shift(DOWN * 3.5)

        vec_label = Text(
            "→ 高维向量空间",
            font="Noto Sans CJK SC",
            font_size=20,
            color=GREY,
        ).next_to(vec_text, DOWN, buff=0.3)

        self.play(Write(vec_text), run_time=0.5)
        self.play(FadeIn(vec_label), run_time=0.3)
        self.wait(2)
