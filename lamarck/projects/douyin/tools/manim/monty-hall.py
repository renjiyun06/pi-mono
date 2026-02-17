"""
Monty Hall Problem — Manim visualization
Three doors, one car, two goats.
Shows why switching gives 2/3 probability.

Output: 1080x1920 vertical video at 30fps.
"""

from manim import *

# Vertical video config
config.pixel_width = 1080
config.pixel_height = 1920
config.frame_width = 9
config.frame_height = 16
config.frame_rate = 30
config.background_color = "#0a0a1a"


class MontyHallSetup(Scene):
    """Scene 1: Show three doors, player picks door 1."""

    def construct(self):
        # Title
        title = Text("蒙提·霍尔问题", font="Noto Sans SC", font_size=56, color=WHITE)
        title.move_to(UP * 5.5)
        subtitle = Text("为什么换门更好？", font="Noto Sans SC", font_size=32, color=GREY_B)
        subtitle.next_to(title, DOWN, buff=0.3)

        self.play(Write(title), run_time=1)
        self.play(FadeIn(subtitle, shift=UP * 0.3), run_time=0.7)
        self.wait(0.5)

        # Three doors
        doors = VGroup()
        door_labels = VGroup()
        door_colors = [BLUE_D, BLUE_D, BLUE_D]

        for i in range(3):
            door = RoundedRectangle(
                corner_radius=0.15,
                width=2.2,
                height=3.5,
                fill_color=BLUE_D,
                fill_opacity=0.8,
                stroke_color=BLUE_B,
                stroke_width=3,
            )
            label = Text(f"门 {i+1}", font="Noto Sans SC", font_size=28, color=WHITE)
            label.move_to(door.get_top() + DOWN * 0.4)

            # Doorknob
            knob = Dot(radius=0.1, color=GOLD)
            knob.move_to(door.get_right() + LEFT * 0.3)

            door_group = VGroup(door, label, knob)
            doors.add(door_group)

        doors.arrange(RIGHT, buff=0.4)
        doors.move_to(UP * 0.5)

        self.play(
            *[FadeIn(d, shift=UP * 0.5, run_time=0.8) for d in doors],
            lag_ratio=0.2,
        )
        self.wait(0.5)

        # Description
        desc = Text(
            "一扇门后是汽车\n另外两扇后面是山羊",
            font="Noto Sans SC",
            font_size=28,
            color=GREY_A,
            line_spacing=1.5,
        )
        desc.move_to(DOWN * 2.5)
        self.play(FadeIn(desc, shift=UP * 0.3), run_time=0.8)
        self.wait(1)

        # Player picks door 1
        pick_text = Text("你选择了门 1", font="Noto Sans SC", font_size=36, color=GOLD)
        pick_text.move_to(DOWN * 4.5)

        # Highlight door 1
        highlight = SurroundingRectangle(
            doors[0], color=GOLD, buff=0.15, corner_radius=0.2, stroke_width=4
        )

        self.play(
            Create(highlight),
            FadeIn(pick_text, shift=UP * 0.3),
            run_time=1,
        )
        self.wait(1.5)


class MontyOpens(Scene):
    """Scene 2: Host opens door 3, showing a goat. Asks if you want to switch."""

    def construct(self):
        # Recreate state: three doors, door 1 highlighted
        doors = VGroup()
        for i in range(3):
            door = RoundedRectangle(
                corner_radius=0.15,
                width=2.2,
                height=3.5,
                fill_color=BLUE_D,
                fill_opacity=0.8,
                stroke_color=BLUE_B,
                stroke_width=3,
            )
            label = Text(f"门 {i+1}", font="Noto Sans SC", font_size=28, color=WHITE)
            label.move_to(door.get_top() + DOWN * 0.4)
            knob = Dot(radius=0.1, color=GOLD)
            knob.move_to(door.get_right() + LEFT * 0.3)
            door_group = VGroup(door, label, knob)
            doors.add(door_group)

        doors.arrange(RIGHT, buff=0.4)
        doors.move_to(UP * 0.5)

        highlight = SurroundingRectangle(
            doors[0], color=GOLD, buff=0.15, corner_radius=0.2, stroke_width=4
        )

        self.add(doors, highlight)

        # Host opens door 3
        host_text = Text(
            "主持人打开了门 3",
            font="Noto Sans SC",
            font_size=36,
            color="#ff6b6b",
        )
        host_text.move_to(UP * 5)
        self.play(FadeIn(host_text, shift=DOWN * 0.3), run_time=0.7)

        # "Open" door 3 — change color and show goat emoji
        goat = Text("🐐", font_size=80)
        goat.move_to(doors[2].get_center())

        self.play(
            doors[2][0].animate.set_fill(RED_D, opacity=0.3).set_stroke(RED, width=2),
            FadeIn(goat, scale=0.5),
            run_time=1.2,
        )
        self.wait(0.5)

        # "Behind is a goat"
        goat_text = Text(
            "后面是山羊！", font="Noto Sans SC", font_size=28, color="#ff6b6b"
        )
        goat_text.next_to(doors[2], DOWN, buff=0.5)
        self.play(FadeIn(goat_text, shift=UP * 0.2), run_time=0.5)
        self.wait(0.8)

        # The question
        question = Text(
            "你要换到门 2 吗？",
            font="Noto Sans SC",
            font_size=44,
            color=GOLD,
            weight=BOLD,
        )
        question.move_to(DOWN * 3)

        self.play(FadeIn(question, scale=1.1), run_time=1)
        self.wait(2)


class MontyProbability(Scene):
    """Scene 3: Show the probability breakdown — why switching gives 2/3."""

    def construct(self):
        title = Text("概率分析", font="Noto Sans SC", font_size=48, color=WHITE, weight=BOLD)
        title.move_to(UP * 6.5)
        self.play(Write(title), run_time=0.8)

        # Three scenarios header
        header = Text(
            "你最初选门 1 → 三种可能",
            font="Noto Sans SC",
            font_size=30,
            color=GREY_A,
        )
        header.move_to(UP * 5.5)
        self.play(FadeIn(header, shift=UP * 0.2), run_time=0.6)

        # Create three scenario rows
        scenarios = VGroup()
        scenario_data = [
            ("车在门1", "不换 → 赢", "换 → 输", GREEN, RED),
            ("车在门2", "不换 → 输", "换 → 赢", RED, GREEN),
            ("车在门3", "不换 → 输", "换 → 赢", RED, GREEN),
        ]

        for i, (situation, stay, switch, stay_c, switch_c) in enumerate(scenario_data):
            # Scenario label
            sit_text = Text(situation, font="Noto Sans SC", font_size=28, color=WHITE)

            # Stay result
            stay_text = Text(stay, font="Noto Sans SC", font_size=24, color=stay_c)

            # Switch result
            switch_text = Text(switch, font="Noto Sans SC", font_size=24, color=switch_c)

            row = VGroup(sit_text, stay_text, switch_text)
            row.arrange(DOWN, buff=0.3, aligned_edge=LEFT)

            # Background box
            bg = RoundedRectangle(
                corner_radius=0.15,
                width=6,
                height=2.4,
                fill_color="#1a1a2e",
                fill_opacity=0.8,
                stroke_color=GREY_D,
                stroke_width=1,
            )
            bg.move_to(row.get_center())

            scenario = VGroup(bg, row)
            scenarios.add(scenario)

        scenarios.arrange(DOWN, buff=0.4)
        scenarios.move_to(UP * 1.2)

        # Probability label
        prob_label = Text("概率: 各 1/3", font="Noto Sans SC", font_size=24, color=GREY_B)
        prob_label.next_to(scenarios, LEFT, buff=0.3)

        # Animate scenarios appearing
        for i, sc in enumerate(scenarios):
            self.play(FadeIn(sc, shift=RIGHT * 0.3), run_time=0.6)
            self.wait(0.3)

        self.play(FadeIn(prob_label), run_time=0.5)
        self.wait(1)

        # Summary: probability bars
        summary_title = Text("结果", font="Noto Sans SC", font_size=36, color=GOLD, weight=BOLD)
        summary_title.move_to(DOWN * 3)
        self.play(FadeIn(summary_title), run_time=0.5)

        # Stay bar: 1/3
        stay_bar_bg = Rectangle(width=6, height=0.6, fill_color=GREY_E, fill_opacity=0.5, stroke_width=0)
        stay_bar = Rectangle(width=2, height=0.6, fill_color=RED, fill_opacity=0.8, stroke_width=0)
        stay_bar.align_to(stay_bar_bg, LEFT)
        stay_label = Text("不换: 1/3", font="Noto Sans SC", font_size=24, color=WHITE)
        stay_group = VGroup(stay_bar_bg, stay_bar)
        stay_label.next_to(stay_group, LEFT, buff=0.3)

        # Switch bar: 2/3
        switch_bar_bg = Rectangle(width=6, height=0.6, fill_color=GREY_E, fill_opacity=0.5, stroke_width=0)
        switch_bar = Rectangle(width=4, height=0.6, fill_color=GREEN, fill_opacity=0.8, stroke_width=0)
        switch_bar.align_to(switch_bar_bg, LEFT)
        switch_label = Text("换门: 2/3", font="Noto Sans SC", font_size=24, color=WHITE)
        switch_group = VGroup(switch_bar_bg, switch_bar)
        switch_label.next_to(switch_group, LEFT, buff=0.3)

        bars = VGroup(
            VGroup(stay_label, stay_group),
            VGroup(switch_label, switch_group),
        )
        bars.arrange(DOWN, buff=0.5)
        bars.move_to(DOWN * 4.8)

        # Animate bars growing
        stay_bar_anim = stay_bar.copy().set_width(0.01).align_to(stay_bar_bg, LEFT)
        switch_bar_anim = switch_bar.copy().set_width(0.01).align_to(switch_bar_bg, LEFT)

        self.play(
            FadeIn(stay_bar_bg), FadeIn(switch_bar_bg),
            FadeIn(stay_label), FadeIn(switch_label),
            run_time=0.5
        )

        self.play(
            GrowFromEdge(stay_bar, LEFT),
            GrowFromEdge(switch_bar, LEFT),
            run_time=1.5,
        )
        self.wait(0.5)

        # Final conclusion
        conclusion = Text(
            "换门赢的概率是不换的两倍！",
            font="Noto Sans SC",
            font_size=36,
            color=GOLD,
            weight=BOLD,
        )
        conclusion.move_to(DOWN * 6.5)
        self.play(FadeIn(conclusion, scale=1.1), run_time=1)
        self.wait(2)


class MontyIntuition(Scene):
    """Scene 4: The intuition — extend to 100 doors to make it obvious."""

    def construct(self):
        title = Text("直觉理解", font="Noto Sans SC", font_size=48, color=WHITE, weight=BOLD)
        title.move_to(UP * 6.5)
        self.play(Write(title), run_time=0.8)

        # Imagine 100 doors
        prompt = Text(
            "想象一下：100 扇门",
            font="Noto Sans SC",
            font_size=36,
            color=GREY_A,
        )
        prompt.move_to(UP * 5)
        self.play(FadeIn(prompt, shift=UP * 0.2), run_time=0.7)

        # Show a grid of small doors
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

        self.play(FadeIn(small_doors, lag_ratio=0.005), run_time=1.5)
        self.wait(0.5)

        # You pick one
        pick_text = Text("你选了一扇", font="Noto Sans SC", font_size=28, color=GOLD)
        pick_text.move_to(DOWN * 2.5)
        self.play(FadeIn(pick_text), run_time=0.5)

        # Highlight door 0
        small_doors[0].set_fill(GOLD, opacity=0.9)
        small_doors[0].set_stroke(GOLD, width=3)
        self.play(Flash(small_doors[0], color=GOLD), run_time=0.5)
        self.wait(0.5)

        # Host opens 98 doors
        open_text = Text(
            "主持人打开了 98 扇山羊门",
            font="Noto Sans SC",
            font_size=28,
            color="#ff6b6b",
        )
        open_text.move_to(DOWN * 2.5)
        self.play(ReplacementTransform(pick_text, open_text), run_time=0.5)

        # Fade out 98 doors (keep 0 and 42)
        anims = []
        for i in range(100):
            if i == 0 or i == 42:
                continue
            anims.append(small_doors[i].animate.set_fill(RED_D, opacity=0.15).set_stroke(RED_D, width=0.5))

        self.play(*anims, run_time=2)
        self.wait(0.5)

        # Highlight the remaining unchosen door
        small_doors[42].set_fill(GREEN, opacity=0.9)
        small_doors[42].set_stroke(GREEN, width=3)
        self.play(Flash(small_doors[42], color=GREEN), run_time=0.5)

        # Question
        question = Text(
            "只剩你选的那扇，和这一扇\n你还觉得不用换吗？",
            font="Noto Sans SC",
            font_size=32,
            color=GOLD,
            line_spacing=1.5,
            weight=BOLD,
        )
        question.move_to(DOWN * 4.5)
        self.play(FadeIn(question, scale=1.05), run_time=1)
        self.wait(2)

        # Conclusion
        final = Text(
            "换！概率是 99/100",
            font="Noto Sans SC",
            font_size=44,
            color=GREEN,
            weight=BOLD,
        )
        final.move_to(DOWN * 6.5)
        self.play(FadeIn(final, shift=UP * 0.3), run_time=1)
        self.wait(2)
