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
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: ImageBindings, ops: OpsBuilder) => void) => void };
};

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
	const frame = `<span class="xtyle-image__frame" part="frame"${ratioStyle}>${placeholder}${media}${hover}</span>`;
	return `<figure class="${imageClass(b)}" part="figure">${frame}${captionHtml(b)}</figure>`;
}

function mount(bindings: ImageBindings, ops: OpsBuilder): void {
	ops.replaceChildren("[data-image]", imageHtml(bindings));
}

// A non-destructive patch: it repaints only the media and caption regions and the frame/figure
// attributes, leaving the hover overlay (and any slotted preview) in place. A full rebuild here would
// discard an SSR-composed hover preview on the first hydration apply.
function patch(bindings: ImageBindings, ops: OpsBuilder): void {
	ops.setAttr('[part="figure"]', "class", imageClass(bindings));
	ops.setAttr('[part="frame"]', "style", bindings.ratio ? `aspect-ratio: ${esc(bindings.ratio)}` : "");
	ops.replaceChildren("[data-image-media]", mediaHtml(bindings));
}

hooks.fragment.mount("image", mount);
hooks.fragment.update("image", patch);
