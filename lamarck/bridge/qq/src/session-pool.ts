/**
 * AgentSession pool — manages one session per QQ user_id.
 *
 * Uses createAgentSession() from pi-coding-agent SDK.
 * Sessions are kept in memory until reset or process restart.
 */

import { createAgentSession, type AgentSession } from "@mariozechner/pi-coding-agent";

export interface SessionPoolOptions {
	/** Working directory for all sessions */
	cwd: string;
}

export class SessionPool {
	private sessions = new Map<string, AgentSession>();
	private options: SessionPoolOptions;

	constructor(options: SessionPoolOptions) {
		this.options = options;
	}

	/** Get existing session or create a new one */
	async getOrCreate(userId: string): Promise<AgentSession> {
		if (!this.sessions.has(userId)) {
			console.log(`[SessionPool] Creating new session for user ${userId}`);
			const { session } = await createAgentSession({
				cwd: this.options.cwd,
			});
			this.sessions.set(userId, session);
		}
		return this.sessions.get(userId)!;
	}

	/** Reset (destroy) session for a user */
	reset(userId: string): boolean {
		if (this.sessions.has(userId)) {
			console.log(`[SessionPool] Resetting session for user ${userId}`);
			this.sessions.delete(userId);
			return true;
		}
		return false;
	}

	/** Check if session exists */
	has(userId: string): boolean {
		return this.sessions.has(userId);
	}
}
