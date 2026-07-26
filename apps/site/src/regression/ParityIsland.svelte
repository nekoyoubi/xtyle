<script lang="ts">
	import { mount, createRawSnippet, tick } from "svelte";
	import { svelteRegistry } from "./svelte-registry.ts";
	import { elementRegistry } from "./element-registry.ts";

	interface Props {
		id: string;
		props: Record<string, unknown>;
		childrenHtml: string;
	}
	let { id, props, childrenHtml }: Props = $props();

	let svelteHost: HTMLDivElement | undefined = $state();
	let rawHost: HTMLDivElement | undefined = $state();
	let started = false;

	// INFO: fragments fill asynchronously and FragmentHost paints an inert scaffold first, so a
	// naive "has content" check returns too early; wait for the render signature to settle
	async function waitForFills(
		els: Array<Element | undefined>,
		{ settleMs = 400, sampleMs = 80, floorMs = 3500, timeoutMs = 10000 } = {},
	) {
		const targets = els.filter((el): el is HTMLElement => !!el);
		if (!targets.length) return;
		const sig = (el: HTMLElement) => {
			const sr = (el as { shadowRoot?: ShadowRoot | null }).shadowRoot;
			const inner = sr ? sr.innerHTML.length : el.innerHTML.length;
			return `${inner}:${el.offsetHeight}:${el.offsetWidth}`;
		};
		const start = performance.now();
		let last = targets.map(sig);
		let stableSince = performance.now();
		while (performance.now() - start < timeoutMs) {
			await new Promise((r) => setTimeout(r, sampleMs));
			const now = targets.map(sig);
			if (now.every((s, i) => s === last[i])) {
				// INFO: floor guards against the host being briefly stable at its inert scaffold
				// before real content lands, when stability alone would return too early
				if (
					performance.now() - stableSince >= settleMs &&
					performance.now() - start >= floorMs
				)
					return;
			} else {
				last = now;
				stableSince = performance.now();
			}
		}
	}

	// INFO: objects/arrays set as properties since they can't survive stringifying to an
	// attribute; scalars ride as kebab attributes
	function applyToRaw(el: HTMLElement, p: Record<string, unknown>) {
		for (const [key, value] of Object.entries(p)) {
			if (value === false || value === null || value === undefined) continue;
			if (typeof value === "object") {
				try {
					(el as unknown as Record<string, unknown>)[key] = value;
				} catch {
					/* ignore */
				}
				continue;
			}
			const name = key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
			el.setAttribute(name, value === true ? "" : String(value));
		}
	}

	$effect(() => {
		if (started || !svelteHost || !rawHost) return;
		started = true;

		(async () => {
			const errors: string[] = [];
			let rawEl: Element | undefined;

			try {
				await elementRegistry[id]?.();
				const el = document.createElement(`xtyle-${id}`) as HTMLElement;
				applyToRaw(el, props);
				if (childrenHtml)
					el.innerHTML = `<span style="display:contents">${childrenHtml}</span>`;
				rawHost!.appendChild(el);
				rawEl = el;
			} catch (err) {
				errors.push(`raw: ${err}`);
			}

			try {
				const Comp = svelteRegistry[id] as never;
				if (!Comp) throw new Error(`no svelte wrapper for ${id}`);
				const snippetChildren = childrenHtml
					? createRawSnippet(() => ({
							render: () => `<span style="display:contents">${childrenHtml}</span>`,
						}))
					: undefined;
				mount(Comp, {
					target: svelteHost!,
					props: {
						...props,
						...(snippetChildren ? { children: snippetChildren } : {}),
					},
				});
			} catch (err) {
				errors.push(`svelte: ${err}`);
			}

			try {
				await tick();
			} catch {
				/* ignore */
			}

			const svelteEl = svelteHost!.querySelector(`xtyle-${id}`) ?? undefined;
			await waitForFills([rawEl, svelteEl]);

			const root = document.documentElement;
			if (errors.length) root.setAttribute("data-parity-error", errors.join(" | "));
			root.setAttribute("data-parity-ready", "1");
		})();
	});
</script>

<div class="parity__col" data-binding="svelte" bind:this={svelteHost}></div>
<div class="parity__col" data-binding="raw" bind:this={rawHost}></div>
