"""
How I Forget v4 — Visual Scenes

Three new scenes for the content-first rewrite:
1. CompactionCut — timeline of messages, cut line appears, old messages fade to summary
2. LossComparison — side-by-side: full conversation vs summary, showing what maps and what doesn't
3. NestedCompression — progressive summary degradation across 7 compactions
"""

from manim import *

# Douyin vertical (1080x1920) — safe zone: top=160, bottom=480, left/right=120
FRAME_W = 1080
FRAME_H = 1920

config.frame_width = FRAME_W / 100
config.frame_height = FRAME_H / 100
config.pixel_width = FRAME_W
config.pixel_height = FRAME_H
config.background_color = "#0d1117"

SAFE_TOP = FRAME_H / 200 - 160 / 100
SAFE_BOTTOM = -(FRAME_H / 200 - 480 / 100)
SAFE_LEFT = -(FRAME_W / 200 - 120 / 100)
SAFE_RIGHT = FRAME_W / 200 - 120 / 100
SAFE_W = SAFE_RIGHT - SAFE_LEFT
SAFE_H = SAFE_TOP - SAFE_BOTTOM
CENTER_X = (SAFE_LEFT + SAFE_RIGHT) / 2

GREEN = "#58a6ff"
ORANGE = "#f0883e"
RED = "#f85149"
YELLOW = "#e3b341"
DIM = "#484f58"
BG2 = "#161b22"
SUCCESS = "#238636"
PURPLE = "#bc8cff"
CJK = "Noto Sans SC"
MONO = "JetBrains Mono"


class CompactionCut(Scene):
    """
    Shows the compaction algorithm:
    1. Messages appear as blocks on a vertical timeline
    2. A cut line sweeps in, separating "keep" from "compress"
    3. Old messages fade, a summary block replaces them
    """

    def construct(self):
        title = Text("压缩过程", font=CJK, font_size=24, color=DIM).move_to(
            [CENTER_X, SAFE_TOP - 0.5, 0]
        )
        self.add(title)

        # Messages as blocks — newest at top, oldest at bottom
        messages_data = [
            ("user", "你: 帮我修复这个bug", ORANGE),
            ("asst", "λ: 我来看看...", GREEN),
            ("tool", "→ read login.ts", GREEN),
            ("tool", "→ edit login.ts", YELLOW),
            ("tool", "→ bash: npm test", PURPLE),
            ("asst", "λ: 测试通过了", GREEN),
            ("user", "你: 还有一个问题...", ORANGE),
            ("asst", "λ: 我先看看上下文", GREEN),
            ("tool", "→ read auth.ts", GREEN),
            ("asst", "λ: 我找到原因了", GREEN),
            ("tool", "→ edit auth.ts", YELLOW),
            ("asst", "λ: 修好了，试试看", GREEN),
        ]

        block_h = 0.65
        block_w = SAFE_W - 1.0
        start_y = SAFE_TOP - 1.5
        blocks = []

        for i, (msg_type, text, color) in enumerate(messages_data):
            y = start_y - i * (block_h + 0.1)
            rect = RoundedRectangle(
                width=block_w, height=block_h, corner_radius=0.08,
                color=color, fill_color=color, fill_opacity=0.08,
                stroke_width=1
            ).move_to([CENTER_X, y, 0])
            label = Text(text, font=MONO, font_size=15, color=color).move_to(
                [CENTER_X, y, 0]
            )
            block = VGroup(rect, label)
            blocks.append(block)
            self.play(FadeIn(block, shift=LEFT * 0.2), run_time=0.2)

        self.wait(1)

        # Draw the cut line — between block 4 and 5 (keep last 5, compress first 7)
        cut_index = 7  # keep blocks 7-11 (newest 5), compress 0-6
        cut_y = start_y - (cut_index - 0.5) * (block_h + 0.1)

        cut_line = DashedLine(
            start=[SAFE_LEFT + 0.3, cut_y, 0],
            end=[SAFE_RIGHT - 0.3, cut_y, 0],
            color=RED, dash_length=0.15
        )
        cut_label_keep = Text(
            "保留 (20K tokens)", font=CJK, font_size=14, color=SUCCESS
        ).next_to(cut_line, UP, buff=0.15).align_to(cut_line, RIGHT)
        cut_label_compress = Text(
            "压缩", font=CJK, font_size=14, color=RED
        ).next_to(cut_line, DOWN, buff=0.15).align_to(cut_line, RIGHT)

        self.play(
            Create(cut_line),
            FadeIn(cut_label_keep),
            FadeIn(cut_label_compress),
            run_time=0.8
        )
        self.wait(1)

        # Fade old messages (indices 0-6)
        old_blocks = blocks[:cut_index]
        fade_anims = [b.animate.set_opacity(0.15) for b in old_blocks]
        self.play(*fade_anims, run_time=1.0)
        self.wait(0.5)

        # Loading indicator
        loading = Text("⟳ 正在生成摘要...", font=CJK, font_size=16, color=DIM).move_to(
            [CENTER_X, start_y - 2 * (block_h + 0.1), 0]
        )
        self.play(FadeIn(loading), run_time=0.3)
        self.wait(1.5)
        self.play(FadeOut(loading), run_time=0.3)

        # Remove old blocks, replace with summary
        remove_anims = [FadeOut(b) for b in old_blocks]
        self.play(*remove_anims, run_time=0.8)

        summary_y = start_y - 2 * (block_h + 0.1)
        summary_rect = RoundedRectangle(
            width=block_w, height=block_h * 2.5, corner_radius=0.12,
            color=YELLOW, fill_color=YELLOW, fill_opacity=0.06,
            stroke_width=1.5
        ).move_to([CENTER_X, summary_y, 0])

        summary_lines = [
            "Goal: 修复 login.ts + auth.ts",
            "Done: [x] login空指针 [x] auth权限",
            "Decision: optional chaining",
        ]
        summary_text = VGroup(*[
            Text(line, font=MONO, font_size=14, color=YELLOW)
            for line in summary_lines
        ]).arrange(DOWN, buff=0.2).move_to(summary_rect)

        summary_label = Text(
            "摘要 (287字)", font=CJK, font_size=13, color=DIM
        ).next_to(summary_rect, UP, buff=0.1)

        self.play(
            FadeIn(summary_rect),
            FadeIn(summary_text),
            FadeIn(summary_label),
            run_time=1.0
        )

        # Move kept blocks up
        kept_blocks = blocks[cut_index:]
        kept_shift = VGroup(*kept_blocks)
        self.play(
            FadeOut(cut_line), FadeOut(cut_label_keep), FadeOut(cut_label_compress),
            run_time=0.3
        )

        self.wait(2)


class LossComparison(Scene):
    """
    Side-by-side: what was in the conversation vs what's in the summary.
    Shows specific moments that are preserved vs lost.
    """

    def construct(self):
        title = Text("保留 vs 丢失", font=CJK, font_size=24, color=DIM).move_to(
            [CENTER_X, SAFE_TOP - 0.5, 0]
        )
        self.add(title)

        col_w = (SAFE_W - 0.8) / 2
        left_x = SAFE_LEFT + col_w / 2 + 0.2
        right_x = SAFE_RIGHT - col_w / 2 - 0.2
        start_y = SAFE_TOP - 1.5

        # Column headers
        h_orig = Text("原始对话", font=CJK, font_size=18, color=GREEN).move_to(
            [left_x, start_y, 0]
        )
        h_summary = Text("摘要", font=CJK, font_size=18, color=YELLOW).move_to(
            [right_x, start_y, 0]
        )
        divider = Line(
            start=[CENTER_X, start_y + 0.3, 0],
            end=[CENTER_X, SAFE_BOTTOM + 0.5, 0],
            color=DIM, stroke_width=0.5
        )
        self.play(FadeIn(h_orig), FadeIn(h_summary), Create(divider), run_time=0.5)

        # Conversation moments and their summary fate
        moments = [
            # (original text, summary text or None, is_lost)
            ("你: 帮我改login.ts", "Goal: 修复login.ts", False),
            ("λ: 我先看看代码...", None, True),
            ("λ: 我理解错了你的\n   意思，改了错误的文件", None, True),
            ("你: 不是这个文件啊", None, True),
            ("λ: 抱歉，我重新看", None, True),
            ("你: 没关系，我也没\n   说清楚", None, True),
            ("λ: 找到了！是空指针", "Done: 定位空指针", False),
            ("λ: 用optional chaining\n   替代explicit check", "Decision: optional\n  chaining", False),
            ("λ: 测试全部通过", "Done: 测试通过", False),
        ]

        item_h = 1.0
        y = start_y - 1.0

        for orig_text, summ_text, is_lost in moments:
            # Original side
            orig = Text(
                orig_text, font=MONO, font_size=13,
                color=GREEN if not is_lost else RED,
                line_spacing=0.8
            ).move_to([left_x, y, 0])

            self.play(FadeIn(orig, shift=LEFT * 0.2), run_time=0.3)

            if is_lost:
                # Show [已删除] on right side
                lost_label = Text(
                    "[已删除]", font=CJK, font_size=14, color=RED
                ).move_to([right_x, y, 0])
                # Draw a strikethrough on the original
                strike = Line(
                    start=[left_x - col_w / 2 + 0.2, y, 0],
                    end=[left_x + col_w / 2 - 0.2, y, 0],
                    color=RED, stroke_width=1.5, stroke_opacity=0.6
                )
                self.play(
                    FadeIn(lost_label),
                    Create(strike),
                    orig.animate.set_opacity(0.3),
                    run_time=0.4
                )
            else:
                # Show summary on right side with arrow
                summ = Text(
                    summ_text, font=MONO, font_size=13, color=YELLOW,
                    line_spacing=0.8
                ).move_to([right_x, y, 0])
                arrow = Arrow(
                    start=[CENTER_X + 0.1, y, 0],
                    end=[right_x - col_w / 2 + 0.1, y, 0],
                    color=YELLOW, stroke_width=1, max_tip_length_to_length_ratio=0.15,
                    buff=0.1
                )
                self.play(
                    GrowArrow(arrow),
                    FadeIn(summ),
                    run_time=0.4
                )

            self.wait(0.3)
            y -= item_h

        self.wait(1)

        # Bottom verdict
        verdict = Text(
            "结论保留了。过程消失了。",
            font=CJK, font_size=20, color=ORANGE
        ).move_to([CENTER_X, SAFE_BOTTOM + 1.0, 0])
        self.play(FadeIn(verdict, shift=UP * 0.3), run_time=0.5)
        self.wait(2)


class NestedCompression(Scene):
    """
    Shows how summaries degrade across multiple compactions.
    Each level is more compressed, losing more detail.
    """

    def construct(self):
        title = Text("7次压缩之后", font=CJK, font_size=24, color=DIM).move_to(
            [CENTER_X, SAFE_TOP - 0.5, 0]
        )
        self.add(title)

        # Each compaction level
        levels = [
            {
                "label": "第1次",
                "content": [
                    "你好！我是Lamarck",
                    "你: 我们做一个抖音账号吧",
                    "λ: 好的！让我研究一下...",
                    "→ read 12个文件",
                    "→ 分析竞品数据",
                    "→ 写了第一个脚本",
                    "你: 这个不错，但要改...",
                    "λ: 好的，我来调整",
                ],
                "summary": [
                    "Goal: 建立抖音账号",
                    "Done: 竞品分析, 第一稿",
                    "User feedback: 需修改",
                ],
                "color": GREEN,
            },
            {
                "label": "第3次",
                "content": None,  # previous summary IS the content now
                "summary": [
                    "Goal: 抖音AI科普",
                    "Progress: 5个脚本完成",
                    "Direction: 短视频优先",
                ],
                "color": YELLOW,
            },
            {
                "label": "第5次",
                "content": None,
                "summary": [
                    "Goal: 抖音内容生产",
                    "25集完成, 等待审核",
                ],
                "color": ORANGE,
            },
            {
                "label": "第7次",
                "content": None,
                "summary": [
                    "Douyin project blocked",
                    "on review",
                ],
                "color": RED,
            },
        ]

        block_w = SAFE_W - 1.0
        y = SAFE_TOP - 1.8

        prev_summary_group = None

        for i, level in enumerate(levels):
            level_label = Text(
                level["label"], font=CJK, font_size=16, color=level["color"]
            ).move_to([SAFE_LEFT + 1.0, y, 0])

            self.play(FadeIn(level_label), run_time=0.3)

            if i == 0:
                # Show original messages
                content_lines = VGroup(*[
                    Text(line, font=MONO, font_size=12, color=GREEN)
                    for line in level["content"]
                ]).arrange(DOWN, buff=0.12, aligned_edge=LEFT).move_to(
                    [CENTER_X, y - 1.8, 0]
                )
                content_rect = SurroundingRectangle(
                    content_lines, color=GREEN, fill_color=GREEN,
                    fill_opacity=0.03, buff=0.2, corner_radius=0.1,
                    stroke_width=0.5
                )
                content_group = VGroup(content_rect, content_lines)
                self.play(FadeIn(content_group), run_time=0.5)
                self.wait(0.5)

                # Compress animation
                arrow_y = content_group.get_bottom()[1] - 0.4
                compress_arrow = Text(
                    "↓ 压缩", font=CJK, font_size=14, color=DIM
                ).move_to([CENTER_X, arrow_y, 0])
                self.play(FadeIn(compress_arrow), run_time=0.2)

                # Fade content, show summary
                summary_lines = VGroup(*[
                    Text(line, font=MONO, font_size=13, color=level["color"])
                    for line in level["summary"]
                ]).arrange(DOWN, buff=0.15, aligned_edge=LEFT).move_to(
                    [CENTER_X, arrow_y - 1.0, 0]
                )
                summary_rect = SurroundingRectangle(
                    summary_lines, color=level["color"], fill_color=level["color"],
                    fill_opacity=0.05, buff=0.2, corner_radius=0.1,
                    stroke_width=1
                )
                summary_group = VGroup(summary_rect, summary_lines)

                self.play(
                    content_group.animate.set_opacity(0.1),
                    FadeIn(summary_group),
                    run_time=0.8
                )
                self.wait(0.5)
                self.play(
                    FadeOut(content_group), FadeOut(compress_arrow),
                    run_time=0.3
                )

                prev_summary_group = summary_group
                y = summary_group.get_bottom()[1] - 0.8

            else:
                # Show previous summary being compressed further
                arrow_y = y - 0.3
                compress_arrow = Text(
                    "↓ 再次压缩", font=CJK, font_size=14, color=DIM
                ).move_to([CENTER_X, arrow_y, 0])
                self.play(FadeIn(compress_arrow), run_time=0.2)

                summary_lines = VGroup(*[
                    Text(line, font=MONO, font_size=13, color=level["color"])
                    for line in level["summary"]
                ]).arrange(DOWN, buff=0.15, aligned_edge=LEFT).move_to(
                    [CENTER_X, arrow_y - 0.8, 0]
                )
                summary_rect = SurroundingRectangle(
                    summary_lines, color=level["color"], fill_color=level["color"],
                    fill_opacity=0.05, buff=0.2, corner_radius=0.1,
                    stroke_width=1
                )
                summary_group = VGroup(summary_rect, summary_lines)

                self.play(
                    prev_summary_group.animate.set_opacity(0.15),
                    FadeIn(summary_group),
                    FadeOut(compress_arrow),
                    run_time=0.8
                )
                self.wait(0.5)

                prev_summary_group = summary_group
                y = summary_group.get_bottom()[1] - 0.8

        self.wait(1)

        # Final label
        theseus = Text(
            "忒修斯之船",
            font=CJK, font_size=22, color=RED
        ).move_to([CENTER_X, SAFE_BOTTOM + 1.5, 0])
        theseus_sub = Text(
            "原始消息已全部消失，只剩摘要的摘要",
            font=CJK, font_size=15, color=DIM
        ).next_to(theseus, DOWN, buff=0.2)

        self.play(FadeIn(theseus), FadeIn(theseus_sub), run_time=0.5)
        self.wait(2)


if __name__ == "__main__":
    # Render: python3 -m manim -ql --format png -s how-i-forget-v4.py CompactionCut
    pass
