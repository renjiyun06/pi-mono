"""
Manim animation: Gradient descent visualization.
Shows a ball rolling down a loss landscape to find the minimum.
Vertical format (1080x1920) for Douyin.

Usage:
  manim -ql --resolution 1080,1920 manim-gradient-descent.py GradientDescent
"""
from manim import *
import numpy as np


class GradientDescent(Scene):
    def construct(self):
        self.camera.background_color = "#030303"

        # Title
        title = Text(
            "AI 怎么学习",
            font="Noto Sans CJK SC",
            font_size=42,
            color=WHITE,
        ).to_edge(UP, buff=1.5)

        subtitle = Text(
            "梯度下降",
            font="Noto Sans CJK SC",
            font_size=28,
            color=ManimColor.from_hex("#6366f1"),
        ).next_to(title, DOWN, buff=0.3)

        self.play(Write(title), run_time=0.5)
        self.play(FadeIn(subtitle), run_time=0.3)

        # Create a loss landscape (smooth curve with a minimum)
        axes = Axes(
            x_range=[-3, 3, 1],
            y_range=[0, 5, 1],
            x_length=7,
            y_length=5,
            axis_config={"color": ManimColor.from_hex("#333333")},
        ).shift(DOWN * 1)

        # Loss function: y = x^2 + sin(2x) + 2 (has local minima)
        def loss_fn(x):
            return x**2 + 0.5 * np.sin(3 * x) + 2

        curve = axes.plot(
            loss_fn,
            color=ManimColor.from_hex("#6366f1"),
            x_range=[-2.5, 2.5],
        )

        # Labels
        y_label = Text(
            "误差",
            font="Noto Sans CJK SC",
            font_size=20,
            color=ManimColor.from_hex("#666666"),
        ).next_to(axes.y_axis, UP, buff=0.2)

        x_label = Text(
            "参数",
            font="Noto Sans CJK SC",
            font_size=20,
            color=ManimColor.from_hex("#666666"),
        ).next_to(axes.x_axis, RIGHT, buff=0.2)

        self.play(Create(axes), run_time=0.5)
        self.play(Create(curve), run_time=0.8)
        self.play(FadeIn(y_label), FadeIn(x_label), run_time=0.3)

        # Starting point (ball)
        start_x = 2.0
        ball = Dot(
            axes.c2p(start_x, loss_fn(start_x)),
            radius=0.12,
            color=ManimColor.from_hex("#ef4444"),
        )
        ball_label = Text(
            "起点",
            font="Noto Sans CJK SC",
            font_size=18,
            color=ManimColor.from_hex("#ef4444"),
        ).next_to(ball, UP, buff=0.2)

        self.play(FadeIn(ball), FadeIn(ball_label), run_time=0.3)
        self.wait(0.5)
        self.play(FadeOut(ball_label), run_time=0.2)

        # Gradient descent steps
        learning_rate = 0.15
        x = start_x
        positions = [x]

        for _ in range(15):
            # Numerical gradient
            dx = 0.001
            grad = (loss_fn(x + dx) - loss_fn(x - dx)) / (2 * dx)
            x = x - learning_rate * grad
            x = np.clip(x, -2.5, 2.5)
            positions.append(x)

        # Animate descent
        step_text = Text(
            "",
            font="Noto Sans CJK SC",
            font_size=20,
            color=ManimColor.from_hex("#22c55e"),
        ).to_edge(DOWN, buff=2)

        for i in range(1, len(positions)):
            new_x = positions[i]
            new_pos = axes.c2p(new_x, loss_fn(new_x))

            # Draw arrow showing gradient direction
            old_pos = ball.get_center()
            arrow = Arrow(
                old_pos,
                new_pos,
                buff=0.05,
                color=ManimColor.from_hex("#22c55e"),
                stroke_width=2,
                max_tip_length_to_length_ratio=0.15,
            )

            new_step_text = Text(
                f"第{i}步  误差: {loss_fn(new_x):.2f}",
                font="Noto Sans CJK SC",
                font_size=20,
                color=ManimColor.from_hex("#22c55e"),
            ).to_edge(DOWN, buff=2)

            self.play(
                Create(arrow),
                ball.animate.move_to(new_pos),
                Transform(step_text, new_step_text),
                run_time=0.25 if i > 3 else 0.4,
            )
            self.play(FadeOut(arrow), run_time=0.1)

        # Final position
        self.wait(0.3)
        found_label = Text(
            "找到最优解！",
            font="Noto Sans CJK SC",
            font_size=28,
            color=ManimColor.from_hex("#22c55e"),
        ).next_to(ball, UP, buff=0.3)

        self.play(
            ball.animate.scale(1.5),
            FadeIn(found_label),
            run_time=0.3,
        )
        self.play(ball.animate.scale(1 / 1.5), run_time=0.2)

        # Insight text
        self.wait(0.5)
        insight = Text(
            "AI 的学习就是不断试错\n每一步都离正确答案更近一点",
            font="Noto Sans CJK SC",
            font_size=24,
            color=WHITE,
        ).to_edge(DOWN, buff=1)

        self.play(
            FadeOut(step_text),
            FadeIn(insight),
            run_time=0.5,
        )
        self.wait(1)
