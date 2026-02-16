import React from "react";
import {
	AbsoluteFill,
	interpolate,
	useCurrentFrame,
	useVideoConfig,
	spring,
	Sequence,
} from "remotion";

// A simple "1 Minute AI" concept explainer video
// Shows a title, then an explanation with animated text

interface OneMinuteAIProps {
	title: string;
	subtitle: string;
	lines: string[];
	backgroundColor?: string;
	accentColor?: string;
}

export const OneMinuteAI: React.FC<OneMinuteAIProps> = ({
	title,
	subtitle,
	lines,
	backgroundColor = "#0a0a0a",
	accentColor = "#00d4ff",
}) => {
	const frame = useCurrentFrame();
	const { fps, width, height } = useVideoConfig();

	// Title animation
	const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
		extrapolateRight: "clamp",
	});
	const titleY = spring({
		fps,
		frame,
		config: { damping: 200, stiffness: 100, mass: 0.5 },
	});

	// Subtitle animation
	const subtitleOpacity = interpolate(frame, [15, 30], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill
			style={{
				backgroundColor,
				fontFamily:
					'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
				padding: 80,
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			{/* Title */}
			<div
				style={{
					fontSize: 72,
					fontWeight: 900,
					color: "#ffffff",
					opacity: titleOpacity,
					transform: `translateY(${interpolate(titleY, [0, 1], [50, 0])}px)`,
					textAlign: "center",
					marginBottom: 20,
				}}
			>
				{title}
			</div>

			{/* Accent line */}
			<div
				style={{
					width: interpolate(frame, [10, 30], [0, 200], {
						extrapolateRight: "clamp",
					}),
					height: 4,
					backgroundColor: accentColor,
					marginBottom: 20,
				}}
			/>

			{/* Subtitle */}
			<div
				style={{
					fontSize: 36,
					color: accentColor,
					opacity: subtitleOpacity,
					textAlign: "center",
					marginBottom: 60,
				}}
			>
				{subtitle}
			</div>

			{/* Content lines - each appears sequentially */}
			{lines.map((line, i) => {
				const startFrame = 45 + i * 30;
				const lineOpacity = interpolate(
					frame,
					[startFrame, startFrame + 15],
					[0, 1],
					{
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					}
				);
				const lineX = interpolate(
					frame,
					[startFrame, startFrame + 15],
					[-30, 0],
					{
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					}
				);

				return (
					<div
						key={i}
						style={{
							fontSize: 32,
							color: "#e0e0e0",
							opacity: lineOpacity,
							transform: `translateX(${lineX}px)`,
							marginBottom: 16,
							maxWidth: width - 160,
							lineHeight: 1.6,
						}}
					>
						<span style={{ color: accentColor, marginRight: 12 }}>▸</span>
						{line}
					</div>
				);
			})}
		</AbsoluteFill>
	);
};
