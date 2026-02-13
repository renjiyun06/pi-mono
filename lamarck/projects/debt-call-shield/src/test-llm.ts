/**
 * Quick test script for the OpenRouter LLM provider.
 * Tests intent classification and response generation.
 *
 * Usage: OPENROUTER_API_KEY=xxx npx tsx src/test-llm.ts
 */
import { OpenRouterLLM } from "./providers/openrouter-llm.js";

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.error("Set OPENROUTER_API_KEY environment variable");
  process.exit(1);
}

const llm = new OpenRouterLLM(apiKey, "deepseek/deepseek-chat");

async function testIntentClassification() {
  console.log("=== Intent Classification ===\n");

  const testCases = [
    "你好，我是XX银行信用卡中心的，请问是张先生吗？您有一笔逾期还款需要处理。",
    "恭喜您获得了我们公司的大奖，请提供您的银行卡号以便转账。",
    "你好，我是快递员，有你一个包裹，请问你在家吗？",
    "喂，你的贷款已经逾期三个月了，如果再不还款我们就要起诉你了。",
  ];

  for (const text of testCases) {
    const intent = await llm.classifyIntent(text);
    console.log(`Input: ${text}`);
    console.log(`Intent: ${intent}\n`);
  }
}

async function testResponseGeneration() {
  console.log("=== Response Generation ===\n");

  const scenarios = [
    {
      transcript: "你好，我是XX银行信用卡中心的催收部门，请问是张先生吗？",
      intent: "debt_collection" as const,
      history: [],
    },
    {
      transcript: "你必须今天就还款，否则我们会通知你的家人和单位！",
      intent: "debt_collection" as const,
      history: [
        {
          role: "caller" as const,
          text: "我是XX银行催收部门的",
          timestamp: Date.now() - 30000,
        },
        {
          role: "agent" as const,
          text: "您好，机主目前不方便接听，请问有什么事情我可以帮您转达？",
          timestamp: Date.now() - 25000,
        },
      ],
    },
    {
      transcript: "恭喜您中了一等奖50万元，请提供您的银行卡号。",
      intent: "scam" as const,
      history: [],
    },
  ];

  for (const scenario of scenarios) {
    console.log(`Scenario: ${scenario.intent}`);
    console.log(`Caller: ${scenario.transcript}`);
    process.stdout.write("Agent: ");

    for await (const chunk of llm.generateResponse(
      scenario.transcript,
      scenario.intent,
      scenario.history
    )) {
      process.stdout.write(chunk);
    }
    console.log("\n");
  }
}

async function main() {
  await testIntentClassification();
  await testResponseGeneration();
}

main().catch(console.error);
