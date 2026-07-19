import { IMAGE_FITS, IMAGE_RADII, IMAGE_LOADING } from "../vocab.js";
export type ImageFit = (typeof IMAGE_FITS)[number];
export type ImageRadius = (typeof IMAGE_RADII)[number];
export type ImageLoading = (typeof IMAGE_LOADING)[number];
export type ImageTrigger = "frame" | "button";
/** Whether a hover preview may play sound, and its initial state. Absent = silent (no toggle). */
export type ImageHoverAudio = "on" | "off";

/** The host-layout rule for an image: the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const imageHostCss = ":host { display: block; }";

const VIDEO_EXT = /\.(mp4|webm|ogv|mov|m4v)(\?|#|$)/i;

/** Whether a `hover-src` resolves to a `<video>` (and so can carry sound) rather than an `<img>`. */
export function isHoverVideo(src: string | null | undefined): boolean {
	return !!src && VIDEO_EXT.test(src);
}

function escAttr(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/**
 * The hover-preview media generated from a `hover-src`: a muted, looping `<video>` for a video URL
 * (the element plays it on hover) or an `<img>` for a gif / animated source. Shared by the element
 * (client) and the Astro binding (SSR) so both emit identical hover-slot content. The caller adds
 * `slot="hover"` when the node is a light-DOM child to project; the SSR path inlines it in place.
 */
export function hoverMediaHtml(src: string, poster?: string): string {
	if (!src) return "";
	const s = escAttr(src);
	const posterAttr = poster ? ` poster="${escAttr(poster)}"` : "";
	if (VIDEO_EXT.test(src)) {
		return `<video class="xtyle-image__hover-media" part="hover-media" muted loop playsinline preload="none"${posterAttr}><source src="${s}" /></video>`;
	}
	return `<img class="xtyle-image__hover-media" part="hover-media" src="${s}" alt="" loading="lazy" decoding="async" />`;
}
