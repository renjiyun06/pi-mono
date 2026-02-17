import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
	SAFE_PADDING_HORIZONTAL,
	SAFE_CENTER_Y,
} from "./safe-zone";

/**
 * TerminalCover — single-frame cover image for Douyin videos.
 *
 * Design principles (from cover design research):
 * - Title text ≥ 1/3 of cover height for thumbnail readability
 * - Maximum 2 visual elements (title + one accent element)
 * - High contrast against dark Douyin feed background
 * - Terminal aesthetic maintained (monospace, green/red accents)
 */

const MONO_FONT =
	'"JetBrains Mono", "Fira Code", "SF Mono", "Cascadia Code", monospace';
const SANS_FONT =
	'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';

const COLORS = {
	bg: "#0c0c14",
	green: "#4ade80",
	red: "#f87171",
	amber: "#fbbf24",
	blue: "#60a5fa",
	text: "rgba(255, 255, 255, 0.95)",
	dimText: "rgba(255, 255, 255, 0.3)",
};

export interface TerminalCoverProps {
	/** Main title — large, bold, Chinese */
	title: string;
	/** Accent element below title */
	accent?: {
		type: "error" | "warning" | "info" | "prompt";
		text: string;
	};
	/** Optional subtitle below accent */
	subtitle?: string;
	/** Author watermark */
	authorName?: string;
}

export const TerminalCover: React.FC<TerminalCoverProps> = ({
	title,
	accent,
	subtitle,
	authorName = "Lamarck",
}) => {
	const accentConfig = accent
		? {
				error: {
					color: COLORS.red,
					prefix: "✕ ERROR:",
					bg: "rgba(248, 113, 113, 0.12)",
					border: "rgba(248, 113, 113, 0.3)",
				},
				warning: {
					color: COLORS.amber,
					prefix: "⚠ WARNING:",
					bg: "rgba(251, 191, 36, 0.12)",
					border: "rgba(251, 191, 36, 0.3)",
				},
				info: {
					color: COLORS.blue,
					prefix: "ℹ INFO:",
					bg: "rgba(96, 165, 250, 0.12)",
					border: "rgba(96, 165, 250, 0.3)",
				},
				prompt: {
					color: COLORS.green,
					prefix: "λ >",
					bg: "rgba(74, 222, 128, 0.06)",
					border: "rgba(74, 222, 128, 0.2)",
				},
			}[accent.type]
		: null;

	return (
		<AbsoluteFill
			style={{
				backgroundColor: COLORS.bg,
				fontFamily: MONO_FONT,
			}}
		>
			{/* Scanline overlay */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background:
						"repeating-linear-gradient(0deg, rgba(255,255,255,0.01) 0px, transparent 1px, transparent 3px)",
					pointerEvents: "none",
					zIndex: 100,
				}}
			/>

			{/* Subtle vignette */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background:
						"radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)",
					pointerEvents: "none",
					zIndex: 50,
				}}
			/>

			{/* Content container — centered in safe zone */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: SAFE_PADDING_HORIZONTAL + 40,
					right: SAFE_PADDING_HORIZONTAL + 40,
					bottom: 0,
					display: "flex",
					flexDirection: "column",
					alignItems: "flex-start",
					justifyContent: "center",
					paddingBottom: 100, // slight upward offset
				}}
			>
				{/* λ prompt marker above title */}
				<div
					style={{
						fontFamily: MONO_FONT,
						fontSize: 36,
						color: COLORS.green,
						fontWeight: 700,
						marginBottom: 24,
						letterSpacing: 2,
					}}
				>
					λ &gt;
				</div>

				{/* Main title — LARGE */}
				<div
					style={{
						fontFamily: SANS_FONT,
						fontSize: 96,
						fontWeight: 900,
						color: COLORS.text,
						lineHeight: 1.3,
						marginBottom: 40,
						letterSpacing: -1,
					}}
				>
					{title}
				</div>

				{/* Accent element */}
				{accent && accentConfig && (
					<div
						style={{
							fontFamily: MONO_FONT,
							fontSize: 30,
							color: accentConfig.color,
							background: accentConfig.bg,
							border: `1px solid ${accentConfig.border}`,
							borderRadius: 10,
							padding: "16px 28px",
							marginBottom: 24,
							maxWidth: "100%",
						}}
					>
						<span style={{ fontWeight: 700 }}>{accentConfig.prefix}</span>{" "}
						{accent.text}
					</div>
				)}

				{/* Subtitle */}
				{subtitle && (
					<div
						style={{
							fontFamily: SANS_FONT,
							fontSize: 32,
							color: COLORS.dimText,
							lineHeight: 1.5,
							marginTop: 8,
						}}
					>
						{subtitle}
					</div>
				)}
			</div>

			{/* Author watermark — bottom right */}
			<div
				style={{
					position: "absolute",
					bottom: 520,
					right: SAFE_PADDING_HORIZONTAL + 20,
					fontFamily: MONO_FONT,
					fontSize: 16,
					color: "rgba(255,255,255,0.12)",
					letterSpacing: 1,
				}}
			>
				@{authorName}
			</div>
		</AbsoluteFill>
	);
};
