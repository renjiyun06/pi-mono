"""
Workload Spiral — HBR study visualization of the AI work intensification cycle.

Visual: Circular dependency diagram showing positive feedback loop:
  AI adoption → Faster pace → More output → Workload creep → Fatigue → Less deep work → More AI dependence → ...

Each loop iteration, the arrows glow brighter and the "Fatigue" node grows.
Vertical format (1080x1920).
"""
from manim import *
import numpy as np

class WorkloadSpiral(Scene):
    def construct(self):
        self.camera.frame_width = 10.8
        self.camera.frame_height = 19.2

        # Title
        title = Text("AI工作强度螺旋", font="Noto Sans SC", font_size=42, color=WHITE)
        title.move_to(UP * 7.5)
        self.play(FadeIn(title))

        # Source
        source = Text("来源：哈佛商业评论 2026", font="Noto Sans SC", font_size=18, color="#888888")
        source.move_to(UP * 6.5)
        self.play(FadeIn(source), run_time=0.3)

        # Cycle nodes arranged in a circle
        labels = [
            "AI加速",
            "产出增加",
            "工作膨胀",
            "认知疲劳",
            "深度思考↓",
            "更依赖AI",
        ]
        colors = [
            "#3b82f6",  # blue - AI
            "#22c55e",  # green - output
            "#f59e0b",  # amber - workload
            "#ef4444",  # red - fatigue
            "#a855f7",  # purple - deep work loss
            "#6366f1",  # indigo - more AI
        ]

        n = len(labels)
        radius = 3.5
        center = DOWN * 0.5
        angle_start = np.pi / 2  # Start from top

        nodes = []
        node_positions = []
        for i in range(n):
            angle = angle_start - i * 2 * np.pi / n
            pos = center + np.array([radius * np.cos(angle), radius * np.sin(angle), 0])
            node_positions.append(pos)

            # Node: rounded rectangle with text
            rect = RoundedRectangle(
                width=2.4, height=1.0, corner_radius=0.2,
                fill_color=colors[i], fill_opacity=0.3,
                stroke_color=colors[i], stroke_width=2,
            )
            rect.move_to(pos)
            label = Text(labels[i], font="Noto Sans SC", font_size=22, color=WHITE)
            label.move_to(pos)
            node = VGroup(rect, label)
            nodes.append(node)

        # Appear one by one
        for i, node in enumerate(nodes):
            self.play(FadeIn(node, scale=0.8), run_time=0.3)

        # Arrows between consecutive nodes
        arrows = []
        for i in range(n):
            start = node_positions[i]
            end = node_positions[(i + 1) % n]
            # Shorten arrow to not overlap with node rectangles
            direction = end - start
            direction_norm = direction / np.linalg.norm(direction)
            arrow_start = start + direction_norm * 1.3
            arrow_end = end - direction_norm * 1.3
            arrow = Arrow(
                arrow_start, arrow_end,
                color=colors[i], stroke_width=3,
                tip_length=0.2, buff=0,
            )
            arrows.append(arrow)

        self.play(*[GrowArrow(a) for a in arrows], run_time=0.8)
        self.wait(0.5)

        # Animate the spiral: highlight each step in sequence, 2 loops
        # First loop: normal speed, show the process
        highlight = Circle(radius=0.15, color=YELLOW, fill_opacity=1, stroke_width=0)
        highlight.move_to(node_positions[0])
        self.play(FadeIn(highlight), run_time=0.2)

        for loop in range(2):
            for i in range(n):
                next_i = (i + 1) % n
                # Move highlight along arrow
                opacity = 0.3 + 0.15 * (loop + 1)
                width = 2 + 1.5 * (loop + 1)
                self.play(
                    highlight.animate.move_to(node_positions[next_i]),
                    nodes[next_i][0].animate.set_fill(opacity=opacity).set_stroke(width=width),
                    run_time=0.35,
                )
                # Special effect on fatigue node (index 3)
                if next_i == 3:
                    flash = Circle(radius=1.5, color="#ef4444", fill_opacity=0.15, stroke_width=0)
                    flash.move_to(node_positions[3])
                    self.play(FadeIn(flash, scale=0.5), run_time=0.15)
                    self.play(FadeOut(flash), run_time=0.15)

        self.play(FadeOut(highlight), run_time=0.2)

        # Punchline
        punchline = Text(
            "越用AI → 越累 → 越需要AI",
            font="Noto Sans SC", font_size=32, color="#ef4444", weight=BOLD,
        )
        punchline.move_to(DOWN * 5.5)

        sub = Text(
            "「生产力飙升之后，是悄悄膨胀的工作量」",
            font="Noto Sans SC", font_size=20, color="#888888",
        )
        sub.move_to(DOWN * 6.5)

        self.play(FadeIn(punchline, shift=UP * 0.3))
        self.wait(0.3)
        self.play(FadeIn(sub))
        self.wait(1.5)
