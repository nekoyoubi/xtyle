import { markedPairs, topLevelElements, type MarkedChild } from "@xtyle/core/elements/ssr";

export interface AuthoredPair {
	lead: MarkedChild;
	body: MarkedChild | null;
}

interface SlotRenderer {
	has(name: string): boolean;
	render(name: string): Promise<string>;
}

/**
 * The authored lead/body pairs of a slotted collection (`Accordion`'s header + panel, `Tabs`'
 * tab + panel), read out of Astro's rendered slot HTML so the server render can compose them.
 *
 * Two authoring shapes reach this, and they arrive already grouped differently:
 *
 * - **Marked children** in the default slot (`data-xtyle-header` / `data-xtyle-panel`) interleave
 *   lead, body, lead, body, and keep their markers, so they pair in document order.
 * - **Legacy named slots** (`slot="header"` / `slot="panel"`) are routed by Astro, which consumes the
 *   attribute and concatenates every child of a role into one slot. There is no marker left to read,
 *   so the two slots are zipped by index instead.
 *
 * Zipping by index means the slot string must hold nothing but authored children, which is why
 * `topLevelElements` excludes non-rendering ones: a nested component's hoisted `<script>` sits inline
 * in that string under `astro dev`, and counting it would shift every pair by one.
 *
 * Content is returned as already-rendered HTML: a nested component ran its own render before Astro
 * handed the string back, so it survives into the static markup intact.
 */
export async function authoredPairs(
	slots: SlotRenderer,
	leadSlot: string,
	bodySlot: string,
): Promise<AuthoredPair[]> {
	const render = async (name: string) => (slots.has(name) ? await slots.render(name) : "");

	const marked = markedPairs(await render("default"), leadSlot, bodySlot);
	if (marked.length > 0) return marked;

	const leads = topLevelElements(await render(leadSlot));
	const bodies = topLevelElements(await render(bodySlot));
	return leads.map((lead, i) => ({ lead, body: bodies[i] ?? null }));
}
