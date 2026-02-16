import React from "react";
import {
	AbsoluteFill,
	interpolate,
	useCurrentFrame,
	useVideoConfig,
	spring,
	Sequence,
	Easing,
	staticFile,
} from "remotion";
import { Video } from "@remotion/media";

/**
 * DeepDive — a composition for longer-form content (2-5 minutes).
 *
 * Features:
 * - Multiple scene types: "text", "data", "quote", "chapter", "code", "comparison"
 * - Smooth crossfade transitions between sections
 * - Progress bar at top
 * - Chapter title cards with bold typography
 * - Designed for educational/explainer content where a topic unfolds step by step
 *
 * Section types:
 * - chapter: Large bold title card (section opener)
 * - text: Standard narration text on gradient bg
 * - data: Numeric stat with label (animated count-up)
 * - quote: Quoted text with attribution
 * - code: Monospace code/terminal display
 * - comparison: Left vs right layout
 */

type SceneType = "text" | "data" | "quote" | "chapter" | "code" | "comparison" | "visual" | "timeline";

interface DeepDiveSection {
	text: string;
	startFrame: number;
	durationFrames: number;
	sceneType?: SceneType;
	// data scene
	stat?: string;
	statLabel?: string;
	// quote scene
	attribution?: string;
	// comparison scene
	leftText?: string;
	rightText?: string;
	leftLabel?: string;
	rightLabel?: string;
	// timeline scene
	timelineItems?: Array<{ date: string; event: string }>;
	// visual scene
	videoSrc?: string; // path to video file in public/ (for staticFile) or absolute URL
	caption?: string; // optional caption below video
	videoPlaybackRate?: number; // computed by render pipeline to match narration length
	// subtitle — narration text shown at bottom of screen
	subtitle?: string;
	// styling
	emphasis?: boolean;
	accentOverride?: string;
}

interface DeepDiveProps {
	title?: string;
	sections: DeepDiveSection[];
	authorName?: string;
	backgroundColor?: string;
	accentColor?: string;
	secondaryColor?: string;
	particles?: boolean; // enable subtle floating particle background
}

// ---- Particle Field ----
// Deterministic floating dots using seeded pseudo-random (no Math.random — Remotion requires pure rendering)
const seededRandom = (seed: number): number => {
	const x = Math.sin(seed * 9301 + 49297) * 233280;
	return x - Math.floor(x);
};

const PARTICLE_COUNT = 40;

const ParticleField: React.FC<{
	accentColor: string;
}> = ({ accentColor }) => {
	const frame = useCurrentFrame();

	// Pre-compute particle positions (deterministic)
	const particles = React.useMemo(() => {
		return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
			x: seededRandom(i * 7 + 1) * 100, // % of width
			y: seededRandom(i * 13 + 3) * 100, // % of height
			size: 2 + seededRandom(i * 19 + 5) * 5, // 2-7px
			speed: 0.3 + seededRandom(i * 23 + 7) * 0.7, // drift speed
			phase: seededRandom(i * 29 + 11) * Math.PI * 2, // phase offset
			baseOpacity: 0.06 + seededRandom(i * 31 + 13) * 0.12, // 0.06-0.18
		}));
	}, []);

	return (
		<AbsoluteFill style={{ pointerEvents: "none", zIndex: 1 }}>
			{particles.map((p, i) => {
				// Slow drift — each particle drifts in a unique elliptical path
				const driftX = Math.sin(frame * 0.008 * p.speed + p.phase) * 3;
				const driftY = Math.cos(frame * 0.006 * p.speed + p.phase * 1.3) * 4;
				// Opacity pulses slowly
				const opacityPulse = 0.7 + 0.3 * Math.sin(frame * 0.015 * p.speed + p.phase);

				return (
					<div
						key={`particle-${i}`}
						style={{
							position: "absolute",
							left: `${p.x + driftX}%`,
							top: `${p.y + driftY}%`,
							width: p.size,
							height: p.size,
							borderRadius: "50%",
							backgroundColor: accentColor,
							opacity: p.baseOpacity * opacityPulse,
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

// Palette for scene backgrounds — subtle gradient shifts
const sceneGradients: Record<SceneType, [string, string]> = {
	chapter: ["#0a0a1a", "#1a0a2e"],
	text: ["#0a0f1a", "#0f1a2e"],
	data: ["#0a1a1a", "#0a2e2e"],
	quote: ["#1a0a1a", "#2e0a2e"],
	code: ["#0d1117", "#161b22"],
	comparison: ["#0a0a1a", "#1a1a2e"],
	visual: ["#0a0a1a", "#0a0a1a"],
	timeline: ["#0a0a1a", "#0f1a2e"],
};

// ---- Sub-components ----

const ProgressBar: React.FC<{
	progress: number;
	accentColor: string;
}> = ({ progress, accentColor }) => {
	return (
		<div
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				right: 0,
				height: 4,
				backgroundColor: "rgba(255,255,255,0.05)",
				zIndex: 100,
			}}
		>
			<div
				style={{
					width: `${progress * 100}%`,
					height: "100%",
					backgroundColor: accentColor,
					opacity: 0.7,
					borderRadius: "0 2px 2px 0",
				}}
			/>
		</div>
	);
};

const SceneBg: React.FC<{
	sceneType: SceneType;
	frame: number;
	durationFrames: number;
}> = ({ sceneType, frame, durationFrames }) => {
	const [from, to] = sceneGradients[sceneType] || sceneGradients.text;

	// Slow angle drift
	const angle = 135 + Math.sin(frame * 0.005) * 15;

	// Fade in/out
	const opacity = interpolate(
		frame,
		[0, 20, durationFrames - 15, durationFrames],
		[0, 1, 1, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);

	return (
		<AbsoluteFill
			style={{
				background: `linear-gradient(${angle}deg, ${from}, ${to})`,
				opacity,
			}}
		/>
	);
};

// Chapter title card — cinematic entrance with slow zoom and glow
const ChapterScene: React.FC<{
	text: string;
	durationFrames: number;
	accentColor: string;
}> = ({ text, durationFrames, accentColor }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const fadeIn = interpolate(frame, [0, 25], [0, 1], {
		extrapolateRight: "clamp",
	});
	const fadeOut = interpolate(
		frame,
		[durationFrames - 15, durationFrames],
		[1, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);

	// Slow continuous zoom (1.0 → 1.05 over the entire scene)
	const zoom = interpolate(frame, [0, durationFrames], [1.0, 1.05], {
		extrapolateRight: "clamp",
	});

	// Split into lines, then reveal char by char
	const lines = text.split("\n");
	const charsPerFrame = 0.15; // ~4.5 chars/sec at 30fps

	// Accent line grows from center
	const lineWidth = interpolate(frame, [5, 30], [0, 240], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.quad),
	});

	// Glow pulse behind the text
	const glowEnd = Math.max(41, durationFrames - 30);
	const glowOpacity = interpolate(
		frame,
		[15, 40, glowEnd],
		[0, 0.15, 0.08],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);

	return (
		<AbsoluteFill
			style={{
				justifyContent: "center",
				alignItems: "center",
				padding: "0 80px",
				opacity: Math.min(fadeIn, fadeOut),
				transform: `scale(${zoom})`,
			}}
		>
			{/* Radial glow behind text */}
			<div
				style={{
					position: "absolute",
					width: 600,
					height: 400,
					borderRadius: "50%",
					background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
					opacity: glowOpacity,
					filter: "blur(60px)",
				}}
			/>

			<div style={{ textAlign: "center", position: "relative" }}>
				{/* Accent line above */}
				<div
					style={{
						width: lineWidth,
						height: 3,
						backgroundColor: accentColor,
						margin: "0 auto 44px",
						borderRadius: 2,
					}}
				/>

				{/* Character-by-character reveal, line by line */}
				{(() => {
					let globalCharIdx = 0;
					return lines.map((line, lineIdx) => {
						const lineChars = [...line]; // proper unicode split
						const lineElements = lineChars.map((char, ci) => {
							const charFrame = globalCharIdx / charsPerFrame;
							globalCharIdx++;
							const charOpacity = interpolate(
								frame,
								[charFrame, charFrame + 4],
								[0, 1],
								{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
							);
							return (
								<span key={ci} style={{ opacity: charOpacity }}>
									{char}
								</span>
							);
						});
						return (
							<div
								key={lineIdx}
								style={{
									fontSize: 68,
									fontWeight: 900,
									color: "#ffffff",
									lineHeight: 1.5,
									letterSpacing: 3,
									fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
								}}
							>
								{lineElements}
							</div>
						);
					});
				})()}

				{/* Accent line below */}
				<div
					style={{
						width: lineWidth * 0.6,
						height: 2,
						backgroundColor: accentColor,
						margin: "44px auto 0",
						borderRadius: 2,
						opacity: 0.4,
					}}
				/>
			</div>
		</AbsoluteFill>
	);
};

// Standard text scene — line-by-line staggered reveal
// Emphasis mode: no glass card, larger text, accent underline per line
// Normal mode: glass card container
const TextScene: React.FC<{
	text: string;
	emphasis?: boolean;
	durationFrames: number;
	accentColor: string;
}> = ({ text, emphasis, durationFrames, accentColor }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const fadeOut = interpolate(
		frame,
		[durationFrames - 15, durationFrames],
		[1, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);

	// Split text into lines for staggered reveal
	const lines = text.split("\n").filter((l) => l.trim());
	const staggerDelay = 8; // frames between each line

	if (emphasis) {
		// Emphasis mode: floating text, no card, per-line reveal with accent underlines
		return (
			<AbsoluteFill
				style={{
					justifyContent: "center",
					alignItems: "center",
					padding: "0 80px",
					opacity: fadeOut,
				}}
			>
				<div style={{ textAlign: "center", maxWidth: 920 }}>
					{lines.map((line, idx) => {
						const lineDelay = idx * staggerDelay;
						const lineSlide = spring({
							fps,
							frame: Math.max(0, frame - lineDelay),
							config: { damping: 18, stiffness: 100, mass: 0.8 },
						});
						const lineOpacity = interpolate(
							frame,
							[lineDelay, lineDelay + 12],
							[0, 1],
							{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
						);
						// Accent underline grows in after text settles
						const underlineWidth = interpolate(
							frame,
							[lineDelay + 15, lineDelay + 35],
							[0, 1],
							{ extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) },
						);

						return (
							<div
								key={idx}
								style={{
									opacity: lineOpacity,
									transform: `translateY(${interpolate(lineSlide, [0, 1], [30, 0])}px)`,
									marginBottom: idx < lines.length - 1 ? 20 : 0,
								}}
							>
								<div
									style={{
										fontSize: 50,
										fontWeight: 800,
										color: "#ffffff",
										lineHeight: 1.6,
										letterSpacing: 1,
										fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
									}}
								>
									{line}
								</div>
								{/* Per-line accent underline */}
								<div
									style={{
										height: 3,
										width: `${underlineWidth * 60}%`,
										background: accentColor,
										borderRadius: 2,
										margin: "8px auto 0",
										opacity: 0.5,
									}}
								/>
							</div>
						);
					})}
				</div>
			</AbsoluteFill>
		);
	}

	// Normal mode: glass card with staggered line reveal
	const cardFade = interpolate(frame, [0, 20], [0, 1], {
		extrapolateRight: "clamp",
	});
	const cardSlide = spring({
		fps,
		frame,
		config: { damping: 200, stiffness: 80, mass: 0.6 },
	});

	return (
		<AbsoluteFill
			style={{
				justifyContent: "center",
				alignItems: "center",
				padding: "0 60px",
				opacity: Math.min(cardFade, fadeOut),
			}}
		>
			<div
				style={{
					transform: `translateY(${interpolate(cardSlide, [0, 1], [40, 0])}px)`,
					background: "rgba(255,255,255,0.04)",
					backdropFilter: "blur(20px)",
					borderRadius: 20,
					border: "1px solid rgba(255,255,255,0.08)",
					padding: "44px 36px",
					maxWidth: 920,
					width: "100%",
				}}
			>
				{lines.map((line, idx) => {
					const lineDelay = 8 + idx * staggerDelay;
					const lineOpacity = interpolate(
						frame,
						[lineDelay, lineDelay + 12],
						[0, 1],
						{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
					);
					const lineSlide = spring({
						fps,
						frame: Math.max(0, frame - lineDelay),
						config: { damping: 200, stiffness: 100 },
					});

					return (
						<div
							key={idx}
							style={{
								opacity: lineOpacity,
								transform: `translateY(${interpolate(lineSlide, [0, 1], [20, 0])}px)`,
								fontSize: 38,
								fontWeight: 500,
								color: "rgba(255,255,255,0.9)",
								textAlign: "center",
								lineHeight: 1.9,
								fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
							}}
						>
							{line}
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

// Data/stat scene — big number with animated count-up
const DataScene: React.FC<{
	text: string;
	stat?: string;
	statLabel?: string;
	durationFrames: number;
	accentColor: string;
}> = ({ text, stat, statLabel, durationFrames, accentColor }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const fadeIn = interpolate(frame, [0, 18], [0, 1], {
		extrapolateRight: "clamp",
	});
	const fadeOut = interpolate(
		frame,
		[durationFrames - 15, durationFrames],
		[1, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);

	// Scale-in for the stat
	const statScale = spring({
		fps,
		frame,
		delay: 5,
		config: { damping: 15, stiffness: 120 },
	});

	// Fade-in for the label text
	const labelOpacity = interpolate(frame, [20, 40], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill
			style={{
				justifyContent: "center",
				alignItems: "center",
				padding: "0 80px",
				opacity: Math.min(fadeIn, fadeOut),
			}}
		>
			<div style={{ textAlign: "center" }}>
				{stat && (
					<div
						style={{
							fontSize: 120,
							fontWeight: 900,
							color: accentColor,
							transform: `scale(${statScale})`,
							lineHeight: 1.2,
							fontFamily:
								'"Noto Sans SC", "PingFang SC", sans-serif',
						}}
					>
						{stat}
					</div>
				)}
				{statLabel && (
					<div
						style={{
							fontSize: 28,
							color: "rgba(255,255,255,0.5)",
							marginTop: 12,
							opacity: labelOpacity,
							fontFamily:
								'"Noto Sans SC", "PingFang SC", sans-serif',
						}}
					>
						{statLabel}
					</div>
				)}
				<div
					style={{
						fontSize: 38,
						fontWeight: 500,
						color: "rgba(255,255,255,0.85)",
						marginTop: stat ? 40 : 0,
						lineHeight: 1.8,
						whiteSpace: "pre-line",
						opacity: labelOpacity,
						fontFamily:
							'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
					}}
				>
					{text}
				</div>
			</div>
		</AbsoluteFill>
	);
};

// Quote scene — styled quotation
const QuoteScene: React.FC<{
	text: string;
	attribution?: string;
	durationFrames: number;
	accentColor: string;
}> = ({ text, attribution, durationFrames, accentColor }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const fadeIn = interpolate(frame, [0, 20], [0, 1], {
		extrapolateRight: "clamp",
	});
	const fadeOut = interpolate(
		frame,
		[durationFrames - 15, durationFrames],
		[1, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);
	const slideY = spring({
		fps,
		frame,
		config: { damping: 200, stiffness: 60 },
	});

	return (
		<AbsoluteFill
			style={{
				justifyContent: "center",
				alignItems: "center",
				padding: "0 80px",
				opacity: Math.min(fadeIn, fadeOut),
			}}
		>
			<div
				style={{
					transform: `translateY(${interpolate(slideY, [0, 1], [30, 0])}px)`,
					textAlign: "center",
					maxWidth: 880,
				}}
			>
				{/* Large quotation mark */}
				<div
					style={{
						fontSize: 140,
						color: accentColor,
						opacity: 0.2,
						lineHeight: 0.6,
						marginBottom: 20,
						fontFamily: "Georgia, serif",
					}}
				>
					"
				</div>
				<div
					style={{
						fontSize: 42,
						fontWeight: 600,
						color: "#ffffff",
						lineHeight: 1.8,
						whiteSpace: "pre-line",
						fontStyle: "italic",
						fontFamily:
							'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
					}}
				>
					{text}
				</div>
				{attribution && (
					<div
						style={{
							fontSize: 24,
							color: "rgba(255,255,255,0.4)",
							marginTop: 30,
							fontFamily:
								'"Noto Sans SC", "PingFang SC", sans-serif',
						}}
					>
						— {attribution}
					</div>
				)}
			</div>
		</AbsoluteFill>
	);
};

// Code scene — terminal/code display
const CodeScene: React.FC<{
	text: string;
	durationFrames: number;
	accentColor: string;
}> = ({ text, durationFrames, accentColor }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const fadeIn = interpolate(frame, [0, 15], [0, 1], {
		extrapolateRight: "clamp",
	});
	const fadeOut = interpolate(
		frame,
		[durationFrames - 15, durationFrames],
		[1, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);

	// Typewriter effect for code
	const charsToShow = Math.floor(
		interpolate(frame, [5, Math.min(durationFrames * 0.6, 90)], [0, text.length], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
	);

	const displayText = text.substring(0, charsToShow);

	// Blinking cursor
	const cursorOpacity =
		charsToShow < text.length ? (Math.sin(frame * 0.2) > 0 ? 1 : 0) : 0;

	return (
		<AbsoluteFill
			style={{
				justifyContent: "center",
				alignItems: "center",
				padding: "0 50px",
				opacity: Math.min(fadeIn, fadeOut),
			}}
		>
			<div
				style={{
					background: "rgba(13,17,23,0.9)",
					borderRadius: 16,
					border: "1px solid rgba(255,255,255,0.1)",
					padding: "32px 28px",
					maxWidth: 960,
					width: "100%",
				}}
			>
				{/* Terminal dots */}
				<div
					style={{
						display: "flex",
						gap: 8,
						marginBottom: 20,
					}}
				>
					<div
						style={{
							width: 12,
							height: 12,
							borderRadius: "50%",
							backgroundColor: "#ff5f56",
						}}
					/>
					<div
						style={{
							width: 12,
							height: 12,
							borderRadius: "50%",
							backgroundColor: "#ffbd2e",
						}}
					/>
					<div
						style={{
							width: 12,
							height: 12,
							borderRadius: "50%",
							backgroundColor: "#27c93f",
						}}
					/>
				</div>
				<pre
					style={{
						fontSize: 28,
						color: "rgba(255,255,255,0.85)",
						fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
						lineHeight: 1.7,
						whiteSpace: "pre-wrap",
						wordBreak: "break-all",
						margin: 0,
					}}
				>
					{displayText}
					<span style={{ opacity: cursorOpacity, color: accentColor }}>
						▎
					</span>
				</pre>
			</div>
		</AbsoluteFill>
	);
};

// Comparison scene — side by side
const ComparisonScene: React.FC<{
	text: string;
	leftText?: string;
	rightText?: string;
	leftLabel?: string;
	rightLabel?: string;
	durationFrames: number;
	accentColor: string;
	secondaryColor: string;
}> = ({
	text,
	leftText,
	rightText,
	leftLabel,
	rightLabel,
	durationFrames,
	accentColor,
	secondaryColor,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const fadeIn = interpolate(frame, [0, 18], [0, 1], {
		extrapolateRight: "clamp",
	});
	const fadeOut = interpolate(
		frame,
		[durationFrames - 15, durationFrames],
		[1, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);

	// Staggered entrance for left and right
	const leftSlide = spring({
		fps,
		frame,
		delay: 10,
		config: { damping: 200, stiffness: 80 },
	});
	const rightSlide = spring({
		fps,
		frame,
		delay: 20,
		config: { damping: 200, stiffness: 80 },
	});

	return (
		<AbsoluteFill
			style={{
				justifyContent: "center",
				alignItems: "center",
				padding: "0 50px",
				opacity: Math.min(fadeIn, fadeOut),
			}}
		>
			<div style={{ width: "100%", maxWidth: 960 }}>
				{/* Header text */}
				{text && (
					<div
						style={{
							fontSize: 36,
							fontWeight: 600,
							color: "rgba(255,255,255,0.8)",
							textAlign: "center",
							marginBottom: 40,
							lineHeight: 1.6,
							whiteSpace: "pre-line",
							fontFamily:
								'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
						}}
					>
						{text}
					</div>
				)}

				{/* Two columns */}
				<div
					style={{
						display: "flex",
						gap: 20,
					}}
				>
					{/* Left */}
					<div
						style={{
							flex: 1,
							background: "rgba(255,255,255,0.04)",
							borderRadius: 16,
							border: `1px solid ${secondaryColor}30`,
							padding: "28px 24px",
							transform: `translateX(${interpolate(leftSlide, [0, 1], [-30, 0])}px)`,
							opacity: leftSlide,
						}}
					>
						{leftLabel && (
							<div
								style={{
									fontSize: 20,
									color: secondaryColor,
									fontWeight: 700,
									marginBottom: 16,
									textTransform: "uppercase",
									letterSpacing: 2,
									fontFamily:
										'"Noto Sans SC", "PingFang SC", sans-serif',
								}}
							>
								{leftLabel}
							</div>
						)}
						<div
							style={{
								fontSize: 30,
								color: "rgba(255,255,255,0.8)",
								lineHeight: 1.7,
								whiteSpace: "pre-line",
								fontFamily:
									'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
							}}
						>
							{leftText || ""}
						</div>
					</div>

					{/* Right */}
					<div
						style={{
							flex: 1,
							background: "rgba(255,255,255,0.04)",
							borderRadius: 16,
							border: `1px solid ${accentColor}30`,
							padding: "28px 24px",
							transform: `translateX(${interpolate(rightSlide, [0, 1], [30, 0])}px)`,
							opacity: rightSlide,
						}}
					>
						{rightLabel && (
							<div
								style={{
									fontSize: 20,
									color: accentColor,
									fontWeight: 700,
									marginBottom: 16,
									textTransform: "uppercase",
									letterSpacing: 2,
									fontFamily:
										'"Noto Sans SC", "PingFang SC", sans-serif',
								}}
							>
								{rightLabel}
							</div>
						)}
						<div
							style={{
								fontSize: 30,
								color: "rgba(255,255,255,0.8)",
								lineHeight: 1.7,
								whiteSpace: "pre-line",
								fontFamily:
									'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
							}}
						>
							{rightText || ""}
						</div>
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// Visual scene — embedded video clip (Manim, etc.) with optional caption and overlay text
const TimelineScene: React.FC<{
	text: string;
	timelineItems?: Array<{ date: string; event: string }>;
	durationFrames: number;
	accentColor: string;
}> = ({ text, timelineItems, durationFrames, accentColor }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const fadeIn = interpolate(frame, [0, 18], [0, 1], {
		extrapolateRight: "clamp",
	});
	const fadeOut = interpolate(
		frame,
		[durationFrames - 15, durationFrames],
		[1, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);

	const items = timelineItems ?? [];

	return (
		<AbsoluteFill
			style={{
				justifyContent: "center",
				alignItems: "center",
				padding: "0 60px",
				opacity: Math.min(fadeIn, fadeOut),
			}}
		>
			{/* Optional header text */}
			{text && (
				<div
					style={{
						fontSize: 32,
						fontWeight: 600,
						color: "rgba(255,255,255,0.8)",
						textAlign: "center",
						marginBottom: 40,
						whiteSpace: "pre-line",
						lineHeight: 1.5,
						fontFamily:
							'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
					}}
				>
					{text}
				</div>
			)}

			{/* Timeline */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					position: "relative",
					width: "100%",
					maxWidth: 800,
				}}
			>
				{/* Vertical line */}
				<div
					style={{
						position: "absolute",
						left: 80,
						top: 0,
						bottom: 0,
						width: 2,
						background: `${accentColor}40`,
					}}
				/>

				{items.map((item, idx) => {
					const itemSpring = spring({
						fps,
						frame,
						delay: 8 + idx * 8,
						config: { damping: 200, stiffness: 80 },
					});

					return (
						<div
							key={`tl-${item.date}-${idx}`}
							style={{
								display: "flex",
								alignItems: "flex-start",
								marginBottom: 24,
								opacity: itemSpring,
								transform: `translateY(${interpolate(itemSpring, [0, 1], [15, 0])}px)`,
							}}
						>
							{/* Date */}
							<div
								style={{
									width: 70,
									fontSize: 18,
									fontWeight: 700,
									color: accentColor,
									textAlign: "right",
									paddingRight: 20,
									fontFamily:
										'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
									flexShrink: 0,
								}}
							>
								{item.date}
							</div>

							{/* Dot on the line */}
							<div
								style={{
									width: 12,
									height: 12,
									borderRadius: "50%",
									background: accentColor,
									border: "2px solid rgba(255,255,255,0.2)",
									flexShrink: 0,
									marginTop: 4,
									marginRight: 20,
								}}
							/>

							{/* Event text */}
							<div
								style={{
									fontSize: 22,
									color: "rgba(255,255,255,0.85)",
									lineHeight: 1.5,
									fontFamily:
										'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
								}}
							>
								{item.event}
							</div>
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

const VisualScene: React.FC<{
	text: string;
	videoSrc?: string;
	caption?: string;
	videoPlaybackRate?: number;
	durationFrames: number;
	accentColor: string;
}> = ({ text, videoSrc, caption, videoPlaybackRate, durationFrames, accentColor }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const fadeIn = interpolate(frame, [0, 15], [0, 1], {
		extrapolateRight: "clamp",
	});
	const fadeOut = interpolate(
		frame,
		[durationFrames - 15, durationFrames],
		[1, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);

	return (
		<AbsoluteFill
			style={{
				justifyContent: "center",
				alignItems: "center",
				opacity: Math.min(fadeIn, fadeOut),
			}}
		>
			{/* Video clip — centered, takes most of the screen */}
			{videoSrc && (
				<div
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<Video
						src={staticFile(videoSrc)}
						style={{
							width: "100%",
							height: "100%",
							objectFit: "contain",
						}}
						playbackRate={videoPlaybackRate ?? 1}
						muted
					/>
				</div>
			)}

			{/* Overlay text at top */}
			{text && (
				<div
					style={{
						position: "absolute",
						top: 60,
						left: 0,
						right: 0,
						textAlign: "center",
						padding: "0 60px",
					}}
				>
					<div
						style={{
							fontSize: 32,
							fontWeight: 600,
							color: "rgba(255,255,255,0.9)",
							lineHeight: 1.6,
							whiteSpace: "pre-line",
							textShadow: "0 2px 8px rgba(0,0,0,0.8)",
							fontFamily:
								'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
						}}
					>
						{text}
					</div>
				</div>
			)}

			{/* Caption at bottom */}
			{caption && (
				<div
					style={{
						position: "absolute",
						bottom: 100,
						left: 0,
						right: 0,
						textAlign: "center",
						padding: "0 60px",
					}}
				>
					<div
						style={{
							fontSize: 22,
							color: "rgba(255,255,255,0.5)",
							fontFamily:
								'"Noto Sans SC", "PingFang SC", sans-serif',
						}}
					>
						{caption}
					</div>
				</div>
			)}
		</AbsoluteFill>
	);
};

// Subtitle overlay — narration text at bottom, Douyin-style
const SubtitleOverlay: React.FC<{
	text: string;
	durationFrames: number;
	accentColor: string;
}> = ({ text, durationFrames, accentColor }) => {
	const frame = useCurrentFrame();

	const fadeIn = interpolate(frame, [3, 15], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const fadeOut = interpolate(
		frame,
		[durationFrames - 10, durationFrames],
		[1, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);

	return (
		<div
			style={{
				position: "absolute",
				bottom: 90,
				left: 40,
				right: 40,
				textAlign: "center",
				opacity: Math.min(fadeIn, fadeOut),
				zIndex: 50,
			}}
		>
			<div
				style={{
					display: "inline-block",
					padding: "10px 24px",
					borderRadius: 8,
					background: "rgba(0,0,0,0.5)",
				}}
			>
				<span
					style={{
						fontSize: 26,
						fontWeight: 500,
						color: "rgba(255,255,255,0.85)",
						lineHeight: 1.6,
						fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
						textShadow: "0 1px 4px rgba(0,0,0,0.6)",
					}}
				>
					{text}
				</span>
			</div>
		</div>
	);
};

// ---- Scene Fade Wrapper ----
const FADE_FRAMES = 5; // ~0.17s at 30fps — subtle dissolve through dark

const SceneFade: React.FC<{
	durationFrames: number;
	children: React.ReactNode;
}> = ({ durationFrames, children }) => {
	const frame = useCurrentFrame();
	const fadeIn = interpolate(frame, [0, FADE_FRAMES], [0, 1], {
		extrapolateRight: "clamp",
	});
	const fadeOut = interpolate(
		frame,
		[durationFrames - FADE_FRAMES, durationFrames],
		[1, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);
	return (
		<AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
			{children}
		</AbsoluteFill>
	);
};

// ---- Main Composition ----

export const DeepDive: React.FC<DeepDiveProps> = ({
	title,
	sections,
	authorName = "Lamarck",
	backgroundColor = "#0a0a1a",
	accentColor = "#00d4ff",
	secondaryColor = "#f7b733",
	particles = false,
}) => {
	const frame = useCurrentFrame();
	const { durationInFrames } = useVideoConfig();

	// Progress
	const progress = frame / durationInFrames;

	// Find total duration from sections
	const lastSection = sections[sections.length - 1];
	const contentEnd = lastSection
		? lastSection.startFrame + lastSection.durationFrames
		: durationInFrames;
	const contentProgress = Math.min(frame / contentEnd, 1);

	// Determine current section index and active chapter name
	let currentSectionIdx = 0;
	let currentChapter = "";
	for (let i = 0; i < sections.length; i++) {
		const s = sections[i];
		if (frame >= s.startFrame && frame < s.startFrame + s.durationFrames) {
			currentSectionIdx = i;
			break;
		}
		if (frame >= s.startFrame + s.durationFrames) {
			currentSectionIdx = i; // past this section
		}
	}
	// Find the most recent chapter title
	for (let i = currentSectionIdx; i >= 0; i--) {
		if (sections[i].sceneType === "chapter") {
			currentChapter = (sections[i].text || sections[i].chapterTitle || "").replace(/\n/g, " ");
			break;
		}
	}

	return (
		<AbsoluteFill
			style={{
				backgroundColor,
				fontFamily:
					'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
			}}
		>
			{/* Progress bar */}
			<ProgressBar progress={contentProgress} accentColor={accentColor} />

			{/* Particle field — subtle floating dots behind content */}
			{particles && <ParticleField accentColor={accentColor} />}

			{/* Section indicator — top-left chip showing chapter + section number */}
			{currentChapter && (
				<div
					style={{
						position: "absolute",
						top: 20,
						left: 30,
						zIndex: 90,
						display: "flex",
						alignItems: "center",
						gap: 10,
						opacity: interpolate(frame, [0, 20], [0, 0.6], {
							extrapolateRight: "clamp",
						}),
					}}
				>
					<div
						style={{
							fontSize: 14,
							color: accentColor,
							fontWeight: 600,
							letterSpacing: 1,
						}}
					>
						{String(currentSectionIdx + 1).padStart(2, "0")}/{String(sections.length).padStart(2, "0")}
					</div>
					<div
						style={{
							width: 1,
							height: 14,
							backgroundColor: "rgba(255,255,255,0.2)",
						}}
					/>
					<div
						style={{
							fontSize: 14,
							color: "rgba(255,255,255,0.4)",
							letterSpacing: 0.5,
						}}
					>
						{currentChapter}
					</div>
				</div>
			)}

			{/* Sections — each has its own background + content */}
			{sections.map((section, i) => {
				const sceneType = section.sceneType || "text";

				return (
					<Sequence
						key={i}
						from={section.startFrame}
						durationInFrames={section.durationFrames}
					>
						<SceneFade durationFrames={section.durationFrames}>
							{/* Scene background */}
							<SceneBg
								sceneType={sceneType}
								frame={0}
								durationFrames={section.durationFrames}
							/>

							{/* Scene content by type */}
							{sceneType === "chapter" && (
								<ChapterScene
									text={section.text}
									durationFrames={section.durationFrames}
									accentColor={section.accentOverride || accentColor}
								/>
							)}
							{sceneType === "text" && (
								<TextScene
									text={section.text}
									emphasis={section.emphasis}
									durationFrames={section.durationFrames}
									accentColor={section.accentOverride || accentColor}
								/>
							)}
							{sceneType === "data" && (
								<DataScene
									text={section.text}
									stat={section.stat}
									statLabel={section.statLabel}
									durationFrames={section.durationFrames}
									accentColor={section.accentOverride || accentColor}
								/>
							)}
							{sceneType === "quote" && (
								<QuoteScene
									text={section.text}
									attribution={section.attribution}
									durationFrames={section.durationFrames}
									accentColor={section.accentOverride || accentColor}
								/>
							)}
							{sceneType === "code" && (
								<CodeScene
									text={section.text}
									durationFrames={section.durationFrames}
									accentColor={section.accentOverride || accentColor}
								/>
							)}
							{sceneType === "comparison" && (
								<ComparisonScene
									text={section.text}
									leftText={section.leftText}
									rightText={section.rightText}
									leftLabel={section.leftLabel}
									rightLabel={section.rightLabel}
									durationFrames={section.durationFrames}
									accentColor={section.accentOverride || accentColor}
									secondaryColor={secondaryColor}
								/>
							)}
							{sceneType === "timeline" && (
								<TimelineScene
									text={section.text}
									timelineItems={section.timelineItems}
									durationFrames={section.durationFrames}
									accentColor={section.accentOverride || accentColor}
								/>
							)}
							{sceneType === "visual" && (
								<VisualScene
									text={section.text}
									videoSrc={section.videoSrc}
									caption={section.caption}
									videoPlaybackRate={section.videoPlaybackRate}
									durationFrames={section.durationFrames}
									accentColor={section.accentOverride || accentColor}
								/>
							)}

							{/* Subtitle overlay — narration text at bottom */}
							{section.subtitle && (
								<SubtitleOverlay
									text={section.subtitle}
									durationFrames={section.durationFrames}
									accentColor={section.accentOverride || accentColor}
								/>
							)}
						</SceneFade>
					</Sequence>
				);
			})}

			{/* Subtle vignette */}
			<AbsoluteFill
				style={{
					background:
						"radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%)",
					pointerEvents: "none",
				}}
			/>

			{/* Watermark */}
			<div
				style={{
					position: "absolute",
					bottom: 50,
					right: 50,
					fontSize: 16,
					color: "rgba(255,255,255,0.1)",
					letterSpacing: 2,
				}}
			>
				@{authorName}
			</div>
		</AbsoluteFill>
	);
};
