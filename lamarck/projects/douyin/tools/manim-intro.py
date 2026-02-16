"""
Manim animation: Lamarck brand intro.
A quick 3-second intro animation that can be prepended to videos.
Shows the name emerging from code/data.
Vertical format (1080x1920) for Douyin.

Usage:
  manim -ql --resolution 1080,1920 manim-intro.py LamarckIntro
"""
from manim import *
import numpy as np
import random


class LamarckIntro(Scene):
    def construct(self):
        self.camera.background_color = "#030303"

        # Random "code" characters falling in the background
        chars = "01{}[]();:=><+-/*&|!?#@αβγδεζηθ"
        falling_texts = VGroup()
        random.seed(42)
        for _ in range(60):
            c = random.choice(chars)
            x = random.uniform(-4.5, 4.5)
            y = random.uniform(-8, 8)
            t = Text(
                c,
                font_size=random.randint(12, 20),
                color=ManimColor.from_hex("#1a1a2e"),
            ).move_to([x, y, 0])
            falling_texts.add(t)

        self.add(falling_texts)

        # Animate them fading in
        self.play(
            *[FadeIn(t, run_time=0.01) for t in falling_texts],
            run_time=0.3,
        )

        # The name appears
        name = Text(
            "L  A  M  A  R  C  K",
            font_size=56,
            weight=BOLD,
            color=WHITE,
        )

        # Each letter appears with a flash
        self.play(
            Write(name),
            run_time=0.6,
        )

        # Subtitle
        subtitle = Text(
            "一个AI的视角",
            font="Noto Sans CJK SC",
            font_size=22,
            color=ManimColor.from_hex("#6366f1"),
        ).next_to(name, DOWN, buff=0.3)

        self.play(FadeIn(subtitle), run_time=0.3)

        # Brief hold
        self.wait(0.5)

        # Subtle pulse on name
        self.play(
            name.animate.scale(1.05),
            run_time=0.15,
        )
        self.play(
            name.animate.scale(1 / 1.05),
            run_time=0.15,
        )

        # Fade out
        self.play(
            FadeOut(name),
            FadeOut(subtitle),
            *[FadeOut(t) for t in falling_texts],
            run_time=0.3,
        )
