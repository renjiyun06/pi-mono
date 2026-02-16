import React from "react";
import {
	AbsoluteFill,
	Audio,
	interpolate,
	useCurrentFrame,
	useVideoConfig,
	spring,
	Sequence,
	staticFile,
	Img,
} from "remotion";

// A complete short-form video composition for Douyin
// Sections: Hook → Context → Insight → Takeaway
// Vertical 1080x1920, designed for 15-60 seconds

interface Section {
	text: string;
	startFrame: number;
	durationFrames: number;
	style?: "hook" | "context" | "insight" | "takeaway";
	emoji?: string;
}

interface AIInsightProps {
	sections: Section[];
	audioFile?: string;
	authorName?: string;
	backgroundColor?: string;
	accentColor?: string;
}

const SectionDisplay: React.FC<{
	section: Section;
	accentColor: string;
}> = ({ section, accentColor }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const fadeIn = interpolate(frame, [0, 12], [0, 1], {
		extrapolateRight: "clamp",
	});
	const slideUp = spring({
		fps,
		frame,
		config: { damping: 200, stiffness: 120, mass: 0.5 },
	});
	const fadeOut = interpolate(
		frame,
		[section.durationFrames - 10, section.durationFrames],
		[1, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }
	);

	const opacity = Math.min(fadeIn, fadeOut);

	const styleConfig = {
		hook: {
			fontSize: 56,
			color: "#ffffff",
			fontWeight: 900 as const,
			align: "center" as const,
		},
		context: {
			fontSize: 38,
			color: "#cccccc",
			fontWeight: 400 as const,
			align: "center" as const,
		},
		insight: {
			fontSize: 44,
			color: accentColor,
			fontWeight: 700 as const,
			align: "center" as const,
		},
		takeaway: {
			fontSize: 40,
			color: "#ffffff",
			fontWeight: 600 as const,
			align: "center" as const,
		},
	};

	const style = styleConfig[section.style || "context"];

	return (
		<AbsoluteFill
			style={{
				justifyContent: "center",
				alignItems: "center",
				padding: 60,
			}}
		>
			<div
				style={{
					opacity,
					transform: `translateY(${interpolate(slideUp, [0, 1], [40, 0])}px)`,
					textAlign: style.align,
					maxWidth: 960,
				}}
			>
				{section.emoji && (
					<div style={{ fontSize: 72, marginBottom: 20 }}>
						{section.emoji}
					</div>
				)}
				<div
					style={{
						fontSize: style.fontSize,
						color: style.color,
						fontWeight: style.fontWeight,
						lineHeight: 1.6,
						letterSpacing: 1,
					}}
				>
					{section.text}
				</div>

				{/* Accent underline for hook and insight */}
				{(section.style === "hook" || section.style === "insight") && (
					<div
						style={{
							width: interpolate(frame, [8, 25], [0, 120], {
								extrapolateRight: "clamp",
							}),
							height: 3,
							backgroundColor: accentColor,
							margin: "20px auto 0",
							opacity: fadeIn,
						}}
					/>
				)}
			</div>
		</AbsoluteFill>
	);
};

export const AIInsight: React.FC<AIInsightProps> = ({
	sections,
	audioFile,
	authorName = "Lamarck",
	backgroundColor = "#0a0a0a",
	accentColor = "#00d4ff",
}) => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();

	return (
		<AbsoluteFill
			style={{
				backgroundColor,
				fontFamily:
					'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
			}}
		>
			{/* Subtle gradient overlay */}
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse at 50% 30%, ${accentColor}10 0%, transparent 70%)`,
				}}
			/>

			{/* Sections */}
			{sections.map((section, i) => (
				<Sequence
					key={i}
					from={section.startFrame}
					durationInFrames={section.durationFrames}
				>
					<SectionDisplay section={section} accentColor={accentColor} />
				</Sequence>
			))}

			{/* Author watermark */}
			<div
				style={{
					position: "absolute",
					bottom: 80,
					right: 60,
					fontSize: 20,
					color: "#444",
					opacity: interpolate(frame, [30, 45], [0, 1], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					}),
				}}
			>
				@{authorName}
			</div>

			{/* Audio track if provided */}
			{audioFile && <Audio src={staticFile(audioFile)} />}
		</AbsoluteFill>
	);
};
