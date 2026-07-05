export type TabsVariant = "underline" | "pill" | "enclosed";
export type TabsActivation = "automatic" | "manual";

export interface TabItemData {
	/** The tab trigger's label as raw HTML (an already-rendered tab's `innerHTML`). */
	label: string;
	/**
	 * The tab's panel body as raw HTML (an already-rendered panel's `innerHTML`).
	 * Optional: in headless `tablist` mode the element owns no panels and the consumer
	 * renders content itself, so a tablist item carries only `label` (and `value`/`disabled`).
	 */
	panel?: string;
	/**
	 * Project a live light-DOM panel through a named `<slot>` instead of baking its
	 * `panel` HTML. The runtime element sets this for light-DOM panels so framework
	 * content (effects, handlers, nested elements) stays live rather than being
	 * snapshotted to static HTML. Ignored by the static `items`/SSR path.
	 */
	panelSlot?: string;
	/** Stable selection key emitted on `data-key`; defaults to the tab index. */
	value?: string;
	disabled?: boolean;
}

/** The host-layout rule for tabs — the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const tabsHostCss = ":host { display: block; }";
