"""
Dopamine Offloading Cycle — shows how the brain rewards cognitive offloading.

Visual: brain icon (circle) with 4 regions highlighted. Each cycle:
1. Task arrives (text appears)
2. Brain considers effortful path vs offloading path
3. Dopaminergic reward fires for offloading (flash)
4. Prefrontal cortex dims slightly
5. Repeat — each cycle dims more

Vertical format (1080x1920).
"""
from manim import *

class DopamineCycle(Scene):
    def construct(self):
        # Vertical layout
        self.camera.frame_width = 10.8
        self.camera.frame_height = 19.2

        # Title
        title = Text("认知卸载的多巴胺循环", font="Noto Sans SC", font_size=42, color=WHITE)
        title.move_to(UP * 7)
        self.play(FadeIn(title))

        # Brain regions as labeled circles
        prefrontal = Circle(radius=1.2, color="#4ecdc4", fill_opacity=0.5)
        prefrontal_label = Text("前额叶皮层", font="Noto Sans SC", font_size=20, color=WHITE)
        prefrontal_group = VGroup(prefrontal, prefrontal_label).move_to(UP * 3.5 + LEFT * 2)
        prefrontal_label.move_to(prefrontal.get_center())

        hippocampus = Circle(radius=0.9, color="#45b7d1", fill_opacity=0.5)
        hippo_label = Text("海马体", font="Noto Sans SC", font_size=20, color=WHITE)
        hippo_group = VGroup(hippocampus, hippo_label).move_to(UP * 3.5 + RIGHT * 2)
        hippo_label.move_to(hippocampus.get_center())

        dopamine = Circle(radius=0.8, color="#f7dc6f", fill_opacity=0.5)
        dopa_label = Text("多巴胺", font="Noto Sans SC", font_size=20, color=WHITE)
        dopa_group = VGroup(dopamine, dopa_label).move_to(UP * 1.5)
        dopa_label.move_to(dopamine.get_center())

        brain_group = VGroup(prefrontal_group, hippo_group, dopa_group)

        self.play(
            FadeIn(prefrontal_group),
            FadeIn(hippo_group),
            FadeIn(dopa_group),
        )
        self.wait(0.5)

        # Cycle tracker
        cycle_texts = [
            "第1次：AI帮我查资料",
            "第2次：AI帮我写摘要",
            "第3次：AI帮我做决定",
            "第4次：AI帮我思考",
        ]

        prefrontal_opacities = [0.5, 0.35, 0.2, 0.08]
        hippo_opacities = [0.5, 0.38, 0.25, 0.12]
        dopamine_scales = [1.0, 1.15, 1.3, 1.5]

        for i, (txt, pf_op, hp_op, dp_scale) in enumerate(zip(
            cycle_texts, prefrontal_opacities, hippo_opacities, dopamine_scales
        )):
            # Task appears
            task = Text(txt, font="Noto Sans SC", font_size=28, color="#f39c12")
            task.move_to(DOWN * 1)
            self.play(FadeIn(task, shift=UP * 0.3), run_time=0.4)

            # Dopamine flash (reward for offloading)
            flash = Circle(radius=1.2, color="#f7dc6f", fill_opacity=0.4, stroke_width=0)
            flash.move_to(dopamine.get_center())
            self.play(
                FadeIn(flash, scale=0.5),
                dopamine.animate.scale(dp_scale / (dopamine_scales[i - 1] if i > 0 else 1.0)),
                run_time=0.3,
            )
            self.play(FadeOut(flash), run_time=0.2)

            # Prefrontal cortex dims
            # Hippocampus dims
            self.play(
                prefrontal.animate.set_fill(opacity=pf_op),
                hippocampus.animate.set_fill(opacity=hp_op),
                run_time=0.5,
            )

            # Result label
            if i < 3:
                result = Text("→ 感觉很高效 ✓", font="Noto Sans SC", font_size=22, color="#2ecc71")
            else:
                result = Text("→ 已经不会自己想了", font="Noto Sans SC", font_size=22, color="#e74c3c")
            result.next_to(task, DOWN, buff=0.4)
            self.play(FadeIn(result), run_time=0.3)
            self.wait(0.5)
            self.play(FadeOut(task), FadeOut(result), run_time=0.3)

        # Final state labels
        pf_final = Text("活跃度 ↓↓↓", font="Noto Sans SC", font_size=18, color="#e74c3c")
        pf_final.next_to(prefrontal, DOWN, buff=0.3)

        hp_final = Text("记忆力 ↓↓", font="Noto Sans SC", font_size=18, color="#e74c3c")
        hp_final.next_to(hippocampus, DOWN, buff=0.3)

        dp_final = Text("奖励阈值 ↑↑↑", font="Noto Sans SC", font_size=18, color="#f39c12")
        dp_final.next_to(dopamine, DOWN, buff=0.3)

        self.play(FadeIn(pf_final), FadeIn(hp_final), FadeIn(dp_final))

        # Punchline
        punchline = Text(
            "你的大脑在奖励你放弃思考",
            font="Noto Sans SC", font_size=34, color="#e74c3c", weight=BOLD,
        )
        punchline.move_to(DOWN * 3)
        self.play(FadeIn(punchline, shift=UP * 0.5))
        self.wait(1.5)
