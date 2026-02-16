"""
Decision Atrophy — animated bar chart showing decision-making capacity
declining over 3 weeks when all choices are delegated to AI.

Vertical 1080x1920, dark theme, orange accent (#ff6b35).
"""
from manim import *

config.pixel_width = 1080
config.pixel_height = 1920
config.frame_width = 6.0
config.frame_height = 10.67
config.frame_rate = 30
config.background_color = "#0a0a0a"

class DecisionAtrophy(Scene):
    def construct(self):
        accent = "#ff6b35"
        dim = "#333333"
        
        # Title
        title = Text("决策能力", font_size=36, color=WHITE).to_edge(UP, buff=1.5)
        self.play(Write(title), run_time=0.8)
        
        # Y-axis
        max_height = 5.0
        y_axis = Line(
            start=DOWN * 2.5, end=UP * 3.0,
            color="#444444", stroke_width=2
        ).shift(LEFT * 2.2)
        
        # Week labels
        weeks = ["第0天", "第1周", "第2周", "第3周"]
        week_labels = VGroup()
        bars = VGroup()
        
        # Bar values (relative to 100%)
        values = [1.0, 0.95, 0.6, 0.25]
        colors = ["#22c55e", "#22c55e", "#eab308", "#ef4444"]
        
        bar_width = 0.8
        spacing = 1.2
        start_x = -1.8
        
        for i, (week, val, col) in enumerate(zip(weeks, values, colors)):
            x = start_x + i * spacing
            
            # Bar
            bar_height = val * max_height
            bar = Rectangle(
                width=bar_width,
                height=bar_height,
                fill_color=col,
                fill_opacity=0.8,
                stroke_width=0,
            ).move_to(DOWN * 2.5 + UP * bar_height / 2 + RIGHT * x)
            
            # Label
            label = Text(week, font_size=20, color="#888888").next_to(
                DOWN * 2.5 + RIGHT * x, DOWN, buff=0.3
            )
            
            # Percentage
            pct = Text(f"{int(val*100)}%", font_size=24, color=WHITE).next_to(bar, UP, buff=0.15)
            
            week_labels.add(label)
            bars.add(VGroup(bar, pct))
        
        # Animate bars appearing one by one
        self.play(
            *[Write(l) for l in week_labels],
            run_time=0.6
        )
        
        for i, bar_group in enumerate(bars):
            bar, pct = bar_group
            self.play(
                GrowFromEdge(bar, DOWN),
                FadeIn(pct, shift=UP * 0.2),
                run_time=0.8 if i == 0 else 0.6
            )
            if i > 0:
                self.wait(0.3)
        
        # Arrow showing decline
        arrow = CurvedArrow(
            bars[0][0].get_top() + UP * 0.5,
            bars[3][0].get_top() + UP * 0.5,
            color=accent,
            angle=-0.5,
        )
        decline_text = Text(
            "越不用 → 越不想用",
            font_size=28,
            color=accent
        ).next_to(arrow, UP, buff=0.3)
        
        self.play(
            Create(arrow),
            Write(decline_text),
            run_time=1.0
        )
        
        self.wait(1.5)
        
        # Fade everything
        self.play(
            *[FadeOut(m) for m in self.mobjects],
            run_time=0.8
        )
