/**
 * Stub LLM provider for offline testing.
 * Returns canned responses based on intent, no API key needed.
 */
import type { LLMProvider, CallIntent, ConversationTurn } from "../pipeline/types.js";

const RESPONSES: Record<CallIntent, string[]> = {
  debt_collection: [
    "您好，我现在不太方便接听电话。请问您是哪个机构的？",
    "好的，我记下了。我会尽快处理这件事。请问还有别的事吗？",
    "我理解您的催促，但我需要时间核实账单。请发送正式书面通知到我的邮箱。",
    "谢谢您的来电。我会在核实后尽快回复。再见。",
  ],
  scam: [
    "请问您是哪个机构的？可以提供您的工号和联系方式吗？",
    "我不确定这件事的真实性。我会通过官方渠道核实。",
    "请不要再打这个电话了。我已经记录了通话内容。再见。",
  ],
  normal: [
    "您好，请问有什么事？",
    "好的，我明白了。还有别的事吗？",
    "好的，谢谢您的来电。再见。",
  ],
  unknown: [
    "您好，请问您找谁？",
    "抱歉，我没太听清。能再说一遍吗？",
    "好的，我知道了。请问还有别的事吗？",
  ],
};

export class StubLLM implements LLMProvider {
  private responseIndex: Record<CallIntent, number> = {
    debt_collection: 0,
    scam: 0,
    normal: 0,
    unknown: 0,
  };

  async *generateResponse(
    _transcript: string,
    intent: CallIntent,
    _history: ConversationTurn[],
  ): AsyncIterable<string> {
    const responses = RESPONSES[intent];
    const idx = this.responseIndex[intent] % responses.length;
    this.responseIndex[intent]++;

    const text = responses[idx];
    // Simulate streaming: yield sentence in chunks
    const chunks = text.match(/.{1,10}/g) || [text];
    for (const chunk of chunks) {
      await new Promise((r) => setTimeout(r, 50)); // simulate latency
      yield chunk;
    }
  }

  async classifyIntent(transcript: string): Promise<CallIntent> {
    const lower = transcript.toLowerCase();
    if (lower.includes("还款") || lower.includes("欠款") || lower.includes("逾期") || lower.includes("催收")) {
      return "debt_collection";
    }
    if (lower.includes("公安") || lower.includes("法院") || lower.includes("冻结") || lower.includes("转账")) {
      return "scam";
    }
    if (lower.includes("你好") || lower.includes("请问")) {
      return "normal";
    }
    return "unknown";
  }
}
