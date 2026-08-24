import type { Algorithm } from "@xtyle/core";

/**
 * A text input that resolves to an algorithm through the sandbox, debounced so a half-typed source or
 * pack reference is never loaded.
 *
 * `value` survives a failed load on purpose: a source edited into a broken state leaves the last good
 * algorithm rendering behind the error rather than blanking the stage.
 */
export class SandboxedAlgorithm {
	value = $state<Algorithm | null>(null);
	error = $state<string | null>(null);
	loading = $state(false);

	readonly #load: (source: string) => Promise<Algorithm>;
	readonly #delayMs: number;

	constructor(load: (source: string) => Promise<Algorithm>, delayMs: number) {
		this.#load = load;
		this.#delayMs = delayMs;
	}

	/**
	 * Arm the loader for the current source. Call from an `$effect` and return its result, so a source
	 * that changes mid-flight cancels the load it started instead of racing it.
	 */
	watch(active: boolean, source: string): () => void {
		if (!active) {
			this.error = null;
			this.loading = false;
			return () => {};
		}
		if (!source.trim()) {
			this.error = null;
			this.value = null;
			this.loading = false;
			return () => {};
		}

		let cancelled = false;
		this.loading = true;
		const handle = setTimeout(() => {
			this.#load(source)
				.then((algorithm) => {
					if (cancelled) return;
					this.value = algorithm;
					this.error = null;
					this.loading = false;
				})
				.catch((thrown: unknown) => {
					if (cancelled) return;
					this.error = thrown instanceof Error ? thrown.message : String(thrown);
					this.loading = false;
				});
		}, this.#delayMs);

		return () => {
			cancelled = true;
			clearTimeout(handle);
		};
	}
}
