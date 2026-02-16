"""
Manim animation driven by JSON config.
Takes a config file path as environment variable MANIM_CONFIG.
Renders different visualizations based on config type.

Supported types:
  - "bar_chart": animated bar chart with labels and values
  - "dual_curve": two opposing curves (like debt accumulation)
  - "network": node-edge graph with optional dimming

Usage:
  MANIM_CONFIG=config.json manim -qm --resolution 1080,1920 manim-from-config.py ConfigScene
"""
import json
import os
import sys

import numpy as np
from manim import *


def load_config():
    path = os.environ.get("MANIM_CONFIG", "manim-config.json")
    with open(path) as f:
        return json.load(f)


class ConfigScene(Scene):
    def construct(self):
        self.camera.background_color = "#0a0a1a"
        config = load_config()
        scene_type = config.get("type", "bar_chart")

        if scene_type == "bar_chart":
            self.render_bar_chart(config)
        elif scene_type == "dual_curve":
            self.render_dual_curve(config)
        elif scene_type == "network":
            self.render_network(config)
        else:
            raise ValueError(f"Unknown scene type: {scene_type}")

    def render_bar_chart(self, config):
        title = config.get("title", "")
        labels = config.get("labels", [])
        values = config.get("values", [])
        accent = config.get("accent", "#00d4ff")
        unit = config.get("unit", "")

        if title:
            t = Text(title, font="Noto Sans CJK SC", font_size=24, color=WHITE)
            t.to_edge(UP, buff=0.8)
            self.play(Write(t), run_time=0.4)

        max_val = max(values) if values else 1
        bar_width = min(0.8, 5.0 / len(values)) if values else 0.8
        total_width = len(values) * (bar_width + 0.3)
        start_x = -total_width / 2

        bars = VGroup()
        bar_labels = VGroup()
        val_labels = VGroup()

        for i, (label, val) in enumerate(zip(labels, values)):
            height = (val / max_val) * 3.0
            x = start_x + i * (bar_width + 0.3) + bar_width / 2

            bar = Rectangle(
                width=bar_width, height=height,
                color=accent, fill_opacity=0.7, stroke_width=1
            ).move_to(np.array([x, -1.5 + height / 2, 0]))

            lbl = Text(
                label, font="Noto Sans CJK SC", font_size=12, color=WHITE
            ).move_to(np.array([x, -1.5 - 0.3, 0]))

            vlbl = Text(
                f"{val}{unit}", font_size=14, color=accent
            ).move_to(np.array([x, -1.5 + height + 0.25, 0]))

            bars.add(bar)
            bar_labels.add(lbl)
            val_labels.add(vlbl)

        self.play(FadeIn(bar_labels), run_time=0.3)
        self.play(
            *[GrowFromEdge(bar, DOWN) for bar in bars],
            run_time=1.5,
            lag_ratio=0.15
        )
        self.play(FadeIn(val_labels), run_time=0.3)

        # Highlight max bar
        max_idx = values.index(max(values))
        highlight = SurroundingRectangle(
            bars[max_idx], color="#fbbf24", stroke_width=2, buff=0.08
        )
        self.play(Create(highlight), run_time=0.3)
        self.wait(1.5)

    def render_dual_curve(self, config):
        title = config.get("title", "")
        curve_a_label = config.get("curve_a_label", "A")
        curve_b_label = config.get("curve_b_label", "B")
        color_a = config.get("color_a", "#00d4ff")
        color_b = config.get("color_b", "#e94560")
        x_label = config.get("x_label", "时间")
        y_label = config.get("y_label", "%")
        decay_rate = config.get("decay_rate", 0.2)

        if title:
            t = Text(title, font="Noto Sans CJK SC", font_size=24, color=WHITE)
            t.to_edge(UP, buff=0.8)
            self.play(Write(t), run_time=0.4)

        axes = Axes(
            x_range=[0, 12, 2], y_range=[0, 100, 20],
            x_length=6, y_length=4,
            axis_config={"color": WHITE, "stroke_width": 1.5, "include_numbers": False},
            tips=False
        ).shift(DOWN * 0.5)

        xl = Text(x_label, font="Noto Sans CJK SC", font_size=16, color=WHITE)
        xl.next_to(axes.x_axis, DOWN, buff=0.3)
        yl = Text(y_label, font="Noto Sans CJK SC", font_size=16, color=WHITE)
        yl.next_to(axes.y_axis, LEFT, buff=0.3).shift(UP * 0.5)

        self.play(Create(axes), FadeIn(xl), FadeIn(yl), run_time=0.6)

        tracker = ValueTracker(0)

        def func_a(x):
            return 90 * np.exp(-decay_rate * x)

        def func_b(x):
            return 90 * (1 - np.exp(-decay_rate * x))

        ca = always_redraw(lambda: axes.plot(
            func_a, x_range=[0, tracker.get_value(), 0.05],
            color=color_a, stroke_width=3
        ))
        cb = always_redraw(lambda: axes.plot(
            func_b, x_range=[0, tracker.get_value(), 0.05],
            color=color_b, stroke_width=3
        ))

        la = Text(curve_a_label, font="Noto Sans CJK SC", font_size=16, color=color_a)
        la.next_to(axes.c2p(1, 85), RIGHT, buff=0.3)
        lb = Text(curve_b_label, font="Noto Sans CJK SC", font_size=16, color=color_b)
        lb.next_to(axes.c2p(1, 10), RIGHT, buff=0.3)

        self.add(ca, cb)
        self.play(FadeIn(la), FadeIn(lb), run_time=0.3)
        self.play(tracker.animate.set_value(12), run_time=4, rate_func=linear)
        self.wait(1.5)

    def render_network(self, config):
        title = config.get("title", "")
        nodes = config.get("nodes", [])  # [{name, x, y}]
        edges = config.get("edges", [])  # [[from_idx, to_idx]]
        accent = config.get("accent", "#00d4ff")
        dim_after = config.get("dim_after", None)  # frame count after which to dim

        if title:
            t = Text(title, font="Noto Sans CJK SC", font_size=24, color=WHITE)
            t.to_edge(UP, buff=0.8)
            self.play(Write(t), run_time=0.4)

        dots = VGroup()
        labels = VGroup()
        for node in nodes:
            dot = Dot(
                point=np.array([node["x"], node["y"], 0]),
                color=accent, radius=0.1
            )
            label = Text(
                node["name"], font="Noto Sans CJK SC", font_size=14, color=WHITE
            ).next_to(dot, DOWN, buff=0.15)
            dots.add(dot)
            labels.add(label)

        lines = VGroup()
        for edge in edges:
            line = Line(
                dots[edge[0]].get_center(), dots[edge[1]].get_center(),
                color=accent, stroke_width=1, stroke_opacity=0.4
            )
            lines.add(line)

        self.play(
            *[FadeIn(d) for d in dots],
            *[FadeIn(l) for l in labels],
            run_time=0.5
        )
        self.play(
            *[Create(l) for l in lines],
            run_time=1.0, lag_ratio=0.05
        )

        if dim_after is not None:
            self.wait(dim_after / 30)  # convert frames to seconds at 30fps
            self.play(
                *[d.animate.set_opacity(0.15) for d in dots],
                *[l.animate.set_opacity(0.1) for l in labels],
                *[l.animate.set_opacity(0.05) for l in lines],
                run_time=1.5
            )

        self.wait(1.5)
