"""
Manim animation: Four stages of cognitive sovereignty loss.
Descending staircase with labels — each step gets darker.
Vertical format (1080x1920).

Usage:
  manim -qm --resolution 1080,1920 manim-sovereignty-stages.py SovereigntyStages
"""
from manim import *


class SovereigntyStages(Scene):
    def construct(self):
        self.camera.background_color = "#0a0a1a"

        title = Text(
            "认知主权的四个阶段", font="Noto Sans CJK SC", font_size=28, color=WHITE
        ).to_edge(UP, buff=0.8)
        self.play(Write(title), run_time=0.5)

        stages = [
            ("省时间", "AI帮我查资料", "#7c3aed", 0.9),
            ("省脑力", "AI帮我分析", "#6d28d9", 0.7),
            ("省思考", "AI帮我决策", "#5b21b6", 0.5),
            ("失控", "不知道自己不知道什么", "#e94560", 0.3),
        ]

        step_width = 5.0
        step_height = 1.2
        start_y = 2.5
        x_offset = -2.0

        steps = VGroup()
        labels = VGroup()
        descs = VGroup()
        arrows = VGroup()

        for i, (label, desc, color, opacity) in enumerate(stages):
            y = start_y - i * (step_height + 0.4)
            # Each step is wider and darker
            step = Rectangle(
                width=step_width - i * 0.3,
                height=step_height,
                fill_color=color,
                fill_opacity=opacity,
                stroke_color=color,
                stroke_width=2,
            ).move_to([x_offset + i * 0.3, y, 0])

            label_text = Text(
                f"阶段{i+1}: {label}",
                font="Noto Sans CJK SC",
                font_size=22,
                color=WHITE,
                weight=BOLD,
            ).move_to(step.get_center() + UP * 0.2)

            desc_text = Text(
                desc,
                font="Noto Sans CJK SC",
                font_size=16,
                color=WHITE,
            ).move_to(step.get_center() + DOWN * 0.2)
            desc_text.set_opacity(0.7)

            steps.add(step)
            labels.add(label_text)
            descs.add(desc_text)

            # Arrow between steps
            if i > 0:
                arrow = Arrow(
                    start=steps[i-1].get_bottom(),
                    end=step.get_top(),
                    color=WHITE,
                    stroke_width=2,
                    buff=0.1,
                    max_tip_length_to_length_ratio=0.3,
                )
                arrow.set_opacity(0.4)
                arrows.add(arrow)

        # Animate each stage appearing
        for i in range(len(stages)):
            anims = [FadeIn(steps[i], shift=DOWN * 0.3), Write(labels[i]), FadeIn(descs[i])]
            if i > 0:
                anims.append(GrowArrow(arrows[i-1]))
            self.play(*anims, run_time=0.8)
            self.wait(0.4)

        # Highlight stage 4 danger
        danger_box = SurroundingRectangle(
            steps[3], color="#e94560", buff=0.15, stroke_width=3
        )
        danger_label = Text(
            "⚠ 最危险", font="Noto Sans CJK SC", font_size=20, color="#e94560"
        ).next_to(steps[3], RIGHT, buff=0.3)

        self.play(Create(danger_box), Write(danger_label), run_time=0.6)
        self.wait(0.3)

        # Bottom message
        bottom_msg = Text(
            "渐进式的，无痛的，不可逆的",
            font="Noto Sans CJK SC",
            font_size=20,
            color=WHITE,
        ).to_edge(DOWN, buff=1.0)
        bottom_msg.set_opacity(0.6)
        self.play(FadeIn(bottom_msg), run_time=0.5)
        self.wait(1.5)
