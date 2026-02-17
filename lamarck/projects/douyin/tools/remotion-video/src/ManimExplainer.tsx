import React from "react";
import {
	AbsoluteFill,
	Audio,
	interpolate,
	Sequence,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import { Video } from "@remotion/media";
import {
	SAFE_PADDING_HORIZONTAL,
	DANGER_TOP,
	SUBTITLE_BOTTOM,
	WATERMARK_BOTTOM,
	WATERMARK_RIGHT,
} from "./safe-zone";

/**
 * ManimExplainer — a composition that wraps pre-rendered Manim clips
 * with TTS narration, subtitle overlay, and transitions.
 *
 * Designed for the "math/science explainer" content format:
 * - Manim produces full-screen 1080x1920 video clips
 * - TTS provides per-scene narration
 * - This composition sequences them with crossfades and subtitles
 *
 * Each scene is a Manim clip + audio + subtitle text.
 * Scenes crossfade into each other for smooth flow.
 */

interface ManimScene {
	/** Path to Manim video in public/ directory */
	videoSrc: string;
	/** Path to TTS audio in public/ directory */
	audioSrc: string;
	/** Subtitle text displayed during this scene */
	subtitle: string;
	/** Duration in frames (should match or exceed audio length) */
	durationFrames: number;
	/** Optional: start frame offset (calculated automatically if not provided) */
	startFrame?: number;
}

interface ManimExplainerProps {
	scenes: ManimScene[];
	authorName?: string;
	/** Crossfade duration in frames between scenes */
	crossfadeDuration?: number;
	/** Background color visible during transitions */
	backgroundColor?: string;
}

const FONT = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';

/**
 * Individual scene: Manim video + narration audio + subtitle
 */
const SceneRenderer: React.FC<{
	scene: ManimScene;
	crossfadeDuration: number;
	durationFrames: number;
}> = ({ scene, crossfadeDuration, durationFrames }) => {
	const frame = useCurrentFrame();

	// Fade in at start
	const fadeIn = interpolate(frame, [0, crossfadeDuration], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Fade out at end
	const fadeOut = interpolate(
		frame,
		[durationFrames - crossfadeDuration, durationFrames],
		[1, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);

	const opacity = Math.min(fadeIn, fadeOut);

	// Subtitle animation: slide up and fade in
	const subtitleOpacity = interpolate(frame, [5, 20], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const subtitleFadeOut = interpolate(
		frame,
		[durationFrames - 15, durationFrames],
		[1, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);
	const subtitleY = interpolate(frame, [5, 20], [15, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{ opacity }}>
			{/* Manim video — full screen */}
			<Video
				src={staticFile(scene.videoSrc)}
				style={{
					width: "100%",
					height: "100%",
					objectFit: "cover",
				}}
				muted
			/>

			{/* TTS narration audio */}
			<Audio src={staticFile(scene.audioSrc)} />

			{/* Subtitle overlay */}
			<div
				style={{
					position: "absolute",
					bottom: SUBTITLE_BOTTOM,
					left: SAFE_PADDING_HORIZONTAL,
					right: SAFE_PADDING_HORIZONTAL,
					textAlign: "center",
					opacity: Math.min(subtitleOpacity, subtitleFadeOut),
					transform: `translateY(${subtitleY}px)`,
				}}
			>
				<div
					style={{
						display: "inline-block",
						background: "rgba(0, 0, 0, 0.6)",
						backdropFilter: "blur(8px)",
						borderRadius: 12,
						padding: "12px 24px",
						maxWidth: "100%",
					}}
				>
					<span
						style={{
							fontSize: 30,
							fontWeight: 600,
							color: "#ffffff",
							fontFamily: FONT,
							lineHeight: 1.6,
							whiteSpace: "pre-line",
						}}
					>
						{scene.subtitle}
					</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};

export const ManimExplainer: React.FC<ManimExplainerProps> = ({
	scenes,
	authorName = "Lamarck",
	crossfadeDuration = 10,
	backgroundColor = "#0a0a1a",
}) => {
	// Calculate start frames if not provided
	let currentFrame = 0;
	const resolvedScenes = scenes.map((scene) => {
		const startFrame = scene.startFrame ?? currentFrame;
		currentFrame = startFrame + scene.durationFrames;
		return { ...scene, startFrame };
	});

	return (
		<AbsoluteFill
			style={{
				backgroundColor,
				fontFamily: FONT,
			}}
		>
			{/* Scene sequences */}
			{resolvedScenes.map((scene, i) => (
				<Sequence
					key={i}
					from={scene.startFrame}
					durationInFrames={scene.durationFrames}
				>
					<SceneRenderer
						scene={scene}
						crossfadeDuration={crossfadeDuration}
						durationFrames={scene.durationFrames}
					/>
				</Sequence>
			))}

			{/* Watermark */}
			<div
				style={{
					position: "absolute",
					bottom: WATERMARK_BOTTOM,
					right: WATERMARK_RIGHT,
					fontSize: 16,
					color: "rgba(255,255,255,0.12)",
					fontFamily: FONT,
					letterSpacing: 2,
				}}
			>
				@{authorName}
			</div>
		</AbsoluteFill>
	);
};
