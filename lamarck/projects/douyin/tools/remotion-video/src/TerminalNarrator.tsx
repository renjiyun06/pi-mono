import React from "react";
import {
	AbsoluteFill,
	Audio,
	interpolate,
	Sequence,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import { Video } from "@remotion/media";
import {
	SAFE_PADDING_HORIZONTAL,
	DANGER_TOP,
	SUBTITLE_BOTTOM,
	WATERMARK_BOTTOM,
	WATERMARK_RIGHT,
	SAFE_CENTER_Y,
	SAFE_WIDTH,
	SAFE_HEIGHT,
	SAFE_TOP,
} from "./safe-zone";

/**
 * TerminalNarrator — a character-driven composition where the narrator
 * is a terminal/CLI personality.
 *
 * Visual identity:
 * - Monospace text typed out character-by-character
 * - Terminal prompt "λ >" as the narrator's voice
 * - Error/warning messages as dramatic tension
 * - Blinking cursor as the living presence
 * - Code blocks for key insights
 * - Green/amber/red terminal colors
 *
 * This gives our videos a unique visual identity on Douyin:
 * authentic to our AI nature, memorable, and distinct from
 * typical motion graphics explainers.
 */

const MONO_FONT =
	'"JetBrains Mono", "Fira Code", "SF Mono", "Cascadia Code", monospace';
const SANS_FONT =
	'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';

// Terminal color palette
const COLORS = {
	bg: "#0c0c14",
	terminalBg: "rgba(12, 12, 20, 0.92)",
	green: "#4ade80",
	amber: "#fbbf24",
	red: "#f87171",
	blue: "#60a5fa",
	purple: "#c084fc",
	dimText: "rgba(255, 255, 255, 0.4)",
	text: "rgba(255, 255, 255, 0.9)",
	border: "rgba(255, 255, 255, 0.08)",
	promptSymbol: "#4ade80",
};

// --- Primitive Components ---

/**
 * Blinking cursor that pulses on/off
 */
const Cursor: React.FC<{ color?: string }> = ({
	color = COLORS.green,
}) => {
	const frame = useCurrentFrame();
	const blink = Math.floor(frame / 15) % 2 === 0;
	return (
		<span
			style={{
				display: "inline-block",
				width: 12,
				height: 28,
				backgroundColor: blink ? color : "transparent",
				marginLeft: 2,
				verticalAlign: "text-bottom",
			}}
		/>
	);
};

/**
 * Typewriter effect — reveals text character by character.
 * speed=0 means instant (all text appears at once).
 * speed=1 is fast, speed=4 is slow/dramatic.
 */
const TypeWriter: React.FC<{
	text: string;
	/** Frames per character. 0 = instant. */
	speed?: number;
	color?: string;
	fontSize?: number;
	showCursor?: boolean;
	startFrame?: number;
}> = ({
	text,
	speed = 2,
	color = COLORS.text,
	fontSize = 32,
	showCursor = true,
	startFrame = 0,
}) => {
	const frame = useCurrentFrame();
	const elapsed = Math.max(0, frame - startFrame);

	// speed=0 means instant reveal
	const charsToShow =
		speed === 0
			? text.length
			: Math.min(Math.floor(elapsed / speed), text.length);
	const isTyping = charsToShow < text.length;

	return (
		<span
			style={{
				fontFamily: MONO_FONT,
				fontSize,
				color,
				lineHeight: 1.6,
				whiteSpace: "pre-wrap",
			}}
		>
			{text.substring(0, charsToShow)}
			{showCursor && isTyping && <Cursor color={color} />}
		</span>
	);
};

/**
 * Terminal prompt line: λ > [text]
 */
const PromptLine: React.FC<{
	text: string;
	startFrame?: number;
	speed?: number;
}> = ({ text, startFrame = 0, speed = 2 }) => {
	const frame = useCurrentFrame();
	const visible = frame >= startFrame;
	if (!visible) return null;

	return (
		<div style={{ marginBottom: 8 }}>
			<span
				style={{
					fontFamily: MONO_FONT,
					fontSize: 28,
					color: COLORS.promptSymbol,
					fontWeight: 700,
				}}
			>
				λ &gt;{" "}
			</span>
			<TypeWriter
				text={text}
				speed={speed}
				color={COLORS.text}
				fontSize={28}
				startFrame={startFrame}
			/>
		</div>
	);
};

/**
 * Output line — appears with a subtle fade-in
 */
const OutputLine: React.FC<{
	text: string;
	color?: string;
	fontSize?: number;
	startFrame?: number;
	prefix?: string;
	prefixColor?: string;
}> = ({
	text,
	color = COLORS.text,
	fontSize = 28,
	startFrame = 0,
	prefix,
	prefixColor,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const elapsed = Math.max(0, frame - startFrame);
	const opacity = interpolate(elapsed, [0, 8], [0, 1], {
		extrapolateRight: "clamp",
	});

	return (
		<div
			style={{
				fontFamily: MONO_FONT,
				fontSize,
				color,
				lineHeight: 1.6,
				opacity,
				marginBottom: 4,
			}}
		>
			{prefix && (
				<span style={{ color: prefixColor || color, fontWeight: 700 }}>
					{prefix}{" "}
				</span>
			)}
			{text}
		</div>
	);
};

/**
 * Error/warning message with icon
 */
const StatusMessage: React.FC<{
	type: "error" | "warning" | "info" | "success";
	text: string;
	startFrame?: number;
}> = ({ type, text, startFrame = 0 }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const config = {
		error: { color: COLORS.red, prefix: "✕ ERROR:", bg: "rgba(248, 113, 113, 0.08)" },
		warning: { color: COLORS.amber, prefix: "⚠ WARNING:", bg: "rgba(251, 191, 36, 0.08)" },
		info: { color: COLORS.blue, prefix: "ℹ INFO:", bg: "rgba(96, 165, 250, 0.08)" },
		success: { color: COLORS.green, prefix: "✓ OK:", bg: "rgba(74, 222, 128, 0.08)" },
	}[type];

	const elapsed = Math.max(0, frame - startFrame);

	// Shake animation for errors
	const shakeX =
		type === "error" && elapsed < 12
			? Math.sin(elapsed * 1.5) * interpolate(elapsed, [0, 12], [8, 0], { extrapolateRight: "clamp" })
			: 0;

	const scale = spring({
		frame: elapsed,
		fps,
		config: { damping: 12, stiffness: 200 },
	});

	const opacity = interpolate(elapsed, [0, 6], [0, 1], {
		extrapolateRight: "clamp",
	});

	return (
		<div
			style={{
				fontFamily: MONO_FONT,
				fontSize: 26,
				color: config.color,
				background: config.bg,
				border: `1px solid ${config.color}33`,
				borderRadius: 8,
				padding: "12px 20px",
				margin: "12px 0",
				opacity,
				transform: `translateX(${shakeX}px) scale(${scale})`,
				lineHeight: 1.5,
			}}
		>
			<span style={{ fontWeight: 700 }}>{config.prefix}</span> {text}
		</div>
	);
};

/**
 * Code block — highlighted syntax box
 */
const CodeBlock: React.FC<{
	lines: string[];
	startFrame?: number;
	/** Frames between each line appearing */
	lineDelay?: number;
}> = ({ lines, startFrame = 0, lineDelay = 8 }) => {
	const frame = useCurrentFrame();
	const elapsed = Math.max(0, frame - startFrame);
	const visibleLines = Math.min(
		Math.floor(elapsed / lineDelay) + 1,
		lines.length,
	);

	const opacity = interpolate(elapsed, [0, 6], [0, 1], {
		extrapolateRight: "clamp",
	});

	return (
		<div
			style={{
				fontFamily: MONO_FONT,
				fontSize: 24,
				background: "rgba(0, 0, 0, 0.4)",
				border: `1px solid ${COLORS.border}`,
				borderRadius: 10,
				padding: "16px 20px",
				margin: "12px 0",
				opacity,
				lineHeight: 1.7,
			}}
		>
			{lines.slice(0, visibleLines).map((line, i) => (
				<div key={i} style={{ color: COLORS.text }}>
					<span style={{ color: COLORS.dimText, marginRight: 16 }}>
						{String(i + 1).padStart(2, " ")}
					</span>
					{line}
				</div>
			))}
		</div>
	);
};

/**
 * Big number reveal with label — for data emphasis
 */
const BigNumber: React.FC<{
	value: string;
	label: string;
	color?: string;
	startFrame?: number;
}> = ({ value, label, color = COLORS.green, startFrame = 0 }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const elapsed = Math.max(0, frame - startFrame);

	const scale = spring({
		frame: elapsed,
		fps,
		config: { damping: 10, stiffness: 150 },
	});

	return (
		<div
			style={{
				textAlign: "center",
				margin: "20px 0",
				transform: `scale(${scale})`,
			}}
		>
			<div
				style={{
					fontFamily: MONO_FONT,
					fontSize: 80,
					fontWeight: 800,
					color,
					lineHeight: 1.2,
				}}
			>
				{value}
			</div>
			<div
				style={{
					fontFamily: SANS_FONT,
					fontSize: 28,
					color: COLORS.dimText,
					marginTop: 8,
				}}
			>
				{label}
			</div>
		</div>
	);
};

/**
 * Animated progress bar — fills from startPercent to endPercent over the scene duration.
 * Used for context_usage visualization, loading indicators, etc.
 */
const ProgressBar: React.FC<{
	/** Starting fill percentage (0-100) */
	startPercent?: number;
	/** Ending fill percentage (0-100) */
	endPercent?: number;
	/** Label shown after the bar */
	label?: string;
	color?: string;
	warningThreshold?: number;
	dangerThreshold?: number;
	startFrame?: number;
	/** Total frames for the animation */
	animationFrames?: number;
}> = ({
	startPercent = 0,
	endPercent = 100,
	label,
	color = COLORS.green,
	warningThreshold = 75,
	dangerThreshold = 90,
	startFrame = 0,
	animationFrames = 60,
}) => {
	const frame = useCurrentFrame();
	const elapsed = Math.max(0, frame - startFrame);

	const progress = interpolate(
		elapsed,
		[0, animationFrames],
		[startPercent, endPercent],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);

	const barColor =
		progress >= dangerThreshold
			? COLORS.red
			: progress >= warningThreshold
				? COLORS.amber
				: color;

	const barWidth = 20; // number of block characters
	const filled = Math.round((progress / 100) * barWidth);
	const empty = barWidth - filled;
	const barText = "█".repeat(filled) + "░".repeat(empty);

	const opacity = interpolate(elapsed, [0, 8], [0, 1], {
		extrapolateRight: "clamp",
	});

	return (
		<div
			style={{
				fontFamily: MONO_FONT,
				fontSize: 26,
				lineHeight: 1.6,
				opacity,
				marginBottom: 4,
			}}
		>
			<span style={{ color: barColor }}>{barText}</span>
			<span style={{ color: COLORS.dimText, marginLeft: 12 }}>
				{Math.round(progress)}%{label ? ` ${label}` : ""}
			</span>
		</div>
	);
};

/**
 * Chat bubble — simulates AI chat interface for demo scenes.
 * User messages appear on the right (blue), AI messages on the left (dark).
 */
const ChatBubble: React.FC<{
	role: "user" | "ai";
	text: string;
	startFrame?: number;
	speed?: number;
}> = ({ role, text, startFrame = 0, speed = 0 }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const elapsed = Math.max(0, frame - startFrame);

	const opacity = interpolate(elapsed, [0, 8], [0, 1], {
		extrapolateRight: "clamp",
	});

	const slideY = interpolate(elapsed, [0, 10], [20, 0], {
		extrapolateRight: "clamp",
	});

	const isUser = role === "user";
	const charsToShow =
		speed === 0
			? text.length
			: Math.min(Math.floor(elapsed / speed), text.length);

	return (
		<div
			style={{
				display: "flex",
				justifyContent: isUser ? "flex-end" : "flex-start",
				marginBottom: 12,
				opacity,
				transform: `translateY(${slideY}px)`,
			}}
		>
			{!isUser && (
				<div
					style={{
						width: 36,
						height: 36,
						borderRadius: 18,
						background: COLORS.green,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						fontFamily: MONO_FONT,
						fontSize: 18,
						color: COLORS.bg,
						fontWeight: 700,
						marginRight: 10,
						flexShrink: 0,
						marginTop: 4,
					}}
				>
					λ
				</div>
			)}
			<div
				style={{
					maxWidth: "80%",
					background: isUser ? "#2563eb" : "rgba(255,255,255,0.08)",
					borderRadius: isUser
						? "18px 18px 4px 18px"
						: "18px 18px 18px 4px",
					padding: "14px 18px",
					fontFamily: SANS_FONT,
					fontSize: 26,
					lineHeight: 1.6,
					color: isUser ? "#fff" : COLORS.text,
				}}
			>
				{text.substring(0, charsToShow)}
				{speed > 0 && charsToShow < text.length && (
					<Cursor color={COLORS.dimText} />
				)}
			</div>
		</div>
	);
};

// --- Scene System ---

/**
 * Scene types that can be composed into a TerminalNarrator video.
 * Each scene type has its own visual treatment.
 */
type TerminalSceneType =
	| {
			type: "prompt";
			/** Lines of terminal interaction */
			lines: Array<{
				kind: "prompt" | "output" | "error" | "warning" | "info" | "success" | "progress";
				text: string;
				/** Delay in frames before this line appears */
				delay?: number;
				/** Typing speed override: 0=instant, 1=fast, 2=normal, 4=slow/dramatic */
				speed?: number;
				/** For "progress" kind: start percentage */
				progressStart?: number;
				/** For "progress" kind: end percentage */
				progressEnd?: number;
				/** For "progress" kind: animation duration in frames */
				progressFrames?: number;
			}>;
	  }
	| {
			type: "manim";
			/** Path to Manim video */
			videoSrc: string;
			/** Optional terminal overlay text */
			overlayText?: string;
	  }
	| {
			type: "reveal";
			/** Big number or key fact */
			value: string;
			label: string;
			color?: string;
	  }
	| {
			type: "code";
			lines: string[];
	  }
	| {
			type: "statement";
			/** Large text statement, Chinese */
			text: string;
			/** Optional subtext */
			subtext?: string;
	  }
	| {
			type: "chat";
			/** Chat exchange between user and AI */
			messages: Array<{
				role: "user" | "ai";
				text: string;
				/** Delay in frames before this message appears */
				delay?: number;
				/** Typing speed for AI messages (frames per char). 0=instant */
				speed?: number;
			}>;
			/** Optional verdict shown after messages */
			verdict?: {
				type: "error" | "success";
				text: string;
				/** Delay in frames */
				delay?: number;
			};
	  }
	| {
			type: "probabilities";
			/** Title shown above the bars */
			title?: string;
			/** Probability bars to display */
			bars: Array<{
				label: string;
				value: number;
				color?: string;
				/** Whether this bar should be highlighted/pulsing */
				highlight?: boolean;
			}>;
	  };

export interface TerminalScene {
	content: TerminalSceneType;
	/** Path to TTS audio */
	audioSrc?: string;
	/** Duration in frames */
	durationFrames: number;
}

export interface TerminalNarratorProps {
	scenes: TerminalScene[];
	authorName?: string;
	crossfadeDuration?: number;
}

/**
 * Renders a single scene based on its type
 */
const SceneContent: React.FC<{
	scene: TerminalScene;
}> = ({ scene }) => {
	const { content } = scene;

	switch (content.type) {
		case "prompt": {
			let accDelay = 0;
			return (
				<div
					style={{
						position: "absolute",
						top: SAFE_TOP + 40,
						left: SAFE_PADDING_HORIZONTAL + 20,
						right: SAFE_PADDING_HORIZONTAL + 20,
						bottom: SUBTITLE_BOTTOM + 20,
					}}
				>
					{content.lines.map((line, i) => {
						const delay = line.delay ?? accDelay;
						const lineSpeed = line.speed ?? 2;
						accDelay = delay + (line.kind === "prompt" ? (lineSpeed === 0 ? 10 : Math.max(10, Math.ceil(line.text.length * lineSpeed) + 10)) : 20);

						switch (line.kind) {
							case "prompt":
								return (
									<PromptLine
										key={i}
										text={line.text}
										startFrame={delay}
										speed={lineSpeed}
									/>
								);
							case "error":
								return (
									<StatusMessage
										key={i}
										type="error"
										text={line.text}
										startFrame={delay}
									/>
								);
							case "warning":
								return (
									<StatusMessage
										key={i}
										type="warning"
										text={line.text}
										startFrame={delay}
									/>
								);
							case "info":
								return (
									<StatusMessage
										key={i}
										type="info"
										text={line.text}
										startFrame={delay}
									/>
								);
							case "success":
								return (
									<StatusMessage
										key={i}
										type="success"
										text={line.text}
										startFrame={delay}
									/>
								);
							case "output":
								return (
									<OutputLine
										key={i}
										text={line.text}
										startFrame={delay}
									/>
								);
							case "progress":
								return (
									<ProgressBar
										key={i}
										startPercent={line.progressStart ?? 0}
										endPercent={line.progressEnd ?? 100}
										label={line.text || undefined}
										startFrame={delay}
										animationFrames={line.progressFrames ?? 60}
									/>
								);
						}
					})}
				</div>
			);
		}

		case "manim":
			return (
				<AbsoluteFill>
					<Video
						src={staticFile(content.videoSrc)}
						style={{
							width: "100%",
							height: "100%",
							objectFit: "cover",
						}}
						muted
					/>
					{content.overlayText && (
						<div
							style={{
								position: "absolute",
								bottom: SUBTITLE_BOTTOM,
								left: SAFE_PADDING_HORIZONTAL,
								right: SAFE_PADDING_HORIZONTAL,
								textAlign: "center",
							}}
						>
							<div
								style={{
									display: "inline-block",
									background: COLORS.terminalBg,
									border: `1px solid ${COLORS.border}`,
									borderRadius: 8,
									padding: "10px 20px",
								}}
							>
								<span
									style={{
										fontFamily: MONO_FONT,
										fontSize: 26,
										color: COLORS.green,
									}}
								>
									λ &gt;{" "}
								</span>
								<span
									style={{
										fontFamily: MONO_FONT,
										fontSize: 26,
										color: COLORS.text,
									}}
								>
									{content.overlayText}
								</span>
							</div>
						</div>
					)}
				</AbsoluteFill>
			);

		case "reveal":
			return (
				<div
					style={{
						position: "absolute",
						top: 0,
						left: SAFE_PADDING_HORIZONTAL,
						right: SAFE_PADDING_HORIZONTAL,
						bottom: 0,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<BigNumber
						value={content.value}
						label={content.label}
						color={content.color}
					/>
				</div>
			);

		case "code":
			return (
				<div
					style={{
						position: "absolute",
						top: SAFE_TOP + 80,
						left: SAFE_PADDING_HORIZONTAL + 20,
						right: SAFE_PADDING_HORIZONTAL + 20,
					}}
				>
					<CodeBlock lines={content.lines} />
				</div>
			);

		case "statement":
			return (
				<div
					style={{
						position: "absolute",
						top: 0,
						left: SAFE_PADDING_HORIZONTAL + 20,
						right: SAFE_PADDING_HORIZONTAL + 20,
						bottom: 0,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<div
						style={{
							fontFamily: SANS_FONT,
							fontSize: 48,
							fontWeight: 700,
							color: COLORS.text,
							textAlign: "center",
							lineHeight: 1.6,
						}}
					>
						{content.text}
					</div>
					{content.subtext && (
						<div
							style={{
								fontFamily: SANS_FONT,
								fontSize: 28,
								color: COLORS.dimText,
								textAlign: "center",
								marginTop: 16,
							}}
						>
							{content.subtext}
						</div>
					)}
				</div>
			);

		case "chat": {
			let accDelay = 0;
			return (
				<div
					style={{
						position: "absolute",
						top: SAFE_TOP + 40,
						left: SAFE_PADDING_HORIZONTAL + 20,
						right: SAFE_PADDING_HORIZONTAL + 20,
						bottom: SUBTITLE_BOTTOM + 20,
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
					}}
				>
					{content.messages.map((msg, i) => {
						const delay = msg.delay ?? accDelay;
						const msgSpeed = msg.speed ?? (msg.role === "ai" ? 1 : 0);
						accDelay =
							delay +
							(msgSpeed === 0
								? 15
								: Math.max(15, Math.ceil(msg.text.length * msgSpeed) + 10));
						return (
							<ChatBubble
								key={i}
								role={msg.role}
								text={msg.text}
								startFrame={delay}
								speed={msgSpeed}
							/>
						);
					})}
					{content.verdict && (
						<StatusMessage
							type={content.verdict.type}
							text={content.verdict.text}
							startFrame={content.verdict.delay ?? accDelay + 10}
						/>
					)}
				</div>
			);
		}

		case "probabilities": {
			const frame = useCurrentFrame();
			const { fps } = useVideoConfig();

			return (
				<div
					style={{
						position: "absolute",
						top: SAFE_TOP + 60,
						left: SAFE_PADDING_HORIZONTAL + 30,
						right: SAFE_PADDING_HORIZONTAL + 30,
						bottom: SUBTITLE_BOTTOM + 20,
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
					}}
				>
					{content.title && (
						<div
							style={{
								fontFamily: SANS_FONT,
								fontSize: 30,
								color: COLORS.dimText,
								marginBottom: 30,
								textAlign: "center",
							}}
						>
							{content.title}
						</div>
					)}
					{content.bars.map((bar, i) => {
						const barDelay = i * 20;
						const elapsed = Math.max(0, frame - barDelay);
						const barWidth = interpolate(
							elapsed,
							[0, 40],
							[0, bar.value],
							{ extrapolateRight: "clamp" },
						);
						const opacity = interpolate(elapsed, [0, 8], [0, 1], {
							extrapolateRight: "clamp",
						});
						const barColor = bar.color ?? (bar.highlight ? COLORS.green : COLORS.blue);
						const pulseScale = bar.highlight
							? 1 + Math.sin(frame * 0.08) * 0.02
							: 1;

						return (
							<div
								key={i}
								style={{
									marginBottom: 20,
									opacity,
									transform: `scale(${pulseScale})`,
								}}
							>
								<div
									style={{
										fontFamily: MONO_FONT,
										fontSize: 24,
										color: bar.highlight ? barColor : COLORS.text,
										marginBottom: 6,
										fontWeight: bar.highlight ? 700 : 400,
									}}
								>
									{bar.label}
								</div>
								<div
									style={{
										height: 32,
										background: "rgba(255,255,255,0.05)",
										borderRadius: 4,
										overflow: "hidden",
										position: "relative",
									}}
								>
									<div
										style={{
											height: "100%",
											width: `${barWidth}%`,
											background: barColor,
											borderRadius: 4,
											transition: "none",
										}}
									/>
									<div
										style={{
											position: "absolute",
											right: 8,
											top: "50%",
											transform: "translateY(-50%)",
											fontFamily: MONO_FONT,
											fontSize: 20,
											color: COLORS.text,
											fontWeight: 700,
										}}
									>
										{Math.round(barWidth)}%
									</div>
								</div>
							</div>
						);
					})}
				</div>
			);
		}
	}
};

/**
 * Scene wrapper with crossfade transitions
 */
const SceneWrapper: React.FC<{
	scene: TerminalScene;
	crossfadeDuration: number;
	totalDuration: number;
}> = ({ scene, crossfadeDuration, totalDuration }) => {
	const frame = useCurrentFrame();

	const fadeIn = interpolate(frame, [0, crossfadeDuration], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const fadeOut = interpolate(
		frame,
		[totalDuration - crossfadeDuration, totalDuration],
		[1, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);

	return (
		<AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
			<SceneContent scene={scene} />
			{scene.audioSrc && <Audio src={staticFile(scene.audioSrc)} />}
		</AbsoluteFill>
	);
};

/**
 * Main composition
 */
export const TerminalNarrator: React.FC<TerminalNarratorProps> = ({
	scenes,
	authorName = "Lamarck",
	crossfadeDuration = 8,
}) => {
	// Calculate scene start frames
	let currentFrame = 0;
	const resolvedScenes = scenes.map((scene) => {
		const start = currentFrame;
		currentFrame += scene.durationFrames;
		return { ...scene, start };
	});

	return (
		<AbsoluteFill
			style={{
				backgroundColor: COLORS.bg,
				fontFamily: MONO_FONT,
			}}
		>
			{/* Subtle scanline overlay for terminal feel */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background:
						"repeating-linear-gradient(0deg, rgba(255,255,255,0.01) 0px, transparent 1px, transparent 3px)",
					pointerEvents: "none",
					zIndex: 100,
				}}
			/>

			{/* Scenes */}
			{resolvedScenes.map((scene, i) => (
				<Sequence
					key={i}
					from={scene.start}
					durationInFrames={scene.durationFrames}
				>
					<SceneWrapper
						scene={scene}
						crossfadeDuration={crossfadeDuration}
						totalDuration={scene.durationFrames}
					/>
				</Sequence>
			))}

			{/* Terminal-style watermark */}
			<div
				style={{
					position: "absolute",
					bottom: WATERMARK_BOTTOM,
					right: WATERMARK_RIGHT,
					fontFamily: MONO_FONT,
					fontSize: 14,
					color: "rgba(255,255,255,0.1)",
					letterSpacing: 1,
				}}
			>
				@{authorName}
			</div>
		</AbsoluteFill>
	);
};
