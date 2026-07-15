import { renderIcon } from "../../../icons";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface CarouselBindings {
	uid?: string;
	slideCount?: number;
	index?: number;
	controls?: "bar" | "overlay" | "none";
	dots?: boolean;
	showPlay?: boolean;
	playing?: boolean;
	loop?: boolean;
	label?: string | null;
	direction?: "right" | "left" | "up" | "down";
}

interface EventPayload {
	dataset?: Record<string, string>;
}

interface Intent {
	nudge?: number;
	select?: string;
	togglePlay?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: CarouselBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

const OPPOSITE: Record<string, string> = { right: "left", left: "right", up: "down", down: "up" };

function esc(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/**
 * The host stamps this instance's id onto the scaffold's track and control bar, and every control the
 * fill draws carries it too. In light DOM a carousel can hold another carousel, and the ops are applied
 * by a plain query from the host element — so an unqualified `[data-dot]` would find the *inner*
 * carousel's dots first. Every selector below is keyed to the instance that owns it.
 *
 * Server-side there is no instance: the fill renders one carousel into an isolated string, nothing can
 * be confused for anything else, and the static op-applier only understands bare `[data-x]` markers. So
 * an id-less render addresses the scaffold plainly.
 */
function uid(b: CarouselBindings): string {
	return b.uid ?? "";
}

function count(b: CarouselBindings): number {
	return b.slideCount ?? 0;
}

function active(b: CarouselBindings): number {
	return b.index ?? 0;
}

function playing(b: CarouselBindings): boolean {
	return b.playing !== false;
}

function scope(b: CarouselBindings, marker: string): string {
	return uid(b) ? `[${marker}][data-uid="${uid(b)}"]` : `[${marker}]`;
}

function trackSel(b: CarouselBindings): string {
	return scope(b, "data-track");
}

function controlsSel(b: CarouselBindings): string {
	return scope(b, "data-controls");
}

/** A control the fill drew: it carries the instance id in its own marker, so it is addressable on its own. */
function controlSel(b: CarouselBindings, marker: string): string {
	return `[data-${marker}="${uid(b)}"]`;
}

function trackLabel(b: CarouselBindings): string {
	return b.label ? b.label : "Carousel";
}

/** The chevron points the way the content advances, so a vertical or reversed carousel's arrows
 * never contradict its motion. */
function chevron(b: CarouselBindings, kind: "prev" | "next"): string {
	const dir = b.direction ?? "right";
	return `chevron-${kind === "next" ? dir : (OPPOSITE[dir] ?? "left")}`;
}

function playLabel(b: CarouselBindings): string {
	return playing(b) ? "Pause automatic slideshow" : "Play automatic slideshow";
}

function playIcon(b: CarouselBindings): string {
	return renderIcon(playing(b) ? "pause" : "play");
}

function atEdge(b: CarouselBindings, edge: number): boolean {
	return !b.loop && active(b) === edge;
}

function navButton(b: CarouselBindings, kind: "prev" | "next", label: string, edge: number): string {
	const disabled = atEdge(b, edge) ? " disabled" : "";
	return (
		`<button type="button" class="xtyle-carousel__nav xtyle-carousel__nav--${kind}" part="nav" ` +
		`data-${kind}="${uid(b)}" aria-label="${esc(label)}"${disabled}>${renderIcon(chevron(b, kind))}</button>`
	);
}

function playButton(b: CarouselBindings): string {
	return (
		'<button type="button" class="xtyle-carousel__nav xtyle-carousel__nav--play" part="play" ' +
		`data-play="${uid(b)}" aria-label="${esc(playLabel(b))}">${playIcon(b)}</button>`
	);
}

function dotClass(isActive: boolean): string {
	return isActive ? "xtyle-carousel__dot is-active" : "xtyle-carousel__dot";
}

function dotsRail(b: CarouselBindings): string {
	let out = '<div class="xtyle-carousel__dots" part="dots" role="tablist" aria-label="Choose slide">';
	for (let i = 0; i < count(b); i++) {
		const isActive = i === active(b);
		out +=
			`<button type="button" class="${dotClass(isActive)}" part="dot" data-dot="${uid(b)}-${i}" data-index="${i}" ` +
			`role="tab" aria-selected="${isActive ? "true" : "false"}" aria-label="Go to slide ${i + 1}"></button>`;
	}
	return `${out}</div>`;
}

/** The bar also stands for a bare autoplay carousel, so the pause toggle always has a home (WCAG 2.2.2). */
function showBar(b: CarouselBindings): boolean {
	if (count(b) === 0) return false;
	return b.controls !== "none" || b.dots === true || b.showPlay === true;
}

function controlsHtml(b: CarouselBindings): string {
	const parts: string[] = [];
	if (b.showPlay) parts.push(playButton(b));
	if (b.controls !== "none") parts.push(navButton(b, "prev", "Previous slide", 0));
	if (b.dots) parts.push(dotsRail(b));
	if (b.controls !== "none") parts.push(navButton(b, "next", "Next slide", count(b) - 1));
	return parts.join("");
}

hooks.fragment.mount("carousel", (bindings, ops) => {
	const bar = showBar(bindings);
	ops.setAttr(trackSel(bindings), "aria-label", trackLabel(bindings));
	ops.replaceChildren(controlsSel(bindings), bar ? controlsHtml(bindings) : "");
	ops.setAttr(controlsSel(bindings), "hidden", bar ? "" : "hidden");
});

hooks.fragment.update("carousel", (bindings, ops) => {
	ops.setAttr(trackSel(bindings), "aria-label", trackLabel(bindings));
	if (bindings.showPlay) {
		ops.replaceChildren(controlSel(bindings, "play"), playIcon(bindings));
		ops.setAttr(controlSel(bindings, "play"), "aria-label", playLabel(bindings));
	}
	if (bindings.controls !== "none") {
		ops.setAttr(controlSel(bindings, "prev"), "disabled", atEdge(bindings, 0) ? "disabled" : "");
		ops.setAttr(controlSel(bindings, "next"), "disabled", atEdge(bindings, count(bindings) - 1) ? "disabled" : "");
	}
	if (!bindings.dots) return;
	for (let i = 0; i < count(bindings); i++) {
		const isActive = i === active(bindings);
		ops.setAttr(`[data-dot="${uid(bindings)}-${i}"]`, "class", dotClass(isActive));
		ops.setAttr(`[data-dot="${uid(bindings)}-${i}"]`, "aria-selected", isActive ? "true" : "false");
	}
});

xript.exports.register("prevSlide", (): Intent => ({ nudge: -1 }));

xript.exports.register("nextSlide", (): Intent => ({ nudge: 1 }));

xript.exports.register("togglePlay", (): Intent => ({ togglePlay: true }));

xript.exports.register("selectDot", (payload: unknown): Intent => {
	const index = (payload as EventPayload).dataset?.index;
	return index === undefined ? {} : { select: index };
});
