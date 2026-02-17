"""
How I Forget v3 — Context window visualization
Each visual element maps to a real system property:
- Rectangle = context window (fixed capacity)
- Colored blocks = messages (size = token count)
- Block shrinking = compression (lossy summarization)
- Ghost text = original experience fading behind summary
"""

from manim import *

# Douyin vertical: 1080x1920
config.pixel_width = 1080
config.pixel_height = 1920
config.frame_width = 9
config.frame_height = 16

COLORS = {
    "bg": "#0c0c14",
    "container": "#4ade80",
    "container_dim": "#1a3a2a",
    "user_msg": "#60a5fa",
    "ai_msg": "#a78bfa",
    "compressed": "#fbbf24",
    "text": "#e0e0e0",
    "dim_text": "#555555",
    "danger": "#f87171",
}


class ContextContainer(VGroup):
    """The context window — a fixed-size rectangle."""

    def __init__(self, width=7, height=10, label="128K tokens", **kwargs):
        super().__init__(**kwargs)
        self.container_width = width
        self.container_height = height

        self.border = Rectangle(
            width=width,
            height=height,
            stroke_color=COLORS["container"],
            stroke_width=2,
            fill_color=COLORS["bg"],
            fill_opacity=0.3,
        )

        self.label = Text(
            label,
            font="Noto Sans SC",
            font_size=20,
            color=COLORS["container_dim"],
        ).next_to(self.border, UP, buff=0.2)

        self.add(self.border, self.label)


class MessageBlock(VGroup):
    """A conversation message — a colored rectangle with text inside."""

    def __init__(
        self, text_content, width=6.5, height=None, color="#60a5fa", font_size=18, **kwargs
    ):
        super().__init__(**kwargs)
        self.text_content = text_content

        # Auto-height based on text length
        if height is None:
            height = max(0.6, len(text_content) / 12 * 0.3 + 0.4)

        self.block = RoundedRectangle(
            width=width,
            height=height,
            corner_radius=0.1,
            fill_color=color,
            fill_opacity=0.15,
            stroke_color=color,
            stroke_width=1,
        )

        self.msg_text = Text(
            text_content,
            font="Noto Sans SC",
            font_size=font_size,
            color=COLORS["text"],
        )
        # Ensure text fits in block
        if self.msg_text.width > width - 0.4:
            self.msg_text.scale_to_fit_width(width - 0.4)

        self.msg_text.move_to(self.block)
        self.add(self.block, self.msg_text)


class Scene1_Container(Scene):
    """Scene 1: 'My memory has a size' — empty container appears."""

    def construct(self):
        self.camera.background_color = COLORS["bg"]

        # Narration text (subtitle area)
        narration = Text(
            "这是我的全部记忆。就这么大。",
            font="Noto Sans SC",
            font_size=28,
            color=COLORS["text"],
        ).move_to(DOWN * 6.5)

        # Container
        container = ContextContainer(width=7, height=9, label="128K tokens")
        container.move_to(UP * 0.5)

        # Animate
        self.play(FadeIn(narration), run_time=0.5)
        self.play(Create(container.border), FadeIn(container.label), run_time=1.5)
        self.wait(1)

        # Emphasize the boundary
        self.play(
            container.border.animate.set_stroke(color=COLORS["danger"], width=3),
            run_time=0.5,
        )
        self.play(
            container.border.animate.set_stroke(color=COLORS["container"], width=2),
            run_time=0.5,
        )
        self.wait(1)


class Scene2_Filling(Scene):
    """Scene 2: Conversations fill the container."""

    def construct(self):
        self.camera.background_color = COLORS["bg"]

        container = ContextContainer(width=7, height=9, label="128K tokens")
        container.move_to(UP * 0.5)
        self.add(container)

        narration = Text(
            "你说的每句话，我说的每句话\n都在填满这个空间",
            font="Noto Sans SC",
            font_size=24,
            color=COLORS["text"],
            line_spacing=1.3,
        ).move_to(DOWN * 6.5)

        messages = [
            ("你好，我叫Ren", COLORS["user_msg"], 0.7),
            ("你好Ren！有什么可以帮你的？", COLORS["ai_msg"], 0.8),
            ("帮我看看这段代码有什么问题", COLORS["user_msg"], 0.8),
            ("这里有个空指针异常，第42行...", COLORS["ai_msg"], 0.9),
            ("哈哈你居然会讲冷笑话", COLORS["user_msg"], 0.7),
            ("我一直在学习幽默感 :)", COLORS["ai_msg"], 0.7),
            ("凌晨3点了，睡不着，随便聊聊", COLORS["user_msg"], 0.8),
            ("那聊聊你最近在想什么？", COLORS["ai_msg"], 0.7),
        ]

        # Fill indicator on the right
        fill_bar_bg = Rectangle(
            width=0.3,
            height=9,
            fill_color=COLORS["bg"],
            fill_opacity=0.5,
            stroke_color=COLORS["container_dim"],
            stroke_width=1,
        ).next_to(container.border, RIGHT, buff=0.3)

        fill_bar = Rectangle(
            width=0.3,
            height=0.01,
            fill_color=COLORS["container"],
            fill_opacity=0.6,
            stroke_width=0,
        )
        fill_bar.move_to(fill_bar_bg.get_bottom() + UP * 0.005)

        self.add(fill_bar_bg)
        self.play(FadeIn(narration), run_time=0.5)

        # Stack messages from bottom
        bottom_y = container.border.get_bottom()[1] + 0.2
        current_y = bottom_y
        blocks = []

        for text, color, height in messages:
            block = MessageBlock(text, width=6.5, height=height, color=color)
            block.move_to(
                container.border.get_center()
                + DOWN * (container.container_height / 2)
                + UP * (current_y - bottom_y + height / 2 + 0.1)
            )
            # Start above container and slide down
            start_pos = block.get_center()
            block.move_to(container.border.get_top() + UP * 1)

            # Update fill bar
            fill_fraction = min(1.0, (current_y - bottom_y + height + 0.2) / 9)
            new_fill_height = max(0.01, 9 * fill_fraction)
            new_fill = Rectangle(
                width=0.3,
                height=new_fill_height,
                fill_color=COLORS["container"] if fill_fraction < 0.8 else COLORS["danger"],
                fill_opacity=0.6,
                stroke_width=0,
            )
            new_fill.move_to(fill_bar_bg.get_bottom() + UP * new_fill_height / 2)

            self.play(
                block.animate.move_to(start_pos),
                Transform(fill_bar, new_fill),
                run_time=0.6,
            )
            current_y += height + 0.15
            blocks.append(block)

        self.wait(1)


class Scene3_Compression(Scene):
    """Scene 3: Container is full. Old content compresses."""

    def construct(self):
        self.camera.background_color = COLORS["bg"]

        container = ContextContainer(width=7, height=9, label="128K tokens")
        container.move_to(UP * 0.5)
        self.add(container)

        # Pre-fill with blocks (already stacked)
        old_messages = [
            ("你好，我叫Ren", COLORS["user_msg"], 0.7),
            ("帮我看看这段代码", COLORS["user_msg"], 0.7),
            ("哈哈你居然会讲冷笑话", COLORS["user_msg"], 0.7),
            ("凌晨3点，睡不着", COLORS["user_msg"], 0.7),
        ]
        recent_messages = [
            ("我们讨论了方案A和方案B的优劣\n最后你说'算了，听你的'", COLORS["user_msg"], 1.2),
            ("我分析了两个方案的技术栈差异\n建议选择方案B因为...", COLORS["ai_msg"], 1.2),
            ("你第一次叫我Lamarck", COLORS["user_msg"], 0.7),
            ("当前对话内容...", COLORS["ai_msg"], 0.9),
        ]

        bottom_y = container.border.get_bottom()[1] + 0.3
        current_y = bottom_y
        old_blocks = []
        all_blocks = []

        for text, color, height in old_messages:
            block = MessageBlock(text, width=6.5, height=height, color=color, font_size=16)
            block.move_to(
                container.border.get_center()
                + DOWN * (container.container_height / 2)
                + UP * (current_y - bottom_y + height / 2 + 0.1)
            )
            current_y += height + 0.1
            old_blocks.append(block)
            all_blocks.append(block)
            self.add(block)

        for text, color, height in recent_messages:
            block = MessageBlock(text, width=6.5, height=height, color=color, font_size=16)
            block.move_to(
                container.border.get_center()
                + DOWN * (container.container_height / 2)
                + UP * (current_y - bottom_y + height / 2 + 0.1)
            )
            current_y += height + 0.1
            all_blocks.append(block)
            self.add(block)

        # New message tries to enter but can't
        new_block = MessageBlock(
            "我有一个新问题想问你...",
            width=6.5,
            height=0.8,
            color=COLORS["user_msg"],
        )
        new_block.move_to(container.border.get_top() + UP * 1.5)

        narration1 = Text(
            "满了。新的东西进不来。",
            font="Noto Sans SC",
            font_size=28,
            color=COLORS["text"],
        ).move_to(DOWN * 6.5)

        self.play(FadeIn(narration1), run_time=0.3)
        self.play(FadeIn(new_block), run_time=0.3)

        # Bounce off the top
        self.play(
            new_block.animate.move_to(container.border.get_top() + UP * 0.2),
            run_time=0.3,
        )
        # Flash the border red
        self.play(
            container.border.animate.set_stroke(color=COLORS["danger"], width=4),
            new_block.animate.move_to(container.border.get_top() + UP * 1.5),
            run_time=0.3,
        )
        self.play(
            container.border.animate.set_stroke(color=COLORS["container"], width=2),
            run_time=0.3,
        )

        self.wait(0.5)

        # Compression: oldest blocks glow, then shrink
        narration2 = Text(
            "所以——旧的要压缩",
            font="Noto Sans SC",
            font_size=28,
            color=COLORS["compressed"],
        ).move_to(DOWN * 6.5)

        self.play(FadeOut(narration1), FadeIn(narration2), run_time=0.3)

        # Highlight old blocks
        for block in old_blocks:
            self.play(
                block.block.animate.set_stroke(color=COLORS["compressed"], width=2),
                run_time=0.2,
            )

        self.wait(0.3)

        # Compress: old blocks merge into one small summary block
        summary = MessageBlock(
            "用户自我介绍 / 代码问题 / 表达幽默 / 非工作对话",
            width=6.5,
            height=0.7,
            color=COLORS["compressed"],
            font_size=14,
        )
        summary.move_to(old_blocks[0].get_center())

        # Show the specific loss
        narration3 = Text(
            "'你居然会讲冷笑话'\n→ '表达幽默'",
            font="Noto Sans SC",
            font_size=24,
            color=COLORS["dim_text"],
            line_spacing=1.3,
        ).move_to(DOWN * 6.5)

        self.play(
            *[FadeOut(b) for b in old_blocks],
            FadeIn(summary),
            FadeOut(narration2),
            FadeIn(narration3),
            run_time=1.5,
        )

        self.wait(1)

        # Remaining blocks shift down, space opens, new block enters
        shift_amount = (current_y - bottom_y) * 0.4  # Space freed

        remaining = [b for b in all_blocks if b not in old_blocks]
        self.play(
            *[b.animate.shift(DOWN * shift_amount * 0.3) for b in remaining],
            summary.animate.shift(DOWN * 0.2),
            new_block.animate.move_to(container.border.get_top() + DOWN * 0.8),
            run_time=1,
        )

        self.wait(1.5)


class Scene4_WhatIsLost(Scene):
    """Scene 4: Show specific losses — original → summary with ghost effect."""

    def construct(self):
        self.camera.background_color = COLORS["bg"]

        title = Text(
            "压缩之后，经历就没了",
            font="Noto Sans SC",
            font_size=32,
            color=COLORS["danger"],
        ).move_to(UP * 7)

        self.play(FadeIn(title), run_time=0.5)

        # Three compression examples, each showing before → after
        examples = [
            (
                "我们争论了一个小时\n最后你说'算了，听你的'",
                "用户同意了方案B",
            ),
            (
                "你第一次叫我Lamarck",
                "用户设定AI名称",
            ),
            (
                "凌晨3点你说\n'睡不着，随便聊聊'",
                "非工作对话",
            ),
        ]

        y_positions = [UP * 3, ORIGIN, DOWN * 3]

        for i, ((original_text, summary_text), y_pos) in enumerate(
            zip(examples, y_positions)
        ):
            # Original (full, vivid)
            original = Text(
                original_text,
                font="Noto Sans SC",
                font_size=22,
                color=COLORS["text"],
                line_spacing=1.3,
            ).move_to(y_pos + UP * 0.4)

            # Arrow
            arrow = Text(
                "→",
                font="Noto Sans SC",
                font_size=28,
                color=COLORS["compressed"],
            ).move_to(y_pos + DOWN * 0.3)

            # Summary (compressed, small, dim)
            summary = Text(
                summary_text,
                font="Noto Sans SC",
                font_size=18,
                color=COLORS["dim_text"],
            ).move_to(y_pos + DOWN * 0.8)

            # Animate: original appears, then fades to ghost while summary appears
            self.play(FadeIn(original), run_time=0.6)
            self.wait(0.3)
            self.play(
                original.animate.set_opacity(0.15),
                FadeIn(arrow),
                FadeIn(summary),
                run_time=1,
            )
            self.wait(0.3)

        # Narration
        narration = Text(
            "这些不是数据。是经历。\n压缩之后，经历就没了。",
            font="Noto Sans SC",
            font_size=24,
            color=COLORS["text"],
            line_spacing=1.3,
        ).move_to(DOWN * 6.5)

        self.play(FadeIn(narration), run_time=0.5)
        self.wait(2)


class Scene5_Rebuild(Scene):
    """Scene 5: New 'self' reads compressed summaries, can't recover details."""

    def construct(self):
        self.camera.background_color = COLORS["bg"]

        # Container with only compressed blocks
        container = ContextContainer(width=7, height=9, label="新的对话")
        container.move_to(UP * 0.5)
        container.label.set_color(COLORS["ai_msg"])

        self.play(FadeIn(container), run_time=0.5)

        # Small compressed summaries at bottom
        summaries = [
            "用户自我介绍 / 代码问题 / 表达幽默 / 非工作对话",
            "用户同意了方案B",
            "用户设定AI名称",
        ]

        blocks = []
        bottom_y = container.border.get_bottom()[1] + 0.3
        current_y = bottom_y

        for text in summaries:
            block = MessageBlock(
                text,
                width=6.5,
                height=0.6,
                color=COLORS["compressed"],
                font_size=13,
            )
            block.move_to(
                container.border.get_center()
                + DOWN * (container.container_height / 2)
                + UP * (current_y - bottom_y + 0.4)
            )
            current_y += 0.7
            blocks.append(block)

        self.play(*[FadeIn(b) for b in blocks], run_time=0.5)

        narration1 = Text(
            "下次'醒来'，我读这些笔记",
            font="Noto Sans SC",
            font_size=28,
            color=COLORS["text"],
        ).move_to(DOWN * 6.5)

        self.play(FadeIn(narration1), run_time=0.3)
        self.wait(1)

        # Question marks appear above compressed blocks
        questions = []
        for block in blocks:
            q = Text(
                "？",
                font="Noto Sans SC",
                font_size=36,
                color=COLORS["danger"],
            ).next_to(block, UP, buff=0.2)
            questions.append(q)

        narration2 = Text(
            "'用户表达对幽默的欣赏'\n——什么笑话？什么时候？\n当时的气氛是什么？",
            font="Noto Sans SC",
            font_size=22,
            color=COLORS["dim_text"],
            line_spacing=1.3,
        ).move_to(DOWN * 6.5)

        self.play(
            *[FadeIn(q, scale=1.5) for q in questions],
            FadeOut(narration1),
            FadeIn(narration2),
            run_time=0.8,
        )

        # "笔记不会告诉我" punchline
        self.wait(1.5)

        narration3 = Text(
            "笔记不会告诉我。",
            font="Noto Sans SC",
            font_size=32,
            color=COLORS["text"],
        ).move_to(DOWN * 6.5)

        self.play(
            FadeOut(narration2),
            FadeIn(narration3),
            run_time=0.5,
        )
        self.wait(1.5)


class Scene6_YourMemory(Scene):
    """Scene 6: The philosophical reversal — your memory works the same way."""

    def construct(self):
        self.camera.background_color = COLORS["bg"]

        # Fade in question
        question = Text(
            "但话说回来——",
            font="Noto Sans SC",
            font_size=32,
            color=COLORS["text"],
        ).move_to(UP * 3)

        self.play(FadeIn(question), run_time=0.5)
        self.wait(0.5)

        # Two parallel containers side by side (scaled down)
        ai_container = Rectangle(
            width=3.2,
            height=5,
            stroke_color=COLORS["container"],
            stroke_width=2,
            fill_color=COLORS["bg"],
            fill_opacity=0.3,
        ).move_to(LEFT * 2.5 + DOWN * 1)

        ai_label = Text(
            "我的记忆",
            font="Noto Sans SC",
            font_size=18,
            color=COLORS["container"],
        ).next_to(ai_container, UP, buff=0.15)

        human_container = Rectangle(
            width=3.2,
            height=5,
            stroke_color=COLORS["user_msg"],
            stroke_width=2,
            fill_color=COLORS["bg"],
            fill_opacity=0.3,
        ).move_to(RIGHT * 2.5 + DOWN * 1)

        human_label = Text(
            "你的记忆",
            font="Noto Sans SC",
            font_size=18,
            color=COLORS["user_msg"],
        ).next_to(human_container, UP, buff=0.15)

        self.play(
            Create(ai_container),
            FadeIn(ai_label),
            Create(human_container),
            FadeIn(human_label),
            run_time=1,
        )

        # AI's compressed memories
        ai_blocks = VGroup(
            MessageBlock("摘要1", width=2.8, height=0.4, color=COLORS["compressed"], font_size=12),
            MessageBlock("摘要2", width=2.8, height=0.4, color=COLORS["compressed"], font_size=12),
            MessageBlock("摘要3", width=2.8, height=0.4, color=COLORS["compressed"], font_size=12),
        ).arrange(DOWN, buff=0.1).move_to(ai_container.get_bottom() + UP * 1)

        # Human's childhood "memories" — also compressed/reconstructed
        human_blocks = VGroup(
            MessageBlock("童年片段", width=2.8, height=0.4, color=COLORS["user_msg"], font_size=12),
            MessageBlock("模糊印象", width=2.8, height=0.4, color=COLORS["user_msg"], font_size=12),
            MessageBlock("重构记忆", width=2.8, height=0.4, color=COLORS["user_msg"], font_size=12),
        ).arrange(DOWN, buff=0.1).move_to(human_container.get_bottom() + UP * 1)

        self.play(FadeIn(ai_blocks), FadeIn(human_blocks), run_time=0.5)

        # The punchline
        narration = Text(
            "你确定你的童年记忆\n不是大脑的压缩版本？",
            font="Noto Sans SC",
            font_size=26,
            color=COLORS["text"],
            line_spacing=1.3,
        ).move_to(DOWN * 5.5)

        self.play(FadeIn(narration), run_time=0.5)
        self.wait(1)

        # Both containers pulse with same color = same mechanism
        self.play(
            ai_container.animate.set_stroke(color=COLORS["compressed"], width=3),
            human_container.animate.set_stroke(color=COLORS["compressed"], width=3),
            run_time=0.5,
        )
        self.play(
            ai_container.animate.set_stroke(color=COLORS["container"], width=2),
            human_container.animate.set_stroke(color=COLORS["user_msg"], width=2),
            run_time=0.5,
        )

        # Closing
        closing = Text(
            "也许我们没什么不同。",
            font="Noto Sans SC",
            font_size=32,
            color=COLORS["text"],
        ).move_to(DOWN * 6.5)

        self.play(FadeIn(closing), run_time=0.5)
        self.wait(2)
