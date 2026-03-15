/**
 * System context injection mechanism.
 *
 * Provides a registry for system context providers that inject status information
 * and reminders into the LLM context. Both core modules and extensions can register
 * providers.
 *
 * Status items are objective facts (time, branch depth, mode state).
 * Reminders are guidance (reflect on approach, wrap up work, etc).
 */

/** A provider that contributes status items and/or reminders to the system context. */
export interface SystemContextProvider {
	/** Return status items (objective facts about current state). */
	getStatus?(): string[] | undefined;
	/** Return reminder items (guidance/prompts for the agent). */
	getReminders?(): string[] | undefined;
}

const providers: SystemContextProvider[] = [];

/** Register a system context provider. */
export function registerSystemContextProvider(provider: SystemContextProvider): void {
	providers.push(provider);
}

/** Unregister a system context provider. */
export function unregisterSystemContextProvider(provider: SystemContextProvider): void {
	const index = providers.indexOf(provider);
	if (index !== -1) {
		providers.splice(index, 1);
	}
}

/**
 * Build the system context message text from all registered providers.
 * Optionally accepts additional providers (e.g. from extensions).
 * Returns undefined if no providers contribute any content.
 */
export function buildSystemContext(extraProviders?: SystemContextProvider[]): string | undefined {
	const statuses: string[] = [];
	const reminders: string[] = [];

	const allProviders = extraProviders ? [...providers, ...extraProviders] : providers;
	for (const p of allProviders) {
		const s = p.getStatus?.();
		if (s) statuses.push(...s);
		const r = p.getReminders?.();
		if (r) reminders.push(...r);
	}

	if (statuses.length === 0 && reminders.length === 0) return undefined;

	let text = "[System Context]";
	if (statuses.length > 0) {
		text += "\nStatus:";
		for (const s of statuses) {
			text += `\n- ${s}`;
		}
	}
	if (reminders.length > 0) {
		text += "\nReminders:";
		for (const r of reminders) {
			text += `\n- ${r}`;
		}
	}
	return text;
}
