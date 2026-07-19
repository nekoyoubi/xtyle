<script lang="ts">
	import "@xtyle/core/elements/markdown.js";
	import type { Snippet } from "svelte";

	interface Props {
		/** The markdown to render. Falls back to the slotted text content. */
		source?: string;
		/** Render as a label rather than a document: emphasis and links, no blocks, no paragraph wrapper. */
		inline?: boolean;
		/** Offer a source view the reader can switch to. */
		editable?: boolean;
		/** Whether the source view is open. Bindable, so a toggle click flows back. */
		editing?: boolean;
		/** The source changed in the editor; `event.detail.source` carries the markdown. */
		oninput?: (event: CustomEvent<{ source: string }>) => void;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		source = $bindable(),
		inline = false,
		editable = false,
		editing = $bindable(false),
		oninput,
		children,
		...rest
	}: Props = $props();

	/** The element owns the source while editing, so mirror it back — a consumer who bound `source`
	 * gets the edit for free, and one who didn't is unaffected. */
	function handleInput(event: Event) {
		const detail = (event as CustomEvent<{ source: string }>).detail;
		if (detail && typeof detail.source === "string") {
			if (source !== undefined) source = detail.source;
			oninput?.(event as CustomEvent<{ source: string }>);
		}
	}

	/** `editing` reflects onto the host, so track the attribute the element writes when its toggle
	 * is clicked; without this a bound `editing` would go stale the moment the reader used the UI. */
	function trackEditing(node: HTMLElement) {
		const observer = new MutationObserver(() => {
			const open = node.hasAttribute("editing");
			if (open !== editing) editing = open;
		});
		observer.observe(node, { attributes: true, attributeFilter: ["editing"] });
		return { destroy: () => observer.disconnect() };
	}
</script>

<xtyle-markdown
	{...rest}
	{source}
	inline={inline || undefined}
	editable={editable || undefined}
	editing={editing || undefined}
	oninput={handleInput}
	use:trackEditing
>
	{@render children?.()}
</xtyle-markdown>
