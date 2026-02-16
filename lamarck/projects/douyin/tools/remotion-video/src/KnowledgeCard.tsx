import React from "react";
import {
	AbsoluteFill,
	interpolate,
	useCurrentFrame,
	useVideoConfig,
	spring,
	Easing,
} from "remotion";

/**
 * KnowledgeCard — an animated single-screen knowledge summary.
 *
 * Unlike DeepDive (multi-scene narrative) or AIInsight (TTS-driven monologue),
 * this is a 15-30s animation where information appears progressively on a
 * single canvas. Optimized for:
 * - Screenshots at the final frame (everything visible)
 * - Douyin "knowledge card" trend (screenshot & share)
 * - No narration needed — pure visual
 *
 * Props:
 * - title: Main heading
 * - items: Array of {icon, label, value} entries
 * - footer: Bottom text (attribution, source)
 * - accentColor: Brand color
 * - style: "grid" | "list" | "comparison"
 */

interface KnowledgeItem {
	icon?: string; // emoji or symbol
	label: string;
	value: string;
	highlight?: boolean; // accent-colored
}

interface KnowledgeCardProps {
	title: string;
	subtitle?: string;
	items: KnowledgeItem[];
	footer?: string;
	authorName?: string;
	accentColor?: string;
	backgroundColor?: string;
	style?: "list" | "grid" | "comparison";
}

const FONT = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';

export const KnowledgeCard: React.FC<KnowledgeCardProps> = ({
	title,
	subtitle,
	items = [],
	footer,
	authorName = "Lamarck",
	accentColor = "#00d4ff",
	backgroundColor = "#0a0a1a",
	style = "list",
}) => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();

	// Title entrance
	const titleSlide = spring({
		fps,
		frame,
		config: { damping: 20, stiffness: 80 },
	});
	const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
		extrapolateRight: "clamp",
	});

	// Subtitle
	const subtitleOpacity = interpolate(frame, [10, 25], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Accent line under title
	const lineWidth = interpolate(frame, [5, 30], [0, 300], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.quad),
	});

	// Footer fade
	const footerOpacity = interpolate(
		frame,
		[durationInFrames * 0.7, durationInFrames * 0.8],
		[0, 1],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);

	return (
		<AbsoluteFill
			style={{
				backgroundColor,
				fontFamily: FONT,
				padding: "80px 60px",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* Decorative top accent bar */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: 4,
					background: `linear-gradient(90deg, ${accentColor}, transparent)`,
					opacity: titleOpacity,
				}}
			/>

			{/* Title block */}
			<div
				style={{
					opacity: titleOpacity,
					transform: `translateY(${interpolate(titleSlide, [0, 1], [20, 0])}px)`,
					marginBottom: 16,
				}}
			>
				<div
					style={{
						fontSize: 56,
						fontWeight: 900,
						color: "#ffffff",
						lineHeight: 1.4,
						letterSpacing: 1,
					}}
				>
					{title}
				</div>
				{/* Accent line */}
				<div
					style={{
						width: lineWidth,
						height: 3,
						backgroundColor: accentColor,
						borderRadius: 2,
						marginTop: 16,
					}}
				/>
				{subtitle && (
					<div
						style={{
							fontSize: 26,
							color: "rgba(255,255,255,0.5)",
							marginTop: 12,
							opacity: subtitleOpacity,
						}}
					>
						{subtitle}
					</div>
				)}
			</div>

			{/* Items area */}
			<div
				style={{
					marginTop: 40,
					display: "flex",
					flexDirection: "column",
					gap: style === "grid" ? 24 : 16,
					...(style === "grid"
						? {
								flexDirection: "row",
								flexWrap: "wrap",
								alignContent: "flex-start",
							}
						: {}),
				}}
			>
				{items.map((item, idx) => {
					const itemDelay = 20 + idx * 12; // stagger
					const itemSlide = spring({
						fps,
						frame: Math.max(0, frame - itemDelay),
						config: { damping: 18, stiffness: 90 },
					});
					const itemOpacity = interpolate(
						frame,
						[itemDelay, itemDelay + 10],
						[0, 1],
						{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
					);

					if (style === "grid") {
						return (
							<div
								key={idx}
								style={{
									opacity: itemOpacity,
									transform: `scale(${interpolate(itemSlide, [0, 1], [0.8, 1])})`,
									background: item.highlight
										? `${accentColor}15`
										: "rgba(255,255,255,0.04)",
									border: `1px solid ${item.highlight ? `${accentColor}40` : "rgba(255,255,255,0.08)"}`,
									borderRadius: 16,
									padding: "28px 24px",
									width: "45%",
									textAlign: "center",
								}}
							>
								{item.icon && (
									<div style={{ fontSize: 40, marginBottom: 12 }}>
										{item.icon}
									</div>
								)}
								<div
									style={{
										fontSize: 20,
										color: "rgba(255,255,255,0.5)",
										marginBottom: 8,
									}}
								>
									{item.label}
								</div>
								<div
									style={{
										fontSize: 32,
										fontWeight: 700,
										color: item.highlight ? accentColor : "#ffffff",
									}}
								>
									{item.value}
								</div>
							</div>
						);
					}

					// List style
					return (
						<div
							key={idx}
							style={{
								opacity: itemOpacity,
								transform: `translateX(${interpolate(itemSlide, [0, 1], [-30, 0])}px)`,
								display: "flex",
								alignItems: "center",
								gap: 20,
								padding: "20px 24px",
								background: item.highlight
									? `${accentColor}10`
									: "rgba(255,255,255,0.03)",
								borderRadius: 12,
								borderLeft: item.highlight
									? `3px solid ${accentColor}`
									: "3px solid transparent",
							}}
						>
							{item.icon && (
								<div style={{ fontSize: 36, flexShrink: 0 }}>
									{item.icon}
								</div>
							)}
							<div style={{ flex: 1 }}>
								<div
									style={{
										fontSize: 22,
										color: "rgba(255,255,255,0.5)",
										marginBottom: 4,
									}}
								>
									{item.label}
								</div>
								<div
									style={{
										fontSize: 34,
										fontWeight: 600,
										color: item.highlight ? accentColor : "#ffffff",
									}}
								>
									{item.value}
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Footer */}
			{footer && (
				<div
					style={{
						opacity: footerOpacity,
						fontSize: 20,
						color: "rgba(255,255,255,0.3)",
						textAlign: "center",
						marginTop: 20,
					}}
				>
					{footer}
				</div>
			)}

			{/* Watermark */}
			<div
				style={{
					position: "absolute",
					bottom: 40,
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
