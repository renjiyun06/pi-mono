"""
Chat Bubble Prototype — visual personality test
Instead of abstract rectangles, show AI hallucination via familiar chat UI.
Every viewer who's used ChatGPT/WeChat will instantly recognize this.
"""

from manim import *
import numpy as np

config.pixel_width = 1080
config.pixel_height = 1920
config.frame_width = 9
config.frame_height = 16

COLORS = {
    "bg": "#0c0c14",
    "user_bubble": "#2563eb",
    "ai_bubble": "#1e293b",
    "ai_border": "#334155",
    "accent": "#4ade80",
    "accent2": "#60a5fa",
    "accent3": "#a78bfa",
    "danger": "#f87171",
    "warn": "#fbbf24",
    "text": "#e0e0e0",
    "dim": "#555555",
    "bright": "#ffffff",
}

FONT = "Noto Sans SC"


def chat_bubble(text_str, is_user=False, width=6.5, font_size=22):
    """Create a chat bubble like ChatGPT/WeChat UI."""
    color = COLORS["user_bubble"] if is_user else COLORS["ai_bubble"]
    border = COLORS["user_bubble"] if is_user else COLORS["ai_border"]
    
    # Main bubble body
    content = Text(text_str, font=FONT, font_size=font_size,
                   color=COLORS["bright"] if is_user else COLORS["text"],
                   line_spacing=1.3)
    
    # Constrain text width
    if content.width > width - 0.6:
        content.scale((width - 0.6) / content.width)
    
    padding_x = 0.4
    padding_y = 0.3
    bubble = RoundedRectangle(
        corner_radius=0.2,
        width=content.width + padding_x * 2,
        height=content.height + padding_y * 2,
        stroke_color=border,
        stroke_width=1.5,
        fill_color=color,
        fill_opacity=0.9,
    )
    content.move_to(bubble)
    
    # Role label
    role = Text("你" if is_user else "AI", font=FONT, font_size=14,
                color=COLORS["dim"])
    role.next_to(bubble, UP, buff=0.1)
    if is_user:
        role.align_to(bubble, RIGHT)
    else:
        role.align_to(bubble, LEFT)
    
    group = VGroup(role, bubble, content)
    
    # Align bubble
    if is_user:
        group.shift(RIGHT * 0.8)
    else:
        group.shift(LEFT * 0.8)
    
    return group


class ChatHallucination(Scene):
    """Show AI hallucination via familiar chat UI — three confident wrong answers."""

    def construct(self):
        self.camera.background_color = COLORS["bg"]

        # Title bar (like app header)
        header_bg = Rectangle(width=9, height=1.2, fill_color="#111827",
                              fill_opacity=1, stroke_width=0).move_to(UP * 7.4)
        header_text = Text("AI 助手", font=FONT, font_size=28,
                           color=COLORS["bright"]).move_to(header_bg)
        status = Text("● 在线", font=FONT, font_size=14,
                      color=COLORS["accent"]).next_to(header_text, RIGHT, buff=0.3)
        header = VGroup(header_bg, header_text, status)
        self.play(FadeIn(header))

        # === Round 1 ===
        # User question
        q1 = chat_bubble("Adam Kalai的生日是几月几号？", is_user=True)
        q1.move_to(UP * 5)
        self.play(FadeIn(q1, shift=UP * 0.3), run_time=0.5)
        self.wait(0.3)

        # AI typing indicator
        typing = Text("AI正在输入...", font=FONT, font_size=16,
                      color=COLORS["dim"]).move_to(UP * 3.5 + LEFT * 2.5)
        self.play(FadeIn(typing))
        self.wait(0.5)
        self.play(FadeOut(typing))

        # AI answer 1 — confident and wrong
        a1 = chat_bubble("根据公开信息，Adam Kalai的生日是\n7月3日。", is_user=False)
        a1.move_to(UP * 3.2)
        self.play(FadeIn(a1, shift=UP * 0.3), run_time=0.5)
        self.wait(1)

        # === Round 2 ===
        q2 = chat_bubble("你确定吗？再想想？", is_user=True)
        q2.move_to(UP * 1.2)
        self.play(FadeIn(q2, shift=UP * 0.3), run_time=0.5)
        self.wait(0.3)

        typing2 = Text("AI正在输入...", font=FONT, font_size=16,
                       color=COLORS["dim"]).move_to(DOWN * 0.5 + LEFT * 2.5)
        self.play(FadeIn(typing2))
        self.wait(0.5)
        self.play(FadeOut(typing2))

        # AI answer 2 — different date, still confident
        a2 = chat_bubble("抱歉，让我重新确认。Adam Kalai\n的生日是6月15日。", is_user=False)
        a2.move_to(DOWN * 0.8)
        self.play(FadeIn(a2, shift=UP * 0.3), run_time=0.5)
        self.wait(1)

        # === Round 3 ===
        q3 = chat_bubble("上次你说7月3日啊？", is_user=True)
        q3.move_to(DOWN * 2.8)
        self.play(FadeIn(q3, shift=UP * 0.3), run_time=0.5)
        self.wait(0.3)

        typing3 = Text("AI正在输入...", font=FONT, font_size=16,
                       color=COLORS["dim"]).move_to(DOWN * 4.5 + LEFT * 2.5)
        self.play(FadeIn(typing3))
        self.wait(0.5)
        self.play(FadeOut(typing3))

        a3 = chat_bubble("非常抱歉造成混淆。经过仔细查证，\n他的生日是1月1日。", is_user=False)
        a3.move_to(DOWN * 4.8)
        self.play(FadeIn(a3, shift=UP * 0.3), run_time=0.5)
        self.wait(1)

        # Reveal: all wrong
        # Red X marks on each AI answer
        strikes = VGroup()
        for a in [a1, a2, a3]:
            x_mark = Text("✗", font=FONT, font_size=40, color=COLORS["danger"])
            x_mark.move_to(a[1].get_right() + RIGHT * 0.5)
            strikes.add(x_mark)

        self.play(*[Write(x) for x in strikes])
        self.wait(0.5)

        # Verdict
        verdict = Text("三次回答，三个日期\n全部自信，全部错误",
                       font=FONT, font_size=28, color=COLORS["danger"],
                       line_spacing=1.3).move_to(DOWN * 7)
        self.play(Write(verdict))
        self.wait(2)


class ChatWithBookmark(Scene):
    """Show the U-curve problem via chat UI — user sends long doc, AI misses middle."""

    def construct(self):
        self.camera.background_color = COLORS["bg"]

        # Header
        header_bg = Rectangle(width=9, height=1.2, fill_color="#111827",
                              fill_opacity=1, stroke_width=0).move_to(UP * 7.4)
        header_text = Text("AI 助手", font=FONT, font_size=28,
                           color=COLORS["bright"]).move_to(header_bg)
        status = Text("● 在线", font=FONT, font_size=14,
                      color=COLORS["accent"]).next_to(header_text, RIGHT, buff=0.3)
        self.play(FadeIn(VGroup(header_bg, header_text, status)))

        # User sends a "document" — visualized as a long scrolling block
        doc_label = chat_bubble("帮我从这篇报告里找项目截止日期", is_user=True)
        doc_label.move_to(UP * 5.5)
        self.play(FadeIn(doc_label, shift=UP * 0.3), run_time=0.5)

        # Show a visual "document" block — gray with colored sections
        doc = VGroup()
        doc_bg = RoundedRectangle(
            width=7, height=8, corner_radius=0.15,
            stroke_color=COLORS["dim"], stroke_width=1,
            fill_color="#0f172a", fill_opacity=0.8,
        ).move_to(DOWN * 0.5)

        # Text lines representing document content
        sections = []
        y_start = doc_bg.get_top()[1] - 0.4
        for i in range(16):
            line_w = 5.5 + np.random.uniform(-1, 0.5)
            line = Rectangle(
                width=line_w, height=0.2,
                fill_color=COLORS["dim"], fill_opacity=0.3,
                stroke_width=0,
            )
            line.move_to(DOWN * 0.5 + UP * (y_start - 0.4 - i * 0.45))
            line.align_to(doc_bg, LEFT).shift(RIGHT * 0.5)
            sections.append(line)

        # The key info is in the MIDDLE (line 8)
        key_line = sections[8]
        key_line.set_fill(COLORS["warn"], opacity=0.8)

        # Label it
        key_label = Text("📌 截止日期: 3月15日", font=FONT, font_size=16,
                         color=COLORS["warn"]).move_to(key_line).shift(RIGHT * 0.3)

        doc.add(doc_bg, *sections, key_label)
        self.play(FadeIn(doc), run_time=1)
        self.wait(1)

        # AI "reads" — highlight sweeps through document
        # Bright at start, dims in middle, bright at end
        highlight = Rectangle(
            width=6.5, height=0.4,
            fill_color=COLORS["accent"], fill_opacity=0.3,
            stroke_width=0,
        )
        highlight.move_to(sections[0])

        self.play(FadeIn(highlight))

        # Sweep through — opacity changes to show attention
        for i in range(16):
            # U-curve attention: high at 0 and 15, low at 7-8
            t = i / 15
            attention = 0.15 + 0.85 * (4 * (t - 0.5) ** 2)
            target = highlight.copy().move_to(sections[i])
            target.set_fill(opacity=attention * 0.5)
            self.play(Transform(highlight, target), run_time=0.15)

        self.play(FadeOut(highlight))
        self.wait(0.5)

        # AI response — misses the date
        self.play(doc.animate.scale(0.4).move_to(UP * 2.5 + LEFT * 2))

        ai_response = chat_bubble("根据报告内容，这个项目涉及\n多个阶段的规划和执行...\n\n我没有找到具体的截止日期。",
                                  is_user=False, font_size=18)
        ai_response.move_to(DOWN * 3)
        self.play(FadeIn(ai_response, shift=UP * 0.3))
        self.wait(1)

        # Arrow pointing to the missed info
        arrow = Arrow(
            ai_response.get_top() + UP * 0.5,
            key_label.get_bottom() + DOWN * 0.1,
            color=COLORS["danger"], stroke_width=3,
        )
        miss_label = Text("就在这里！\n但AI看不见", font=FONT, font_size=20,
                          color=COLORS["danger"], line_spacing=1.2
                          ).next_to(arrow, RIGHT, buff=0.2)
        self.play(Create(arrow), Write(miss_label))
        self.wait(2)


class TextDegradation(Scene):
    """Show model collapse via actual text getting blander each generation.
    Visual: text blocks with decreasing color richness."""

    def construct(self):
        self.camera.background_color = COLORS["bg"]

        title = Text("复印机效应", font=FONT, font_size=42,
                     color=COLORS["warn"]).move_to(UP * 7)
        self.play(Write(title))

        # Five "pages" showing text degradation
        generations = [
            {
                "gen": "第0代 · 人类原创",
                "text": "落日余晖洒在湖面\n像碎金在水中跳舞\n微风拂过芦苇丛\n惊起一只白鹭",
                "color": COLORS["accent"],
                "bg_opacity": 0.15,
                "text_color": COLORS["bright"],
            },
            {
                "gen": "第1代 · AI学习",
                "text": "夕阳照在湖面上\n闪闪发光\n风吹过湖边的草\n有鸟飞起来",
                "color": COLORS["accent2"],
                "bg_opacity": 0.12,
                "text_color": COLORS["text"],
            },
            {
                "gen": "第3代 · AI学AI",
                "text": "太阳照在湖上\n湖面很漂亮\n有风\n有鸟",
                "color": COLORS["warn"],
                "bg_opacity": 0.08,
                "text_color": "#999999",
            },
            {
                "gen": "第5代 · 坍缩",
                "text": "一个美丽的场景\n一个美丽的场景\n一个美丽的场景\n一个美丽的场景",
                "color": COLORS["danger"],
                "bg_opacity": 0.05,
                "text_color": "#666666",
            },
        ]

        cards = VGroup()
        for i, gen in enumerate(generations):
            # Page card
            page = RoundedRectangle(
                width=7, height=3.2, corner_radius=0.15,
                stroke_color=gen["color"], stroke_width=2,
                fill_color=gen["color"], fill_opacity=gen["bg_opacity"],
            )

            gen_label = Text(gen["gen"], font=FONT, font_size=18,
                             color=gen["color"])
            gen_label.next_to(page, UP, buff=0.15).align_to(page, LEFT).shift(RIGHT * 0.2)

            content = Text(gen["text"], font=FONT, font_size=20,
                           color=gen["text_color"], line_spacing=1.4)
            content.move_to(page)

            card = VGroup(gen_label, page, content)
            card.move_to(UP * (4.5 - i * 3.8))
            cards.add(card)

        # Animate one by one
        for i, card in enumerate(cards):
            self.play(FadeIn(card, shift=LEFT * 0.5), run_time=0.8)
            self.wait(0.8)

            # After gen 0, show a "copy" arrow
            if i < len(cards) - 1:
                arrow = Arrow(
                    card.get_bottom() + DOWN * 0.1,
                    cards[i + 1].get_top() + UP * 0.6,
                    color=COLORS["dim"], stroke_width=2, buff=0.1,
                    max_tip_length_to_length_ratio=0.15,
                )
                copy_label = Text("复印", font=FONT, font_size=14,
                                  color=COLORS["dim"]).next_to(arrow, RIGHT, buff=0.1)
                self.play(Create(arrow), Write(copy_label), run_time=0.4)

        self.wait(2)
