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

type SceneType = "text" | "data" | "quote" | "chapter" | "code" | "comparison" | "visual";

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
	// visual scene
	videoSrc?: string; // path to video file in public/ (for staticFile) or absolute URL
	caption?: string; // optional caption below video
	videoPlaybackRate?: number; // computed by render pipeline to match narration length
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
}

// Palette for scene backgrounds — subtle gradient shifts
const sceneGradients: Record<SceneType, [string, string]> = {
	chapter: ["#0a0a1a", "#1a0a2e"],
	text: ["#0a0f1a", "#0f1a2e"],
	data: ["#0a1a1a", "#0a2e2e"],
	quote: ["#1a0a1a", "#2e0a2e"],
	code: ["#0d1117", "#161b22"],
	comparison: ["#0a0a1a", "#1a1a2e"],
	visual: ["#0a0a1a", "#0a0a1a"],
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

// Chapter title card — large, bold, centered
const ChapterScene: React.FC<{
	text: string;
	durationFrames: number;
	accentColor: string;
}> = ({ text, durationFrames, accentColor }) => {
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
	const slideUp = spring({
		fps,
		frame,
		config: { damping: 200, stiffness: 60 },
	});

	// Accent line grows in
	const lineWidth = interpolate(frame, [10, 40], [0, 200], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.quad),
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
					transform: `translateY(${interpolate(slideUp, [0, 1], [30, 0])}px)`,
					textAlign: "center",
				}}
			>
				{/* Accent line above */}
				<div
					style={{
						width: lineWidth,
						height: 3,
						backgroundColor: accentColor,
						margin: "0 auto 40px",
						borderRadius: 2,
					}}
				/>
				<div
					style={{
						fontSize: 64,
						fontWeight: 900,
						color: "#ffffff",
						lineHeight: 1.4,
						whiteSpace: "pre-line",
						letterSpacing: 2,
						fontFamily:
							'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
					}}
				>
					{text}
				</div>
				{/* Accent line below */}
				<div
					style={{
						width: lineWidth,
						height: 3,
						backgroundColor: accentColor,
						margin: "40px auto 0",
						borderRadius: 2,
						opacity: 0.5,
					}}
				/>
			</div>
		</AbsoluteFill>
	);
};

// Standard text scene with glass card
const TextScene: React.FC<{
	text: string;
	emphasis?: boolean;
	durationFrames: number;
	accentColor: string;
}> = ({ text, emphasis, durationFrames, accentColor }) => {
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
	const slideY = spring({
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
				opacity: Math.min(fadeIn, fadeOut),
			}}
		>
			<div
				style={{
					transform: `translateY(${interpolate(slideY, [0, 1], [40, 0])}px)`,
					background: "rgba(255,255,255,0.04)",
					backdropFilter: "blur(20px)",
					borderRadius: 20,
					border: "1px solid rgba(255,255,255,0.08)",
					padding: "44px 36px",
					maxWidth: 920,
					width: "100%",
				}}
			>
				<div
					style={{
						fontSize: emphasis ? 46 : 38,
						fontWeight: emphasis ? 700 : 500,
						color: emphasis ? "#ffffff" : "rgba(255,255,255,0.9)",
						textAlign: "center",
						lineHeight: 1.9,
						whiteSpace: "pre-line",
						fontFamily:
							'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
					}}
				>
					{text}
				</div>
				{emphasis && (
					<div
						style={{
							marginTop: 24,
							height: 3,
							width: interpolate(fadeIn, [0, 1], [0, 100]),
							background: accentColor,
							borderRadius: 2,
							margin: "24px auto 0",
							opacity: 0.6,
						}}
					/>
				)}
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

// ---- Main Composition ----

export const DeepDive: React.FC<DeepDiveProps> = ({
	title,
	sections,
	authorName = "Lamarck",
	backgroundColor = "#0a0a1a",
	accentColor = "#00d4ff",
	secondaryColor = "#f7b733",
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

			{/* Sections — each has its own background + content */}
			{sections.map((section, i) => {
				const sceneType = section.sceneType || "text";

				return (
					<Sequence
						key={i}
						from={section.startFrame}
						durationInFrames={section.durationFrames}
					>
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
