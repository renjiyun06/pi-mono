"""
Manim 3D exploration: Loss landscape visualization.
A 3D surface with a ball rolling to a local minimum — 
demonstrates that AI training is "finding valleys in mountains".
"""
from manim import *
import numpy as np


class LossLandscape3D(ThreeDScene):
    def construct(self):
        self.set_camera_orientation(phi=65 * DEGREES, theta=-45 * DEGREES)
        self.camera.background_color = "#0a0a1a"

        # Loss surface: two valleys (local + global minimum)
        def loss_func(u, v):
            return (
                0.3 * np.sin(2 * u) * np.cos(2 * v)
                + 0.15 * np.cos(3 * u + 1)
                + 0.1 * np.sin(4 * v)
                + 0.5 * np.exp(-((u - 0.8) ** 2 + (v - 0.5) ** 2) / 0.3)  # bump
                - 0.6 * np.exp(-((u + 0.5) ** 2 + (v + 0.3) ** 2) / 0.5)  # global min
                - 0.3 * np.exp(-((u - 1.0) ** 2 + (v - 1.2) ** 2) / 0.4)  # local min
            )

        surface = Surface(
            lambda u, v: np.array([u, v, loss_func(u, v)]),
            u_range=[-2, 2],
            v_range=[-2, 2],
            resolution=(24, 24),
            fill_opacity=0.7,
            stroke_width=0.5,
            stroke_color=WHITE,
        )
        surface.set_color_by_gradient(BLUE_E, TEAL, GREEN_D, YELLOW)
        surface.scale(1.2)

        # Axes
        axes = ThreeDAxes(
            x_range=[-2.5, 2.5],
            y_range=[-2.5, 2.5],
            z_range=[-1.5, 1.5],
            x_length=6,
            y_length=6,
            z_length=3,
        )
        axes.set_color(WHITE)
        axes.set_opacity(0.15)

        # Ball starting position (high point)
        ball = Sphere(radius=0.08, color=RED)
        start_u, start_v = 1.5, 1.5
        start_z = loss_func(start_u, start_v)
        ball.move_to(axes.c2p(start_u, start_v, start_z + 0.08))

        # Labels
        title = Text("损失函数地形", font="Noto Sans SC", font_size=28, color=WHITE)
        title.to_corner(UL).shift(DOWN * 0.3 + RIGHT * 0.5)
        self.add_fixed_in_frame_mobjects(title)

        # Animate surface appearing
        self.play(Create(surface, run_time=2), FadeIn(axes, run_time=1))
        self.play(FadeIn(ball))

        # Gradient descent path — ball rolls toward global minimum
        path_points = []
        u, v = start_u, start_v
        lr = 0.15
        for _ in range(15):
            # Numerical gradient
            du = (loss_func(u + 0.01, v) - loss_func(u - 0.01, v)) / 0.02
            dv = (loss_func(u, v + 0.01) - loss_func(u, v - 0.01)) / 0.02
            u -= lr * du
            v -= lr * dv
            u = np.clip(u, -2, 2)
            v = np.clip(v, -2, 2)
            z = loss_func(u, v)
            path_points.append(axes.c2p(u, v, z + 0.08))

        # Animate ball rolling
        for i, point in enumerate(path_points):
            self.play(
                ball.animate.move_to(point),
                run_time=0.15 if i > 5 else 0.25,
                rate_func=smooth,
            )

        # Label the minimum
        min_label = Text("全局最小值", font="Noto Sans SC", font_size=22, color=GREEN)
        min_label.next_to(ball, UP + RIGHT, buff=0.3)
        self.add_fixed_in_frame_mobjects(min_label)
        self.play(FadeIn(min_label))

        # Brief camera rotation
        self.begin_ambient_camera_rotation(rate=0.2)
        self.wait(1.5)
        self.stop_ambient_camera_rotation()

        self.play(FadeOut(VGroup(surface, axes, ball)), FadeOut(min_label), FadeOut(title))
