/**
 * Host-wired interactive controls for a fragment. A fragment fill declares each control the host
 * owns — its `marker` attribute, the `capability` it needs, and the `behavior` the element
 * implements — and ships the control element `hidden`. The element supplies the behavior
 * implementations; this module reads the declarations, gates each control on its capability (and
 * the behavior's per-instance opt-in), un-hides only where it can work, and wires a delegated
 * click once. The side effect stays element-owned — the zero-authority fill sandbox can't reach
 * a host capability like the clipboard — while the contract, gating, and wiring derive from the
 * manifest instead of a hardcoded per-marker branch.
 */

/** A built-in availability check per declared capability, so a gated control stays hidden where it can't work. */
const capabilityChecks: Record<string, () => boolean> = {
	clipboard: () => typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function",
};

export interface HostControlBehavior {
	/** Per-instance opt-in (e.g. a `copy="false"` drops it), composed with the capability check. */
	enabled: boolean;
	/** The element-owned side effect the control triggers. */
	run(): void | Promise<void>;
}

export interface HostControlDecl {
	marker: string;
	capability?: string;
	behavior: string;
}

/** The host controls a fragment fill declares, flattened across every fill in the manifest. */
export function declaredHostControls(manifest: unknown): HostControlDecl[] {
	const fills = (manifest as { fills?: Record<string, Array<{ hostControls?: HostControlDecl[] }>> }).fills ?? {};
	const out: HostControlDecl[] = [];
	for (const list of Object.values(fills)) {
		for (const fill of list) {
			if (fill.hostControls) out.push(...fill.hostControls);
		}
	}
	return out;
}

/**
 * Apply a fragment's declared host controls to one element's shadow root: for each declaration
 * with an implemented behavior, gate on the capability and the behavior's `enabled`, set the
 * marker element's visibility to match, and wire a delegated click on the shadow root the first
 * time the control is active. `wired` tracks which behaviors already carry a listener, so a
 * re-render re-evaluates visibility without stacking listeners.
 */
export function wireHostControls(
	root: ShadowRoot,
	manifest: unknown,
	behaviors: Record<string, HostControlBehavior>,
	wired: Set<string>,
): void {
	for (const control of declaredHostControls(manifest)) {
		const el = root.querySelector<HTMLElement>(`[${control.marker}]`);
		const behavior = behaviors[control.behavior];
		if (!el || !behavior) continue;
		const capable = control.capability ? (capabilityChecks[control.capability]?.() ?? false) : true;
		const active = capable && behavior.enabled;
		el.hidden = !active;
		if (!active || wired.has(control.behavior)) continue;
		wired.add(control.behavior);
		root.addEventListener("click", (event) => {
			const target = event.target as HTMLElement | null;
			if (target?.closest(`[${control.marker}]`)) void behavior.run();
		});
	}
}
