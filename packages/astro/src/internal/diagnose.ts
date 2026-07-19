/**
 * Authoring diagnostics for the Astro wrappers, dev-only and dynamically imported.
 *
 * The check reads the component manifests, which are a large graph a production site has no reason to
 * pull into its build. `import.meta.env.DEV` is statically replaced, so the guard folds to `false` and
 * the dynamic `import()` never becomes an edge in the production module graph — the diagnostic costs a
 * shipped site nothing at all.
 */
export async function checkAuthoring(id: string, props: Record<string, unknown>): Promise<void> {
	if (!import.meta.env.DEV) return;
	const { warnAuthoring } = await import("@xtyle/core");
	warnAuthoring(id, props);
}
