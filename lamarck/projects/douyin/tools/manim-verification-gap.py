"""
Verification Gap: Trust vs Checking of AI-generated code.
Based on Sonar survey (1,100+ devs) + Vogels "verification debt" concept.

Animates two bars: "Don't trust AI code: 96%" vs "Always check it: 48%"
The gap between them is the verification debt.
"""
from manim import *

class VerificationGap(Scene):
    def construct(self):
        self.camera.background_color = "#0d0d0d"

        # Title
        title = Text("验证债务", font_size=42, color=WHITE, font="Noto Sans SC")
        title.to_edge(UP, buff=0.8)

        # Subtitle
        subtitle = Text("Verification Debt", font_size=24, color=GREY_B)
        subtitle.next_to(title, DOWN, buff=0.2)

        self.play(Write(title), FadeIn(subtitle), run_time=1.5)
        self.wait(0.5)

        # Bar chart setup
        bar_width = 1.8
        max_height = 4.0
        gap = 2.5

        # Bar 1: Don't trust (96%)
        bar1_height = max_height * 0.96
        bar1 = Rectangle(
            width=bar_width, height=bar1_height,
            fill_color="#e94560", fill_opacity=0.9,
            stroke_color="#e94560", stroke_width=1
        )
        bar1.move_to(LEFT * gap / 2 + DOWN * 0.3)
        bar1.align_to(DOWN * 2.3, DOWN)

        label1 = Text("不信任\nAI代码", font_size=20, color=WHITE, font="Noto Sans SC")
        label1.next_to(bar1, DOWN, buff=0.3)

        pct1 = Text("96%", font_size=36, color="#e94560", weight=BOLD)
        pct1.next_to(bar1, UP, buff=0.2)

        # Bar 2: Always check (48%)
        bar2_height = max_height * 0.48
        bar2 = Rectangle(
            width=bar_width, height=bar2_height,
            fill_color="#10b981", fill_opacity=0.9,
            stroke_color="#10b981", stroke_width=1
        )
        bar2.move_to(RIGHT * gap / 2 + DOWN * 0.3)
        bar2.align_to(DOWN * 2.3, DOWN)

        label2 = Text("每次都\n检查", font_size=20, color=WHITE, font="Noto Sans SC")
        label2.next_to(bar2, DOWN, buff=0.3)

        pct2 = Text("48%", font_size=36, color="#10b981", weight=BOLD)
        pct2.next_to(bar2, UP, buff=0.2)

        # Animate bars growing from bottom
        bar1_target = bar1.copy()
        bar2_target = bar2.copy()

        bar1.stretch_to_fit_height(0.01)
        bar1.align_to(DOWN * 2.3, DOWN)
        bar2.stretch_to_fit_height(0.01)
        bar2.align_to(DOWN * 2.3, DOWN)

        self.play(
            bar1.animate.become(bar1_target),
            FadeIn(label1),
            run_time=1.5
        )
        self.play(FadeIn(pct1), run_time=0.5)
        self.wait(0.3)

        self.play(
            bar2.animate.become(bar2_target),
            FadeIn(label2),
            run_time=1.5
        )
        self.play(FadeIn(pct2), run_time=0.5)
        self.wait(0.5)

        # The gap arrow + label
        gap_top = bar1_target.get_top()
        gap_bottom = bar2_target.get_top()

        brace = BraceBetweenPoints(
            [gap / 2 + bar_width / 2 + 0.3, gap_top[1], 0],
            [gap / 2 + bar_width / 2 + 0.3, gap_bottom[1], 0],
            direction=RIGHT,
            color="#ff6b35"
        )

        gap_label = Text("48%\n验证缺口", font_size=22, color="#ff6b35", font="Noto Sans SC")
        gap_label.next_to(brace, RIGHT, buff=0.3)

        self.play(GrowFromCenter(brace), FadeIn(gap_label), run_time=1.0)
        self.wait(0.5)

        # Quote
        quote = Text(
            "「理解来自创造。\n机器写的代码，你必须重建理解。」",
            font_size=20, color=GREY_A, font="Noto Sans SC",
            line_spacing=1.4
        )
        quote.to_edge(DOWN, buff=0.3)

        source = Text("— Werner Vogels, Amazon CTO", font_size=14, color=GREY_C)
        source.next_to(quote, DOWN, buff=0.15)

        self.play(FadeIn(quote), FadeIn(source), run_time=1.5)
        self.wait(2.0)
