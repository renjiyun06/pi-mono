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
 * Character-by-character typewriter reveal synced to narration duration.
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

/**
 * Splits text into lines (by \n) and renders each character with staggered fade-in.
 * Characters appear one by one like a typewriter, taking ~70% of the section duration.
 * The remaining 30% holds the full text visible before fade-out.
 */
const TypewriterText: React.FC<{
	text: string;
	emphasis?: boolean;
	durationFrames: number;
	spotlightColor: string;
}> = ({ text, emphasis, durationFrames, spotlightColor }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// Split into lines, then characters
	const lines = text.split("\n");
	const allChars: Array<{ char: string; lineIdx: number; charIdx: number }> = [];
	for (let l = 0; l < lines.length; l++) {
		for (let c = 0; c < lines[l].length; c++) {
			allChars.push({ char: lines[l][c], lineIdx: l, charIdx: c });
		}
	}

	const totalChars = allChars.length;
	// Typewriter phase: 60% of duration, each char fades in over ~4 frames
	const typewriterEnd = Math.floor(durationFrames * 0.6);
	const charDelay = totalChars > 0 ? typewriterEnd / totalChars : 1;

	// Overall fade out
	const fadeOut = interpolate(
		frame,
		[durationFrames - 15, durationFrames],
		[1, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);

	// Container slide-up
	const slideY = spring({
		fps,
		frame,
		config: { damping: 200, stiffness: 50, mass: 0.8 },
	});

	return (
		<AbsoluteFill
			style={{
				justifyContent: "center",
				alignItems: "center",
				padding: "0 80px",
				opacity: fadeOut,
			}}
		>
			<div
				style={{
					transform: `translateY(${interpolate(slideY, [0, 1], [20, 0])}px)`,
				}}
			>
				{lines.map((line, lineIdx) => {
					// Count chars before this line
					let charsBefore = 0;
					for (let l = 0; l < lineIdx; l++) {
						charsBefore += lines[l].length;
					}

					// Empty lines create spacing
					if (line.length === 0) {
						return (
							<div
								key={lineIdx}
								style={{ height: emphasis ? 28 : 20 }}
							/>
						);
					}

					return (
						<div
							key={lineIdx}
							style={{
								fontSize: emphasis ? 46 : 38,
								fontWeight: emphasis ? 700 : 400,
								textAlign: "center",
								lineHeight: 1.8,
								fontFamily:
									'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
								letterSpacing: emphasis ? 1.5 : 0.5,
							}}
						>
							{line.split("").map((char, charIdx) => {
								const globalIdx = charsBefore + charIdx;
								const charAppearFrame = globalIdx * charDelay;
								const charOpacity = interpolate(
									frame,
									[charAppearFrame, charAppearFrame + 4],
									[0, 1],
									{
										extrapolateLeft: "clamp",
										extrapolateRight: "clamp",
									},
								);

								return (
									<span
										key={charIdx}
										style={{
											opacity: charOpacity,
											color: emphasis
												? "#ffffff"
												: `rgba(255,255,255,${0.85 * charOpacity + 0.15})`,
											display: "inline",
										}}
									>
										{char}
									</span>
								);
							})}
						</div>
					);
				})}

				{/* Emphasis underline */}
				{emphasis && (
					<div
						style={{
							marginTop: 20,
							height: 2,
							width: interpolate(
								frame,
								[typewriterEnd, typewriterEnd + 15],
								[0, 80],
								{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
							),
							background: spotlightColor,
							borderRadius: 1,
							margin: "20px auto 0",
							opacity: 0.6,
						}}
					/>
				)}
			</div>
		</AbsoluteFill>
	);
};

// Animated cursor that blinks at the bottom of the screen
const Cursor: React.FC<{ spotlightColor: string }> = ({ spotlightColor }) => {
	const frame = useCurrentFrame();
	const blink = Math.sin(frame * 0.15) > 0 ? 0.7 : 0;

	return (
		<div
			style={{
				position: "absolute",
				bottom: 120,
				left: "50%",
				transform: "translateX(-50%)",
				width: 2,
				height: 20,
				backgroundColor: spotlightColor,
				opacity: blink,
			}}
		/>
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
			<SpotlightBg spotlightColor={spotlightColor} />

			{/* Film grain overlay */}
			<AbsoluteFill
				style={{
					opacity: 0.03,
					background:
						"repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
				}}
			/>

			{/* Blinking cursor */}
			<Cursor spotlightColor={spotlightColor} />

			{/* Sections */}
			{sections.map((section, i) => (
				<Sequence
					key={i}
					from={section.startFrame}
					durationInFrames={section.durationFrames}
				>
					<TypewriterText
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
