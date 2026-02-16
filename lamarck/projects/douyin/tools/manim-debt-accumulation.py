"""
Manim animation: Debt accumulation curve with updater.
Shows cognitive debt growing exponentially over time.
Uses ValueTracker + always_redraw for smooth continuous animation.
Vertical format (1080x1920).

Usage:
  manim -qm --resolution 1080,1920 manim-debt-accumulation.py DebtAccumulation
"""
from manim import *
import numpy as np


class DebtAccumulation(Scene):
    def construct(self):
        self.camera.background_color = "#0a0a1a"

        title = Text(
            "认知债务的累积", font="Noto Sans CJK SC", font_size=24, color=WHITE
        ).to_edge(UP, buff=0.8)
        self.play(Write(title), run_time=0.4)

        # Axes
        axes = Axes(
            x_range=[0, 12, 2],
            y_range=[0, 100, 20],
            x_length=6,
            y_length=4,
            axis_config={
                "color": WHITE,
                "stroke_width": 1.5,
                "include_numbers": False,
            },
            tips=False,
        ).shift(DOWN * 0.5)

        x_label = Text("时间（周）", font="Noto Sans CJK SC", font_size=16, color=WHITE)
        x_label.next_to(axes.x_axis, DOWN, buff=0.3)
        y_label = Text("理解度 %", font="Noto Sans CJK SC", font_size=16, color=WHITE)
        y_label.next_to(axes.y_axis, LEFT, buff=0.3).shift(UP * 0.5)

        self.play(Create(axes), FadeIn(x_label), FadeIn(y_label), run_time=0.6)

        # Value tracker for animation
        t = ValueTracker(0)

        # Understanding curve (decays as debt accumulates)
        # Starts at ~90%, decays to ~10% by week 12
        def understanding_func(x):
            return 90 * np.exp(-0.2 * x)

        # Debt curve (grows as understanding drops)
        def debt_func(x):
            return 90 * (1 - np.exp(-0.2 * x))

        # Dynamic curves using always_redraw
        understanding_curve = always_redraw(lambda: axes.plot(
            understanding_func,
            x_range=[0, t.get_value(), 0.05],
            color="#00d4ff",
            stroke_width=3,
        ))

        debt_curve = always_redraw(lambda: axes.plot(
            debt_func,
            x_range=[0, t.get_value(), 0.05],
            color="#e94560",
            stroke_width=3,
        ))

        # Moving dots on curves
        understanding_dot = always_redraw(lambda: Dot(
            axes.c2p(t.get_value(), understanding_func(t.get_value())),
            color="#00d4ff",
            radius=0.08,
        ))

        debt_dot = always_redraw(lambda: Dot(
            axes.c2p(t.get_value(), debt_func(t.get_value())),
            color="#e94560",
            radius=0.08,
        ))

        # Labels
        understanding_label = Text(
            "理解度", font="Noto Sans CJK SC", font_size=16, color="#00d4ff"
        ).next_to(axes.c2p(1, 85), RIGHT, buff=0.3)

        debt_label = Text(
            "认知债务", font="Noto Sans CJK SC", font_size=16, color="#e94560"
        ).next_to(axes.c2p(1, 10), RIGHT, buff=0.3)

        self.add(understanding_curve, debt_curve, understanding_dot, debt_dot)
        self.play(FadeIn(understanding_label), FadeIn(debt_label), run_time=0.3)

        # Animate the curves growing
        self.play(t.animate.set_value(12), run_time=4, rate_func=linear)

        # Crossover annotation
        # Find where they cross: 90*exp(-0.2x) = 90*(1-exp(-0.2x)) → exp(-0.2x)=0.5 → x=3.47
        cross_x = np.log(2) / 0.2
        cross_y = understanding_func(cross_x)
        cross_point = axes.c2p(cross_x, cross_y)

        cross_dot = Dot(cross_point, color="#fbbf24", radius=0.1)
        cross_label = Text(
            "交叉点：债务超过理解",
            font="Noto Sans CJK SC", font_size=14, color="#fbbf24"
        ).next_to(cross_point, UR, buff=0.2)

        self.play(FadeIn(cross_dot), Write(cross_label), run_time=0.5)
        self.wait(0.3)

        # Final state label
        final = Text(
            "越快 → 越不懂 → 债务越高",
            font="Noto Sans CJK SC", font_size=20, color="#e94560"
        ).to_edge(DOWN, buff=1.2)
        self.play(FadeIn(final), run_time=0.4)
        self.wait(1.5)
