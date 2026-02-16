// Generated on 2026-02-16T16:50:02.325Z by pi-monorepo@0.0.3
// Server: understand
// Source: /home/lamarck/pi-mono/config/mcporter.json
// Transport: STDIO npx tsx /home/lamarck/pi-mono/lamarck/projects/understand/mcp-server.ts

import type { CallResult } from 'mcporter';

export interface UnderstandTools {
  /**
   * Generate comprehension questions for a code file. Tests design decisions, failure modes, and
   * architectural understanding — not just syntax. Requires OPENROUTER_API_KEY.
   *
   * @param code The code to generate questions for
   * @param filename Filename for context (e.g., 'rate-limiter.ts')
   * @param count? Number of questions (default: 3)
   */
  understand_quiz(code: string, filename: string, count?: number): Promise<CallResult>;

  /**
   * Evaluate a developer's answer to a comprehension question. Returns score (0-10), feedback, and
   * missed concepts. Requires OPENROUTER_API_KEY.
   *
   * @param question The comprehension question
   * @param key_concepts Key concepts the answer should cover
   * @param answer The developer's answer
   * @param code The relevant code
   * @param filename? Filename for score tracking
   */
  understand_evaluate(question: string, key_concepts: string[], answer: string, code: string, filename?: string): Promise<CallResult>;

  /**
   * Get comprehension score history for tracked files. Shows per-file scores, trends, and files below a
   * configurable threshold.
   *
   * @param directory? Project directory to check (default: current directory)
   * @param threshold? Score threshold for 'at risk' files (default: 6)
   */
  understand_score(directory?: string, threshold?: number): Promise<CallResult>;
}

