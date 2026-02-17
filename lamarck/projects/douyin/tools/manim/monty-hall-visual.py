"""
Monty Hall Problem — Visual-only Manim animations (no text)
Designed to be B-roll for Remotion narration overlay.

All text/labels are handled by the Remotion composition layer.
These animations are pure visual illustrations.

Output: 1080x1920 vertical video at 30fps.
"""

from manim import *

config.pixel_width = 1080
config.pixel_height = 1920
config.frame_width = 9
config.frame_height = 16
config.frame_rate = 30
config.background_color = "#0a0a1a"


def create_door(color=BLUE_D, stroke_color=BLUE_B) -> VGroup:
    """Create a single door with doorknob."""
    door = RoundedRectangle(
        corner_radius=0.15,
        width=2.2,
        height=3.5,
        fill_color=color,
        fill_opacity=0.8,
        stroke_color=stroke_color,
        stroke_width=3,
    )
    knob = Dot(radius=0.12, color=GOLD)
    knob.move_to(door.get_right() + LEFT * 0.35 + DOWN * 0.2)
    return VGroup(door, knob)


def create_three_doors() -> VGroup:
    """Create three doors arranged horizontally."""
    doors = VGroup(*[create_door() for _ in range(3)])
    doors.arrange(RIGHT, buff=0.4)
    doors.move_to(UP * 0.5)
    return doors


class VisualSetup(Scene):
    """Three doors appear. One gets highlighted (player's choice)."""

    def construct(self):
        doors = create_three_doors()

        # Doors appear with stagger
        self.play(
            *[FadeIn(d, shift=UP * 0.5) for d in doors],
            lag_ratio=0.15,
            run_time=1.2,
        )
        self.wait(1)

        # Question marks above each door (mystery)
        qmarks = VGroup()
        for door in doors:
            q = Text("?", font_size=80, color=GREY_A, weight=BOLD)
            q.move_to(door.get_center())
            qmarks.add(q)
        self.play(FadeIn(qmarks, scale=0.5), run_time=0.6)
        self.wait(1)

        # Highlight door 1 (player picks)
        highlight = SurroundingRectangle(
            doors[0], color=GOLD, buff=0.15, corner_radius=0.2, stroke_width=4
        )
        self.play(Create(highlight), run_time=0.8)

        # Pulse the highlight
        self.play(
            highlight.animate.set_stroke(width=6),
            run_time=0.3,
        )
        self.play(
            highlight.animate.set_stroke(width=4),
            run_time=0.3,
        )
        self.wait(2)

        # Hold for narration sync
        self.wait(4)


class VisualHostOpens(Scene):
    """Door 3 opens to reveal a goat. Door 2 glows as the alternative."""

    def construct(self):
        doors = create_three_doors()
        highlight = SurroundingRectangle(
            doors[0], color=GOLD, buff=0.15, corner_radius=0.2, stroke_width=4
        )
        qmarks = VGroup()
        for door in doors:
            q = Text("?", font_size=80, color=GREY_A, weight=BOLD)
            q.move_to(door.get_center())
            qmarks.add(q)

        self.add(doors, highlight, qmarks)

        # Door 3 opens: rotate, change color, show goat
        goat = Text("🐐", font_size=100)
        goat.move_to(doors[2].get_center())

        self.play(
            doors[2][0].animate.set_fill(RED_D, opacity=0.2).set_stroke(RED, width=2),
            FadeOut(qmarks[2]),
            run_time=0.8,
        )
        self.play(FadeIn(goat, scale=0.3), run_time=0.6)
        self.wait(1)

        # Door 2 starts to glow (the alternative)
        glow = SurroundingRectangle(
            doors[1], color=GREEN, buff=0.15, corner_radius=0.2, stroke_width=3
        )
        self.play(Create(glow), run_time=0.8)

        # Pulsing between door 1 (gold) and door 2 (green)
        for _ in range(2):
            self.play(
                highlight.animate.set_stroke(opacity=0.3),
                glow.animate.set_stroke(width=5, opacity=1),
                run_time=0.5,
            )
            self.play(
                highlight.animate.set_stroke(opacity=1),
                glow.animate.set_stroke(width=3, opacity=0.5),
                run_time=0.5,
            )

        self.wait(2)


class VisualProbability(Scene):
    """Animated probability bars showing 1/3 vs 2/3."""

    def construct(self):
        # Two large probability bars, horizontal
        # Keep within safe zone: 840px safe width ÷ 120px/unit ≈ 7 units, use 5.5 for margin
        bar_width = 5.5
        bar_height = 0.8

        # "Stay" bar: 1/3
        stay_bg = Rectangle(
            width=bar_width, height=bar_height,
            fill_color=GREY_E, fill_opacity=0.3, stroke_width=0,
        )
        stay_fill = Rectangle(
            width=bar_width / 3, height=bar_height,
            fill_color=RED, fill_opacity=0.8, stroke_width=0,
        )
        stay_fill.align_to(stay_bg, LEFT)
        stay_group = VGroup(stay_bg, stay_fill)

        # "Switch" bar: 2/3
        switch_bg = Rectangle(
            width=bar_width, height=bar_height,
            fill_color=GREY_E, fill_opacity=0.3, stroke_width=0,
        )
        switch_fill = Rectangle(
            width=bar_width * 2 / 3, height=bar_height,
            fill_color=GREEN, fill_opacity=0.8, stroke_width=0,
        )
        switch_fill.align_to(switch_bg, LEFT)
        switch_group = VGroup(switch_bg, switch_fill)

        bars = VGroup(stay_group, switch_group)
        bars.arrange(DOWN, buff=1.5)
        bars.move_to(ORIGIN)

        # Fraction labels
        stay_frac = MathTex(r"\frac{1}{3}", font_size=72, color=RED)
        stay_frac.next_to(stay_group, RIGHT, buff=0.5)
        switch_frac = MathTex(r"\frac{2}{3}", font_size=72, color=GREEN)
        switch_frac.next_to(switch_group, RIGHT, buff=0.5)

        # Icons: X for stay, checkmark for switch
        stay_icon = Text("✕", font_size=60, color=RED)
        stay_icon.next_to(stay_group, LEFT, buff=0.5)
        switch_icon = Text("✓", font_size=60, color=GREEN)
        switch_icon.next_to(switch_group, LEFT, buff=0.5)

        # Animate backgrounds appearing
        self.play(FadeIn(stay_bg), FadeIn(switch_bg), run_time=0.5)
        self.play(FadeIn(stay_icon), FadeIn(switch_icon), run_time=0.4)
        self.wait(0.5)

        # Bars grow from left
        stay_fill_target = stay_fill.copy()
        switch_fill_target = switch_fill.copy()
        stay_fill.set_width(0.01).align_to(stay_bg, LEFT)
        switch_fill.set_width(0.01).align_to(switch_bg, LEFT)

        self.add(stay_fill, switch_fill)
        self.play(
            stay_fill.animate.become(stay_fill_target),
            switch_fill.animate.become(switch_fill_target),
            run_time=2,
        )
        self.wait(0.3)

        # Fractions appear
        self.play(
            Write(stay_frac),
            Write(switch_frac),
            run_time=0.8,
        )
        self.wait(1)

        # Emphasize the 2x difference
        arrow = Arrow(
            stay_group.get_center() + RIGHT * 3.5,
            switch_group.get_center() + RIGHT * 3.5,
            color=GOLD,
            stroke_width=4,
            buff=0.3,
        )
        times_two = MathTex(r"2\times", font_size=56, color=GOLD)
        times_two.next_to(arrow, RIGHT, buff=0.3)

        self.play(GrowArrow(arrow), run_time=0.8)
        self.play(Write(times_two), run_time=0.5)

        # Pulse
        self.play(
            switch_fill.animate.set_fill(opacity=1),
            run_time=0.3,
        )
        self.play(
            switch_fill.animate.set_fill(opacity=0.8),
            run_time=0.3,
        )

        self.wait(8)  # Hold for narration


class VisualHundredDoors(Scene):
    """100-door grid. One selected, 98 eliminated, one remains."""

    def construct(self):
        # Grid of 100 small doors
        small_doors = VGroup()
        for i in range(100):
            door = Square(
                side_length=0.55,
                fill_color=BLUE_D,
                fill_opacity=0.7,
                stroke_color=BLUE_B,
                stroke_width=1,
            )
            small_doors.add(door)

        small_doors.arrange_in_grid(rows=10, cols=10, buff=0.1)
        small_doors.move_to(UP * 1)
        small_doors.scale_to_fit_width(7)

        self.play(FadeIn(small_doors, lag_ratio=0.003), run_time=1.5)
        self.wait(0.5)

        # Highlight door 0 (player picks)
        small_doors[0].set_fill(GOLD, opacity=0.9)
        small_doors[0].set_stroke(GOLD, width=3)
        self.play(Flash(small_doors[0], color=GOLD, flash_radius=0.4), run_time=0.5)
        self.wait(1)

        # Host opens 98 doors (dramatic sweep)
        # Do it in waves for visual effect
        wave1 = [i for i in range(1, 42)]  # First batch
        wave2 = [i for i in range(43, 100)]  # Second batch

        anims1 = [
            small_doors[i].animate.set_fill(RED_D, opacity=0.1).set_stroke(RED_D, width=0.5)
            for i in wave1
        ]
        self.play(*anims1, run_time=1.5)

        anims2 = [
            small_doors[i].animate.set_fill(RED_D, opacity=0.1).set_stroke(RED_D, width=0.5)
            for i in wave2
        ]
        self.play(*anims2, run_time=1.5)

        self.wait(0.5)

        # Remaining door glows green
        small_doors[42].set_fill(GREEN, opacity=0.9)
        small_doors[42].set_stroke(GREEN, width=3)
        self.play(
            Flash(small_doors[42], color=GREEN, flash_radius=0.4),
            run_time=0.5,
        )

        # Scale up the two remaining doors and center them
        remaining = VGroup(small_doors[0].copy(), small_doors[42].copy())
        remaining[0].scale(4).set_fill(GOLD, 0.9).set_stroke(GOLD, 3)
        remaining[1].scale(4).set_fill(GREEN, 0.9).set_stroke(GREEN, 3)
        remaining.arrange(RIGHT, buff=1.5)
        remaining.move_to(DOWN * 2)

        # "vs" text between them
        vs = Text("vs", font_size=48, color=GREY_A)
        vs.move_to(remaining.get_center())

        self.play(
            FadeIn(remaining, scale=0.5),
            FadeIn(vs),
            run_time=1.2,
        )

        # Pulsing between gold and green
        for _ in range(3):
            self.play(
                remaining[0].animate.set_fill(opacity=0.4),
                remaining[1].animate.set_fill(opacity=1),
                run_time=0.4,
            )
            self.play(
                remaining[0].animate.set_fill(opacity=0.9),
                remaining[1].animate.set_fill(opacity=0.5),
                run_time=0.4,
            )

        self.wait(3)
