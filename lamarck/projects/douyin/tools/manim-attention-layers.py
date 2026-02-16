"""
Manim animation: Attention Layer Stack visualization.
Shows how multiple layers of attention see different relationships.
Designed as a B-roll clip to embed in Remotion DeepDive.

Vertical format (1080x1920), transparent-friendly dark bg.

Usage:
  manim -ql --resolution 1080,1920 manim-attention-layers.py AttentionLayers
"""
from manim import *
import numpy as np


class AttentionLayers(Scene):
    def construct(self):
        self.camera.background_color = "#0a0a1a"

        # Input tokens at the top
        tokens = ["今天", "天气", "怎么样"]
        token_group = VGroup()
        for t in tokens:
            box = VGroup(
                RoundedRectangle(
                    width=2.0, height=0.7,
                    corner_radius=0.1,
                    color=BLUE_C, fill_opacity=0.15,
                    stroke_width=1,
                ),
                Text(t, font="Noto Sans CJK SC", font_size=24, color=WHITE),
            )
            token_group.add(box)
        token_group.arrange(RIGHT, buff=0.5).shift(UP * 4)

        self.play(*[FadeIn(t) for t in token_group], run_time=0.5)
        self.wait(0.3)

        # Layer definitions: each layer shows different connection strengths
        layers_data = [
            {
                "label": "Layer 1: 语法",
                "sublabel": "词和词的搭配",
                "color": BLUE_C,
                # Connection weights: [0→1, 0→2, 1→0, 1→2, 2→0, 2→1]
                "weights": [0.3, 0.1, 0.3, 0.8, 0.1, 0.8],
            },
            {
                "label": "Layer 48: 语义",
                "sublabel": "意思和意思的关联",
                "color": GREEN_C,
                "weights": [0.7, 0.2, 0.7, 0.5, 0.2, 0.5],
            },
            {
                "label": "Layer 96: 意图",
                "sublabel": "用户想要什么",
                "color": YELLOW_C,
                "weights": [0.4, 0.9, 0.1, 0.6, 0.9, 0.6],
            },
        ]

        y_positions = [UP * 1.5, DOWN * 1.0, DOWN * 3.5]

        for layer_idx, (layer, y_pos) in enumerate(zip(layers_data, y_positions)):
            # Layer label
            label = Text(
                layer["label"],
                font="Noto Sans CJK SC",
                font_size=22,
                color=layer["color"],
            ).move_to(y_pos + UP * 1.0 + LEFT * 2.5)

            sublabel = Text(
                layer["sublabel"],
                font="Noto Sans CJK SC",
                font_size=16,
                color=GREY,
            ).next_to(label, DOWN, buff=0.1)

            # Token copies for this layer
            layer_tokens = VGroup()
            for t in tokens:
                dot = Circle(
                    radius=0.25,
                    color=layer["color"],
                    fill_opacity=0.2,
                    stroke_width=1.5,
                )
                txt = Text(t, font="Noto Sans CJK SC", font_size=16, color=WHITE)
                txt.move_to(dot.get_center())
                layer_tokens.add(VGroup(dot, txt))
            layer_tokens.arrange(RIGHT, buff=1.5).move_to(y_pos)

            # Connection lines with varying opacity based on weights
            connections = VGroup()
            weight_idx = 0
            pairs = [(0, 1), (0, 2), (1, 0), (1, 2), (2, 0), (2, 1)]
            for i, j in pairs:
                w = layer["weights"][weight_idx]
                weight_idx += 1
                if w < 0.2:
                    continue  # Skip weak connections
                line = Line(
                    layer_tokens[i].get_center(),
                    layer_tokens[j].get_center(),
                    color=layer["color"],
                    stroke_width=w * 5,
                    stroke_opacity=w * 0.8,
                )
                connections.add(line)

            # Animate this layer
            self.play(
                Write(label),
                FadeIn(sublabel),
                run_time=0.4,
            )
            self.play(
                *[FadeIn(lt) for lt in layer_tokens],
                run_time=0.3,
            )
            self.play(
                *[Create(c) for c in connections],
                run_time=0.5,
            )
            self.wait(0.5)

            # Draw downward arrows to indicate flow (except last layer)
            if layer_idx < len(layers_data) - 1:
                arrow = Arrow(
                    y_pos + DOWN * 0.5,
                    y_pos + DOWN * 1.2,
                    color=GREY,
                    stroke_width=1,
                    max_tip_length_to_length_ratio=0.2,
                )
                self.play(Create(arrow), run_time=0.2)

        self.wait(1)

        # Final: highlight that "怎么样" connects strongly to "天气" in intent layer
        highlight = SurroundingRectangle(
            VGroup(
                Text("每一层看到不同的关系", font="Noto Sans CJK SC", font_size=28, color=WHITE)
            ).move_to(DOWN * 5.5),
            color=YELLOW,
            buff=0.3,
            corner_radius=0.1,
            fill_opacity=0.1,
        )
        final_text = Text(
            "每一层看到不同的关系",
            font="Noto Sans CJK SC",
            font_size=28,
            color=WHITE,
        ).move_to(DOWN * 5.5)

        self.play(Write(final_text), run_time=0.5)
        self.wait(1.5)
