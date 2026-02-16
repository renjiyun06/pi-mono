"""
Manim animation: Attention Grid — shows which tokens attend to which.
Visualizes as a heatmap grid for "今天天气怎么样".
Vertical format (1080x1920).

Usage:
  manim -ql --resolution 1080,1920 manim-attention-grid.py AttentionGrid
"""
from manim import *
import numpy as np


class AttentionGrid(Scene):
    def construct(self):
        self.camera.background_color = "#0a0a1a"

        tokens = ["今天", "天气", "怎", "么", "样"]
        n = len(tokens)

        # Simulated attention weights (row = query, col = key)
        # "天气" attends strongly to "今天", "怎么样" attends to "天气"
        weights = np.array([
            [0.60, 0.20, 0.08, 0.06, 0.06],  # 今天
            [0.35, 0.40, 0.10, 0.08, 0.07],  # 天气 attends to 今天
            [0.05, 0.30, 0.30, 0.20, 0.15],  # 怎 attends to 天气
            [0.04, 0.15, 0.25, 0.35, 0.21],  # 么
            [0.03, 0.25, 0.15, 0.20, 0.37],  # 样 attends to 天气
        ])

        title = Text(
            "注意力矩阵",
            font="Noto Sans CJK SC",
            font_size=32,
            color=WHITE,
        ).to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=0.5)

        cell_size = 1.1
        grid_center = ORIGIN + DOWN * 1.0

        # Column labels (keys) at top
        col_labels = VGroup()
        for j, tok in enumerate(tokens):
            label = Text(
                tok, font="Noto Sans CJK SC", font_size=20, color=GREY_B,
            ).move_to(
                grid_center
                + RIGHT * (j - n / 2 + 0.5) * cell_size
                + UP * (n / 2 + 0.3) * cell_size
            )
            col_labels.add(label)

        # Row labels (queries) on left
        row_labels = VGroup()
        for i, tok in enumerate(tokens):
            label = Text(
                tok, font="Noto Sans CJK SC", font_size=20, color=GREY_B,
            ).move_to(
                grid_center
                + LEFT * (n / 2 + 0.5) * cell_size
                + DOWN * (i - n / 2 + 0.5) * cell_size
            )
            row_labels.add(label)

        # Key/Query labels
        key_label = Text(
            "Key →", font="Noto Sans CJK SC", font_size=16, color=GREY,
        ).next_to(col_labels, LEFT, buff=0.5).shift(UP * 0.3)

        query_label = Text(
            "Query ↓", font="Noto Sans CJK SC", font_size=16, color=GREY,
        ).next_to(row_labels, UP, buff=0.3).shift(LEFT * 0.3)

        self.play(
            FadeIn(col_labels), FadeIn(row_labels),
            FadeIn(key_label), FadeIn(query_label),
            run_time=0.5,
        )

        # Animate cells row by row
        cells = VGroup()
        for i in range(n):
            for j in range(n):
                w = weights[i][j]
                color = interpolate_color(
                    ManimColor("#0a0a1a"),
                    ManimColor("#00d4ff"),
                    w,
                )
                cell = Square(
                    side_length=cell_size * 0.9,
                    fill_color=color,
                    fill_opacity=0.8,
                    stroke_color=WHITE,
                    stroke_width=0.5,
                    stroke_opacity=0.3,
                ).move_to(
                    grid_center
                    + RIGHT * (j - n / 2 + 0.5) * cell_size
                    + DOWN * (i - n / 2 + 0.5) * cell_size
                )
                # Weight text
                w_text = Text(
                    f"{w:.2f}",
                    font_size=14,
                    color=WHITE if w > 0.2 else GREY,
                ).move_to(cell.get_center())
                cells.add(VGroup(cell, w_text))

            # Animate this row
            row_start = i * n
            row_end = (i + 1) * n
            self.play(
                *[FadeIn(cells[k]) for k in range(row_start, row_end)],
                run_time=0.4,
            )

        self.wait(0.5)

        # Highlight the strong connections
        highlight_text = Text(
            "「天气」强烈关注「今天」",
            font="Noto Sans CJK SC",
            font_size=24,
            color="#00d4ff",
        ).shift(DOWN * 4.5)
        self.play(Write(highlight_text), run_time=0.5)
        self.wait(2)
