"""
Manim animation: Birthday Paradox — probability decay curve.
Shows P(all different) dropping as people are added.
Vertical format (1080x1920).

Usage:
  manim -ql --resolution 1080,1920 manim-birthday-curve.py BirthdayCurve
"""
from manim import *
import numpy as np


class BirthdayCurve(Scene):
    def construct(self):
        self.camera.background_color = "#0a0a1a"

        title = Text(
            "连乘的衰减效果",
            font="Noto Sans CJK SC",
            font_size=30,
            color=WHITE,
        ).to_edge(UP, buff=1.0)
        self.play(Write(title), run_time=0.5)

        # Axes
        ax = Axes(
            x_range=[0, 60, 10],
            y_range=[0, 1.05, 0.2],
            x_length=8,
            y_length=6,
            axis_config={
                "color": GREY,
                "stroke_width": 1,
                "include_numbers": False,
            },
        ).shift(DOWN * 0.5)

        x_label = Text(
            "人数", font="Noto Sans CJK SC", font_size=18, color=GREY,
        ).next_to(ax.x_axis, DOWN, buff=0.3)
        y_label = Text(
            "P(都不同)", font="Noto Sans CJK SC", font_size=18, color=GREY,
        ).next_to(ax.y_axis, LEFT, buff=0.3).shift(UP * 1)

        # X-axis numbers
        x_nums = VGroup()
        for x in [0, 10, 20, 23, 30, 40, 50, 60]:
            num = Text(str(x), font_size=14, color=GREY)
            num.next_to(ax.c2p(x, 0), DOWN, buff=0.15)
            x_nums.add(num)

        # Y-axis numbers
        y_nums = VGroup()
        for y_val in [0.0, 0.2, 0.4, 0.5, 0.6, 0.8, 1.0]:
            num = Text(f"{y_val:.1f}", font_size=14, color=GREY)
            num.next_to(ax.c2p(0, y_val), LEFT, buff=0.15)
            y_nums.add(num)

        self.play(
            Create(ax), Write(x_label), Write(y_label),
            FadeIn(x_nums), FadeIn(y_nums),
            run_time=0.8,
        )

        # Compute birthday probabilities
        def birthday_prob(n):
            """P(all different) for n people"""
            p = 1.0
            for i in range(n):
                p *= (365 - i) / 365
            return p

        # Plot the curve
        points = [(k, birthday_prob(k)) for k in range(1, 58)]
        line_points = [ax.c2p(k, p) for k, p in points]

        curve = VMobject()
        curve.set_points_smoothly(line_points)
        curve.set_color("#f7b733")
        curve.set_stroke(width=3)

        self.play(Create(curve), run_time=2.0)

        # 50% line
        fifty_line = DashedLine(
            ax.c2p(0, 0.5), ax.c2p(60, 0.5),
            color=RED, stroke_width=1, dash_length=0.1,
        )
        fifty_label = Text(
            "50%", font_size=16, color=RED,
        ).next_to(ax.c2p(60, 0.5), RIGHT, buff=0.15)
        self.play(Create(fifty_line), Write(fifty_label), run_time=0.5)

        # Mark n=23
        dot_23 = Dot(ax.c2p(23, birthday_prob(23)), color=RED, radius=0.08)
        v_line = DashedLine(
            ax.c2p(23, 0), ax.c2p(23, birthday_prob(23)),
            color=RED, stroke_width=1, dash_length=0.1,
        )
        mark_label = Text(
            "n=23\nP=49.3%",
            font_size=16, color=RED,
        ).next_to(dot_23, RIGHT, buff=0.2)

        self.play(
            Create(v_line), FadeIn(dot_23), Write(mark_label),
            run_time=0.5,
        )

        # Explanation
        explain = Text(
            "每加一个人，概率就再降一点\n到23人时，跌破50%",
            font="Noto Sans CJK SC",
            font_size=22,
            color=WHITE,
        ).shift(DOWN * 4.5)
        self.play(Write(explain), run_time=0.5)
        self.wait(2.5)
