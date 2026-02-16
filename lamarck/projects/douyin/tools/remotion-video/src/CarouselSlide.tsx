import React from "react";
import { AbsoluteFill } from "remotion";

// A single carousel slide for Douyin 图文笔记
// Rendered as a still image (1080x1440, 3:4 ratio)

interface SlideProps {
	headline: string;
	body?: string;
	pageNumber?: number;
	totalPages?: number;
	style?: "title" | "content" | "quote" | "stat" | "takeaway";
	emoji?: string;
	authorName?: string;
	backgroundColor?: string;
	accentColor?: string;
}

export const CarouselSlide: React.FC<SlideProps> = ({
	headline,
	body,
	pageNumber,
	totalPages,
	style = "content",
	emoji,
	authorName = "Lamarck",
	backgroundColor = "#0a0a0a",
	accentColor = "#00d4ff",
}) => {
	const styleConfig = {
		title: {
			headlineFontSize: 56,
			bodyFontSize: 28,
			headlineColor: "#ffffff",
			bodyColor: "#888",
			align: "center" as const,
			headlineWeight: 900,
		},
		content: {
			headlineFontSize: 40,
			bodyFontSize: 28,
			headlineColor: "#ffffff",
			bodyColor: "#cccccc",
			align: "left" as const,
			headlineWeight: 700,
		},
		quote: {
			headlineFontSize: 44,
			bodyFontSize: 24,
			headlineColor: accentColor,
			bodyColor: "#888",
			align: "center" as const,
			headlineWeight: 600,
		},
		stat: {
			headlineFontSize: 72,
			bodyFontSize: 28,
			headlineColor: accentColor,
			bodyColor: "#cccccc",
			align: "center" as const,
			headlineWeight: 900,
		},
		takeaway: {
			headlineFontSize: 40,
			bodyFontSize: 28,
			headlineColor: "#ffffff",
			bodyColor: "#cccccc",
			align: "center" as const,
			headlineWeight: 700,
		},
	};

	const config = styleConfig[style];

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
			}}
		>
			{/* Subtle gradient */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background:
						style === "title"
							? `radial-gradient(ellipse at 50% 40%, ${accentColor}15 0%, transparent 60%)`
							: `radial-gradient(ellipse at 30% 60%, ${accentColor}08 0%, transparent 50%)`,
				}}
			/>

			{/* Content */}
			<div
				style={{
					position: "relative",
					zIndex: 1,
					textAlign: config.align,
					maxWidth: 920,
					margin: "0 auto",
				}}
			>
				{/* Emoji */}
				{emoji && (
					<div style={{ fontSize: 64, marginBottom: 24 }}>{emoji}</div>
				)}

				{/* Headline */}
				<div
					style={{
						fontSize: config.headlineFontSize,
						fontWeight: config.headlineWeight,
						color: config.headlineColor,
						lineHeight: 1.5,
						marginBottom: body ? 24 : 0,
						whiteSpace: "pre-line",
					}}
				>
					{headline}
				</div>

				{/* Accent line for title style */}
				{style === "title" && (
					<div
						style={{
							width: 80,
							height: 3,
							backgroundColor: accentColor,
							margin: "20px auto",
						}}
					/>
				)}

				{/* Quote marks */}
				{style === "quote" && (
					<div
						style={{
							fontSize: 120,
							color: `${accentColor}30`,
							position: "absolute",
							top: -60,
							left: config.align === "center" ? "calc(50% - 40px)" : 0,
							fontFamily: "Georgia, serif",
							lineHeight: 1,
						}}
					>
						"
					</div>
				)}

				{/* Body */}
				{body && (
					<div
						style={{
							fontSize: config.bodyFontSize,
							color: config.bodyColor,
							lineHeight: 1.8,
							whiteSpace: "pre-line",
						}}
					>
						{body}
					</div>
				)}

				{/* Takeaway box */}
				{style === "takeaway" && (
					<div
						style={{
							marginTop: 30,
							padding: "20px 30px",
							borderLeft: `4px solid ${accentColor}`,
							backgroundColor: `${accentColor}10`,
							borderRadius: 8,
							textAlign: "left",
						}}
					>
						<div
							style={{
								fontSize: 22,
								color: accentColor,
								fontWeight: 600,
							}}
						>
							💡 记住这个
						</div>
					</div>
				)}
			</div>

			{/* Page number */}
			{pageNumber && totalPages && (
				<div
					style={{
						position: "absolute",
						bottom: 40,
						left: 0,
						right: 0,
						textAlign: "center",
						fontSize: 18,
						color: "#444",
					}}
				>
					{pageNumber} / {totalPages}
				</div>
			)}

			{/* Author */}
			<div
				style={{
					position: "absolute",
					bottom: 40,
					right: 60,
					fontSize: 18,
					color: "#333",
				}}
			>
				@{authorName}
			</div>
		</AbsoluteFill>
	);
};
