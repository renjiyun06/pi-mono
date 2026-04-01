import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { ImageContent, Message, TextContent } from "@mariozechner/pi-ai";
import { execSync } from "child_process";
import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { readdir, stat } from "fs/promises";
import { join } from "path";
import type { BashExecutionMessage, CustomMessage } from "./messages.js";
import {
	type BranchSummaryEntry,
	buildSessionContext,
	type CompactionEntry,
	CURRENT_SESSION_VERSION,
	type CustomEntry,
	type CustomMessageEntry,
	type LabelEntry,
	type ModelChangeEntry,
	type NewSessionOptions,
	type SessionContext,
	type SessionEntry,
	type SessionHeader,
	type SessionInfo,
	type SessionInfoEntry,
	type SessionListProgress,
	type SessionMessageEntry,
	type SessionTreeNode,
	type ThinkingLevelChangeEntry,
} from "./session-manager.js";

/**
 * Git-based session manager.
 *
 * Uses a Git repository for session persistence. Each message is stored as
 * an empty commit (git commit --allow-empty). The commit message contains
 * the conversation content. Structured metadata is stored in git notes
 * under a custom ref (refs/notes/session-meta).
 */
export class GitSessionManager {
	private sessionId: string = "";
	private cwd: string;
	private sessionDir: string;
	private gitRepoPath: string | undefined;
	private gitInitialized: boolean = false;

	// In-memory state
	private entries: SessionEntry[] = [];
	private byId: Map<string, SessionEntry> = new Map();
	private leafId: string | null = null;
	private thinkingLevel: string = "off";

	private constructor(cwd: string, sessionDir: string) {
		this.cwd = cwd;
		this.sessionDir = sessionDir;
		this.initSession();
	}

	private initSession(options?: NewSessionOptions): void {
		this.sessionId = options?.id ?? randomUUID();
		this.entries = [];
		this.byId.clear();
		this.leafId = null;

		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		this.gitRepoPath = join(this.sessionDir, `${timestamp}_${this.sessionId}`);
	}

	// =========================================================================
	// Git operations
	// =========================================================================

	private git(command: string): string {
		if (!this.gitRepoPath) throw new Error("Git repo path not set");
		try {
			return execSync(`git ${command}`, {
				cwd: this.gitRepoPath,
				encoding: "utf8",
				stdio: ["pipe", "pipe", "pipe"],
				maxBuffer: 500 * 1024 * 1024,
			}).trim();
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(`Git command failed: git ${command}\n${message}`);
		}
	}

	private ensureGitRepo(): void {
		if (this.gitInitialized) return;
		if (!this.gitRepoPath) throw new Error("Git repo path not set");

		if (!existsSync(this.sessionDir)) {
			mkdirSync(this.sessionDir, { recursive: true });
		}
		mkdirSync(this.gitRepoPath, { recursive: true });
		this.git("init -b main");
		this.git('config user.email "pi@session"');
		this.git('config user.name "pi"');
		this.gitInitialized = true;
	}

	private commitEntry(entry: SessionEntry): void {
		const commitMessage = this.formatCommitMessage(entry);
		const metaJson = JSON.stringify(entry);

		// Commit with message via stdin to avoid shell escaping issues
		this.gitWithStdin("commit --allow-empty -F -", commitMessage);

		// Get the commit hash
		const commitHash = this.git("rev-parse HEAD");

		// Add structured metadata as git note via stdin
		this.gitWithStdin(`notes --ref=session-meta add -F - ${commitHash}`, metaJson);
	}

	private flushAllEntries(): void {
		for (const entry of this.entries) {
			this.commitEntry(entry);
		}
	}

	private formatCommitMessage(entry: SessionEntry): string {
		if (entry.type === "message") {
			const msg = (entry as SessionMessageEntry).message;
			if ("role" in msg) {
				const role = (msg as Message).role;
				const content = (msg as Message).content;
				let text: string;
				if (typeof content === "string") {
					text = content;
				} else if (Array.isArray(content)) {
					const parts: string[] = [];
					for (const c of content as any[]) {
						if (c.type === "text") {
							parts.push(c.text);
						} else if (c.type === "toolCall") {
							const args = c.arguments ? JSON.stringify(c.arguments) : "";
							parts.push(`[tool: ${c.name}] [call: ${c.id}] ${args}`);
						}
					}
					if (parts.length > 0 && parts[0].startsWith("[tool:")) {
						// Tool calls without preceding text: put each on its own line after role
						text = `\n${parts.join("\n")}`;
					} else {
						text = parts.join("\n");
					}
				} else {
					text = String(content);
				}
				// Handle toolResult specially to show toolName and callId
				if (role === "toolResult") {
					const tr = msg as any;
					return `toolResult[${tr.toolName}] [call: ${tr.toolCallId}]: ${text}`;
				}
				return `${role}: ${text}`;
			}
			return `message: ${JSON.stringify(msg)}`;
		}
		if (entry.type === "thinking_level_change") {
			return `[thinking_level_change] ${(entry as ThinkingLevelChangeEntry).thinkingLevel}`;
		}
		if (entry.type === "model_change") {
			const mc = entry as ModelChangeEntry;
			return `[model_change] ${mc.provider}/${mc.modelId}`;
		}
		if (entry.type === "session_info") {
			const si = entry as SessionInfoEntry;
			return `[session_info] ${si.name || ""}`;
		}
		if (entry.type === "compaction") {
			const comp = entry as CompactionEntry;
			return `[compaction] ${comp.summary}`;
		}
		if (entry.type === "branch_summary") {
			const bs = entry as BranchSummaryEntry;
			return `[branch_summary] ${bs.summary}`;
		}
		if (entry.type === "custom_message") {
			const cm = entry as CustomMessageEntry;
			const text = typeof cm.content === "string" ? cm.content : JSON.stringify(cm.content);
			return `[custom_message:${cm.customType}] ${text}`;
		}
		if (entry.type === "custom") {
			const ce = entry as CustomEntry;
			return `[custom:${ce.customType}]`;
		}
		if (entry.type === "label") {
			const le = entry as LabelEntry;
			return `[label] ${le.targetId} ${le.label || "(cleared)"}`;
		}
		return `[${(entry as SessionEntry).type}]`;
	}

	private gitWithStdin(command: string, input: string): string {
		if (!this.gitRepoPath) throw new Error("Git repo path not set");
		try {
			return execSync(`git ${command}`, {
				cwd: this.gitRepoPath,
				encoding: "utf8",
				input,
				stdio: ["pipe", "pipe", "pipe"],
			}).trim();
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(`Git command failed: git ${command}\n${message}`);
		}
	}

	// =========================================================================
	// ID generation
	// =========================================================================

	private generateId(): string {
		for (let i = 0; i < 100; i++) {
			const id = randomUUID().slice(0, 8);
			if (!this.byId.has(id)) return id;
		}
		return randomUUID();
	}

	// =========================================================================
	// Entry management
	// =========================================================================

	private appendEntry(entry: SessionEntry): void {
		this.entries.push(entry);
		this.byId.set(entry.id, entry);
		this.leafId = entry.id;

		// Check if we should initialize git and flush
		if (!this.gitInitialized) {
			const hasAssistant = this.entries.some(
				(e) => e.type === "message" && (e as SessionMessageEntry).message.role === "assistant",
			);
			if (hasAssistant) {
				this.ensureGitRepo();
				this.flushAllEntries();
			}
		} else {
			this.commitEntry(entry);
		}
	}

	// =========================================================================
	// Session lifecycle
	// =========================================================================

	setSessionFile(sessionFile: string): void {
		// TODO: Load from Git repo
		this.gitRepoPath = sessionFile;
	}

	newSession(options?: NewSessionOptions): string | undefined {
		this.initSession(options);
		return this.gitRepoPath;
	}

	isPersisted(): boolean {
		return true;
	}

	// =========================================================================
	// Getters
	// =========================================================================

	getCwd(): string {
		return this.cwd;
	}

	getSessionDir(): string {
		return this.sessionDir;
	}

	getSessionId(): string {
		return this.sessionId;
	}

	getSessionFile(): string | undefined {
		return this.gitRepoPath;
	}

	getSessionName(): string | undefined {
		for (let i = this.entries.length - 1; i >= 0; i--) {
			const entry = this.entries[i];
			if (entry.type === "session_info") {
				return (entry as SessionInfoEntry).name?.trim() || undefined;
			}
		}
		return undefined;
	}

	getLeafId(): string | null {
		return this.leafId;
	}

	getLeafEntry(): SessionEntry | undefined {
		return this.leafId ? this.byId.get(this.leafId) : undefined;
	}

	getEntry(id: string): SessionEntry | undefined {
		return this.byId.get(id);
	}

	getChildren(parentId: string): SessionEntry[] {
		const children: SessionEntry[] = [];
		for (const entry of this.byId.values()) {
			if (entry.parentId === parentId) {
				children.push(entry);
			}
		}
		return children;
	}

	getLabel(_id: string): string | undefined {
		return undefined;
	}

	getHeader(): SessionHeader | null {
		return {
			type: "session",
			version: CURRENT_SESSION_VERSION,
			id: this.sessionId,
			timestamp: new Date().toISOString(),
			cwd: this.cwd,
		};
	}

	getEntries(): SessionEntry[] {
		return [...this.entries];
	}

	// =========================================================================
	// Append methods
	// =========================================================================

	appendMessage(message: Message | CustomMessage | BashExecutionMessage): string {
		const entry: SessionMessageEntry = {
			type: "message",
			id: this.generateId(),
			parentId: this.leafId,
			timestamp: new Date().toISOString(),
			message: message as AgentMessage,
		};
		this.appendEntry(entry);
		return entry.id;
	}

	appendThinkingLevelChange(thinkingLevel: string): string {
		this.thinkingLevel = thinkingLevel;
		const entry: ThinkingLevelChangeEntry = {
			type: "thinking_level_change",
			id: this.generateId(),
			parentId: this.leafId,
			timestamp: new Date().toISOString(),
			thinkingLevel,
		};
		this.appendEntry(entry);
		return entry.id;
	}

	appendModelChange(provider: string, modelId: string): string {
		const entry: ModelChangeEntry = {
			type: "model_change",
			id: this.generateId(),
			parentId: this.leafId,
			timestamp: new Date().toISOString(),
			provider,
			modelId,
		};
		this.appendEntry(entry);
		return entry.id;
	}

	appendCompaction<T = unknown>(
		summary: string,
		firstKeptEntryId: string,
		tokensBefore: number,
		details?: T,
		fromHook?: boolean,
	): string {
		const entry: CompactionEntry<T> = {
			type: "compaction",
			id: this.generateId(),
			parentId: this.leafId,
			timestamp: new Date().toISOString(),
			summary,
			firstKeptEntryId,
			tokensBefore,
			details,
			fromHook,
		};
		this.appendEntry(entry);
		return entry.id;
	}

	appendCustomEntry(customType: string, data?: unknown): string {
		const entry: CustomEntry = {
			type: "custom",
			customType,
			data,
			id: this.generateId(),
			parentId: this.leafId,
			timestamp: new Date().toISOString(),
		};
		this.appendEntry(entry);
		return entry.id;
	}

	appendSessionInfo(name: string): string {
		const entry: SessionInfoEntry = {
			type: "session_info",
			id: this.generateId(),
			parentId: this.leafId,
			timestamp: new Date().toISOString(),
			name: name.trim(),
		};
		this.appendEntry(entry);
		return entry.id;
	}

	appendCustomMessageEntry<T = unknown>(
		customType: string,
		content: string | (TextContent | ImageContent)[],
		display: boolean,
		details?: T,
	): string {
		const entry: CustomMessageEntry<T> = {
			type: "custom_message",
			customType,
			content,
			display,
			details,
			id: this.generateId(),
			parentId: this.leafId,
			timestamp: new Date().toISOString(),
		};
		this.appendEntry(entry);
		return entry.id;
	}

	appendLabelChange(targetId: string, label: string | undefined): string {
		const entry: LabelEntry = {
			type: "label",
			id: this.generateId(),
			parentId: this.leafId,
			timestamp: new Date().toISOString(),
			targetId,
			label,
		};
		this.appendEntry(entry);
		return entry.id;
	}

	// =========================================================================
	// Tree traversal
	// =========================================================================

	getBranch(fromId?: string): SessionEntry[] {
		const path: SessionEntry[] = [];
		const startId = fromId ?? this.leafId;
		let current = startId ? this.byId.get(startId) : undefined;
		while (current) {
			path.unshift(current);
			current = current.parentId ? this.byId.get(current.parentId) : undefined;
		}
		return path;
	}

	buildSessionContext(): SessionContext {
		return buildSessionContext(this.entries, this.leafId, this.byId);
	}

	getTree(): SessionTreeNode[] {
		const nodeMap = new Map<string, SessionTreeNode>();
		const roots: SessionTreeNode[] = [];

		for (const entry of this.entries) {
			nodeMap.set(entry.id, { entry, children: [] });
		}

		for (const entry of this.entries) {
			const node = nodeMap.get(entry.id)!;
			if (entry.parentId === null || entry.parentId === entry.id) {
				roots.push(node);
			} else {
				const parent = nodeMap.get(entry.parentId!);
				if (parent) {
					parent.children.push(node);
				} else {
					roots.push(node);
				}
			}
		}

		return roots;
	}

	// =========================================================================
	// Branching
	// =========================================================================

	/**
	 * @deprecated GitSessionManager does not support legacy branch navigation.
	 * Branch switching will be handled by the checkout tool.
	 * This method is used by: navigateTree, onBranchReenter, onBranchReturn — all to be replaced.
	 */
	branch(_branchFromId: string): void {
		throw new Error("GitSessionManager does not support branch().");
	}

	// =========================================================================
	// Git branch operations (checkout/merge)
	// =========================================================================

	/**
	 * Get the current Git branch name.
	 */
	getCurrentBranch(): string {
		return this.git("rev-parse --abbrev-ref HEAD");
	}

	/**
	 * Create a new Git branch from the current position and switch to it.
	 */
	gitCreateBranch(branchId: string): void {
		this.git(`checkout -b ${branchId}`);
	}

	/**
	 * Switch to an existing Git branch.
	 */
	gitCheckoutBranch(branchId: string): void {
		this.git(`checkout ${branchId}`);
	}

	/**
	 * Perform a merge --no-ff from sourceBranch into the current branch.
	 */
	gitMergeNoFf(sourceBranch: string, message: string): void {
		this.git(`merge --no-ff ${sourceBranch} --no-edit`);
		this.gitWithStdin("commit --amend -F -", message);
	}

	/**
	 * Reload entries from the current Git branch's commit history.
	 * This is needed after switching branches, as the commit history changes.
	 */
	reloadEntries(): void {
		this.entries = [];
		this.byId.clear();
		this.leafId = null;

		const parsed = this.loadEntriesFromGitLog("--first-parent");
		for (const entry of parsed) {
			this.entries.push(entry);
			this.byId.set(entry.id, entry);
			this.leafId = entry.id;
		}
	}

	resetLeaf(): void {
		this.leafId = null;
	}

	branchWithSummary(branchFromId: string | null, summary: string, details?: unknown, fromHook?: boolean): string {
		this.leafId = branchFromId;
		const entry: BranchSummaryEntry = {
			type: "branch_summary",
			id: this.generateId(),
			parentId: branchFromId,
			timestamp: new Date().toISOString(),
			fromId: branchFromId ?? "root",
			summary,
			details,
			fromHook,
		};
		this.appendEntry(entry);
		return entry.id;
	}

	createBranchedSession(_leafId: string): string | undefined {
		// TODO: Implement Git-based session branching
		return undefined;
	}

	// =========================================================================
	// Static factory methods
	// =========================================================================

	static create(cwd: string, sessionDir?: string): GitSessionManager {
		const dir = sessionDir ?? join(cwd, ".pi", "sessions");
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
		return new GitSessionManager(cwd, dir);
	}

	static open(path: string, sessionDir?: string): GitSessionManager {
		const dir = sessionDir ?? join(path, "..");
		const mgr = new GitSessionManager(process.cwd(), dir);
		mgr.loadFromGitRepo(path);
		return mgr;
	}

	static continueRecent(cwd: string, sessionDir?: string): GitSessionManager {
		const dir = sessionDir ?? join(cwd, ".pi", "sessions");
		if (!existsSync(dir)) {
			return new GitSessionManager(cwd, dir);
		}
		// Find most recent Git repo
		const repoPath = GitSessionManager.findMostRecentGitRepo(dir);
		if (repoPath) {
			const mgr = new GitSessionManager(cwd, dir);
			mgr.loadFromGitRepo(repoPath);
			return mgr;
		}
		// No Git repos found, create new session
		return new GitSessionManager(cwd, dir);
	}

	static inMemory(cwd: string = process.cwd()): GitSessionManager {
		return new GitSessionManager(cwd, "");
	}

	static forkFrom(_sourcePath: string, targetCwd: string, sessionDir?: string): GitSessionManager {
		// TODO: Implement Git-based fork
		const dir = sessionDir ?? join(targetCwd, ".pi", "sessions");
		return new GitSessionManager(targetCwd, dir);
	}

	static async list(cwd: string, sessionDir?: string, onProgress?: SessionListProgress): Promise<SessionInfo[]> {
		const { getDefaultSessionDir } = await import("./session-manager.js");
		const dir = sessionDir ?? getDefaultSessionDir(cwd);
		const sessions = await GitSessionManager.listGitSessions(dir, onProgress);
		sessions.sort((a, b) => b.modified.getTime() - a.modified.getTime());
		return sessions;
	}

	static async listAll(_onProgress?: SessionListProgress): Promise<SessionInfo[]> {
		const { getSessionsDir } = await import("../config.js");
		const sessionsDir = getSessionsDir();
		if (!existsSync(sessionsDir)) return [];

		const entries = await readdir(sessionsDir, { withFileTypes: true });
		const dirs = entries.filter((e) => e.isDirectory()).map((e) => join(sessionsDir, e.name));

		const sessions: SessionInfo[] = [];
		for (const dir of dirs) {
			const dirSessions = await GitSessionManager.listGitSessions(dir);
			sessions.push(...dirSessions);
		}

		sessions.sort((a, b) => b.modified.getTime() - a.modified.getTime());
		return sessions;
	}

	// =========================================================================
	// Git loading helpers
	// =========================================================================

	/**
	 * Load session state from an existing Git repo.
	 */
	private loadFromGitRepo(repoPath: string): void {
		this.gitRepoPath = repoPath;
		this.gitInitialized = true;
		this.entries = [];
		this.byId.clear();
		this.leafId = null;

		// Extract sessionId from directory name (format: {timestamp}_{sessionId})
		const dirName = repoPath.split("/").pop() || "";
		const idMatch = dirName.match(/_([^_]+)$/);
		if (idMatch) {
			this.sessionId = idMatch[1];
		}

		// Load all entries in one git command using --notes
		const parsed = this.loadEntriesFromGitLog("--first-parent");
		for (const entry of parsed) {
			this.entries.push(entry);
			this.byId.set(entry.id, entry);
			this.leafId = entry.id;
		}
	}

	/**
	 * Load all session entries from git log with notes in a single command.
	 * Uses --notes=session-meta to embed note content directly in log output,
	 * avoiding N separate `git notes show` calls.
	 */
	private loadEntriesFromGitLog(extraFlags?: string): SessionEntry[] {
		const entries: SessionEntry[] = [];
		try {
			const flags = extraFlags ? `${extraFlags} ` : "";
			const output = this.git(`log ${flags}--reverse --format="%x00%N" --notes=session-meta`);
			const blocks = output.split("\0").filter((b) => b.trim().length > 0);
			for (const block of blocks) {
				const trimmed = block.trim();
				if (!trimmed) continue;
				try {
					const entry = JSON.parse(trimmed) as SessionEntry;
					entries.push(entry);
				} catch {
					// Skip commits without valid notes
				}
			}
		} catch {
			// Empty repo or error
		}
		return entries;
	}

	/**
	 * Find the most recent Git repo in a session directory.
	 */
	static findMostRecentGitRepo(sessionDir: string): string | null {
		try {
			const entries = readdirSync(sessionDir);
			const gitRepos = entries
				.map((name) => join(sessionDir, name))
				.filter((p) => existsSync(join(p, ".git")))
				.map((p) => ({ path: p, mtime: statSync(p).mtime }))
				.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

			return gitRepos[0]?.path || null;
		} catch {
			return null;
		}
	}

	/**
	 * List all Git-based sessions in a directory.
	 */
	private static async listGitSessions(sessionDir: string, onProgress?: SessionListProgress): Promise<SessionInfo[]> {
		const sessions: SessionInfo[] = [];
		if (!existsSync(sessionDir)) return sessions;

		try {
			const dirEntries = await readdir(sessionDir);
			const repoPaths = dirEntries.map((name) => join(sessionDir, name)).filter((p) => existsSync(join(p, ".git")));

			let loaded = 0;
			for (const repoPath of repoPaths) {
				try {
					const info = await GitSessionManager.buildGitSessionInfo(repoPath);
					if (info) sessions.push(info);
				} catch {
					// Skip invalid repos
				}
				loaded++;
				onProgress?.(loaded, repoPaths.length);
			}
		} catch {
			// Return empty on error
		}

		return sessions;
	}

	/**
	 * Build SessionInfo from a Git repo.
	 */
	private static async buildGitSessionInfo(repoPath: string): Promise<SessionInfo | null> {
		try {
			const stats = await stat(repoPath);
			const dirName = repoPath.split("/").pop() || "";
			const idMatch = dirName.match(/_([^_]+)$/);
			const sessionId = idMatch ? idMatch[1] : dirName;

			// Get first and last commit timestamps
			let created = stats.birthtime;
			let modified = stats.mtime;
			let messageCount = 0;
			let firstMessage = "";
			const allMessages: string[] = [];
			let name: string | undefined;

			try {
				// Load all entries in one git command using --notes
				const gitOutput = execSync('git log --reverse --format="%x00%N" --notes=session-meta', {
					cwd: repoPath,
					encoding: "utf8",
					stdio: ["pipe", "pipe", "pipe"],
					maxBuffer: 500 * 1024 * 1024,
				}).trim();

				const blocks = gitOutput.split("\0").filter((b) => b.trim().length > 0);

				for (const block of blocks) {
					const trimmed = block.trim();
					if (!trimmed) continue;
					try {
						const entry = JSON.parse(trimmed) as SessionEntry;

						if (entry.type === "session_info") {
							name = (entry as SessionInfoEntry).name?.trim() || undefined;
						}

						if (entry.type === "message") {
							const msg = (entry as SessionMessageEntry).message as Message;
							if (msg.role === "user" || msg.role === "assistant") {
								messageCount++;
								let text = "";
								if (typeof msg.content === "string") {
									text = msg.content;
								} else if (Array.isArray(msg.content)) {
									text = (msg.content as any[])
										.filter((c: any) => c.type === "text")
										.map((c: any) => c.text)
										.join(" ");
								}
								if (text) {
									allMessages.push(text);
									if (!firstMessage && msg.role === "user") {
										firstMessage = text;
									}
								}
							}
						}

						// Use entry timestamp for created/modified
						const entryTime = new Date(entry.timestamp);
						if (entryTime < created) created = entryTime;
						if (entryTime > modified) modified = entryTime;
					} catch {
						// Skip commits without valid notes
					}
				}
			} catch {
				// Empty repo
			}

			return {
				path: repoPath,
				id: sessionId,
				cwd: "",
				name,
				created,
				modified,
				messageCount,
				firstMessage: firstMessage || "(no messages)",
				allMessagesText: allMessages.join(" "),
			};
		} catch {
			return null;
		}
	}
}
