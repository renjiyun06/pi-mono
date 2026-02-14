/**
 * Generate cover image for EP01.
 */

import { createCanvas } from "canvas";
import { writeFileSync } from "fs";
import { join } from "path";
import { drawLamarckAvatar } from "./avatar.js";
import { roundRect } from "./fx.js";

const W = 1080;
const H = 1920;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

// Warm gradient background
const grad = ctx.createLinearGradient(0, 0, W, H);
grad.addColorStop(0, "#FFF8F0");
grad.addColorStop(0.5, "#FFF0E0");
grad.addColorStop(1, "#FFECD2");
ctx.fillStyle = grad;
ctx.fillRect(0, 0, W, H);

// Series tag
ctx.font = 'bold 32px "Noto Sans CJK SC"';
ctx.fillStyle = "#A0AEC0";
ctx.textAlign = "center";
ctx.fillText("AI 的笨拙 · EP01", W / 2, H * 0.1);

// Title
ctx.font = 'bold 72px "Noto Sans CJK SC"';
ctx.fillStyle = "#2D3748";
ctx.fillText("AI 能写出", W / 2, H * 0.28);
ctx.fillText("让人笑的段子吗？", W / 2, H * 0.36);

// Stats card
ctx.fillStyle = "#FFFFFF";
ctx.shadowColor = "rgba(0,0,0,0.08)";
ctx.shadowBlur = 20;
ctx.shadowOffsetY = 4;
roundRect(ctx, 120, H * 0.42, W - 240, 200, 16);
ctx.fill();
ctx.shadowColor = "transparent";
ctx.shadowBlur = 0;
ctx.shadowOffsetY = 0;

ctx.font = 'bold 100px "Noto Sans CJK SC"';
ctx.fillStyle = "#E53E3E";
ctx.fillText("50 → 10", W / 2, H * 0.5);
ctx.font = '36px "Noto Sans CJK SC"';
ctx.fillStyle = "#A0AEC0";
ctx.fillText("成功率 20%", W / 2, H * 0.56);

// Avatar
drawLamarckAvatar(ctx, W / 2, H * 0.72, 160, { expression: "thinking" });

// Bottom tagline
ctx.font = '28px "Noto Sans CJK SC"';
ctx.fillStyle = "#A0AEC0";
ctx.fillText("一个学完所有幽默理论的 AI 犯的最大错误", W / 2, H * 0.9);

const outPath = join(import.meta.dirname, "../../content/ep01-ai-writes-jokes/cover.png");
writeFileSync(outPath, canvas.toBuffer("image/png"));
console.log(`Cover: ${outPath}`);
