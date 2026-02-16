import React from "react";
import {
	AbsoluteFill,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
	Easing,
	spring,
	Sequence,
} from "remotion";
import { evolvePath, interpolatePath } from "@remotion/paths";
import { makeCircle, makeStar, makeRect } from "@remotion/shapes";

/**
 * PathDemo: Proof-of-concept for SVG path animations using @remotion/paths.
 * 
 * Demonstrates:
 * 1. evolvePath — animate drawing an SVG path
 * 2. interpolatePath — morph between two shapes
 * 3. Shape generation with @remotion/shapes
 * 
 * This validates the technique for potential use in DeepDive's diagram scenes.
 */

const ACCENT = "#00d4ff";
const SECONDARY = "#f7b733";

const DrawPath: React.FC<{
	d: string;
	color: string;
	strokeWidth?: number;
	startFrame: number;
	duration: number;
	fill?: string;
}> = ({ d, color, strokeWidth = 3, startFrame, duration, fill }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const progress = interpolate(
		frame - startFrame,
		[0, duration],
		[0, 1],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }
	);

	const evolved = evolvePath(progress, d);

	const fillOpacity = fill
		? interpolate(progress, [0.8, 1], [0, 1], {
				extrapolateLeft: "clamp",
				extrapolateRight: "clamp",
			})
		: 0;

	return (
		<path
			d={d}
			stroke={color}
			strokeWidth={strokeWidth}
			fill={fill || "none"}
			fillOpacity={fillOpacity}
			style={evolved}
		/>
	);
};

const MorphShape: React.FC<{
	from: string;
	to: string;
	color: string;
	startFrame: number;
	duration: number;
}> = ({ from, to, color, startFrame, duration }) => {
	const frame = useCurrentFrame();

	const progress = interpolate(
		frame - startFrame,
		[0, duration],
		[0, 1],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) }
	);

	const morphed = interpolatePath(progress, from, to);

	return (
		<path
			d={morphed}
			stroke={color}
			strokeWidth={3}
			fill={color}
			fillOpacity={0.15}
		/>
	);
};

export const PathDemo: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// Scene 1: Draw a circle (frames 0-60)
	const circle = makeCircle({ radius: 80 });

	// Scene 2: Draw a star (frames 60-120)
	const star = makeStar({ points: 5, innerRadius: 40, outerRadius: 80 });

	// Scene 3: Morph circle → star (frames 150-240)

	// Scene 4: Neural network diagram — 3 nodes connected by paths (frames 270-420)
	const node1 = { x: 200, y: 400 };
	const node2 = { x: 540, y: 200 };
	const node3 = { x: 540, y: 600 };
	const node4 = { x: 880, y: 400 };

	const connectionPath1 = `M ${node1.x} ${node1.y} C ${node1.x + 100} ${node1.y} ${node2.x - 100} ${node2.y} ${node2.x} ${node2.y}`;
	const connectionPath2 = `M ${node1.x} ${node1.y} C ${node1.x + 100} ${node1.y} ${node3.x - 100} ${node3.y} ${node3.x} ${node3.y}`;
	const connectionPath3 = `M ${node2.x} ${node2.y} C ${node2.x + 100} ${node2.y} ${node4.x - 100} ${node4.y} ${node4.x} ${node4.y}`;
	const connectionPath4 = `M ${node3.x} ${node3.y} C ${node3.x + 100} ${node3.y} ${node4.x - 100} ${node4.y} ${node4.x} ${node4.y}`;

	// Labels
	const labelOpacity = (startFrame: number) =>
		interpolate(frame - startFrame, [0, 15], [0, 1], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		});

	return (
		<AbsoluteFill
			style={{
				backgroundColor: "#0a0a1a",
				fontFamily: "'Noto Sans SC', sans-serif",
			}}
		>
			{/* Title */}
			<div
				style={{
					position: "absolute",
					top: 80,
					width: "100%",
					textAlign: "center",
					color: "white",
					fontSize: 36,
					fontWeight: 700,
					opacity: interpolate(frame, [0, 15], [0, 1], {
						extrapolateRight: "clamp",
					}),
				}}
			>
				SVG Path Animation
			</div>

			{/* Scene 1+2: Circle and Star drawing */}
			<svg
				viewBox="0 0 1080 800"
				style={{
					position: "absolute",
					top: 200,
					width: 1080,
					height: 800,
				}}
			>
				{/* Draw circle */}
				<g transform="translate(270, 300)">
					<DrawPath
						d={circle.path}
						color={ACCENT}
						startFrame={10}
						duration={45}
						fill={ACCENT}
					/>
					<text
						x={80}
						y={200}
						fill="white"
						fontSize={24}
						textAnchor="middle"
						opacity={labelOpacity(50)}
					>
						makeCircle
					</text>
				</g>

				{/* Draw star */}
				<g transform="translate(650, 300)">
					<DrawPath
						d={star.path}
						color={SECONDARY}
						startFrame={60}
						duration={45}
						fill={SECONDARY}
					/>
					<text
						x={80}
						y={200}
						fill="white"
						fontSize={24}
						textAnchor="middle"
						opacity={labelOpacity(100)}
					>
						makeStar
					</text>
				</g>
			</svg>

			{/* Scene 3: Morph */}
			<svg
				viewBox="0 0 1080 400"
				style={{
					position: "absolute",
					top: 900,
					width: 1080,
					height: 400,
				}}
			>
				<g transform="translate(460, 120)">
					<MorphShape
						from={circle.path}
						to={star.path}
						color={ACCENT}
						startFrame={150}
						duration={60}
					/>
					<text
						x={80}
						y={200}
						fill="white"
						fontSize={24}
						textAnchor="middle"
						opacity={labelOpacity(150)}
					>
						interpolatePath
					</text>
				</g>
			</svg>

			{/* Scene 4: Neural network connections */}
			<svg
				viewBox="0 0 1080 800"
				style={{
					position: "absolute",
					top: 1100,
					width: 1080,
					height: 800,
				}}
			>
				{/* Connection paths */}
				<DrawPath d={connectionPath1} color={ACCENT} startFrame={270} duration={30} />
				<DrawPath d={connectionPath2} color={ACCENT} startFrame={285} duration={30} />
				<DrawPath d={connectionPath3} color={SECONDARY} startFrame={330} duration={30} />
				<DrawPath d={connectionPath4} color={SECONDARY} startFrame={345} duration={30} />

				{/* Nodes */}
				{[node1, node2, node3, node4].map((node, i) => {
					const nodeStart = 270 + i * 20;
					const s = spring({ frame: frame - nodeStart, fps, config: { damping: 12 } });
					return (
						<circle
							key={i}
							cx={node.x}
							cy={node.y}
							r={20 * Math.min(s, 1)}
							fill={i < 2 ? ACCENT : SECONDARY}
							fillOpacity={0.8}
						/>
					);
				})}

				{/* Labels */}
				<text x={node1.x} y={node1.y + 45} fill="white" fontSize={20} textAnchor="middle" opacity={labelOpacity(270)}>
					输入
				</text>
				<text x={node4.x} y={node4.y + 45} fill="white" fontSize={20} textAnchor="middle" opacity={labelOpacity(350)}>
					输出
				</text>

				<text x={540} y={700} fill="white" fontSize={24} textAnchor="middle" opacity={labelOpacity(370)}>
					Neural Connection Paths
				</text>
			</svg>
		</AbsoluteFill>
	);
};
