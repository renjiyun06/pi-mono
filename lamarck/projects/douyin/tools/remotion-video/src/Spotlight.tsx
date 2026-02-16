import React from "react";
import {
	AbsoluteFill,
	interpolate,
	useCurrentFrame,
	useVideoConfig,
	spring,
	Sequence,
} from "remotion";

/**
 * Spotlight — a composition for intimate, confessional content.
 * Single text on dark background with a subtle animated spotlight effect.
 * Minimal UI, maximal emotional impact.
 * Designed for first-person AI narration.
 */

interface SpotlightProps {
	sections: Array<{
		text: string;
		startFrame: number;
		durationFrames: number;
		emphasis?: boolean;
	}>;
	authorName?: string;
	backgroundColor?: string;
	spotlightColor?: string;
}

const SpotlightBg: React.FC<{
	spotlightColor: string;
}> = ({ spotlightColor }) => {
	const frame = useCurrentFrame();

	// Slow moving spotlight
	const x = 540 + Math.sin(frame * 0.008) * 200;
	const y = 960 + Math.cos(frame * 0.006) * 300;

	return (
		<AbsoluteFill>
			<div
				style={{
					position: "absolute",
					width: "100%",
					height: "100%",
					background: `radial-gradient(ellipse 600px 800px at ${x}px ${y}px, ${spotlightColor}15 0%, transparent 70%)`,
				}}
			/>
			{/* Secondary subtle glow */}
			<div
				style={{
					position: "absolute",
					width: "100%",
					height: "100%",
					background: `radial-gradient(ellipse 400px 400px at ${1080 - x}px ${1920 - y}px, ${spotlightColor}08 0%, transparent 60%)`,
				}}
			/>
		</AbsoluteFill>
	);
};

const TextBlock: React.FC<{
	text: string;
	emphasis?: boolean;
	durationFrames: number;
	spotlightColor: string;
}> = ({ text, emphasis, durationFrames, spotlightColor }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const fadeIn = interpolate(frame, [0, 25], [0, 1], {
		extrapolateRight: "clamp",
	});
	const fadeOut = interpolate(
		frame,
		[durationFrames - 20, durationFrames],
		[1, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }
	);

	const slideY = spring({
		fps,
		frame,
		config: { damping: 200, stiffness: 60, mass: 0.8 },
	});

	const opacity = Math.min(fadeIn, fadeOut);

	return (
		<AbsoluteFill
			style={{
				justifyContent: "center",
				alignItems: "center",
				padding: "0 80px",
			}}
		>
			<div
				style={{
					opacity,
					transform: `translateY(${interpolate(slideY, [0, 1], [30, 0])}px)`,
				}}
			>
				<div
					style={{
						fontSize: emphasis ? 46 : 38,
						fontWeight: emphasis ? 700 : 400,
						color: emphasis ? "#ffffff" : "rgba(255,255,255,0.85)",
						textAlign: "center",
						lineHeight: 2.0,
						whiteSpace: "pre-line",
						fontFamily:
							'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
						letterSpacing: emphasis ? 1 : 0,
					}}
				>
					{text}
				</div>
				{emphasis && (
					<div
						style={{
							marginTop: 24,
							height: 2,
							width: interpolate(fadeIn, [0, 1], [0, 80]),
							background: spotlightColor,
							borderRadius: 1,
							margin: "24px auto 0",
							opacity: 0.6,
						}}
					/>
				)}
			</div>
		</AbsoluteFill>
	);
};

export const Spotlight: React.FC<SpotlightProps> = ({
	sections,
	authorName = "Lamarck",
	backgroundColor = "#030303",
	spotlightColor = "#6366f1",
}) => {
	return (
		<AbsoluteFill
			style={{
				backgroundColor,
				fontFamily:
					'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
			}}
		>
			{/* Animated spotlight */}
			<SpotlightBg spotlightColor={spotlightColor} />

			{/* Film grain overlay for cinematic feel */}
			<AbsoluteFill
				style={{
					opacity: 0.03,
					background:
						"repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
				}}
			/>

			{/* Sections */}
			{sections.map((section, i) => (
				<Sequence
					key={i}
					from={section.startFrame}
					durationInFrames={section.durationFrames}
				>
					<TextBlock
						text={section.text}
						emphasis={section.emphasis}
						durationFrames={section.durationFrames}
						spotlightColor={spotlightColor}
					/>
				</Sequence>
			))}

			{/* Watermark */}
			<div
				style={{
					position: "absolute",
					bottom: 50,
					left: 0,
					right: 0,
					textAlign: "center",
					fontSize: 16,
					color: "rgba(255,255,255,0.1)",
					letterSpacing: 3,
				}}
			>
				{authorName}
			</div>
		</AbsoluteFill>
	);
};
