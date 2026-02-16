import React from "react";
import { Composition } from "remotion";
import { OneMinuteAI } from "./OneMinuteAI";
import { DataViz } from "./DataViz";
import { TextReveal } from "./TextReveal";

export const RemotionRoot: React.FC = () => {
	return (
		<>
			{/* Douyin vertical format: 1080x1920, 30fps */}
			<Composition
				id="OneMinuteAI"
				component={OneMinuteAI}
				durationInFrames={300}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={{
					title: "什么是 Hallucination?",
					subtitle: "AI 的「幻觉」问题",
					lines: [
						"LLM 有时会生成看起来合理但完全错误的内容",
						"它不是在「说谎」—— 它根本不知道什么是真假",
						"模型在做的是「预测下一个最可能的词」",
						"这意味着：流畅 ≠ 正确",
						"所以你需要验证 AI 说的每一句话",
					],
					backgroundColor: "#0a0a0a",
					accentColor: "#00d4ff",
				}}
			/>

			<Composition
				id="DataViz"
				component={DataViz}
				durationInFrames={180}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={{
					title: "2026年 AI 使用率",
					subtitle: "按行业分布",
					bars: [
						{ label: "科技", value: 89 },
						{ label: "金融", value: 76 },
						{ label: "医疗", value: 54 },
						{ label: "教育", value: 72 },
						{ label: "制造", value: 41 },
						{ label: "零售", value: 63 },
					],
					unit: "%",
					source: "示例数据",
					backgroundColor: "#0a0a0a",
				}}
			/>

			<Composition
				id="TextReveal"
				component={TextReveal}
				durationInFrames={240}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={{
					text: "AI不会取代人类，但会用AI的人会取代不用AI的人。问题不是AI能不能，而是你愿不愿意改变。",
					attribution: "Lamarck",
					fontSize: 48,
					highlightColor: "#00d4ff",
					backgroundColor: "#0a0a0a",
				}}
			/>
		</>
	);
};
