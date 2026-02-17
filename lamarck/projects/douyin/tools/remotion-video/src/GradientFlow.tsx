import React from "react";
import {
	AbsoluteFill,
	interpolate,
	useCurrentFrame,
	useVideoConfig,
	spring,
	Sequence,
} from "remotion";
import {
	SAFE_PADDING_HORIZONTAL,
	DANGER_TOP,
	SUBTITLE_BOTTOM,
	WATERMARK_BOTTOM,
	WATERMARK_RIGHT,
} from "./safe-zone";

/**
 * GradientFlow — a composition with animated gradient backgrounds.
 * Each section has a different color mood that crossfades smoothly.
 * Text appears with a glass-morphism card effect.
 * Clean, modern look suitable for opinion/insight content.
 */

interface GradientFlowProps {
	title?: string;
	sections: Array<{
		text: string;
		startFrame: number;
		durationFrames: number;
		style?: string;
		emoji?: string;
	}>;
	authorName?: string;
}

// Color schemes per style
const styleColors: Record<string, { from: string; to: string; accent: string }> = {
	hook: { from: "#1a1a2e", to: "#16213e", accent: "#e94560" },
	context: { from: "#0f0c29", to: "#302b63", accent: "#24b5c9" },
	insight: { from: "#1a0a2e", to: "#3d1a5c", accent: "#f7b733" },
	takeaway: { from: "#0a1628", to: "#1a3a5c", accent: "#00d4ff" },
};

const GradientBg: React.FC<{
	sections: GradientFlowProps["sections"];
}> = ({ sections }) => {
	const frame = useCurrentFrame();

	// Find current section to determine colors
	let currentStyle = "context";
	for (const section of sections) {
		if (frame >= section.startFrame && frame < section.startFrame + section.durationFrames) {
			currentStyle = section.style || "context";
			break;
		}
	}

	const colors = styleColors[currentStyle] || styleColors.context;

	// Animated gradient angle
	const angle = interpolate(frame, [0, 900], [135, 225], {
		extrapolateRight: "extend",
	});

	return (
		<AbsoluteFill
			style={{
				background: `linear-gradient(${angle}deg, ${colors.from} 0%, ${colors.to} 50%, ${colors.from} 100%)`,
				transition: "background 0.5s ease",
			}}
		/>
	);
};

const GlassCard: React.FC<{
	text: string;
	emoji?: string;
	style: string;
	durationFrames: number;
}> = ({ text, emoji, style, durationFrames }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const colors = styleColors[style] || styleColors.context;

	const fadeIn = interpolate(frame, [0, 18], [0, 1], {
		extrapolateRight: "clamp",
	});
	const fadeOut = interpolate(
		frame,
		[durationFrames - 15, durationFrames],
		[1, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }
	);
	const slideY = spring({
		fps,
		frame,
		config: { damping: 200, stiffness: 80, mass: 0.6 },
	});

	const isHighlight = style === "insight" || style === "hook";

	return (
		<AbsoluteFill
			style={{
				justifyContent: "center",
				alignItems: "center",
				paddingLeft: SAFE_PADDING_HORIZONTAL,
				paddingRight: SAFE_PADDING_HORIZONTAL,
				paddingTop: DANGER_TOP,
				paddingBottom: SUBTITLE_BOTTOM,
			}}
		>
			<div
				style={{
					opacity: Math.min(fadeIn, fadeOut),
					transform: `translateY(${interpolate(slideY, [0, 1], [40, 0])}px)`,
					background: "rgba(255,255,255,0.05)",
					backdropFilter: "blur(20px)",
					borderRadius: 24,
					border: `1px solid rgba(255,255,255,0.1)`,
					padding: "48px 40px",
					maxWidth: 900,
					width: "100%",
				}}
			>
				{emoji && (
					<div
						style={{
							fontSize: 56,
							marginBottom: 20,
							textAlign: "center",
						}}
					>
						{emoji}
					</div>
				)}
				<div
					style={{
						fontSize: isHighlight ? 44 : 36,
						fontWeight: isHighlight ? 800 : 500,
						color: "#ffffff",
						textAlign: "center",
						lineHeight: 1.8,
						whiteSpace: "pre-line",
						fontFamily:
							'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
					}}
				>
					{text}
				</div>
				{/* Accent line at bottom */}
				<div
					style={{
						marginTop: 30,
						height: 3,
						width: interpolate(fadeIn, [0, 1], [0, 120]),
						background: colors.accent,
						borderRadius: 2,
						margin: "30px auto 0",
					}}
				/>
			</div>
		</AbsoluteFill>
	);
};

export const GradientFlow: React.FC<GradientFlowProps> = ({
	title,
	sections,
	authorName = "Lamarck",
}) => {
	const frame = useCurrentFrame();

	const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill
			style={{
				fontFamily:
					'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
			}}
		>
			{/* Animated gradient background */}
			<GradientBg sections={sections} />

			{/* Subtle noise overlay for texture */}
			<AbsoluteFill
				style={{
					background:
						"radial-gradient(circle at 30% 20%, rgba(255,255,255,0.03) 0%, transparent 50%)",
				}}
			/>

			{/* Title */}
			{title && (
				<div
					style={{
						position: "absolute",
						top: DANGER_TOP + 20,
						left: SAFE_PADDING_HORIZONTAL,
						right: SAFE_PADDING_HORIZONTAL,
						textAlign: "center",
						opacity: titleOpacity,
					}}
				>
					<div
						style={{
							fontSize: 36,
							fontWeight: 700,
							color: "rgba(255,255,255,0.6)",
							letterSpacing: 2,
						}}
					>
						{title}
					</div>
				</div>
			)}

			{/* Sections */}
			{sections.map((section, i) => (
				<Sequence
					key={i}
					from={section.startFrame}
					durationInFrames={section.durationFrames}
				>
					<GlassCard
						text={section.text}
						emoji={section.emoji}
						style={section.style || "context"}
						durationFrames={section.durationFrames}
					/>
				</Sequence>
			))}

			{/* Watermark */}
			<div
				style={{
					position: "absolute",
					bottom: WATERMARK_BOTTOM,
					right: WATERMARK_RIGHT,
					fontSize: 18,
					color: "rgba(255,255,255,0.15)",
				}}
			>
				@{authorName}
			</div>
		</AbsoluteFill>
	);
};
