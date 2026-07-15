import { renderIcon } from "../../../icons";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface ImageBindings {
	src?: string;
	alt?: string;
	ratio?: string;
	fit?: string;
	radius?: string;
	loading?: string;
	caption?: string;
	/** The zoom button that opens the lightbox — only when the element is live (a no-JS zoom button is dead chrome). */
	zoom?: boolean;
	zoomLabel?: string;
	/** The mute toggle over a hover video whose audio the author allowed. */
	audio?: boolean;
	audioMuted?: boolean;
	audioLabel?: string;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: ImageBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

interface Intent {
	stopPropagation?: boolean;
	activate?: string;
}

function esc(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function imageClass(b: ImageBindings): string {
	const radius = b.radius ?? "md";
	return [
		"xtyle-image",
		b.fit === "contain" && "xtyle-image--contain",
		radius !== "md" && `xtyle-image--radius-${radius}`,
	]
		.filter(Boolean)
		.join(" ");
}

function mediaHtml(b: ImageBindings): string {
	const src = esc(b.src ?? "");
	if (!src) return "";
	const alt = esc(b.alt ?? "");
	const loading = b.loading === "eager" ? "eager" : "lazy";
	return `<img class="xtyle-image__img" part="image" src="${src}" alt="${alt}" loading="${loading}" decoding="async" />`;
}

function captionHtml(b: ImageBindings): string {
	return b.caption ? `<figcaption class="xtyle-image__caption" part="caption">${esc(b.caption)}</figcaption>` : "";
}

function zoomHtml(b: ImageBindings): string {
	if (!b.zoom) return "";
	return (
		`<button class="xtyle-image__zoom" part="zoom" type="button" aria-label="${esc(b.zoomLabel ?? "View image")}">` +
		`${renderIcon("maximize")}</button>`
	);
}

/** Both glyphs ship; the button's `aria-pressed` picks which one shows, so the element flips sound
 * on and off by setting state on this node instead of writing markup over it. */
function audioHtml(b: ImageBindings): string {
	if (!b.audio) return "";
	const muted = b.audioMuted !== false;
	return (
		`<button class="xtyle-image__audio" part="audio" type="button" aria-pressed="${muted ? "false" : "true"}"` +
		` aria-label="${esc(b.audioLabel ?? (muted ? "Unmute preview" : "Mute preview"))}">` +
		`<span class="xtyle-image__audio-glyph xtyle-image__audio-glyph--muted">${renderIcon("volume-off")}</span>` +
		`<span class="xtyle-image__audio-glyph xtyle-image__audio-glyph--live">${renderIcon("volume")}</span>` +
		`</button>`
	);
}

/** Always rendered, revealed by the frame's `data-error` state — the element marks the failure, the
 * fill draws it. */
function errorHtml(): string {
	return `<span class="xtyle-image__error" part="error" aria-hidden="true">${renderIcon("warning", { size: "lg" })}</span>`;
}

function imageHtml(b: ImageBindings): string {
	const ratioStyle = b.ratio ? ` style="aspect-ratio: ${esc(b.ratio)}"` : "";
	const placeholder = `<span class="xtyle-image__placeholder" part="placeholder" aria-hidden="true"></span>`;
	const media = `<span class="xtyle-image__media" data-image-media>${mediaHtml(b)}</span>`;
	// The hover-preview overlay: hidden until the element reveals it. Marked `data-slot="hover"` so the
	// host preserves its content across rebuilds. Content arrives through the named slot (a consumer's
	// `<video>` / nested `<xtyle-carousel>` in shadow mode, or the Astro binding's slot-replace in
	// light DOM), or is injected by the element from `hover-src`. The `update` hook below never touches
	// this node, so a live re-render can't wipe an SSR-composed preview.
	const hover = `<span class="xtyle-image__hover" part="hover" aria-hidden="true" data-slot="hover"><slot name="hover"></slot></span>`;
	// The frame's controls are siblings of the hover region, never children of it: a rebuild refills
	// that region with the consumer's slotted preview, which would take any control nested inside it.
	const chrome = `${zoomHtml(b)}${audioHtml(b)}${errorHtml()}`;
	const frame = `<span class="xtyle-image__frame" part="frame"${ratioStyle}>${placeholder}${media}${hover}${chrome}</span>`;
	return `<figure class="${imageClass(b)}" part="figure">${frame}${captionHtml(b)}</figure>`;
}

function mount(bindings: ImageBindings, ops: OpsBuilder): void {
	ops.replaceChildren("[data-image]", imageHtml(bindings));
}

// A non-destructive patch: it repaints only the media region and the frame/figure attributes, and
// re-labels the live controls in place, leaving the hover overlay (and any slotted preview) and the
// control nodes themselves alone. A full rebuild here would discard an SSR-composed hover preview on
// the first hydration apply, and would drop focus off a control mid-interaction. Chrome that has to
// appear or disappear (the zoom button, the audio toggle) is a shape change: the element remounts.
function patch(bindings: ImageBindings, ops: OpsBuilder): void {
	ops.setAttr('[part="figure"]', "class", imageClass(bindings));
	ops.setAttr('[part="frame"]', "style", bindings.ratio ? `aspect-ratio: ${esc(bindings.ratio)}` : "");
	ops.replaceChildren("[data-image-media]", mediaHtml(bindings));
	if (bindings.zoom) ops.setAttr(".xtyle-image__zoom", "aria-label", bindings.zoomLabel ?? "View image");
}

hooks.fragment.mount("image", mount);
hooks.fragment.update("image", patch);

xript.exports.register("zoom", (): Intent => {
	return { activate: "zoom" };
});

xript.exports.register("audio", (): Intent => {
	return { stopPropagation: true, activate: "audio" };
});
