interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
}

interface SpotlightBindings {
	open?: boolean;
	heading?: string | null;
	closeLabel?: string | null;
	noCloseButton?: boolean;
	arrow?: string;
	pulse?: string;
	/** The veil's clip path, already computed against the target's measured rect. */
	cutout?: string;
	/** How dark the veil goes, 0–1; null leaves the CSS default. Composed into the veil style, not a separate write. */
	dim?: string | null;
	/** The page-behind blur, already in px (`4px`); null leaves the CSS default. */
	blur?: string | null;
	/** The target's rect, for the ring that traces it. */
	ringStyle?: string;
	pointerStyle?: string;
	showPointer?: boolean;
	headingId?: string;
}

interface EventPayload {
	disabled?: boolean;
}

interface Intent {
	requestClose?: boolean;
	preventDefault?: boolean;
	stopPropagation?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: SpotlightBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

function rootClass(b: SpotlightBindings): string {
	const arrow = b.arrow ?? "bounce";
	const pulse = b.pulse ?? "none";
	return [
		"xtyle-spotlight",
		b.open && "xtyle-spotlight--open",
		pulse !== "none" && `xtyle-spotlight--pulse-${pulse}`,
		arrow !== "none" && `xtyle-spotlight--arrow-${arrow}`,
	]
		.filter(Boolean)
		.join(" ");
}

/**
 * Class ops key to this fill's own names; everything a mod inherits by keeping the `data-*` hooks — the
 * measured geometry, the open state, the accessible name — keys to the markers.
 */
function paint(b: SpotlightBindings, ops: OpsBuilder): void {
	const heading = b.heading ?? "";
	const open = b.open === true;
	ops.setAttr(".xtyle-spotlight", "class", rootClass(b));
	ops.setAttr("[data-root]", "hidden", open ? "" : "hidden");

	// the veil's whole style is one string: the measured clip path plus the dim/blur knobs, composed together
	// so setting it never wipes the other. The knobs override the CSS default inline on the veil.
	const veilStyle = [
		b.cutout ? `clip-path: path(evenodd, "${b.cutout}")` : "",
		b.dim != null ? `--spotlight-dim: ${b.dim}` : "",
		b.blur != null ? `--spotlight-blur: ${b.blur}` : "",
	]
		.filter(Boolean)
		.join("; ");
	ops.setAttr("[data-veil]", "style", veilStyle);
	ops.setAttr("[data-ring]", "style", b.ringStyle ?? "");
	ops.setAttr("[data-pointer]", "style", b.pointerStyle ?? "");
	ops.setAttr("[data-pointer]", "hidden", b.showPointer === true ? "" : "hidden");

	ops.setText("[data-sl-title]", heading);
	ops.setAttr("[data-sl-title]", "id", b.headingId ?? "");
	ops.setAttr("[data-sl-title]", "hidden", heading.length > 0 ? "" : "hidden");
	ops.setAttr("[data-callout]", "aria-labelledby", heading.length > 0 ? (b.headingId ?? "") : "");

	ops.setText("[data-sl-close]", b.closeLabel ?? "Got it");
	ops.setAttr("[data-sl-close]", "hidden", b.noCloseButton === true ? "hidden" : "");
}

hooks.fragment.mount("spotlight", (bindings, ops) => {
	paint(bindings, ops);
});

hooks.fragment.update("spotlight", (bindings, ops) => {
	paint(bindings, ops);
});

xript.exports.register("dismiss", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.disabled) return {};
	return { requestClose: true, preventDefault: true, stopPropagation: true };
});

// a click on the veil is a click on "everything else" — the gesture that says *I'm done here*. A click in
// the hole is a click on the app, and passes straight through to it.
xript.exports.register("veilClick", (): Intent => {
	return { requestClose: true };
});
