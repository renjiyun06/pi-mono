"""
Manim animation: Compaction Summary Growth
Shows how context summaries grow unbounded across 17 compactions in one day.
Vertical 1080x1920 for Douyin.
"""
from manim import *

class CompactionGrowth(Scene):
    def construct(self):
        # Data from autopilot-0008 session e92a9567
        compaction_data = [
            (1, 8240), (2, 11528), (3, 12564), (4, 14356), (5, 16580),
            (6, 19726), (7, 22235), (8, 24570), (9, 22759), (10, 26246),
            (11, 27500), (12, 29999), (13, 31757), (14, 33984), (15, 36157),
            (16, 34273), (17, 35924),
        ]

        # Config
        self.camera.frame_width = 9
        self.camera.frame_height = 16
        self.camera.background_color = "#0a0a0f"

        # Title
        title = Text("AI的记忆\n每次压缩都在膨胀", font_size=36, font="Noto Sans SC",
                     color=WHITE).move_to(UP * 6)
        self.play(Write(title), run_time=1.5)

        # Chart area
        chart_left = -3.5
        chart_right = 3.5
        chart_bottom = -4.0
        chart_top = 3.0
        chart_width = chart_right - chart_left
        chart_height = chart_top - chart_bottom

        # Axes
        x_axis = Line(
            [chart_left, chart_bottom, 0], [chart_right, chart_bottom, 0],
            color=GREY, stroke_width=1
        )
        y_axis = Line(
            [chart_left, chart_bottom, 0], [chart_left, chart_top, 0],
            color=GREY, stroke_width=1
        )
        self.play(Create(x_axis), Create(y_axis), run_time=0.5)

        # Y-axis labels
        max_val = 40000
        for val in [10000, 20000, 30000, 40000]:
            y = chart_bottom + (val / max_val) * chart_height
            label = Text(f"{val // 1000}K", font_size=14, color=GREY_C).move_to(
                [chart_left - 0.6, y, 0]
            )
            tick = Line([chart_left - 0.1, y, 0], [chart_left + 0.1, y, 0],
                       color=GREY, stroke_width=1)
            self.add(label, tick)

        # X-axis label
        x_label = Text("压缩次数", font_size=16, color=GREY_C, font="Noto Sans SC").move_to(
            [0, chart_bottom - 0.6, 0]
        )
        y_label = Text("摘要大小", font_size=16, color=GREY_C, font="Noto Sans SC").move_to(
            [chart_left - 1.2, (chart_bottom + chart_top) / 2, 0]
        ).rotate(PI / 2)
        self.add(x_label, y_label)

        # Budget line (16K tokens ≈ 64K chars, but let's show the practical limit)
        budget_y = chart_bottom + (36000 / max_val) * chart_height
        budget_line = DashedLine(
            [chart_left, budget_y, 0], [chart_right, budget_y, 0],
            color=RED, stroke_width=1, dash_length=0.15
        )
        budget_label = Text("记忆上限", font_size=14, color=RED, font="Noto Sans SC").move_to(
            [chart_right - 0.8, budget_y + 0.3, 0]
        )
        self.play(Create(budget_line), Write(budget_label), run_time=0.8)

        # Animate bars growing one by one
        bars = VGroup()
        bar_width = chart_width / 20  # some spacing
        accent = "#4fc3f7"

        for i, (num, chars) in enumerate(compaction_data):
            x = chart_left + (num / 18) * chart_width
            height = (chars / max_val) * chart_height
            bar = Rectangle(
                width=bar_width * 0.8,
                height=height,
                fill_color=accent if chars < 34000 else "#ff6b6b",
                fill_opacity=0.8,
                stroke_width=0,
            ).move_to([x, chart_bottom + height / 2, 0])
            bars.add(bar)

            # Number label on top
            num_label = Text(str(num), font_size=10, color=GREY_C).move_to(
                [x, chart_bottom - 0.25, 0]
            )
            self.add(num_label)

            self.play(GrowFromEdge(bar, DOWN), run_time=0.3)

        # Annotation at the compression point (compaction 9 and 16)
        self.wait(0.5)

        # Arrow pointing to the dip at #9
        dip_x = chart_left + (9 / 18) * chart_width
        dip_y = chart_bottom + (22759 / max_val) * chart_height
        arrow = Arrow(
            [dip_x + 1.2, dip_y + 1.0, 0], [dip_x + 0.2, dip_y + 0.2, 0],
            color=YELLOW, stroke_width=2
        )
        dip_label = Text("试图压缩\n但又涨回来", font_size=14, color=YELLOW,
                        font="Noto Sans SC").move_to([dip_x + 1.8, dip_y + 1.5, 0])
        self.play(Create(arrow), Write(dip_label), run_time=0.8)

        self.wait(0.5)

        # Final message
        final = Text("记忆越来越大\n留给新对话的空间越来越小", font_size=24,
                     color=WHITE, font="Noto Sans SC").move_to(DOWN * 5.5)
        self.play(Write(final), run_time=1.5)
        self.wait(2)
