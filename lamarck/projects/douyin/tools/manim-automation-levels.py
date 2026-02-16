"""
Manim animation: Levels of Automation (Sheridan & Verplank, 1978)
10 horizontal bars from "Human control" to "Full automation"
Color gradient from blue (human) to orange (machine)
A sliding indicator shows where current AI tools fall

Vertical 1080x1920, 30fps
Usage: manim -qm --resolution 1080,1920 manim-automation-levels.py AutomationLevels
"""
import numpy as np
from manim import *


class AutomationLevels(Scene):
    def construct(self):
        self.camera.background_color = "#0a0a1a"

        # Title
        title = Text("自动化的十个层级", font="Noto Sans CJK SC", font_size=28, color=WHITE)
        title.to_edge(UP, buff=0.8)
        subtitle = Text(
            "Sheridan & Verplank, 1978",
            font_size=16, color="#888888"
        )
        subtitle.next_to(title, DOWN, buff=0.2)

        self.play(Write(title), FadeIn(subtitle), run_time=0.6)

        # 10 levels
        levels = [
            "1. 人类完全自主",
            "2. 计算机提供选项",
            "3. 缩小选项范围",
            "4. 推荐一个方案",
            "5. 人类批准后执行",
            "6. 限时否决",
            "7. 先执行后通知",
            "8. 只在被问时通知",
            "9. 自行决定是否通知",
            "10. 完全自主，忽略人类",
        ]

        # Color gradient: blue (human) → orange/red (machine)
        colors = [
            "#3498db",  # 1 - blue
            "#2e86c1",  # 2
            "#2874a6",  # 3
            "#1a8d5e",  # 4 - teal
            "#27ae60",  # 5 - green (boundary)
            "#f39c12",  # 6 - yellow-orange (boundary)
            "#e67e22",  # 7 - orange
            "#d35400",  # 8
            "#c0392b",  # 9
            "#e74c3c",  # 10 - red
        ]

        bar_width = 5.5
        bar_height = 0.38
        start_y = 2.3
        spacing = 0.52

        bars = VGroup()
        labels = VGroup()
        number_labels = VGroup()

        for i, (level, color) in enumerate(zip(levels, colors)):
            y = start_y - i * spacing

            # Background bar (fill proportional to automation level)
            fill_width = bar_width * ((i + 1) / 10)
            bar_bg = Rectangle(
                width=bar_width, height=bar_height,
                color=WHITE, fill_opacity=0.03, stroke_width=0.5, stroke_opacity=0.2
            ).move_to(np.array([0, y, 0]))

            bar_fill = Rectangle(
                width=fill_width, height=bar_height,
                color=color, fill_opacity=0.5, stroke_width=0
            ).move_to(np.array([-bar_width / 2 + fill_width / 2, y, 0]))

            label = Text(
                level, font="Noto Sans CJK SC", font_size=13, color=WHITE
            ).move_to(np.array([0, y, 0]))

            bars.add(VGroup(bar_bg, bar_fill))
            labels.add(label)

        # Animate bars appearing one by one
        for i in range(10):
            self.play(
                FadeIn(bars[i]),
                FadeIn(labels[i]),
                run_time=0.25
            )

        self.wait(0.5)

        # Zone labels on the right
        human_zone = Text(
            "增强", font="Noto Sans CJK SC", font_size=14,
            color="#3498db"
        ).move_to(np.array([3.8, start_y - 1 * spacing, 0]))

        boundary_zone = Text(
            "边界", font="Noto Sans CJK SC", font_size=14,
            color="#f39c12"
        ).move_to(np.array([3.8, start_y - 5.5 * spacing, 0]))

        replace_zone = Text(
            "替代", font="Noto Sans CJK SC", font_size=14,
            color="#e74c3c"
        ).move_to(np.array([3.8, start_y - 8 * spacing, 0]))

        # Divider lines
        line1 = DashedLine(
            start=np.array([-3.5, start_y - 4.7 * spacing, 0]),
            end=np.array([3.2, start_y - 4.7 * spacing, 0]),
            color="#f39c12", stroke_width=1, dash_length=0.1
        )
        line2 = DashedLine(
            start=np.array([-3.5, start_y - 6.7 * spacing, 0]),
            end=np.array([3.2, start_y - 6.7 * spacing, 0]),
            color="#e74c3c", stroke_width=1, dash_length=0.1
        )

        self.play(
            Create(line1), Create(line2),
            FadeIn(human_zone), FadeIn(boundary_zone), FadeIn(replace_zone),
            run_time=0.5
        )

        self.wait(0.5)

        # Sliding indicator: show where common AI tools fall
        tools = [
            ("Copilot", 4, "#27ae60"),  # level 5 (index 4)
            ("AI邮件", 7, "#d35400"),    # level 8 (index 7)
            ("OpenClaw", 9, "#e74c3c"),  # level 10 (index 9)
        ]

        indicator = Triangle(
            color="#ffffff", fill_opacity=0.9
        ).scale(0.12).rotate(-PI / 2)

        tool_label = Text("", font="Noto Sans CJK SC", font_size=16, color=WHITE)

        for name, idx, color in tools:
            y = start_y - idx * spacing
            new_pos = np.array([-bar_width / 2 - 0.3, y, 0])
            new_label = Text(
                name, font="Noto Sans CJK SC", font_size=16, color=color
            ).next_to(new_pos, LEFT, buff=0.15)

            if name == "Copilot":
                indicator.move_to(new_pos)
                self.play(FadeIn(indicator), FadeIn(new_label), run_time=0.3)
            else:
                self.play(
                    indicator.animate.move_to(new_pos),
                    FadeIn(new_label),
                    run_time=0.6
                )

            # Highlight the bar
            bars[idx][1].save_state()
            self.play(
                bars[idx][1].animate.set_fill(opacity=0.9),
                run_time=0.2
            )
            self.wait(0.8)
            self.play(bars[idx][1].animate.restore(), run_time=0.2)

        self.wait(1.5)
