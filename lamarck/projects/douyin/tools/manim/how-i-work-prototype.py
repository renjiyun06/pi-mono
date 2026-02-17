"""
How I Work — Visual Prototype: The Tool Loop with Context Gauge

Shows what happens when an AI agent processes a request:
1. User message arrives → context gauge increases
2. Agent calls tools (read, edit, bash) → each tool call and result fills the gauge
3. Agent generates response → final gauge level

The gauge is a vertical bar on the right side showing context window usage.
Tool calls appear as terminal-style entries on the left.
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

# Safe zone boundaries in Manim units
SAFE_TOP = FRAME_H / 200 - 160 / 100  # ~8.0
SAFE_BOTTOM = -(FRAME_H / 200 - 480 / 100)  # ~-4.8
SAFE_LEFT = -(FRAME_W / 200 - 120 / 100)  # ~-4.2
SAFE_RIGHT = FRAME_W / 200 - 120 / 100   # ~4.2
SAFE_W = SAFE_RIGHT - SAFE_LEFT  # ~8.4
SAFE_H = SAFE_TOP - SAFE_BOTTOM  # ~12.8

TERMINAL_GREEN = "#58a6ff"
ACCENT_ORANGE = "#f0883e"
ACCENT_RED = "#f85149"
ACCENT_YELLOW = "#e3b341"
DIM_TEXT = "#484f58"
GAUGE_BG = "#161b22"
GAUGE_FILL = "#238636"
GAUGE_WARN = "#e3b341"
GAUGE_DANGER = "#f85149"


class ToolLoopWithGauge(Scene):
    """
    Split view: left = terminal showing tool calls, right = context gauge filling up.
    """

    def construct(self):
        # === Context Gauge (right side) ===
        gauge_x = SAFE_RIGHT - 0.8
        gauge_h = SAFE_H - 2
        gauge_w = 0.5
        gauge_bottom = SAFE_BOTTOM + 1.5

        # Background bar
        gauge_bg = Rectangle(
            width=gauge_w, height=gauge_h,
            color="#30363d", fill_color=GAUGE_BG, fill_opacity=1,
            stroke_width=1
        ).move_to([gauge_x, gauge_bottom + gauge_h / 2, 0])

        # Label
        gauge_label = Text("上下文", font="Noto Sans SC", font_size=16,
                           color=DIM_TEXT).next_to(gauge_bg, UP, buff=0.15)
        tokens_label = Text("0 / 200K", font="JetBrains Mono", font_size=14,
                            color=DIM_TEXT).next_to(gauge_bg, DOWN, buff=0.15)

        self.add(gauge_bg, gauge_label, tokens_label)

        # Fill bar (starts empty)
        fill_bar = Rectangle(
            width=gauge_w - 0.06, height=0.01,
            color=GAUGE_FILL, fill_color=GAUGE_FILL, fill_opacity=0.8,
            stroke_width=0
        ).align_to(gauge_bg, DOWN).shift(UP * 0.03)

        self.add(fill_bar)

        # === Terminal Area (left side) ===
        term_x = SAFE_LEFT + (SAFE_W - 1.6) / 2  # center in remaining space
        term_top = SAFE_TOP - 0.5

        # Title
        title = Text("λ > 处理中...", font="JetBrains Mono", font_size=22,
                      color=TERMINAL_GREEN).move_to([term_x, term_top, 0])
        self.add(title)

        # --- Animation sequence ---
        entries = [
            ("user", "用户: 修复 login.ts 中的bug", 0.08, "12K"),
            ("system", "[系统提示 + AGENTS.md 加载]", 0.15, "32K"),
            ("read", "→ read login.ts", 0.05, "35K"),
            ("read", "→ read auth-service.ts", 0.04, "39K"),
            ("think", "  思考中...", 0.02, "41K"),
            ("edit", "→ edit login.ts (修复空指针检查)", 0.03, "44K"),
            ("read", "→ read login.test.ts", 0.04, "48K"),
            ("bash", "→ bash: npm test login.test.ts", 0.06, "54K"),
            ("result", "  ✓ 3 tests passed", 0.02, "56K"),
            ("think", "  思考中...", 0.01, "57K"),
            ("edit", "→ edit login.ts (添加日志)", 0.02, "59K"),
            ("bash", "→ bash: npm test", 0.08, "67K"),
            ("result", "  ✓ 47 tests passed", 0.02, "69K"),
            ("response", "回复: 已修复login.ts中的空指针异常...", 0.04, "73K"),
        ]

        entry_y = term_top - 0.7
        entry_spacing = 0.55

        for i, (entry_type, text, fill_pct, token_str) in enumerate(entries):
            y = entry_y - i * entry_spacing

            # Color based on type
            if entry_type == "user":
                color = ACCENT_ORANGE
            elif entry_type == "system":
                color = DIM_TEXT
            elif entry_type == "read":
                color = TERMINAL_GREEN
            elif entry_type == "edit":
                color = ACCENT_YELLOW
            elif entry_type == "bash":
                color = "#bc8cff"  # purple for bash
            elif entry_type == "result":
                color = GAUGE_FILL
            elif entry_type == "think":
                color = DIM_TEXT
            elif entry_type == "response":
                color = WHITE
            else:
                color = WHITE

            # Create text entry
            entry_text = Text(
                text, font="JetBrains Mono", font_size=18,
                color=color
            ).move_to([term_x, y, 0])

            # Calculate new fill height
            cumulative_fill = sum(e[2] for e in entries[:i + 1])
            new_h = max(0.01, cumulative_fill * gauge_h)
            gauge_color = GAUGE_FILL
            if cumulative_fill > 0.7:
                gauge_color = GAUGE_WARN
            if cumulative_fill > 0.9:
                gauge_color = GAUGE_DANGER

            new_fill = Rectangle(
                width=gauge_w - 0.06, height=new_h,
                color=gauge_color, fill_color=gauge_color, fill_opacity=0.8,
                stroke_width=0
            )
            new_fill.move_to([gauge_x, gauge_bottom + 0.03 + new_h / 2, 0])

            new_tokens = Text(
                f"{token_str} / 200K", font="JetBrains Mono", font_size=14,
                color=gauge_color if cumulative_fill > 0.7 else DIM_TEXT
            ).next_to(gauge_bg, DOWN, buff=0.15)

            # Animate
            self.play(
                FadeIn(entry_text, shift=LEFT * 0.3),
                Transform(fill_bar, new_fill),
                Transform(tokens_label, new_tokens),
                run_time=0.5
            )
            self.wait(0.3)

        # Final pause
        self.wait(1)

        # Flash the total
        total_text = Text(
            "一次对话 = 17次工具调用 + 73K tokens",
            font="Noto Sans SC", font_size=20,
            color=ACCENT_ORANGE
        ).move_to([term_x, SAFE_BOTTOM + 0.8, 0])

        self.play(FadeIn(total_text, shift=UP * 0.3), run_time=0.5)
        self.wait(2)


class MemoryReload(Scene):
    """
    Shows what happens on session start:
    1. Terminal boots
    2. memory-loader.ts fires
    3. Vault notes load one by one
    4. Context gauge fills with "memory" before user even speaks
    """

    def construct(self):
        center_x = (SAFE_LEFT + SAFE_RIGHT) / 2
        y = SAFE_TOP - 1

        # Boot sequence
        lines = [
            ("λ > session_start", TERMINAL_GREEN, 0.8),
            ("STATUS: 加载扩展...", DIM_TEXT, 0.4),
            ("  ✓ memory-loader.ts", GAUGE_FILL, 0.3),
            ("  ✓ main-session/index.ts", GAUGE_FILL, 0.3),
            ("  ✓ reload-tool.ts", GAUGE_FILL, 0.3),
            ("", None, 0.2),
            ("memory-loader: 读取 vault/Index.md", ACCENT_ORANGE, 0.5),
            ("memory-loader: 按照 Context Restore 指引...", ACCENT_ORANGE, 0.4),
            ("", None, 0.2),
            ("→ read vault/Notes/edge-tts.md", TERMINAL_GREEN, 0.2),
            ("→ read vault/Notes/extensions.md", TERMINAL_GREEN, 0.2),
            ("→ read vault/Notes/how-pi-compacts-memory.md", TERMINAL_GREEN, 0.2),
            ("→ read vault/Notes/ai-self-narration-genre.md", TERMINAL_GREEN, 0.2),
            ("→ read vault/Notes/video-quality-gap-synthesis.md", TERMINAL_GREEN, 0.2),
            ("  ... 读取 18 个高优先级笔记", DIM_TEXT, 0.3),
            ("", None, 0.2),
            ("→ git log --oneline -20", "#bc8cff", 0.3),
            ("→ read vault/Daily/2026-02-17.md", TERMINAL_GREEN, 0.3),
            ("", None, 0.3),
            ("STATUS: 上下文已恢复", GAUGE_FILL, 0.5),
            ("COST: 47K tokens（你还没说一个字）", ACCENT_YELLOW, 0.8),
        ]

        texts = []
        for i, (text, color, wait) in enumerate(lines):
            if not text:
                y -= 0.3
                self.wait(wait)
                continue

            t = Text(text, font="JetBrains Mono", font_size=18,
                     color=color).move_to([center_x, y, 0])
            self.play(FadeIn(t, shift=LEFT * 0.2), run_time=0.3)
            texts.append(t)
            y -= 0.5

            if wait > 0.3:
                self.wait(wait - 0.3)

        self.wait(2)


if __name__ == "__main__":
    # Render: manim -pql how-i-work-prototype.py ToolLoopWithGauge
    pass
