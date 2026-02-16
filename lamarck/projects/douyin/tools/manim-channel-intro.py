"""
Channel intro animation — 3-5 second animated brand identity.

Concept: The name "Lamarck" (or Chinese equivalent) forms from scattered particles/nodes,
like a neural network assembling into text. Accent color glow.

Vertical format (1080x1920), 3 seconds.
"""
from manim import *
import numpy as np

class ChannelIntro(Scene):
    def construct(self):
        self.camera.frame_width = 10.8
        self.camera.frame_height = 19.2
        self.camera.background_color = "#0a0a0a"

        # Brand name
        brand = Text("LAMARCK", font="Noto Sans SC", font_size=64, color=WHITE, weight=BOLD)
        brand.move_to(ORIGIN)

        # Tagline
        tagline = Text("AI · 认知 · 洞察", font="Noto Sans SC", font_size=24, color="#888888")
        tagline.next_to(brand, DOWN, buff=0.5)

        # Create scattered particles that will converge
        particles = VGroup()
        rng = np.random.default_rng(42)
        for _ in range(30):
            dot = Dot(
                point=np.array([
                    rng.uniform(-5, 5),
                    rng.uniform(-8, 8),
                    0,
                ]),
                radius=rng.uniform(0.03, 0.08),
                color="#00d4ff",
                fill_opacity=rng.uniform(0.3, 0.8),
            )
            particles.add(dot)

        # Thin connection lines between nearby particles
        lines = VGroup()
        positions = [p.get_center() for p in particles]
        for i in range(len(positions)):
            for j in range(i + 1, len(positions)):
                dist = np.linalg.norm(positions[i] - positions[j])
                if dist < 3.0:
                    line = Line(
                        positions[i], positions[j],
                        stroke_width=0.5,
                        stroke_opacity=0.15,
                        color="#00d4ff",
                    )
                    lines.add(line)

        # Phase 1: Particles appear and drift (0.5s)
        self.play(FadeIn(particles, scale=0.5), FadeIn(lines), run_time=0.5)

        # Phase 2: Particles converge toward center while brand forms (1.0s)
        # Converge particles
        target_positions = []
        for i, p in enumerate(particles):
            angle = i * 2 * np.pi / len(particles)
            r = rng.uniform(1.5, 3.0)
            target = np.array([r * np.cos(angle), r * np.sin(angle), 0])
            target_positions.append(target)

        particle_anims = [
            p.animate.move_to(target_positions[i])
            for i, p in enumerate(particles)
        ]

        self.play(
            *particle_anims,
            FadeOut(lines),
            run_time=0.8,
        )

        # Phase 3: Brand name writes in (1.0s)
        # Glow behind text
        glow = Circle(radius=2.5, color="#00d4ff", fill_opacity=0.08, stroke_width=0)
        glow.move_to(ORIGIN)

        self.play(
            FadeIn(glow, scale=0.5),
            Write(brand),
            run_time=0.8,
        )

        # Phase 4: Tagline fades in (0.5s)
        self.play(
            FadeIn(tagline, shift=UP * 0.2),
            run_time=0.4,
        )

        # Phase 5: Hold (0.5s) then particles fade
        self.wait(0.3)
        self.play(
            FadeOut(particles),
            FadeOut(glow),
            run_time=0.3,
        )

        # Final hold
        self.wait(0.3)
