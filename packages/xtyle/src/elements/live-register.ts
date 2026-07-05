const reresolved = new WeakSet<HTMLElement>();

/**
 * Reads the given theme tokens off an element's live cascade into a register for the elements that
 * resolve a palette from `getComputedStyle`. When none resolve, the theme isn't on the cascade yet
 * (a scoped `apply()` on a subtree that landed after the element mounted, or a first render before
 * connection), so it schedules `reresolve` once on the next frame, letting the element re-resolve
 * instead of sticking on the currentColor fallback. A theme present at `:root` resolves on the first
 * read, so `reresolve` never fires and there is no recolor flash. The one-shot guard is per element,
 * so a genuinely tokenless page retries once and then rests.
 */
export function readLiveRegister(el: HTMLElement, tokens: readonly string[], reresolve: () => void): Record<string, string> {
	const styles = getComputedStyle(el);
	const register: Record<string, string> = {};
	for (const token of tokens) {
		const value = styles.getPropertyValue(token).trim();
		if (value) register[token] = value;
	}
	if (Object.keys(register).length === 0 && !reresolved.has(el) && typeof requestAnimationFrame === "function") {
		reresolved.add(el);
		requestAnimationFrame(reresolve);
	}
	return register;
}
