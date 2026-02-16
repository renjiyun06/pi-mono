import React from "react";
import {
	AbsoluteFill,
	interpolate,
	useCurrentFrame,
	useVideoConfig,
	spring,
	Easing,
} from "remotion";

// Animated bar chart for data visualization videos
// Useful for AI stats, comparisons, trends

interface BarData {
	label: string;
	value: number;
	color?: string;
}

interface DataVizProps {
	title: string;
	subtitle?: string;
	bars: BarData[];
	unit?: string;
	source?: string;
	backgroundColor?: string;
}

export const DataViz: React.FC<DataVizProps> = ({
	title,
	subtitle,
	bars,
	unit = "",
	source,
	backgroundColor = "#0a0a0a",
}) => {
	const frame = useCurrentFrame();
	const { fps, width } = useVideoConfig();

	const maxValue = Math.max(...bars.map((b) => b.value));
	const barMaxWidth = width - 400; // leave room for labels

	const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
		extrapolateRight: "clamp",
	});

	const defaultColors = [
		"#00d4ff",
		"#ff6b6b",
		"#ffd93d",
		"#6bcb77",
		"#9b59b6",
		"#e67e22",
		"#1abc9c",
		"#e74c3c",
	];

	return (
		<AbsoluteFill
			style={{
				backgroundColor,
				fontFamily:
					'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
				padding: 80,
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* Title */}
			<div
				style={{
					opacity: titleOpacity,
					marginBottom: 10,
				}}
			>
				<div
					style={{
						fontSize: 56,
						fontWeight: 900,
						color: "#ffffff",
					}}
				>
					{title}
				</div>
				{subtitle && (
					<div
						style={{
							fontSize: 28,
							color: "#888",
							marginTop: 8,
						}}
					>
						{subtitle}
					</div>
				)}
			</div>

			{/* Bars */}
			<div
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					gap: 24,
				}}
			>
				{bars.map((bar, i) => {
					const barDelay = 30 + i * 12;
					const barProgress = spring({
						fps,
						frame: frame - barDelay,
						config: {
							damping: 200,
							stiffness: 80,
							mass: 0.8,
						},
					});

					const barWidth = interpolate(
						barProgress,
						[0, 1],
						[0, (bar.value / maxValue) * barMaxWidth]
					);

					const labelOpacity = interpolate(
						frame,
						[barDelay, barDelay + 10],
						[0, 1],
						{
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						}
					);

					const color = bar.color || defaultColors[i % defaultColors.length];

					return (
						<div key={i} style={{ display: "flex", alignItems: "center" }}>
							{/* Label */}
							<div
								style={{
									width: 180,
									fontSize: 26,
									color: "#ccc",
									textAlign: "right",
									paddingRight: 20,
									opacity: labelOpacity,
									flexShrink: 0,
								}}
							>
								{bar.label}
							</div>

							{/* Bar */}
							<div
								style={{
									height: 40,
									width: barWidth,
									backgroundColor: color,
									borderRadius: 6,
									position: "relative",
								}}
							>
								{/* Value label */}
								{barProgress > 0.5 && (
									<div
										style={{
											position: "absolute",
											right: -20,
											top: "50%",
											transform: "translate(100%, -50%)",
											fontSize: 22,
											color: color,
											fontWeight: 700,
											opacity: interpolate(barProgress, [0.5, 0.8], [0, 1]),
											whiteSpace: "nowrap",
										}}
									>
										{bar.value}
										{unit}
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{/* Source */}
			{source && (
				<div
					style={{
						fontSize: 18,
						color: "#555",
						textAlign: "right",
						opacity: interpolate(frame, [fps * 3, fps * 3 + 15], [0, 1], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						}),
					}}
				>
					数据来源: {source}
				</div>
			)}
		</AbsoluteFill>
	);
};
