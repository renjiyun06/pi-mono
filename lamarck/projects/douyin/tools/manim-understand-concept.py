"""
Manim animation: The Understand Concept
Shows cognitive debt accumulating as AI-generated code piles up,
then the intervention (comprehension quiz) reversing the trend.

Vertical format (1080x1920) for Douyin.
"""

from manim import *
import numpy as np


class UnderstandConcept(Scene):
    def construct(self):
        self.camera.background_color = "#0a0a0f"

        # Phase 1: Code accumulating (0-4s)
        title = Text("AI 写了代码", font_size=42, color=WHITE, font="Noto Sans SC").to_edge(UP, buff=1.5)
        self.play(Write(title), run_time=0.8)

        # File blocks stacking up
        files = VGroup()
        file_names = ["auth.ts", "api.ts", "db.ts", "cache.ts", "queue.ts", "router.ts"]
        colors = [BLUE_C, BLUE_D, BLUE_E, TEAL_C, TEAL_D, TEAL_E]

        for i, (name, color) in enumerate(zip(file_names, colors)):
            rect = RoundedRectangle(
                width=5, height=0.6, corner_radius=0.1,
                fill_color=color, fill_opacity=0.7,
                stroke_color=WHITE, stroke_width=1
            )
            label = Text(name, font_size=24, color=WHITE).move_to(rect)
            file_block = VGroup(rect, label)
            file_block.move_to(DOWN * (1 - i * 0.8))
            files.add(file_block)

        for i, f in enumerate(files):
            self.play(FadeIn(f, shift=DOWN * 0.3), run_time=0.3)

        self.wait(0.5)

        # Phase 2: Understanding meter dropping (4-7s)
        self.play(FadeOut(title), run_time=0.3)
        question = Text("你看得懂吗？", font_size=48, color=YELLOW, font="Noto Sans SC").to_edge(UP, buff=1.5)
        self.play(Write(question), run_time=0.5)

        # Understanding bar
        bar_bg = RoundedRectangle(
            width=6, height=0.5, corner_radius=0.1,
            fill_color=GREY_E, fill_opacity=0.5,
            stroke_color=WHITE, stroke_width=1
        ).move_to(UP * 3)

        bar_fill = RoundedRectangle(
            width=6, height=0.5, corner_radius=0.1,
            fill_color=GREEN, fill_opacity=0.8,
            stroke_width=0
        ).move_to(bar_bg)

        bar_label = Text("理解度: 100%", font_size=22, color=WHITE, font="Noto Sans SC").next_to(bar_bg, UP, buff=0.2)

        self.play(FadeIn(bar_bg), FadeIn(bar_fill), FadeIn(bar_label), run_time=0.5)

        # Animate understanding dropping
        for pct, color in [(70, YELLOW_D), (40, ORANGE), (15, RED)]:
            new_width = 6 * pct / 100
            new_fill = RoundedRectangle(
                width=new_width, height=0.5, corner_radius=0.1,
                fill_color=color, fill_opacity=0.8,
                stroke_width=0
            ).align_to(bar_bg, LEFT)

            new_label = Text(
                f"理解度: {pct}%", font_size=22, color=color, font="Noto Sans SC"
            ).next_to(bar_bg, UP, buff=0.2)

            # Dim corresponding files
            dim_idx = {70: [5, 4], 40: [3, 2], 15: [1, 0]}[pct]
            anims = [Transform(bar_fill, new_fill), Transform(bar_label, new_label)]
            for idx in dim_idx:
                if idx < len(files):
                    anims.append(files[idx].animate.set_opacity(0.2))

            self.play(*anims, run_time=0.7)

        self.wait(0.5)

        # Phase 3: The intervention (7-10s)
        self.play(FadeOut(question), run_time=0.3)

        # Quiz flash
        quiz_text = Text("🔍 Understand", font_size=56, color=BLUE_A).to_edge(UP, buff=1.5)
        self.play(FadeIn(quiz_text, scale=1.3), run_time=0.4)

        q1 = Text("Q: 这段代码为什么用缓存？", font_size=28, color=WHITE, font="Noto Sans SC").move_to(DOWN * 3)
        self.play(Write(q1), run_time=0.6)

        # Understanding recovering
        for pct, color in [(40, ORANGE), (70, YELLOW_D), (95, GREEN)]:
            new_width = 6 * pct / 100
            new_fill = RoundedRectangle(
                width=new_width, height=0.5, corner_radius=0.1,
                fill_color=color, fill_opacity=0.8,
                stroke_width=0
            ).align_to(bar_bg, LEFT)

            new_label = Text(
                f"理解度: {pct}%", font_size=22, color=color, font="Noto Sans SC"
            ).next_to(bar_bg, UP, buff=0.2)

            # Un-dim files
            restore_idx = {40: [0, 1], 70: [2, 3], 95: [4, 5]}[pct]
            anims = [Transform(bar_fill, new_fill), Transform(bar_label, new_label)]
            for idx in restore_idx:
                if idx < len(files):
                    anims.append(files[idx].animate.set_opacity(1.0))

            self.play(*anims, run_time=0.5)

        self.wait(0.3)

        # Punchline
        self.play(FadeOut(q1), run_time=0.2)
        punchline = Text(
            "AI写代码，你要看得懂",
            font_size=44, color=GREEN_A, font="Noto Sans SC"
        ).move_to(DOWN * 3.5)
        self.play(Write(punchline), run_time=0.8)
        self.wait(1.5)
