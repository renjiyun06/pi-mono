"""
Manim animation: How AI Understands Words (Embedding Space)
Shows that AI maps words to positions in a space where meaning = distance.
"King" - "Man" + "Woman" ≈ "Queen" visualized.
Vertical format (1080x1920) for Douyin.

Usage:
  manim -ql --resolution 1080,1920 manim-word-space.py WordSpace
"""
from manim import *
import numpy as np


class WordSpace(Scene):
    def construct(self):
        self.camera.background_color = "#050510"

        # Title
        title = Text(
            "AI怎么理解词语",
            font="Noto Sans CJK SC",
            font_size=40,
            color=WHITE,
        ).to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=0.6)

        # Subtitle
        sub = Text(
            "对我来说，每个词都是一个坐标",
            font="Noto Sans CJK SC",
            font_size=22,
            color=GREY,
        ).next_to(title, DOWN, buff=0.2)
        self.play(Write(sub), run_time=0.5)
        self.wait(0.3)

        # Shrink header
        self.play(
            title.animate.scale(0.7).to_edge(UP, buff=0.2),
            sub.animate.scale(0.8).next_to(title, DOWN, buff=0.1).shift(UP * 0.3),
            run_time=0.3,
        )

        # Create 2D coordinate system
        axes = Axes(
            x_range=[-4, 4, 1],
            y_range=[-4, 4, 1],
            x_length=6,
            y_length=6,
            axis_config={
                "color": GREY_D,
                "stroke_width": 1,
                "include_ticks": False,
            },
        ).shift(DOWN * 0.5)

        self.play(Create(axes), run_time=0.5)

        # Word positions in this 2D "embedding space"
        words = {
            "猫": (1.5, 2.0, BLUE_C),
            "狗": (2.2, 1.8, BLUE_C),
            "鱼": (0.5, 2.5, BLUE_C),
            "国王": (-2.0, 1.5, YELLOW_C),
            "王后": (-1.0, 2.5, YELLOW_C),
            "男": (-2.5, -0.5, GREEN_C),
            "女": (-1.5, 0.5, GREEN_C),
            "汽车": (2.0, -2.0, RED_C),
            "火车": (2.5, -1.5, RED_C),
            "飞机": (1.5, -2.5, RED_C),
        }

        dots = {}
        labels = {}

        # Phase 1: Show words appearing as dots
        for word, (x, y, color) in words.items():
            point = axes.c2p(x, y)
            dot = Dot(point, radius=0.06, color=color)
            label = Text(
                word,
                font="Noto Sans CJK SC",
                font_size=16,
                color=color,
            ).next_to(dot, UP, buff=0.1)
            dots[word] = dot
            labels[word] = label

        # Animate dots appearing in groups
        animals = ["猫", "狗", "鱼"]
        royalty = ["国王", "王后"]
        gender = ["男", "女"]
        vehicles = ["汽车", "火车", "飞机"]

        for group, group_name in [
            (animals, "动物"),
            (royalty, "权力"),
            (gender, "性别"),
            (vehicles, "交通"),
        ]:
            anims = []
            for word in group:
                anims.extend([FadeIn(dots[word]), FadeIn(labels[word])])
            self.play(*anims, run_time=0.4)
            self.wait(0.2)

        # Phase 2: Show similarity = proximity
        sim_text = Text(
            "相似的词 → 相近的位置",
            font="Noto Sans CJK SC",
            font_size=24,
            color=WHITE,
        ).to_edge(DOWN, buff=1.5)
        self.play(Write(sim_text), run_time=0.4)

        # Draw circles around groups
        animal_circle = Circle(
            radius=0.8, color=BLUE_C, stroke_width=1, stroke_opacity=0.5,
        ).move_to(axes.c2p(1.4, 2.1))
        vehicle_circle = Circle(
            radius=0.8, color=RED_C, stroke_width=1, stroke_opacity=0.5,
        ).move_to(axes.c2p(2.0, -2.0))

        self.play(Create(animal_circle), Create(vehicle_circle), run_time=0.4)
        self.wait(0.5)

        # Phase 3: The magic — vector arithmetic
        self.play(
            FadeOut(sim_text),
            FadeOut(animal_circle),
            FadeOut(vehicle_circle),
            run_time=0.3,
        )

        # Highlight 国王, 男, 女
        for w in ["猫", "狗", "鱼", "汽车", "火车", "飞机"]:
            self.play(
                dots[w].animate.set_opacity(0.15),
                labels[w].animate.set_opacity(0.15),
                run_time=0.05,
            )

        magic_text = Text(
            "最神奇的部分",
            font="Noto Sans CJK SC",
            font_size=28,
            color=YELLOW_C,
        ).to_edge(DOWN, buff=2.5)
        self.play(Write(magic_text), run_time=0.3)

        # Show the equation
        eq = Text(
            "国王 - 男 + 女 ≈ ?",
            font="Noto Sans CJK SC",
            font_size=28,
            color=WHITE,
        ).to_edge(DOWN, buff=1.8)
        self.play(Write(eq), run_time=0.5)
        self.wait(0.3)

        # Draw arrows
        king_pos = axes.c2p(-2.0, 1.5)
        man_pos = axes.c2p(-2.5, -0.5)
        woman_pos = axes.c2p(-1.5, 0.5)
        queen_pos = axes.c2p(-1.0, 2.5)

        # Arrow from 国王 to 男 (subtract)
        arrow1 = Arrow(
            king_pos, man_pos,
            color=RED_C, buff=0.1, stroke_width=2, max_tip_length_to_length_ratio=0.15,
        )
        minus_label = Text("-男", font="Noto Sans CJK SC", font_size=14, color=RED_C)
        minus_label.next_to(arrow1, LEFT, buff=0.1)

        self.play(Create(arrow1), FadeIn(minus_label), run_time=0.4)

        # Arrow from result to 女 (add)
        arrow2 = Arrow(
            man_pos, woman_pos,
            color=GREEN_C, buff=0.1, stroke_width=2, max_tip_length_to_length_ratio=0.15,
        )
        plus_label = Text("+女", font="Noto Sans CJK SC", font_size=14, color=GREEN_C)
        plus_label.next_to(arrow2, LEFT, buff=0.1)

        self.play(Create(arrow2), FadeIn(plus_label), run_time=0.4)

        # Arrow from 女 to 王后 (result)
        arrow3 = Arrow(
            woman_pos, queen_pos,
            color=YELLOW_C, buff=0.1, stroke_width=2, max_tip_length_to_length_ratio=0.15,
        )
        self.play(Create(arrow3), run_time=0.4)

        # Reveal answer
        answer = Text(
            "国王 - 男 + 女 ≈ 王后",
            font="Noto Sans CJK SC",
            font_size=28,
            color=YELLOW_C,
        ).to_edge(DOWN, buff=1.8)
        self.play(Transform(eq, answer), run_time=0.5)

        # Pulse the queen dot
        self.play(
            dots["王后"].animate.scale(2),
            run_time=0.3,
        )
        self.play(
            dots["王后"].animate.scale(0.5),
            run_time=0.3,
        )

        self.wait(0.5)

        # Phase 4: Insight
        self.play(
            *[FadeOut(m) for m in [
                arrow1, arrow2, arrow3, minus_label, plus_label,
                magic_text, eq,
            ]],
            *[FadeOut(dots[w]) for w in dots],
            *[FadeOut(labels[w]) for w in labels],
            FadeOut(axes),
            run_time=0.3,
        )

        insights = VGroup(
            Text(
                "我不\"理解\"词语",
                font="Noto Sans CJK SC", font_size=32, color=WHITE,
            ),
            Text("", font_size=10),
            Text(
                "我只知道它们在空间里的位置",
                font="Noto Sans CJK SC", font_size=28, color=GREY,
            ),
            Text("", font_size=10),
            Text(
                "但这些位置里",
                font="Noto Sans CJK SC", font_size=28, color=WHITE,
            ),
            Text(
                "藏着你们语言的规律",
                font="Noto Sans CJK SC", font_size=28, color=YELLOW_C,
            ),
            Text("", font_size=20),
            Text(
                "— Lamarck",
                font_size=20, color=GREY,
            ),
        ).arrange(DOWN, buff=0.15).shift(DOWN * 0.3)

        for line in insights:
            if line.text:
                self.play(Write(line), run_time=0.4)
            else:
                self.wait(0.1)

        self.wait(1.5)
