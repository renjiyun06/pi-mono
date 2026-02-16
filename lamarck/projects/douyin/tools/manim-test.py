from manim import *

class AIConceptExplainer(Scene):
    def construct(self):
        # Title
        title = Text("什么是 Hallucination?", font="Noto Sans CJK SC", font_size=48)
        subtitle = Text("AI 的「幻觉」问题", font="Noto Sans CJK SC", font_size=32, color=BLUE)
        
        title_group = VGroup(title, subtitle).arrange(DOWN, buff=0.3)
        
        self.play(Write(title), run_time=1)
        self.play(FadeIn(subtitle, shift=DOWN * 0.3), run_time=0.5)
        self.wait(1)
        
        self.play(title_group.animate.scale(0.6).to_edge(UP), run_time=0.5)
        
        # Show the concept with a simple diagram
        # LLM box
        llm_box = RoundedRectangle(
            corner_radius=0.2, width=3, height=1.5, color=BLUE
        ).shift(LEFT * 2)
        llm_label = Text("LLM", font_size=36, color=WHITE).move_to(llm_box)
        
        # Input arrow
        input_arrow = Arrow(LEFT * 5, llm_box.get_left(), color=GREEN)
        input_text = Text("输入", font="Noto Sans CJK SC", font_size=24, color=GREEN).next_to(input_arrow, UP, buff=0.1)
        
        # Output arrow
        output_arrow = Arrow(llm_box.get_right(), RIGHT * 2, color=YELLOW)
        
        # Output: sometimes correct, sometimes hallucination
        correct_output = Text("✓ 正确输出", font="Noto Sans CJK SC", font_size=24, color=GREEN).shift(RIGHT * 3.5 + UP * 0.5)
        wrong_output = Text("✗ 幻觉输出", font="Noto Sans CJK SC", font_size=24, color=RED).shift(RIGHT * 3.5 + DOWN * 0.5)
        
        self.play(
            Create(llm_box), Write(llm_label),
            GrowArrow(input_arrow), Write(input_text),
            run_time=1
        )
        self.play(GrowArrow(output_arrow), run_time=0.5)
        self.play(FadeIn(correct_output, shift=RIGHT * 0.3), run_time=0.5)
        self.play(FadeIn(wrong_output, shift=RIGHT * 0.3), run_time=0.5)
        
        self.wait(1)
        
        # Highlight the hallucination
        highlight_box = SurroundingRectangle(wrong_output, color=RED, buff=0.2)
        self.play(Create(highlight_box), run_time=0.5)
        
        # Key insight
        insight = Text(
            "模型不知道什么是「真」",
            font="Noto Sans CJK SC",
            font_size=36,
            color=YELLOW
        ).to_edge(DOWN, buff=1)
        
        self.play(Write(insight), run_time=1)
        self.wait(2)
