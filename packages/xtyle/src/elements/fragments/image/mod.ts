import { escapeAttr } from "../escape.js";
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
	/** The roster glyph on the zoom button, and its body resolved by the trusted host. */
	zoomIcon?: string;
	zoomBody?: string | null;
	/** The mute toggle over a hover video whose audio the author allowed. */
	audio?: boolean;
	audioMuted?: boolean;
	audioLabel?: string;
	/** Bodies for the fixed status glyphs, so a mod reskinning them through the roster still shows. */
	volumeOffBody?: string | null;
	volumeBody?: string | null;
	warningBody?: string | null;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: ImageBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

interface Intent {
	stopPropagation?: boolean;
	activate?: string;
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
	const src = escapeAttr(b.src ?? "");
	if (!src) return "";
	const alt = escapeAttr(b.alt ?? "");
	const loading = b.loading === "eager" ? "eager" : "lazy";
	return `<img class="xtyle-image__img" part="image" src="${src}" alt="${alt}" loading="${escapeAttr(loading)}" decoding="async" />`;
}

function captionHtml(b: ImageBindings): string {
	return b.caption ? `<figcaption class="xtyle-image__caption" part="caption">${escapeAttr(b.caption)}</figcaption>` : "";
}

function zoomHtml(b: ImageBindings): string {
	if (!b.zoom) return "";
	return (
		`<button class="xtyle-image__zoom" part="zoom" type="button" aria-label="${escapeAttr(b.zoomLabel ?? "View image")}">` +
		`${renderIcon(b.zoomIcon ?? "maximize", { body: b.zoomBody })}</button>`
	);
}

/** Both glyphs ship; the button's `aria-pressed` picks which one shows, so the element flips sound
 * on and off by setting state on this node instead of writing markup over it. */
function audioHtml(b: ImageBindings): string {
	if (!b.audio) return "";
	const muted = b.audioMuted !== false;
	return (
		`<button class="xtyle-image__audio" part="audio" type="button" aria-pressed="${muted ? "false" : "true"}"` +
		` aria-label="${escapeAttr(b.audioLabel ?? (muted ? "Unmute preview" : "Mute preview"))}">` +
		`<span class="xtyle-image__audio-glyph xtyle-image__audio-glyph--muted">${renderIcon("volume-off", { body: b.volumeOffBody })}</span>` +
		`<span class="xtyle-image__audio-glyph xtyle-image__audio-glyph--live">${renderIcon("volume", { body: b.volumeBody })}</span>` +
		`</button>`
	);
}

/** Always rendered, revealed by the frame's `data-error` state — the element marks the failure, the
 * fill draws it. */
function errorHtml(b: ImageBindings): string {
	return `<span class="xtyle-image__error" part="error" aria-hidden="true">${renderIcon("warning", { size: "lg", body: b.warningBody })}</span>`;
}

function imageHtml(b: ImageBindings): string {
	const ratioStyle = b.ratio ? ` style="aspect-ratio: ${escapeAttr(b.ratio)}"` : "";
	const placeholder = `<span class="xtyle-image__placeholder" part="placeholder" aria-hidden="true"></span>`;
	const media = `<span class="xtyle-image__media" data-image-media>${mediaHtml(b)}</span>`;
	const hover = `<span class="xtyle-image__hover" part="hover" aria-hidden="true" data-slot="hover"><slot name="hover"></slot></span>`;
	// INFO: controls are siblings of the hover region, not children — a rebuild refills that region and would take any nested control
	const chrome = `${zoomHtml(b)}${audioHtml(b)}${errorHtml(b)}`;
	const frame = `<span class="xtyle-image__frame" part="frame"${ratioStyle}>${placeholder}${media}${hover}${chrome}</span>`;
	return `<figure class="${imageClass(b)}" part="figure">${frame}${captionHtml(b)}</figure>`;
}

function mount(bindings: ImageBindings, ops: OpsBuilder): void {
	ops.replaceChildren("[data-image]", imageHtml(bindings));
}

function patch(bindings: ImageBindings, ops: OpsBuilder): void {
	ops.setAttr(".xtyle-image", "class", imageClass(bindings));
	ops.setAttr('[part="frame"]', "style", bindings.ratio ? `aspect-ratio: ${escapeAttr(bindings.ratio)}` : "");
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
