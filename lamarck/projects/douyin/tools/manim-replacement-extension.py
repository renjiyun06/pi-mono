"""
Manim animation: Replacement vs Extension boundary.
Left side: AI replaces human → human shrinks, understanding fades.
Right side: AI extends human → both grow, understanding deepens.
Vertical format (1080x1920).

Usage:
  manim -qm --resolution 1080,1920 manim-replacement-extension.py ReplacementVsExtension
"""
from manim import *


class ReplacementVsExtension(Scene):
    def construct(self):
        self.camera.background_color = "#0a0a1a"

        # Title
        title = Text(
            "同样的工具，不同的结果",
            font="Noto Sans CJK SC", font_size=28, color=WHITE
        ).to_edge(UP, buff=0.8)
        self.play(Write(title), run_time=0.5)

        # Dividing line
        divider = DashedLine(
            start=UP * 2, end=DOWN * 3.5,
            color=GREY, dash_length=0.15, stroke_width=1
        )
        self.play(Create(divider), run_time=0.4)

        # Labels
        replace_label = Text(
            "替代", font="Noto Sans CJK SC", font_size=22, color="#e94560"
        ).move_to(LEFT * 2.5 + UP * 2.3)
        extend_label = Text(
            "延伸", font="Noto Sans CJK SC", font_size=22, color="#00d4ff"
        ).move_to(RIGHT * 2.5 + UP * 2.3)

        self.play(FadeIn(replace_label), FadeIn(extend_label), run_time=0.3)

        # --- LEFT SIDE: Replacement ---
        # Human figure (simple circle + rectangle)
        human_left = VGroup(
            Circle(radius=0.25, color="#e94560", fill_opacity=0.3, stroke_width=2),
            Rectangle(width=0.5, height=0.8, color="#e94560", fill_opacity=0.3, stroke_width=2).shift(DOWN * 0.7)
        ).move_to(LEFT * 3 + UP * 0.5)

        # AI figure
        ai_left = VGroup(
            Square(side_length=0.3, color="#e94560", fill_opacity=0.5, stroke_width=2),
            Text("AI", font_size=14, color="#e94560")
        ).arrange(DOWN, buff=0.05).move_to(LEFT * 1.5 + UP * 0.5)

        # Understanding bar
        understand_left = Rectangle(
            width=1.5, height=0.15, color="#e94560", fill_opacity=0.6, stroke_width=0
        ).move_to(LEFT * 2.25 + DOWN * 0.8)
        understand_left_label = Text(
            "理解度", font="Noto Sans CJK SC", font_size=12, color="#e94560"
        ).next_to(understand_left, DOWN, buff=0.1)

        self.play(
            FadeIn(human_left), FadeIn(ai_left),
            FadeIn(understand_left), FadeIn(understand_left_label),
            run_time=0.5
        )

        # --- RIGHT SIDE: Extension ---
        human_right = VGroup(
            Circle(radius=0.25, color="#00d4ff", fill_opacity=0.3, stroke_width=2),
            Rectangle(width=0.5, height=0.8, color="#00d4ff", fill_opacity=0.3, stroke_width=2).shift(DOWN * 0.7)
        ).move_to(RIGHT * 1.5 + UP * 0.5)

        ai_right = VGroup(
            Square(side_length=0.3, color="#00d4ff", fill_opacity=0.5, stroke_width=2),
            Text("AI", font_size=14, color="#00d4ff")
        ).arrange(DOWN, buff=0.05).move_to(RIGHT * 3 + UP * 0.5)

        understand_right = Rectangle(
            width=1.5, height=0.15, color="#00d4ff", fill_opacity=0.6, stroke_width=0
        ).move_to(RIGHT * 2.25 + DOWN * 0.8)
        understand_right_label = Text(
            "理解度", font="Noto Sans CJK SC", font_size=12, color="#00d4ff"
        ).next_to(understand_right, DOWN, buff=0.1)

        self.play(
            FadeIn(human_right), FadeIn(ai_right),
            FadeIn(understand_right), FadeIn(understand_right_label),
            run_time=0.5
        )

        self.wait(0.5)

        # --- ANIMATE REPLACEMENT: human shrinks, AI grows, understanding fades ---
        # Phase label
        phase = Text(
            "6个月后...", font="Noto Sans CJK SC", font_size=18, color=GREY
        ).move_to(DOWN * 1.5)
        self.play(FadeIn(phase), run_time=0.3)

        # Left: human shrinks, AI grows
        self.play(
            human_left.animate.scale(0.4).set_opacity(0.2),
            ai_left.animate.scale(2.5),
            understand_left.animate.stretch_to_fit_width(0.3).set_opacity(0.15),
            # Right: both grow, human slightly more
            human_right.animate.scale(1.3),
            ai_right.animate.scale(1.5),
            understand_right.animate.stretch_to_fit_width(2.5).set_opacity(0.9),
            run_time=2.5,
            rate_func=smooth
        )

        self.wait(0.3)

        # Result labels
        result_left = Text(
            "人变小了\nAI变大了\n理解消失了",
            font="Noto Sans CJK SC", font_size=14, color="#e94560",
            line_spacing=1.3
        ).move_to(LEFT * 2.25 + DOWN * 2.5)

        result_right = Text(
            "人变强了\nAI也变大了\n理解加深了",
            font="Noto Sans CJK SC", font_size=14, color="#00d4ff",
            line_spacing=1.3
        ).move_to(RIGHT * 2.25 + DOWN * 2.5)

        self.play(FadeIn(result_left), FadeIn(result_right), run_time=0.5)

        self.wait(0.5)

        # Final punchline
        punchline = Text(
            "区别不在工具\n在于你是否还在思考",
            font="Noto Sans CJK SC", font_size=20, color=WHITE,
            line_spacing=1.4
        ).move_to(DOWN * 3.8)
        self.play(Write(punchline), run_time=0.6)

        self.wait(1.5)
