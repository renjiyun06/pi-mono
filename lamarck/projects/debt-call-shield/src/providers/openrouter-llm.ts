import type {
  LLMProvider,
  CallIntent,
  ConversationTurn,
} from "../pipeline/types.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const INTENT_SYSTEM_PROMPT = `You are a call intent classifier. Given a transcript of what a caller said, classify the intent into one of:
- debt_collection: The caller is from a debt collection agency, bank, or loan company trying to collect payment
- scam: The caller appears to be running a scam or fraud
- normal: A normal, legitimate call
- unknown: Cannot determine

Respond with ONLY the intent label, nothing else.`;

const STRATEGY_PROMPTS: Record<CallIntent, string> = {
  debt_collection: `你是一个智能语音助手，正在代替机主接听催收电话。你的目标是：
1. 保持礼貌但坚定
2. 不透露机主的个人信息（住址、工作单位、家人信息等）
3. 表示会转告机主，请对方留下联系方式
4. 如果对方态度恶劣或威胁，冷静地提醒对方注意文明用语
5. 不做任何还款承诺
6. 回复要简短，像正常电话对话一样，每次1-2句话`,

  scam: `你是一个智能语音助手，正在代替机主接听疑似诈骗电话。你的目标是：
1. 不透露任何个人信息
2. 不按对方指示操作任何事项
3. 礼貌地询问对方身份和来意
4. 尽量拖延时间
5. 回复简短自然`,

  normal: `你是一个智能语音助手，正在代替机主接听电话。机主暂时不方便接听。
1. 礼貌告知对方机主不在
2. 询问是否需要留言
3. 回复简短自然`,

  unknown: `你是一个智能语音助手，正在代替机主接听电话。机主暂时不方便接听。
1. 先了解对方身份和来意
2. 礼貌应对
3. 回复简短自然`,
};

export class OpenRouterLLM implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = "deepseek/deepseek-chat") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async classifyIntent(transcript: string): Promise<CallIntent> {
    const messages: ChatMessage[] = [
      { role: "system", content: INTENT_SYSTEM_PROMPT },
      { role: "user", content: transcript },
    ];

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: 20,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      console.error(
        `[openrouter-llm] Intent classification failed: ${response.status}`
      );
      return "unknown";
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const result = data.choices[0]?.message?.content?.trim().toLowerCase();

    const validIntents: CallIntent[] = [
      "debt_collection",
      "scam",
      "normal",
      "unknown",
    ];
    if (validIntents.includes(result as CallIntent)) {
      return result as CallIntent;
    }
    return "unknown";
  }

  async *generateResponse(
    transcript: string,
    intent: CallIntent,
    conversationHistory: ConversationTurn[]
  ): AsyncIterable<string> {
    const systemPrompt = STRATEGY_PROMPTS[intent];

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history (last 10 turns for context window efficiency)
    const recentHistory = conversationHistory.slice(-10);
    for (const turn of recentHistory) {
      messages.push({
        role: turn.role === "caller" ? "user" : "assistant",
        content: turn.text,
      });
    }

    // Add current transcript
    messages.push({ role: "user", content: transcript });

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: 200,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      console.error(
        `[openrouter-llm] Response generation failed: ${response.status}`
      );
      yield "抱歉，我暂时无法回应，请稍后再拨。";
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") return;

          try {
            const parsed = JSON.parse(data) as {
              choices: Array<{ delta: { content?: string } }>;
            };
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // Skip malformed SSE chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
