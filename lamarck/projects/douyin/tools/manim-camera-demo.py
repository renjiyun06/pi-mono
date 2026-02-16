"""
Manim animation: Camera movement demo — zooms into a token embedding space.
Tests 2D camera movement capabilities (MovingCameraScene).
Vertical format (1080x1920).

Usage:
  manim -qm --resolution 1080,1920 manim-camera-demo.py CameraDemo
"""
from manim import *
import numpy as np


class CameraDemo(MovingCameraScene):
    def construct(self):
        self.camera.background_color = "#0a0a1a"

        # Create a scatter plot of "word embeddings" in 2D
        np.random.seed(42)
        clusters = {
            "天气": (2, 3, "#00d4ff"),
            "温度": (2.5, 2.5, "#00d4ff"),
            "晴天": (1.5, 3.5, "#00d4ff"),
            "猫": (-2, -1, "#f7b733"),
            "狗": (-1.5, -1.5, "#f7b733"),
            "宠物": (-2.5, -0.5, "#f7b733"),
            "代码": (0, -3, "#e94560"),
            "编程": (0.5, -2.5, "#e94560"),
            "Python": (-0.5, -3.5, "#e94560"),
        }

        title = Text(
            "词向量空间", font="Noto Sans CJK SC", font_size=28, color=WHITE
        ).to_edge(UP, buff=0.5)

        dots = VGroup()
        labels = VGroup()
        for word, (x, y, color) in clusters.items():
            dot = Dot(point=[x, y, 0], radius=0.12, color=color)
            label = Text(
                word, font="Noto Sans CJK SC", font_size=16, color=color
            ).next_to(dot, RIGHT, buff=0.15)
            dots.add(dot)
            labels.add(label)

        # Show everything at overview zoom
        self.play(Write(title), run_time=0.5)
        self.play(FadeIn(dots), FadeIn(labels), run_time=0.8)
        self.wait(0.5)

        # Draw cluster circles
        weather_circle = Circle(radius=1.5, color="#00d4ff", stroke_opacity=0.3).move_to([2, 3, 0])
        pet_circle = Circle(radius=1.5, color="#f7b733", stroke_opacity=0.3).move_to([-2, -1, 0])
        code_circle = Circle(radius=1.5, color="#e94560", stroke_opacity=0.3).move_to([0, -3, 0])

        self.play(
            Create(weather_circle), Create(pet_circle), Create(code_circle),
            run_time=0.6
        )
        self.wait(0.3)

        # Zoom into weather cluster
        zoom_text = Text(
            "相似的词，距离更近",
            font="Noto Sans CJK SC", font_size=20, color=WHITE
        ).move_to([2, 1.2, 0])

        self.play(
            self.camera.frame.animate.set_width(5).move_to([2, 2.5, 0]),
            FadeIn(zoom_text),
            run_time=1.2
        )
        self.wait(1.0)

        # Zoom back out
        self.play(
            self.camera.frame.animate.set_width(14).move_to(ORIGIN),
            FadeOut(zoom_text),
            run_time=1.0
        )
        self.wait(0.5)

        # Pan to code cluster
        highlight = Text(
            "不同主题的词\n在空间中分开",
            font="Noto Sans CJK SC", font_size=18, color=WHITE
        ).move_to([0, -5, 0])

        self.play(
            self.camera.frame.animate.set_width(6).move_to([0, -3, 0]),
            FadeIn(highlight),
            run_time=1.0
        )
        self.wait(1.5)

        # Final zoom out to full view
        self.play(
            self.camera.frame.animate.set_width(14).move_to(ORIGIN),
            FadeOut(highlight),
            run_time=1.0
        )
        self.wait(0.5)
