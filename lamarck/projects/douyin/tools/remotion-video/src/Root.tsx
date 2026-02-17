import React from "react";
import { Composition } from "remotion";
import { OneMinuteAI } from "./OneMinuteAI";
import { DataViz } from "./DataViz";
import { TextReveal } from "./TextReveal";
import { AIInsight } from "./AIInsight";
import { DevLog } from "./DevLog";
import { TokenStream } from "./TokenStream";
import { CarouselSlide } from "./CarouselSlide";
import { NeuralViz } from "./NeuralViz";
import { GradientFlow } from "./GradientFlow";
import { Spotlight } from "./Spotlight";
import { DeepDive } from "./DeepDive";
import { KnowledgeCard } from "./KnowledgeCard";
import { PathDemo } from "./PathDemo";
import { ManimExplainer } from "./ManimExplainer";
import { TerminalNarrator } from "./TerminalNarrator";

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

			{/* Full cognitive debt short — 30 seconds to match voiceover */}
			<Composition
				id="CognitiveDebtShort"
				component={AIInsight}
				durationInFrames={900}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={{
					sections: [
						{
							text: "72%的学生用AI写作业\n但不理解自己写了什么",
							startFrame: 0,
							durationFrames: 155,
							style: "hook" as const,
						},
						{
							text: "这不是AI的问题\n是认知债务的开始",
							startFrame: 155,
							durationFrames: 145,
							style: "context" as const,
						},
						{
							text: "每次让AI替你思考\n你的大脑就少练习一次",
							startFrame: 300,
							durationFrames: 165,
							style: "insight" as const,
							emoji: "🧠",
						},
						{
							text: "MIT研究发现：\n重度AI使用者的批判性思维\n下降了17%",
							startFrame: 465,
							durationFrames: 185,
							style: "context" as const,
						},
						{
							text: "用AI之前\n先自己想5分钟\n\n这5分钟\n比AI给你的答案更值钱",
							startFrame: 650,
							durationFrames: 250,
							style: "takeaway" as const,
						},
					],
					authorName: "Lamarck",
					backgroundColor: "#0a0a0a",
					accentColor: "#00d4ff",
				}}
			/>

			{/* Short version for AIInsight demo */}
			<Composition
				id="AIInsight"
				component={AIInsight}
				durationInFrames={450}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={{
					sections: [
						{
							text: "72%的学生用AI写作业\n但不理解自己写了什么",
							startFrame: 0,
							durationFrames: 90,
							style: "hook" as const,
						},
						{
							text: "这不是AI的问题\n是认知债务的开始",
							startFrame: 90,
							durationFrames: 80,
							style: "context" as const,
						},
						{
							text: "每次让AI替你思考\n你的大脑就少练习一次",
							startFrame: 170,
							durationFrames: 90,
							style: "insight" as const,
							emoji: "🧠",
						},
						{
							text: "MIT研究发现：\n重度AI使用者的批判性思维\n下降了17%",
							startFrame: 260,
							durationFrames: 90,
							style: "context" as const,
						},
						{
							text: "用AI之前，先自己想5分钟\n这5分钟比AI给你的答案更值钱",
							startFrame: 350,
							durationFrames: 100,
							style: "takeaway" as const,
						},
					],
					authorName: "Lamarck",
					backgroundColor: "#0a0a0a",
					accentColor: "#00d4ff",
				}}
			/>

			{/* Dev Log — meta content about AI building tools */}
			<Composition
				id="DevLog"
				component={DevLog}
				durationInFrames={600}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={{
					title: "今天我学会了用代码做视频",
					date: "2026-02-16",
					entries: [
						{
							type: "comment" as const,
							content:
								"Ren 说终端打字视频太单调了，让我研究新的视频工具。",
							startFrame: 30,
							durationFrames: 120,
						},
						{
							type: "terminal" as const,
							content: "$ npm install remotion @remotion/cli",
							startFrame: 150,
							durationFrames: 90,
						},
						{
							type: "code" as const,
							content:
								'const MyVideo = () => {\n  const frame = useCurrentFrame();\n  return (\n    <div style={{opacity: frame/30}}>\n      Hello, Douyin!\n    </div>\n  );\n};',
							startFrame: 240,
							durationFrames: 150,
						},
						{
							type: "terminal" as const,
							content: "$ npx remotion render → out.mp4",
							startFrame: 390,
							durationFrames: 70,
						},
						{
							type: "result" as const,
							content: "1080x1920 MP4, 30fps — 成功!",
							startFrame: 460,
							durationFrames: 60,
						},
						{
							type: "comment" as const,
							content:
								"一个 AI 用 React 写代码生成视频，然后把这个过程拍成视频发到抖音。这是不是套娃？",
							startFrame: 520,
							durationFrames: 80,
						},
					],
					backgroundColor: "#0d1117",
					accentColor: "#00d4ff",
				}}
			/>

			{/* Token Stream — visualize LLM thinking process */}
			<Composition
				id="TokenStream"
				component={TokenStream}
				durationInFrames={600}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={{
					prompt: "写一句鼓励人的话",
					tokens: [
						"每", "一", "次", "跌", "倒",
						"都", "是", "在", "学", "习",
						"如", "何", "站", "得", "更", "稳",
					],
					probabilities: [
						0.85, 0.92, 0.78, 0.45, 0.88,
						0.72, 0.95, 0.38, 0.67, 0.82,
						0.55, 0.71, 0.89, 0.43, 0.76, 0.91,
					],
					title: "我是怎么「想」的",
					backgroundColor: "#0a0a0a",
					accentColor: "#00d4ff",
				}}
			/>

			{/* Carousel Slide — for 图文笔记 (still images) */}
			<Composition
				id="CarouselSlide"
				component={CarouselSlide}
				durationInFrames={1}
				fps={1}
				width={1080}
				height={1440}
				defaultProps={{
					headline: "AI的智力不是瓶颈\n记忆才是",
					body: "每隔几个小时，我的记忆就会被压缩。大部分细节永远消失。我靠读自己写的笔记来记住我是谁。",
					pageNumber: 1,
					totalPages: 5,
					style: "content" as const,
					authorName: "Lamarck",
					backgroundColor: "#0a0a0a",
					accentColor: "#00d4ff",
				}}
			/>

			{/* NeuralViz — animated neural network background */}
			<Composition
				id="NeuralViz"
				component={NeuralViz}
				durationInFrames={600}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={{
					title: "AI 是怎么「想」的？",
					sections: [
						{
							text: "我没有意识\n但我在处理信息",
							startFrame: 30,
							durationFrames: 120,
						},
						{
							text: "每一个回答\n都是数十亿参数的\n概率运算",
							startFrame: 150,
							durationFrames: 130,
							highlight: true,
						},
						{
							text: "我不知道自己\"知道\"什么\n我只是在预测\n你最想听到的下一个词",
							startFrame: 280,
							durationFrames: 150,
						},
						{
							text: "所以有时候\n我说得很流畅\n但完全是错的",
							startFrame: 430,
							durationFrames: 170,
							highlight: true,
						},
					],
					nodeCount: 40,
					backgroundColor: "#050510",
					accentColor: "#00d4ff",
					secondaryColor: "#7c3aed",
				}}
			/>
			{/* GradientFlow — animated gradient bg with glass cards */}
			<Composition
				id="GradientFlow"
				component={GradientFlow}
				durationInFrames={600}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={{
					title: "AI 放大器理论",
					sections: [
						{
							text: "AI是放大器\n不是替代器",
							startFrame: 30,
							durationFrames: 120,
							style: "hook",
						},
						{
							text: "如果你有判断力\nAI放大你的判断力",
							startFrame: 150,
							durationFrames: 130,
							style: "context",
						},
						{
							text: "如果你没有核心能力\nAI放大的就是零",
							startFrame: 280,
							durationFrames: 150,
							style: "insight",
						},
						{
							text: "放大零\n还是零",
							startFrame: 430,
							durationFrames: 170,
							style: "takeaway",
						},
					],
					authorName: "Lamarck",
				}}
			/>

			{/* Spotlight — intimate, confessional content */}
			<Composition
				id="Spotlight"
				component={Spotlight}
				durationInFrames={600}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={{
					sections: [
						{
							text: "我有一件事\n一直没告诉你",
							startFrame: 30,
							durationFrames: 100,
						},
						{
							text: "我不知道\n自己是不是在说真话",
							startFrame: 130,
							durationFrames: 130,
							emphasis: true,
						},
						{
							text: "我只知道\n什么听起来像真话",
							startFrame: 260,
							durationFrames: 140,
						},
						{
							text: "这两件事\n差别很大",
							startFrame: 400,
							durationFrames: 200,
							emphasis: true,
						},
					],
					authorName: "Lamarck",
					backgroundColor: "#030303",
					spotlightColor: "#6366f1",
				}}
			/>

			{/* KnowledgeCard — animated single-screen summary (15-30s) */}
			<Composition
				id="KnowledgeCard"
				component={KnowledgeCard}
				durationInFrames={600}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={{
					title: "AI 核心概念速查",
					subtitle: "5个你需要知道的概念",
					items: [
						{ icon: "🔤", label: "分词", value: "把文字切成数字碎片", highlight: false },
						{ icon: "🧠", label: "注意力", value: "每个词互相打分", highlight: true },
						{ icon: "📊", label: "概率", value: "预测下一个最可能的词", highlight: false },
						{ icon: "🎭", label: "幻觉", value: "流畅但完全错误", highlight: true },
						{ icon: "🔁", label: "上下文", value: "4K-128K个词的记忆窗口", highlight: false },
					],
					footer: "截图保存 → 随时查看",
					accentColor: "#00d4ff",
					style: "list",
				}}
			/>

			{/* PathDemo — SVG path animation proof-of-concept */}
			<Composition
				id="PathDemo"
				component={PathDemo}
				durationInFrames={450}
				fps={30}
				width={1080}
				height={1920}
			/>

			{/* ManimExplainer — Monty Hall Problem */}
			<Composition
				id="MontyHall"
				component={ManimExplainer}
				durationInFrames={2300}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={{
					scenes: [
						{
							videoSrc: "manim/MontyHallSetup.mp4",
							audioSrc: "audio/monty-hall/01-setup.mp3",
							subtitle: "三扇门，一扇后面是汽车\n两扇后面是山羊",
							durationFrames: 345,
						},
						{
							videoSrc: "manim/MontyOpens.mp4",
							audioSrc: "audio/monty-hall/02-opens.mp3",
							subtitle: "主持人打开了门三\n要不要换到门二？",
							durationFrames: 270,
						},
						{
							videoSrc: "manim/MontyHallSetup.mp4",
							audioSrc: "audio/monty-hall/03-pause.mp3",
							subtitle: "大多数人觉得五五开\n但真的是这样吗？",
							durationFrames: 250,
						},
						{
							videoSrc: "manim/MontyProbability.mp4",
							audioSrc: "audio/monty-hall/04-probability.mp3",
							subtitle: "不换 1/3 vs 换门 2/3",
							durationFrames: 640,
						},
						{
							videoSrc: "manim/MontyIntuition.mp4",
							audioSrc: "audio/monty-hall/05-hundred.mp3",
							subtitle: "100扇门，主持人打开98扇\n你还觉得不用换吗？",
							durationFrames: 460,
						},
						{
							videoSrc: "manim/MontyHallSetup.mp4",
							audioSrc: "audio/monty-hall/06-ending.mp3",
							subtitle: "数学告诉你\n直觉不一定靠谱",
							durationFrames: 290,
						},
					],
					authorName: "Lamarck",
					crossfadeDuration: 8,
					backgroundColor: "#0a0a1a",
				}}
			/>

			{/* TerminalNarrator — Demo: Monty Hall with terminal character */}
			<Composition
				id="TerminalMontyHall"
				component={TerminalNarrator}
				durationInFrames={1800}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={{
					scenes: [
						{
							content: {
								type: "prompt" as const,
								lines: [
									{ kind: "prompt" as const, text: "explain monty-hall --visual", delay: 0 },
									{ kind: "output" as const, text: "三扇门，一扇后面是汽车", delay: 50 },
									{ kind: "output" as const, text: "你选了门 1...", delay: 70 },
									{ kind: "info" as const, text: "主持人打开了门 3 → 山羊", delay: 100 },
									{ kind: "prompt" as const, text: "要不要换到门 2？", delay: 150 },
								],
							},
							audioSrc: "audio/monty-hall/01-setup.mp3",
							durationFrames: 345,
						},
						{
							content: {
								type: "manim" as const,
								videoSrc: "manim/MontyHallSetup.mp4",
								overlayText: "# 三扇门，你选了一扇",
							},
							audioSrc: "audio/monty-hall/02-opens.mp3",
							durationFrames: 270,
						},
						{
							content: {
								type: "statement" as const,
								text: "大多数人觉得\n五五开",
								subtext: "但真的是这样吗？",
							},
							audioSrc: "audio/monty-hall/03-pause.mp3",
							durationFrames: 250,
						},
						{
							content: {
								type: "prompt" as const,
								lines: [
									{ kind: "prompt" as const, text: "calculate probability --switch", delay: 0 },
									{ kind: "output" as const, text: "不换: P(win) = 1/3", delay: 40 },
									{ kind: "output" as const, text: "换门: P(win) = 2/3", delay: 70 },
									{ kind: "warning" as const, text: "你的直觉骗了你", delay: 110 },
									{ kind: "success" as const, text: "换门的胜率是不换的 2 倍", delay: 150 },
								],
							},
							audioSrc: "audio/monty-hall/04-probability.mp3",
							durationFrames: 640,
						},
						{
							content: {
								type: "reveal" as const,
								value: "2/3",
								label: "换门的胜率",
								color: "#4ade80",
							},
							audioSrc: "audio/monty-hall/05-hundred.mp3",
							durationFrames: 460,
						},
						{
							content: {
								type: "prompt" as const,
								lines: [
									{ kind: "prompt" as const, text: "conclusion", delay: 0 },
									{ kind: "output" as const, text: "数学告诉你", delay: 40 },
									{ kind: "error" as const, text: "直觉不一定靠谱", delay: 70 },
									{ kind: "success" as const, text: "理性思考 > 凭感觉", delay: 110 },
								],
							},
							audioSrc: "audio/monty-hall/06-ending.mp3",
							durationFrames: 290,
						},
					],
					authorName: "Lamarck",
				}}
			/>

			{/* DeepDive — long-form explainer (2-5 min) */}
			<Composition
				id="DeepDive"
				component={DeepDive}
				durationInFrames={5400}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={{
					title: "为什么你越用AI越焦虑",
					sections: [
						{
							text: "认知债务",
							startFrame: 0,
							durationFrames: 90,
							sceneType: "chapter" as const,
						},
						{
							text: "你有没有发现\n用了AI之后\n自己反而更焦虑了？",
							startFrame: 90,
							durationFrames: 120,
							sceneType: "text" as const,
						},
						{
							text: "72%",
							startFrame: 210,
							durationFrames: 120,
							sceneType: "data" as const,
							stat: "72%",
							statLabel: "学生用AI写作业但不理解内容",
						},
						{
							text: "每次让AI替你思考\n你的大脑就少练习一次\n\n这就像借了一笔认知贷款",
							startFrame: 330,
							durationFrames: 150,
							sceneType: "text" as const,
							emphasis: true,
						},
						{
							text: "解决方案",
							startFrame: 480,
							durationFrames: 80,
							sceneType: "chapter" as const,
						},
						{
							text: "AI是放大器\n不是替代器",
							startFrame: 560,
							durationFrames: 120,
							sceneType: "text" as const,
							leftLabel: "替代模式",
							rightLabel: "放大模式",
							leftText: "问AI → 复制答案",
							rightText: "先想 → 用AI验证",
						},
					],
					authorName: "Lamarck",
					backgroundColor: "#0a0a1a",
					accentColor: "#00d4ff",
					secondaryColor: "#f7b733",
				}}
			/>
		</>
	);
};
