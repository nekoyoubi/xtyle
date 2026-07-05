export interface AccordionSection {
	/** The trigger label as raw HTML (an already-rendered header's `innerHTML`). */
	header: string;
	/** The panel body as raw HTML (an already-rendered panel's `innerHTML`). */
	panel: string;
	/**
	 * Project a live light-DOM panel through a named `<slot>` instead of baking its
	 * `panel` HTML. The runtime element sets this for light-DOM panels so framework
	 * content (effects, handlers, nested elements) stays live rather than being
	 * snapshotted to static HTML. Ignored by the static `items`/SSR path.
	 */
	panelSlot?: string;
	open?: boolean;
	disabled?: boolean;
	/** Stable key emitted on `data-key`; defaults to the section index. */
	value?: string;
}

/** The host-layout rule for an accordion — the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const accordionHostCss = ":host { display: block; }";
