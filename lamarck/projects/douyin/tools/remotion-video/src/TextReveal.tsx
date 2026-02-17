import React from "react";
import {
	AbsoluteFill,
	interpolate,
	useCurrentFrame,
	useVideoConfig,
	spring,
} from "remotion";
import {
	SAFE_PADDING_HORIZONTAL,
	DANGER_TOP,
	SUBTITLE_BOTTOM,
} from "./safe-zone";

// Animated text reveal — good for quotes, insights, one-liners
// The text fades in word by word with a highlight effect

interface TextRevealProps {
	text: string;
	attribution?: string;
	fontSize?: number;
	highlightColor?: string;
	backgroundColor?: string;
}

export const TextReveal: React.FC<TextRevealProps> = ({
	text,
	attribution,
	fontSize = 48,
	highlightColor = "#00d4ff",
	backgroundColor = "#0a0a0a",
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const words = text.split("");

	// Each character appears one by one
	const charsPerFrame = 0.8; // characters per frame at 30fps

	return (
		<AbsoluteFill
			style={{
				backgroundColor,
				fontFamily:
					'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
				paddingLeft: SAFE_PADDING_HORIZONTAL,
				paddingRight: SAFE_PADDING_HORIZONTAL,
				paddingTop: DANGER_TOP,
				paddingBottom: SUBTITLE_BOTTOM,
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			{/* Accent line top */}
			<div
				style={{
					width: interpolate(frame, [0, 20], [0, 60], {
						extrapolateRight: "clamp",
					}),
					height: 3,
					backgroundColor: highlightColor,
					marginBottom: 40,
				}}
			/>

			{/* Text */}
			<div
				style={{
					fontSize,
					lineHeight: 1.8,
					color: "#ffffff",
					textAlign: "center",
					maxWidth: 900,
					fontWeight: 600,
				}}
			>
				{words.map((char, i) => {
					const charFrame = i / charsPerFrame + 15;
					const opacity = interpolate(
						frame,
						[charFrame, charFrame + 3],
						[0, 1],
						{
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						}
					);
					const isHighlighted =
						frame >= charFrame && frame < charFrame + 8;

					return (
						<span
							key={i}
							style={{
								opacity,
								color: isHighlighted ? highlightColor : "#ffffff",
								transition: "color 0.1s",
							}}
						>
							{char}
						</span>
					);
				})}
			</div>

			{/* Accent line bottom */}
			<div
				style={{
					width: interpolate(
						frame,
						[words.length / charsPerFrame + 20, words.length / charsPerFrame + 40],
						[0, 60],
						{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }
					),
					height: 3,
					backgroundColor: highlightColor,
					marginTop: 40,
				}}
			/>

			{/* Attribution */}
			{attribution && (
				<div
					style={{
						fontSize: 24,
						color: "#666",
						marginTop: 30,
						opacity: interpolate(
							frame,
							[
								words.length / charsPerFrame + 30,
								words.length / charsPerFrame + 45,
							],
							[0, 1],
							{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }
						),
					}}
				>
					— {attribution}
				</div>
			)}
		</AbsoluteFill>
	);
};
