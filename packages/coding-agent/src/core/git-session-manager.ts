import type { ImageContent, Message, TextContent } from "@mariozechner/pi-ai";
import type { BashExecutionMessage, CustomMessage } from "./messages.js";
import {
	type NewSessionOptions,
	type SessionContext,
	type SessionEntry,
	type SessionHeader,
	type SessionInfo,
	type SessionListProgress,
	SessionManager,
	type SessionTreeNode,
} from "./session-manager.js";

/**
 * Git-based session manager that delegates to a SessionManager instance.
 *
 * All methods proxy to the underlying SessionManager. Methods will be
 * progressively replaced with Git-native implementations.
 */
export class GitSessionManager {
	private delegate: SessionManager;

	private constructor(delegate: SessionManager) {
		this.delegate = delegate;
	}

	// =========================================================================
	// Session lifecycle
	// =========================================================================

	setSessionFile(sessionFile: string): void {
		this.delegate.setSessionFile(sessionFile);
	}

	newSession(options?: NewSessionOptions): string | undefined {
		return this.delegate.newSession(options);
	}

	isPersisted(): boolean {
		return this.delegate.isPersisted();
	}

	// =========================================================================
	// Getters
	// =========================================================================

	getCwd(): string {
		return this.delegate.getCwd();
	}

	getSessionDir(): string {
		return this.delegate.getSessionDir();
	}

	getSessionId(): string {
		return this.delegate.getSessionId();
	}

	getSessionFile(): string | undefined {
		return this.delegate.getSessionFile();
	}

	getSessionName(): string | undefined {
		return this.delegate.getSessionName();
	}

	getLeafId(): string | null {
		return this.delegate.getLeafId();
	}

	getLeafEntry(): SessionEntry | undefined {
		return this.delegate.getLeafEntry();
	}

	getEntry(id: string): SessionEntry | undefined {
		return this.delegate.getEntry(id);
	}

	getChildren(parentId: string): SessionEntry[] {
		return this.delegate.getChildren(parentId);
	}

	getLabel(id: string): string | undefined {
		return this.delegate.getLabel(id);
	}

	getHeader(): SessionHeader | null {
		return this.delegate.getHeader();
	}

	getEntries(): SessionEntry[] {
		return this.delegate.getEntries();
	}

	// =========================================================================
	// Append methods
	// =========================================================================

	appendMessage(message: Message | CustomMessage | BashExecutionMessage): string {
		return this.delegate.appendMessage(message);
	}

	appendThinkingLevelChange(thinkingLevel: string): string {
		return this.delegate.appendThinkingLevelChange(thinkingLevel);
	}

	appendModelChange(provider: string, modelId: string): string {
		return this.delegate.appendModelChange(provider, modelId);
	}

	appendCompaction<T = unknown>(
		summary: string,
		firstKeptEntryId: string,
		tokensBefore: number,
		details?: T,
		fromHook?: boolean,
	): string {
		return this.delegate.appendCompaction(summary, firstKeptEntryId, tokensBefore, details, fromHook);
	}

	appendCustomEntry(customType: string, data?: unknown): string {
		return this.delegate.appendCustomEntry(customType, data);
	}

	appendSessionInfo(name: string): string {
		return this.delegate.appendSessionInfo(name);
	}

	appendCustomMessageEntry<T = unknown>(
		customType: string,
		content: string | (TextContent | ImageContent)[],
		display: boolean,
		details?: T,
	): string {
		return this.delegate.appendCustomMessageEntry(customType, content, display, details);
	}

	appendLabelChange(targetId: string, label: string | undefined): string {
		return this.delegate.appendLabelChange(targetId, label);
	}

	// =========================================================================
	// Tree traversal
	// =========================================================================

	getBranch(fromId?: string): SessionEntry[] {
		return this.delegate.getBranch(fromId);
	}

	buildSessionContext(): SessionContext {
		return this.delegate.buildSessionContext();
	}

	getTree(): SessionTreeNode[] {
		return this.delegate.getTree();
	}

	// =========================================================================
	// Branching
	// =========================================================================

	branch(branchFromId: string): void {
		this.delegate.branch(branchFromId);
	}

	resetLeaf(): void {
		this.delegate.resetLeaf();
	}

	branchWithSummary(branchFromId: string | null, summary: string, details?: unknown, fromHook?: boolean): string {
		return this.delegate.branchWithSummary(branchFromId, summary, details, fromHook);
	}

	createBranchedSession(leafId: string): string | undefined {
		return this.delegate.createBranchedSession(leafId);
	}

	// =========================================================================
	// Static factory methods
	// =========================================================================

	static create(cwd: string, sessionDir?: string): GitSessionManager {
		return new GitSessionManager(SessionManager.create(cwd, sessionDir));
	}

	static open(path: string, sessionDir?: string): GitSessionManager {
		return new GitSessionManager(SessionManager.open(path, sessionDir));
	}

	static continueRecent(cwd: string, sessionDir?: string): GitSessionManager {
		return new GitSessionManager(SessionManager.continueRecent(cwd, sessionDir));
	}

	static inMemory(cwd: string = process.cwd()): GitSessionManager {
		return new GitSessionManager(SessionManager.inMemory(cwd));
	}

	static forkFrom(sourcePath: string, targetCwd: string, sessionDir?: string): GitSessionManager {
		return new GitSessionManager(SessionManager.forkFrom(sourcePath, targetCwd, sessionDir));
	}

	static async list(cwd: string, sessionDir?: string, onProgress?: SessionListProgress): Promise<SessionInfo[]> {
		return SessionManager.list(cwd, sessionDir, onProgress);
	}

	static async listAll(onProgress?: SessionListProgress): Promise<SessionInfo[]> {
		return SessionManager.listAll(onProgress);
	}
}
