"""
Manim animation: Birthday Paradox — shows how pairings explode.
Visual demonstration of why 23 people → 253 pairs.
Designed as B-roll for Remotion DeepDive.

Vertical format (1080x1920).

Usage:
  manim -ql --resolution 1080,1920 manim-birthday-pairings.py BirthdayPairings
"""
from manim import *
import numpy as np


class BirthdayPairings(Scene):
    def construct(self):
        self.camera.background_color = "#0a0a1a"

        # Title
        title = Text(
            "配对数量爆炸",
            font="Noto Sans CJK SC",
            font_size=36,
            color=WHITE,
        ).to_edge(UP, buff=1.0)
        self.play(Write(title), run_time=0.5)

        # Show 5 people as dots in a circle
        n_people = 5
        radius = 2.0
        center = ORIGIN + UP * 0.5

        dots = VGroup()
        labels = VGroup()
        for i in range(n_people):
            angle = i * TAU / n_people - TAU / 4  # start from top
            pos = center + radius * np.array([np.cos(angle), np.sin(angle), 0])
            dot = Circle(
                radius=0.25,
                color=BLUE_C,
                fill_opacity=0.3,
                stroke_width=2,
            ).move_to(pos)
            label = Text(
                str(i + 1),
                font_size=20,
                color=WHITE,
            ).move_to(pos)
            dots.add(dot)
            labels.add(label)

        people_label = Text(
            f"{n_people}个人",
            font="Noto Sans CJK SC",
            font_size=24,
            color=GREY,
        ).next_to(title, DOWN, buff=0.3)

        self.play(
            Write(people_label),
            *[FadeIn(d) for d in dots],
            *[FadeIn(l) for l in labels],
            run_time=0.5,
        )
        self.wait(0.3)

        # Draw all pairings one by one
        counter_text = Text(
            "配对：0",
            font="Noto Sans CJK SC",
            font_size=28,
            color=YELLOW,
        ).shift(DOWN * 3.5)
        self.play(Write(counter_text), run_time=0.3)

        count = 0
        lines = VGroup()
        for i in range(n_people):
            for j in range(i + 1, n_people):
                count += 1
                angle_i = i * TAU / n_people - TAU / 4
                angle_j = j * TAU / n_people - TAU / 4
                pos_i = center + radius * np.array([np.cos(angle_i), np.sin(angle_i), 0])
                pos_j = center + radius * np.array([np.cos(angle_j), np.sin(angle_j), 0])
                line = Line(
                    pos_i, pos_j,
                    color=interpolate_color(BLUE_C, YELLOW, count / 10),
                    stroke_width=1.5,
                    stroke_opacity=0.6,
                )
                lines.add(line)

                new_counter = Text(
                    f"配对：{count}",
                    font="Noto Sans CJK SC",
                    font_size=28,
                    color=YELLOW,
                ).shift(DOWN * 3.5)

                self.play(
                    Create(line),
                    Transform(counter_text, new_counter),
                    run_time=0.15,
                )

        self.wait(0.5)

        # Formula
        formula = MathTex(
            f"C({n_people}, 2) = \\frac{{{n_people} \\times {n_people - 1}}}{{2}} = {count}",
            font_size=32,
            color=WHITE,
        ).shift(DOWN * 4.5)
        self.play(Write(formula), run_time=0.5)
        self.wait(0.5)

        # Transition: now show 23 people
        self.play(
            FadeOut(dots), FadeOut(labels), FadeOut(lines),
            FadeOut(counter_text), FadeOut(formula), FadeOut(people_label),
            run_time=0.4,
        )

        # 23 people as dots in a circle (smaller)
        n23 = 23
        radius2 = 2.5
        dots23 = VGroup()
        for i in range(n23):
            angle = i * TAU / n23 - TAU / 4
            pos = center + radius2 * np.array([np.cos(angle), np.sin(angle), 0])
            dot = Circle(
                radius=0.1,
                color=BLUE_C,
                fill_opacity=0.4,
                stroke_width=1,
            ).move_to(pos)
            dots23.add(dot)

        people_label_23 = Text(
            "23个人",
            font="Noto Sans CJK SC",
            font_size=24,
            color=GREY,
        ).next_to(title, DOWN, buff=0.3)

        self.play(
            Write(people_label_23),
            *[FadeIn(d) for d in dots23],
            run_time=0.5,
        )

        # Draw ALL lines at once (253 lines!)
        lines23 = VGroup()
        for i in range(n23):
            for j in range(i + 1, n23):
                angle_i = i * TAU / n23 - TAU / 4
                angle_j = j * TAU / n23 - TAU / 4
                pos_i = center + radius2 * np.array([np.cos(angle_i), np.sin(angle_i), 0])
                pos_j = center + radius2 * np.array([np.cos(angle_j), np.sin(angle_j), 0])
                line = Line(
                    pos_i, pos_j,
                    color=YELLOW,
                    stroke_width=0.3,
                    stroke_opacity=0.15,
                )
                lines23.add(line)

        count_23 = Text(
            "253 种配对",
            font="Noto Sans CJK SC",
            font_size=36,
            color=YELLOW,
        ).shift(DOWN * 3.5)

        formula_23 = MathTex(
            "C(23, 2) = \\frac{23 \\times 22}{2} = 253",
            font_size=32,
            color=WHITE,
        ).shift(DOWN * 4.5)

        self.play(
            *[Create(l) for l in lines23],
            Write(count_23),
            run_time=1.5,
        )
        self.play(Write(formula_23), run_time=0.5)
        self.wait(2)
