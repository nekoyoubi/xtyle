export interface AccordionSection {
	/** The trigger label as plain text; it is escaped on render. Markup belongs in `headerSlot`. */
	header: string;
	/**
	 * Project an authored header through a named `<slot>` instead of escaping the `header`
	 * text, so a header carrying markup (an icon, a badge) survives. Both bindings set this:
	 * the runtime element for live light-DOM headers, and the Astro binding for the
	 * already-rendered header HTML it splices into the static render.
	 */
	headerSlot?: string;
	/** The panel body as raw HTML (an already-rendered panel's `innerHTML`). */
	panel: string;
	/**
	 * Project a live light-DOM panel through a named `<slot>` instead of baking its
	 * `panel` HTML. The runtime element sets this for light-DOM panels so framework
	 * content (effects, handlers, nested elements) stays live rather than being
	 * snapshotted to static HTML. The Astro binding sets it for slotted authoring too.
	 */
	panelSlot?: string;
	open?: boolean;
	disabled?: boolean;
	/** Stable key emitted on `data-key`; defaults to the section index. */
	value?: string;
}

/** The host-layout rule for an accordion — the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const accordionHostCss = ":host { display: block; }";
