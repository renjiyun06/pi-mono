"""
Manim animation: Knowledge graph fragmentation (cognitive debt).
A connected knowledge graph progressively loses edges as AI replaces understanding.
Vertical format (1080x1920).

Usage:
  manim -qm --resolution 1080,1920 manim-cognitive-debt.py CognitiveDebt
"""
from manim import *
import random


class CognitiveDebt(Scene):
    def construct(self):
        self.camera.background_color = "#0a0a1a"
        random.seed(42)

        # Phase 1: Build a healthy knowledge graph
        title = Text(
            "你对项目的理解", font="Noto Sans CJK SC", font_size=24, color=WHITE
        ).to_edge(UP, buff=0.8)
        self.play(Write(title), run_time=0.4)

        # Node labels representing understanding
        labels = [
            "架构", "数据库", "API", "前端",
            "部署", "权限", "缓存", "日志",
            "测试", "配置",
        ]

        # Layout in a rough circle
        positions = [
            [-1.5, 2.0, 0], [1.5, 2.0, 0],
            [-2.5, 0.5, 0], [2.5, 0.5, 0],
            [-1.5, -1.0, 0], [1.5, -1.0, 0],
            [-2.5, -2.0, 0], [2.5, -2.0, 0],
            [0, 1.2, 0], [0, -0.5, 0],
        ]

        nodes = VGroup()
        node_labels = VGroup()
        for i, (label, pos) in enumerate(zip(labels, positions)):
            circle = Circle(radius=0.35, fill_color="#1a365d", fill_opacity=0.8,
                          stroke_color="#00d4ff", stroke_width=2)
            circle.move_to(pos)
            txt = Text(label, font="Noto Sans CJK SC", font_size=14, color=WHITE)
            txt.move_to(pos)
            nodes.add(circle)
            node_labels.add(txt)

        # Edges (connections between knowledge areas)
        edge_pairs = [
            (0, 2), (0, 8), (1, 3), (1, 8), (2, 4), (2, 9),
            (3, 5), (3, 9), (4, 6), (5, 7), (6, 9), (7, 9),
            (8, 9), (0, 1), (4, 5), (6, 7), (2, 6), (3, 7),
        ]

        edges = VGroup()
        for i, j in edge_pairs:
            line = Line(
                positions[i], positions[j],
                color="#00d4ff", stroke_width=1.5, stroke_opacity=0.4
            )
            edges.add(line)

        # Animate building the graph
        self.play(
            *[FadeIn(n, scale=0.5) for n in nodes],
            *[FadeIn(l) for l in node_labels],
            run_time=0.8
        )
        self.play(
            *[Create(e) for e in edges],
            run_time=0.6
        )

        # Phase 1 label
        phase1 = Text(
            "Week 1: 你理解整个系统",
            font="Noto Sans CJK SC", font_size=18, color="#4ade80"
        ).to_edge(DOWN, buff=1.5)
        self.play(FadeIn(phase1), run_time=0.3)
        self.wait(0.8)

        # Phase 2: AI starts replacing understanding — edges fade
        self.play(FadeOut(phase1), run_time=0.2)
        phase2 = Text(
            "Week 4: AI 帮你写了几个模块",
            font="Noto Sans CJK SC", font_size=18, color="#fbbf24"
        ).to_edge(DOWN, buff=1.5)
        self.play(FadeIn(phase2), run_time=0.3)

        # Fade out some edges (losing connections)
        fade_edges_1 = [edges[i] for i in [1, 5, 10, 14, 16]]
        fade_nodes_1 = [6, 9]  # 缓存, 配置 — dimmed
        self.play(
            *[e.animate.set_opacity(0.08) for e in fade_edges_1],
            *[nodes[i].animate.set_fill(color="#1a1a2e", opacity=0.4) for i in fade_nodes_1],
            *[node_labels[i].animate.set_opacity(0.3) for i in fade_nodes_1],
            run_time=0.8
        )
        self.wait(0.5)

        # Phase 3: More AI, more fragmentation
        self.play(FadeOut(phase2), run_time=0.2)
        phase3 = Text(
            "Week 7: AI 帮你做了大部分决策",
            font="Noto Sans CJK SC", font_size=18, color="#f97316"
        ).to_edge(DOWN, buff=1.5)
        self.play(FadeIn(phase3), run_time=0.3)

        fade_edges_2 = [edges[i] for i in [0, 3, 6, 8, 12, 17]]
        fade_nodes_2 = [2, 3, 4, 5]  # API, 前端, 部署, 权限
        self.play(
            *[e.animate.set_opacity(0.08) for e in fade_edges_2],
            *[nodes[i].animate.set_fill(color="#1a1a2e", opacity=0.4) for i in fade_nodes_2],
            *[node_labels[i].animate.set_opacity(0.3) for i in fade_nodes_2],
            run_time=0.8
        )
        self.wait(0.5)

        # Phase 4: Almost all edges gone
        self.play(FadeOut(phase3), run_time=0.2)
        phase4 = Text(
            "Week 8: 你改了一行代码，全崩了",
            font="Noto Sans CJK SC", font_size=18, color="#ef4444"
        ).to_edge(DOWN, buff=1.5)
        self.play(FadeIn(phase4), run_time=0.3)

        already_faded = {1, 5, 10, 14, 16, 0, 3, 6, 8, 12, 17}
        remaining_indices = [i for i in range(len(edges)) if i not in already_faded]
        remaining_edges = [edges[i] for i in remaining_indices]
        remaining_nodes = [0, 1, 7, 8]
        self.play(
            *[e.animate.set_opacity(0.08) for e in remaining_edges],
            *[nodes[i].animate.set_fill(color="#1a1a2e", opacity=0.4) for i in remaining_nodes],
            *[node_labels[i].animate.set_opacity(0.3) for i in remaining_nodes],
            run_time=0.8
        )

        # Pulse the crash
        crash_flash = Rectangle(
            width=8, height=12,
            fill_color="#ef4444", fill_opacity=0.15,
            stroke_width=0
        )
        self.play(FadeIn(crash_flash, run_time=0.15))
        self.play(FadeOut(crash_flash, run_time=0.3))
        self.wait(0.5)

        # Final label
        self.play(FadeOut(phase4), run_time=0.2)
        final = Text(
            "代码没变，你的理解碎了",
            font="Noto Sans CJK SC", font_size=22, color="#ef4444",
            weight=BOLD
        ).to_edge(DOWN, buff=1.5)
        self.play(FadeIn(final), run_time=0.4)
        self.wait(1.5)
