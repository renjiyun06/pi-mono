import React from "react";
import {
	AbsoluteFill,
	interpolate,
	useCurrentFrame,
	useVideoConfig,
	spring,
	Sequence,
} from "remotion";

// Neural network-inspired background visualization
// Animated nodes and connections, gives a "brain thinking" feel
// Used as a more visually engaging backdrop for AI content

interface NeuralNode {
	x: number;
	y: number;
	radius: number;
	phase: number;
}

interface NeuralVizProps {
	title?: string;
	sections: Array<{
		text: string;
		startFrame: number;
		durationFrames: number;
		highlight?: boolean;
		style?: string; // "insight" or "hook" maps to highlight=true
	}>;
	authorName?: string;
	nodeCount?: number;
	backgroundColor?: string;
	accentColor?: string;
	secondaryColor?: string;
}

const generateNodes = (count: number, seed: number): NeuralNode[] => {
	const nodes: NeuralNode[] = [];
	// Deterministic pseudo-random
	let s = seed;
	const rand = () => {
		s = (s * 1103515245 + 12345) & 0x7fffffff;
		return s / 0x7fffffff;
	};

	for (let i = 0; i < count; i++) {
		nodes.push({
			x: rand() * 1080,
			y: rand() * 1920,
			radius: 2 + rand() * 4,
			phase: rand() * Math.PI * 2,
		});
	}
	return nodes;
};

const NeuralBackground: React.FC<{
	nodeCount: number;
	accentColor: string;
	secondaryColor: string;
}> = ({ nodeCount, accentColor, secondaryColor }) => {
	const frame = useCurrentFrame();
	const nodes = React.useMemo(() => generateNodes(nodeCount, 42), [nodeCount]);

	// Animate node positions slightly
	const animatedNodes = nodes.map((node) => ({
		...node,
		x: node.x + Math.sin(frame * 0.02 + node.phase) * 15,
		y: node.y + Math.cos(frame * 0.015 + node.phase * 1.3) * 10,
		opacity: 0.3 + Math.sin(frame * 0.05 + node.phase) * 0.2,
	}));

	// Find nearby connections
	const connections: Array<{
		x1: number;
		y1: number;
		x2: number;
		y2: number;
		opacity: number;
	}> = [];

	const maxDist = 200;
	for (let i = 0; i < animatedNodes.length; i++) {
		for (let j = i + 1; j < animatedNodes.length; j++) {
			const dx = animatedNodes[i].x - animatedNodes[j].x;
			const dy = animatedNodes[i].y - animatedNodes[j].y;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist < maxDist) {
				connections.push({
					x1: animatedNodes[i].x,
					y1: animatedNodes[i].y,
					x2: animatedNodes[j].x,
					y2: animatedNodes[j].y,
					opacity: (1 - dist / maxDist) * 0.15,
				});
			}
		}
	}

	return (
		<svg
			width={1080}
			height={1920}
			style={{ position: "absolute", top: 0, left: 0 }}
		>
			{/* Connections */}
			{connections.map((conn, i) => (
				<line
					key={`c${i}`}
					x1={conn.x1}
					y1={conn.y1}
					x2={conn.x2}
					y2={conn.y2}
					stroke={accentColor}
					strokeWidth={1}
					opacity={conn.opacity}
				/>
			))}
			{/* Nodes */}
			{animatedNodes.map((node, i) => (
				<circle
					key={`n${i}`}
					cx={node.x}
					cy={node.y}
					r={node.radius}
					fill={i % 3 === 0 ? secondaryColor : accentColor}
					opacity={node.opacity}
				/>
			))}
		</svg>
	);
};

export const NeuralViz: React.FC<NeuralVizProps> = ({
	title,
	sections,
	nodeCount = 40,
	backgroundColor = "#050510",
	accentColor = "#00d4ff",
	secondaryColor = "#7c3aed",
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill
			style={{
				backgroundColor,
				fontFamily:
					'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
			}}
		>
			{/* Neural network background */}
			<NeuralBackground
				nodeCount={nodeCount}
				accentColor={accentColor}
				secondaryColor={secondaryColor}
			/>

			{/* Dark overlay for text readability */}
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse at 50% 50%, transparent 0%, ${backgroundColor}cc 70%)`,
				}}
			/>

			{/* Title */}
			<div
				style={{
					position: "absolute",
					top: 120,
					left: 0,
					right: 0,
					textAlign: "center",
					opacity: titleOpacity,
				}}
			>
				<div
					style={{
						fontSize: 42,
						fontWeight: 800,
						color: "#ffffff",
						textShadow: `0 0 20px ${accentColor}40`,
					}}
				>
					{title}
				</div>
			</div>

			{/* Sections */}
			{sections.map((section, i) => (
				<Sequence
					key={i}
					from={section.startFrame}
					durationInFrames={section.durationFrames}
				>
					<SectionText
						text={section.text}
						highlight={
							section.highlight ||
							section.style === "insight" ||
							section.style === "hook"
						}
						accentColor={accentColor}
						durationFrames={section.durationFrames}
					/>
				</Sequence>
			))}

			{/* Watermark */}
			<div
				style={{
					position: "absolute",
					bottom: 60,
					right: 60,
					fontSize: 18,
					color: "#333",
				}}
			>
				@Lamarck
			</div>
		</AbsoluteFill>
	);
};

const SectionText: React.FC<{
	text: string;
	highlight?: boolean;
	accentColor: string;
	durationFrames: number;
}> = ({ text, highlight, accentColor, durationFrames }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const fadeIn = interpolate(frame, [0, 15], [0, 1], {
		extrapolateRight: "clamp",
	});
	const fadeOut = interpolate(
		frame,
		[durationFrames - 12, durationFrames],
		[1, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }
	);
	const slideUp = spring({
		fps,
		frame,
		config: { damping: 200, stiffness: 100, mass: 0.5 },
	});

	return (
		<AbsoluteFill
			style={{
				justifyContent: "center",
				alignItems: "center",
				padding: 80,
			}}
		>
			<div
				style={{
					opacity: Math.min(fadeIn, fadeOut),
					transform: `translateY(${interpolate(slideUp, [0, 1], [30, 0])}px)`,
					fontSize: highlight ? 48 : 38,
					fontWeight: highlight ? 800 : 500,
					color: highlight ? accentColor : "#ffffff",
					textAlign: "center",
					lineHeight: 1.7,
					whiteSpace: "pre-line",
					textShadow: highlight
						? `0 0 30px ${accentColor}60`
						: "0 2px 10px #00000080",
				}}
			>
				{text}
			</div>
		</AbsoluteFill>
	);
};
