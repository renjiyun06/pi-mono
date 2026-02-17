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
} from "./safe-zone";

// Visualizes how an LLM "thinks" — showing token-by-token generation
// This is the kind of content only an AI would create: showing its own internal process

interface TokenStreamProps {
	prompt: string;
	tokens: string[];
	probabilities?: number[];
	title?: string;
	backgroundColor?: string;
	accentColor?: string;
}

export const TokenStream: React.FC<TokenStreamProps> = ({
	prompt,
	tokens,
	probabilities,
	title = "我是怎么「想」的",
	backgroundColor = "#0a0a0a",
	accentColor = "#00d4ff",
}) => {
	const frame = useCurrentFrame();
	const { fps, width, height } = useVideoConfig();

	const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
		extrapolateRight: "clamp",
	});

	// Prompt appears first
	const promptOpacity = interpolate(frame, [20, 40], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Tokens appear one by one starting at frame 60
	const tokenStartFrame = 60;
	const framesPerToken = 8;

	return (
		<AbsoluteFill
			style={{
				backgroundColor,
				fontFamily:
					'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
				paddingLeft: SAFE_PADDING_HORIZONTAL,
				paddingRight: SAFE_PADDING_HORIZONTAL,
				paddingTop: DANGER_TOP + 20,
				paddingBottom: SUBTITLE_BOTTOM,
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* Title */}
			<div
				style={{
					opacity: titleOpacity,
					fontSize: 44,
					fontWeight: 800,
					color: "#ffffff",
					marginBottom: 30,
					textAlign: "center",
				}}
			>
				{title}
			</div>

			{/* Prompt section */}
			<div
				style={{
					opacity: promptOpacity,
					backgroundColor: "#1a1a2e",
					borderRadius: 12,
					padding: 24,
					marginBottom: 30,
					border: `1px solid ${accentColor}40`,
				}}
			>
				<div
					style={{
						fontSize: 16,
						color: accentColor,
						marginBottom: 8,
						fontFamily: '"JetBrains Mono", monospace',
					}}
				>
					输入 →
				</div>
				<div
					style={{
						fontSize: 28,
						color: "#ccc",
						lineHeight: 1.5,
					}}
				>
					{prompt}
				</div>
			</div>

			{/* Output / token stream */}
			<div
				style={{
					backgroundColor: "#111",
					borderRadius: 12,
					padding: 30,
					flex: 1,
					overflow: "hidden",
				}}
			>
				<div
					style={{
						fontSize: 16,
						color: "#666",
						marginBottom: 16,
						fontFamily: '"JetBrains Mono", monospace',
					}}
				>
					输出 ← token by token
				</div>

				{/* Generated tokens */}
				<div
					style={{
						fontSize: 32,
						lineHeight: 2,
						display: "flex",
						flexWrap: "wrap",
						gap: 4,
					}}
				>
					{tokens.map((token, i) => {
						const tokenFrame = tokenStartFrame + i * framesPerToken;
						const isActive = frame >= tokenFrame;
						const isLatest =
							frame >= tokenFrame &&
							frame < tokenFrame + framesPerToken;
						const age = frame - tokenFrame;
						const prob = probabilities?.[i];

						if (!isActive) return null;

						const opacity = interpolate(
							age,
							[0, 5],
							[0.3, 1],
							{ extrapolateRight: "clamp" }
						);

						// Color based on probability (if provided)
						let tokenColor = "#ffffff";
						if (prob !== undefined) {
							if (prob > 0.8) tokenColor = "#27ca40";
							else if (prob > 0.5) tokenColor = "#ffd93d";
							else if (prob > 0.2) tokenColor = "#ff9f43";
							else tokenColor = "#ff6b6b";
						}

						return (
							<span
								key={i}
								style={{
									opacity,
									color: isLatest ? accentColor : tokenColor,
									backgroundColor: isLatest ? `${accentColor}20` : "transparent",
									padding: "2px 6px",
									borderRadius: 4,
									transition: "background-color 0.2s",
									fontWeight: isLatest ? 700 : 400,
								}}
							>
								{token}
							</span>
						);
					})}

					{/* Cursor */}
					{frame >= tokenStartFrame && (
						<span
							style={{
								display: "inline-block",
								width: 3,
								height: 36,
								backgroundColor: accentColor,
								opacity: Math.sin(frame * 0.2) > 0 ? 1 : 0,
								marginLeft: 2,
								alignSelf: "center",
							}}
						/>
					)}
				</div>

				{/* Probability legend */}
				{probabilities && frame > tokenStartFrame + 30 && (
					<div
						style={{
							position: "absolute",
							bottom: SUBTITLE_BOTTOM,
							left: SAFE_PADDING_HORIZONTAL,
							right: SAFE_PADDING_HORIZONTAL,
							display: "flex",
							justifyContent: "center",
							gap: 24,
							opacity: interpolate(
								frame,
								[tokenStartFrame + 30, tokenStartFrame + 45],
								[0, 0.7],
								{ extrapolateRight: "clamp" }
							),
						}}
					>
						<span style={{ fontSize: 16, color: "#27ca40" }}>
							■ 高确定 ({">"}80%)
						</span>
						<span style={{ fontSize: 16, color: "#ffd93d" }}>
							■ 中确定 (50-80%)
						</span>
						<span style={{ fontSize: 16, color: "#ff6b6b" }}>
							■ 低确定 ({"<"}20%)
						</span>
					</div>
				)}
			</div>

			{/* Footer */}
			<div
				style={{
					fontSize: 18,
					color: "#444",
					textAlign: "center",
					marginTop: 20,
				}}
			>
				这就是 AI 生成文本的过程 — 一个 token 接一个 token
			</div>
		</AbsoluteFill>
	);
};
