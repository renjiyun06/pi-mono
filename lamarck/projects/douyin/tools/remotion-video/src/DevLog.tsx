import React from "react";
import {
	AbsoluteFill,
	interpolate,
	useCurrentFrame,
	useVideoConfig,
	spring,
	Sequence,
} from "remotion";

// "AI Development Log" format — shows code/terminal + commentary
// Designed for the "AI building its own tools" narrative

interface LogEntry {
	type: "terminal" | "code" | "comment" | "result";
	content: string;
	startFrame: number;
	durationFrames: number;
}

interface DevLogProps {
	title: string;
	date: string;
	entries: LogEntry[];
	backgroundColor?: string;
	accentColor?: string;
}

const TerminalLine: React.FC<{ text: string; color: string }> = ({
	text,
	color,
}) => {
	const frame = useCurrentFrame();
	// Typing effect
	const charsToShow = Math.floor(frame * 1.2);
	const displayText = text.substring(0, charsToShow);
	const showCursor = charsToShow < text.length;

	return (
		<div
			style={{
				fontFamily: '"JetBrains Mono", "Fira Code", monospace',
				fontSize: 24,
				color,
				lineHeight: 1.6,
				whiteSpace: "pre-wrap",
				wordBreak: "break-all",
			}}
		>
			{displayText}
			{showCursor && (
				<span
					style={{
						backgroundColor: color,
						opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0,
					}}
				>
					{" "}
				</span>
			)}
		</div>
	);
};

const CodeBlock: React.FC<{ text: string }> = ({ text }) => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [0, 10], [0, 1], {
		extrapolateRight: "clamp",
	});

	return (
		<div
			style={{
				backgroundColor: "#1a1a2e",
				borderRadius: 12,
				padding: 24,
				opacity,
				border: "1px solid #333",
			}}
		>
			<div
				style={{
					display: "flex",
					gap: 6,
					marginBottom: 12,
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
						backgroundColor: "#27ca40",
					}}
				/>
			</div>
			<pre
				style={{
					fontFamily: '"JetBrains Mono", "Fira Code", monospace',
					fontSize: 20,
					color: "#e0e0e0",
					margin: 0,
					whiteSpace: "pre-wrap",
					lineHeight: 1.5,
				}}
			>
				{text}
			</pre>
		</div>
	);
};

const CommentBubble: React.FC<{
	text: string;
	accentColor: string;
}> = ({ text, accentColor }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const scale = spring({
		fps,
		frame,
		config: { damping: 200, stiffness: 150, mass: 0.3 },
	});

	return (
		<div
			style={{
				transform: `scale(${scale})`,
				backgroundColor: `${accentColor}20`,
				borderLeft: `4px solid ${accentColor}`,
				borderRadius: 8,
				padding: "16px 24px",
			}}
		>
			<div
				style={{
					fontFamily:
						'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
					fontSize: 30,
					color: "#ffffff",
					lineHeight: 1.6,
				}}
			>
				{text}
			</div>
		</div>
	);
};

const ResultDisplay: React.FC<{ text: string }> = ({ text }) => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [0, 15], [0, 1], {
		extrapolateRight: "clamp",
	});

	return (
		<div
			style={{
				opacity,
				textAlign: "center",
			}}
		>
			<div
				style={{
					fontSize: 28,
					color: "#27ca40",
					fontFamily: '"JetBrains Mono", monospace',
				}}
			>
				✓ {text}
			</div>
		</div>
	);
};

export const DevLog: React.FC<DevLogProps> = ({
	title,
	date,
	entries,
	backgroundColor = "#0d1117",
	accentColor = "#00d4ff",
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill
			style={{
				backgroundColor,
				fontFamily:
					'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
				padding: 60,
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* Header */}
			<div style={{ opacity: titleOpacity, marginBottom: 30 }}>
				<div
					style={{
						fontSize: 20,
						color: "#666",
						fontFamily: '"JetBrains Mono", monospace',
						marginBottom: 8,
					}}
				>
					{date} — Lamarck Dev Log
				</div>
				<div
					style={{
						fontSize: 44,
						fontWeight: 800,
						color: "#ffffff",
					}}
				>
					{title}
				</div>
				<div
					style={{
						width: 60,
						height: 3,
						backgroundColor: accentColor,
						marginTop: 12,
					}}
				/>
			</div>

			{/* Entries */}
			<div
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					gap: 20,
				}}
			>
				{entries.map((entry, i) => (
					<Sequence
						key={i}
						from={entry.startFrame}
						durationInFrames={entry.durationFrames}
					>
						{entry.type === "terminal" && (
							<TerminalLine text={entry.content} color="#27ca40" />
						)}
						{entry.type === "code" && <CodeBlock text={entry.content} />}
						{entry.type === "comment" && (
							<CommentBubble
								text={entry.content}
								accentColor={accentColor}
							/>
						)}
						{entry.type === "result" && (
							<ResultDisplay text={entry.content} />
						)}
					</Sequence>
				))}
			</div>

			{/* Footer */}
			<div
				style={{
					fontSize: 18,
					color: "#444",
					textAlign: "right",
				}}
			>
				@Lamarck — AI Dev Log
			</div>
		</AbsoluteFill>
	);
};
