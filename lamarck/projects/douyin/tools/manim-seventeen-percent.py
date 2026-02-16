"""
Two-bar comparison: AI group scores 17% lower.
Simple, punchy, red accent. Vertical 1080x1920.
"""
from manim import *

class SeventeenPercent(Scene):
    def construct(self):
        self.camera.background_color = "#0a0a0a"

        # Title at top
        title = Text("知识测试得分", font="Noto Sans SC", font_size=44, color=WHITE)
        title.move_to(UP * 6.5)

        # Bar dimensions — tall to fill vertical
        bar_width = 2.8
        max_height = 8.0
        gap = 2.0
        bottom_y = -6.0

        # No-AI group bar (left) — full height, blue
        no_ai_bar = Rectangle(
            width=bar_width, height=max_height,
            fill_color="#4a9eff", fill_opacity=0.85,
            stroke_color="#4a9eff", stroke_width=2
        )
        no_ai_bar.move_to(LEFT * gap)
        no_ai_bar.align_to(bottom_y * UP, DOWN)

        no_ai_label = Text("无AI组", font="Noto Sans SC", font_size=36, color="#4a9eff")
        no_ai_label.next_to(no_ai_bar, DOWN, buff=0.4)

        no_ai_pct = Text("100%", font="Noto Sans SC", font_size=44, color=WHITE, weight=BOLD)
        no_ai_pct.next_to(no_ai_bar, UP, buff=0.3)

        # AI group bar (right) — 83% height, red
        ai_height = max_height * 0.83
        ai_bar = Rectangle(
            width=bar_width, height=ai_height,
            fill_color="#ff3333", fill_opacity=0.85,
            stroke_color="#ff3333", stroke_width=2
        )
        ai_bar.move_to(RIGHT * gap)
        ai_bar.align_to(bottom_y * UP, DOWN)

        ai_label = Text("AI组", font="Noto Sans SC", font_size=36, color="#ff3333")
        ai_label.next_to(ai_bar, DOWN, buff=0.4)

        ai_pct = Text("83%", font="Noto Sans SC", font_size=44, color=WHITE, weight=BOLD)
        ai_pct.next_to(ai_bar, UP, buff=0.3)

        # Big -17% at center top
        diff_text = Text("-17%", font="Noto Sans SC", font_size=72, color="#ff3333", weight=BOLD)
        diff_text.move_to(UP * 5)

        # Animation
        self.play(Write(title), run_time=0.4)
        self.wait(0.2)

        # Grow no-AI bar from bottom
        no_ai_bar_start = no_ai_bar.copy().stretch(0.01, 1, about_edge=DOWN)
        self.add(no_ai_bar_start)
        self.play(
            Transform(no_ai_bar_start, no_ai_bar),
            FadeIn(no_ai_label),
            run_time=0.8
        )
        self.play(FadeIn(no_ai_pct), run_time=0.2)
        self.wait(0.2)

        # Grow AI bar from bottom
        ai_bar_start = ai_bar.copy().stretch(0.01, 1, about_edge=DOWN)
        self.add(ai_bar_start)
        self.play(
            Transform(ai_bar_start, ai_bar),
            FadeIn(ai_label),
            run_time=0.8
        )
        self.play(FadeIn(ai_pct), run_time=0.2)
        self.wait(0.3)

        # Flash the difference
        self.play(
            Write(diff_text),
            Flash(ai_bar.get_top(), color=RED, flash_radius=0.8),
            run_time=0.6
        )
        self.wait(2.5)
