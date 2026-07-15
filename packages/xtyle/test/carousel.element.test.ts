// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
// side effect: defines the <xtyle-carousel> custom element on the happy-dom registry
import "../src/elements/carousel.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { manifest, fragmentSources } from "../src/elements/fragments/carousel/source.generated.js";

type CarouselEl = HTMLElement & { label: string; autoplay: boolean; loop: boolean; interval: number };

interface ScrollCall {
	left?: number;
	top?: number;
	behavior?: string;
}

const scrolls: ScrollCall[] = [];

/** happy-dom 15 implements no `Element.scrollTo` (it lays nothing out), so record the calls instead;
 * and it ignores `addEventListener`'s `signal`, so an aborted controller would leave the element's
 * listeners attached and a re-connected carousel would page twice per key. Both are environment gaps,
 * not element behavior — stand them in so the real wiring is what's under test. */
beforeAll(async () => {
	const proto = Element.prototype as unknown as Record<string, unknown>;
	proto.scrollTo = function scrollTo(this: Element, opts: ScrollCall): void {
		scrolls.push(opts);
	};
	// The DOM base class happy-dom's elements actually inherit from is not the `EventTarget` it exposes
	// as a global, so the shim has to patch the prototype that really owns the method.
	let owner: object | null = HTMLElement.prototype;
	while (owner && !Object.prototype.hasOwnProperty.call(owner, "addEventListener")) {
		owner = Object.getPrototypeOf(owner);
	}
	const target = owner as unknown as EventTarget;
	const offs = new WeakMap<AbortSignal, (() => void)[]>();
	const nativeAdd = target.addEventListener;
	target.addEventListener = function addEventListener(
		this: EventTarget,
		type: string,
		listener: EventListenerOrEventListenerObject | null,
		options?: boolean | AddEventListenerOptions,
	): void {
		nativeAdd.call(this, type, listener, options);
		const signal = typeof options === "object" && options ? options.signal : undefined;
		if (!signal) return;
		const list = offs.get(signal) ?? [];
		list.push(() => this.removeEventListener(type, listener));
		offs.set(signal, list);
	};
	const nativeAbort = AbortController.prototype.abort;
	AbortController.prototype.abort = function abort(this: AbortController, reason?: unknown): void {
		for (const off of offs.get(this.signal) ?? []) off();
		offs.delete(this.signal);
		nativeAbort.call(this, reason);
	};
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
	scrolls.length = 0;
	vi.restoreAllMocks();
});

function make(attrs: Record<string, string> = {}, slideCount = 3): CarouselEl {
	const el = document.createElement("xtyle-carousel") as CarouselEl;
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	for (let i = 0; i < slideCount; i++) {
		const slide = document.createElement("div");
		slide.id = `slide-${i}`;
		slide.textContent = `Slide ${i + 1}`;
		el.appendChild(slide);
	}
	document.body.appendChild(el);
	return el;
}

/** An element's own track: the outer carousel's is an ancestor of any nested one's, so it comes first. */
function track(el: CarouselEl): HTMLElement {
	return el.querySelector("[data-track]") as HTMLElement;
}

/** The control bar of *this* carousel, keyed by the instance id it stamps on its own scaffold — a
 * nested carousel's bar sits inside this one's track, and so precedes it in document order. */
function bar(el: CarouselEl): HTMLElement {
	const uid = track(el).getAttribute("data-uid");
	return el.querySelector(`.xtyle-carousel__controls[data-uid="${uid}"]`) as HTMLElement;
}

/** The real slides only — direct children of the track, minus the seam clones. */
function slides(el: CarouselEl): HTMLElement[] {
	return [...track(el).children].filter(
		(child): child is HTMLElement =>
			child instanceof HTMLElement &&
			child.classList.contains("xtyle-carousel__slide") &&
			!child.hasAttribute("data-clone"),
	);
}

function clones(el: CarouselEl): HTMLElement[] {
	return [...track(el).children].filter(
		(child): child is HTMLElement => child instanceof HTMLElement && child.hasAttribute("data-clone"),
	);
}

function dots(el: CarouselEl): HTMLButtonElement[] {
	return [...bar(el).querySelectorAll<HTMLButtonElement>(".xtyle-carousel__dot")];
}

function nav(el: CarouselEl, kind: "prev" | "next" | "play"): HTMLButtonElement {
	return bar(el).querySelector(`.xtyle-carousel__nav--${kind}`) as HTMLButtonElement;
}

function activeDot(el: CarouselEl): number {
	return dots(el).findIndex((dot) => dot.classList.contains("is-active"));
}

function press(el: HTMLElement, key: string): KeyboardEvent {
	const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
	el.dispatchEvent(event);
	return event;
}

function click(el: HTMLElement): void {
	el.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
}

describe("<xtyle-carousel> fragment chrome", () => {
	it("renders the viewport, track, control bar, arrows, and dots from the fill", () => {
		const el = make({ label: "Gallery" });
		expect(el.querySelector(".xtyle-carousel__viewport")).not.toBeNull();
		expect(track(el).classList.contains("xtyle-carousel__track")).toBe(true);
		expect(el.querySelector(".xtyle-carousel__controls")).not.toBeNull();
		expect(nav(el, "prev")).not.toBeNull();
		expect(nav(el, "next")).not.toBeNull();
		expect(dots(el)).toHaveLength(3);
		expect(track(el).getAttribute("aria-label")).toBe("Gallery");
		expect(el.getAttribute("data-enhanced")).toBe("");
	});

	it("points each chevron the way the track advances", () => {
		expect(nav(make(), "next").innerHTML).toContain("</svg>");
		const down = make({ direction: "down" });
		expect(nav(down, "next").querySelector("svg")).not.toBeNull();
		expect(nav(down, "prev").querySelector("svg")).not.toBeNull();
	});

	it("hides the control bar when there are no arrows, dots, or play toggle", () => {
		const bare = make({ controls: "false", dots: "false" });
		expect(bar(bare).hasAttribute("hidden")).toBe(true);
		expect(dots(bare)).toHaveLength(0);
		expect(bar(make()).hasAttribute("hidden")).toBe(false);
	});

	it("grows a play toggle only when autoplay can actually run", () => {
		expect(nav(make(), "play")).toBeNull();
		expect(nav(make({ autoplay: "" }), "play")).not.toBeNull();
	});

	it("keeps the aria-live announcer in the element, outside the fill's chrome", () => {
		const el = make();
		const live = el.querySelector(".xtyle-carousel__live") as HTMLElement;
		expect(live).not.toBeNull();
		expect(live.getAttribute("aria-live")).toBe("polite");
		expect(track(el).contains(live)).toBe(false);
		expect(bar(el).contains(live)).toBe(false);
	});

	it("draws no chrome imperatively in the element", () => {
		const here = dirname(fileURLToPath(import.meta.url));
		const source = readFileSync(resolve(here, "../src/elements/carousel.ts"), "utf8");
		expect(source).not.toContain("renderIcon");
		expect(source).not.toContain('createElement("button")');
		expect(source).not.toContain("innerHTML");
	});
});

describe("<xtyle-carousel> slide relocation", () => {
	it("moves the consumer's own nodes into the fill's track rather than copying them", () => {
		const el = make({}, 3);
		const authored = [...el.querySelectorAll("[id^='slide-']")].filter((node) => !node.hasAttribute("data-clone"));
		const placed = slides(el);
		expect(placed).toHaveLength(3);
		for (const [i, slide] of placed.entries()) expect(slide).toBe(authored[i]);
		expect(placed[0].textContent).toBe("Slide 1");
	});

	it("labels every slide as a group, N of M", () => {
		const el = make({}, 3);
		expect(slides(el).map((s) => s.getAttribute("aria-label"))).toEqual(["1 of 3", "2 of 3", "3 of 3"]);
		expect(slides(el)[0].getAttribute("aria-roledescription")).toBe("slide");
	});

	it("holds the same slide nodes across a remount", () => {
		const el = make({ loop: "" }, 3);
		const before = slides(el);
		// a shape change (the play toggle appears) rebuilds the bar and re-places the slots
		el.setAttribute("autoplay", "");
		const after = slides(el);
		expect(after).toHaveLength(3);
		for (const [i, slide] of after.entries()) expect(slide).toBe(before[i]);
		expect(nav(el, "play")).not.toBeNull();
	});
});

describe("<xtyle-carousel> seam clones", () => {
	it("brackets the track with an inert clone of each end slide when looping", () => {
		const el = make({ loop: "" }, 3);
		const seams = clones(el);
		expect(seams).toHaveLength(2);
		const children = [...track(el).children] as HTMLElement[];
		expect(children[0].hasAttribute("data-clone")).toBe(true);
		expect(children[children.length - 1].hasAttribute("data-clone")).toBe(true);
		expect(children[0].textContent).toBe("Slide 3");
		expect(children[children.length - 1].textContent).toBe("Slide 1");
		for (const seam of seams) {
			expect(seam.getAttribute("aria-hidden")).toBe("true");
			expect(seam.hasAttribute("id")).toBe(false);
		}
	});

	it("builds no clones without loop, with a single slide, or under a stacked transition", () => {
		expect(clones(make({}, 3))).toHaveLength(0);
		expect(clones(make({ loop: "" }, 1))).toHaveLength(0);
		expect(clones(make({ loop: "", transition: "fade" }, 3))).toHaveLength(0);
	});

	it("rebuilds the clones after a remount re-places the slides", () => {
		const el = make({ loop: "" }, 3);
		const first = clones(el);
		expect(first).toHaveLength(2);
		el.setAttribute("autoplay", "");
		const rebuilt = clones(el);
		expect(rebuilt).toHaveLength(2);
		expect(rebuilt[0]).not.toBe(first[0]);
		expect(first[0].isConnected).toBe(false);
		const children = [...track(el).children] as HTMLElement[];
		expect(children[0].hasAttribute("data-clone")).toBe(true);
		expect(children[children.length - 1].hasAttribute("data-clone")).toBe(true);
	});

	it("drops the clones when loop is turned off", () => {
		const el = make({ loop: "" }, 3);
		expect(clones(el)).toHaveLength(2);
		el.removeAttribute("loop");
		expect(clones(el)).toHaveLength(0);
		expect(slides(el)).toHaveLength(3);
	});
});

describe("<xtyle-carousel> navigation", () => {
	it("advances and retreats through the dots, tracking the active one", () => {
		const el = make({}, 3);
		expect(activeDot(el)).toBe(0);
		click(nav(el, "next"));
		expect(activeDot(el)).toBe(1);
		expect(dots(el)[1].getAttribute("aria-selected")).toBe("true");
		click(nav(el, "prev"));
		expect(activeDot(el)).toBe(0);
	});

	it("jumps to the slide a dot names", () => {
		const el = make({}, 4);
		click(dots(el)[2]);
		expect(activeDot(el)).toBe(2);
		expect(scrolls.length).toBeGreaterThan(0);
	});

	it("disables the arrows at the ends without loop, and never with it", () => {
		const el = make({}, 3);
		expect(nav(el, "prev").disabled).toBe(true);
		expect(nav(el, "next").disabled).toBe(false);
		click(nav(el, "next"));
		click(nav(el, "next"));
		expect(activeDot(el)).toBe(2);
		expect(nav(el, "next").disabled).toBe(true);
		expect(nav(el, "prev").disabled).toBe(false);

		const looping = make({ loop: "" }, 3);
		expect(nav(looping, "prev").disabled).toBe(false);
		expect(nav(looping, "next").disabled).toBe(false);
	});

	it("pages with the arrow keys and the Home/End bounds", () => {
		const el = make({}, 4);
		expect(press(el, "ArrowRight").defaultPrevented).toBe(true);
		expect(activeDot(el)).toBe(1);
		press(el, "End");
		expect(activeDot(el)).toBe(3);
		press(el, "Home");
		expect(activeDot(el)).toBe(0);
		press(el, "ArrowLeft");
		expect(activeDot(el)).toBe(0);
	});

	it("follows the track's axis: a vertical carousel pages on Up/Down", () => {
		const el = make({ direction: "down" }, 3);
		expect(press(el, "ArrowRight").defaultPrevented).toBe(false);
		expect(activeDot(el)).toBe(0);
		expect(press(el, "ArrowDown").defaultPrevented).toBe(true);
		expect(activeDot(el)).toBe(1);
		expect(scrolls.some((call) => "top" in call)).toBe(true);
	});

	it("announces the new slide through the live region, but stays quiet on load", () => {
		const el = make({}, 3);
		const live = el.querySelector(".xtyle-carousel__live") as HTMLElement;
		expect(live.textContent).toBe("");
		click(nav(el, "next"));
		expect(live.textContent).toBe("Slide 2 of 3");
	});
});

describe("<xtyle-carousel> stacked transitions", () => {
	it("marks only the active slide, and makes the rest inert", () => {
		const el = make({ transition: "fade" }, 3);
		const [first, second] = slides(el);
		expect(first.classList.contains("is-active")).toBe(true);
		expect(second.classList.contains("is-active")).toBe(false);
		expect(second.getAttribute("aria-hidden")).toBe("true");
		click(nav(el, "next"));
		expect(first.classList.contains("is-active")).toBe(false);
		expect(second.classList.contains("is-active")).toBe(true);
		expect(second.hasAttribute("aria-hidden")).toBe(false);
	});

	it("wraps by index instead of scrolling when looping", () => {
		const el = make({ transition: "fade", loop: "" }, 3);
		click(nav(el, "prev"));
		expect(activeDot(el)).toBe(2);
		click(nav(el, "next"));
		expect(activeDot(el)).toBe(0);
	});
});

describe("<xtyle-carousel> autoplay", () => {
	it("advances on the interval and stops on the play toggle", () => {
		vi.useFakeTimers();
		try {
			const el = make({ autoplay: "", interval: "1000" }, 3);
			expect(activeDot(el)).toBe(0);
			vi.advanceTimersByTime(1000);
			expect(activeDot(el)).toBe(1);
			click(nav(el, "play"));
			expect(nav(el, "play").getAttribute("aria-label")).toBe("Play automatic slideshow");
			vi.advanceTimersByTime(5000);
			expect(activeDot(el)).toBe(1);
			click(nav(el, "play"));
			expect(nav(el, "play").getAttribute("aria-label")).toBe("Pause automatic slideshow");
			vi.advanceTimersByTime(1000);
			expect(activeDot(el)).toBe(2);
		} finally {
			vi.useRealTimers();
		}
	});

	it("pauses under the pointer, and keeps cycling when pause-on-hover is off", () => {
		vi.useFakeTimers();
		try {
			const el = make({ autoplay: "", interval: "1000" }, 3);
			el.dispatchEvent(new Event("pointerenter"));
			vi.advanceTimersByTime(3000);
			expect(activeDot(el)).toBe(0);
			el.dispatchEvent(new Event("pointerleave"));
			vi.advanceTimersByTime(1000);
			expect(activeDot(el)).toBe(1);

			const decorative = make({ autoplay: "", interval: "1000", "pause-on-hover": "false" }, 3);
			decorative.dispatchEvent(new Event("pointerenter"));
			vi.advanceTimersByTime(1000);
			expect(activeDot(decorative)).toBe(1);
		} finally {
			vi.useRealTimers();
		}
	});

	it("keeps a deliberate pause across a pointer leaving and re-entering", () => {
		vi.useFakeTimers();
		try {
			const el = make({ autoplay: "", interval: "1000" }, 3);
			click(nav(el, "play"));
			el.dispatchEvent(new Event("pointerenter"));
			el.dispatchEvent(new Event("pointerleave"));
			vi.advanceTimersByTime(4000);
			expect(activeDot(el)).toBe(0);
		} finally {
			vi.useRealTimers();
		}
	});
});

describe("<xtyle-carousel> upgrading over server-rendered markup", () => {
	/** What `@xtyle/astro` ships: the fill's frame with the slides already in the track, and no chrome
	 * (the slide count isn't knowable from a rendered slot string, and the controls are a runtime
	 * enhancement). The upgrade must grow the bar without ever detaching the slides. */
	async function ssr(attrs: Record<string, string> = {}): Promise<CarouselEl> {
		const light = await renderFragmentLight("carousel", {
			slideCount: 0,
			index: 0,
			controls: "bar",
			dots: true,
			showPlay: false,
			playing: true,
			loop: false,
			label: "Server",
			direction: "right",
		});
		const el = document.createElement("xtyle-carousel") as CarouselEl;
		for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
		const slideHtml = ["One", "Two", "Three"].map((text) => `<div>${text}</div>`).join("");
		el.innerHTML = light.replace("<slot></slot>", slideHtml);
		return el;
	}

	it("composes the track, the slides, and a hidden bar with no runtime", async () => {
		const el = await ssr();
		const scaffold = el.querySelector("[data-track]") as HTMLElement;
		expect(scaffold.classList.contains("xtyle-carousel__track")).toBe(true);
		expect(scaffold.getAttribute("aria-label")).toBe("Server");
		expect(el.querySelectorAll("[data-track] > div")).toHaveLength(3);
		expect((el.querySelector(".xtyle-carousel__controls") as HTMLElement).hasAttribute("hidden")).toBe(true);
		expect(el.innerHTML).not.toContain("<slot>");
	});

	it("grows its chrome on upgrade without disturbing the server-rendered slides", async () => {
		const el = await ssr({ label: "Server" });
		const authored = [...el.querySelectorAll<HTMLElement>("[data-track] > div")];
		document.body.appendChild(el);
		expect(slides(el)).toHaveLength(3);
		for (const [i, slide] of slides(el).entries()) expect(slide).toBe(authored[i]);
		expect(dots(el)).toHaveLength(3);
		expect(nav(el, "next")).not.toBeNull();
		expect(bar(el).hasAttribute("hidden")).toBe(false);
		click(nav(el, "next"));
		expect(activeDot(el)).toBe(1);
	});
});

describe("<xtyle-carousel> nested in a carousel", () => {
	/** The site's own gallery demo puts a carousel inside a slide of another one. Both render into the
	 * light DOM, so the outer element's queries and the fill's ops see the inner one's chrome too. */
	function nest(attrs: Record<string, string> = {}): { outer: CarouselEl; inner: CarouselEl } {
		const outer = document.createElement("xtyle-carousel") as CarouselEl;
		outer.setAttribute("label", "Outer");
		for (const [name, value] of Object.entries(attrs)) outer.setAttribute(name, value);
		const first = document.createElement("div");
		first.textContent = "Outer 1";
		const second = document.createElement("div");
		const inner = document.createElement("xtyle-carousel") as CarouselEl;
		inner.setAttribute("label", "Inner");
		for (const [name, value] of Object.entries(attrs)) inner.setAttribute(name, value);
		for (const text of ["Inner 1", "Inner 2"]) {
			const slide = document.createElement("div");
			slide.textContent = text;
			inner.appendChild(slide);
		}
		second.appendChild(inner);
		outer.append(first, second);
		document.body.appendChild(outer);
		return { outer, inner };
	}

	it("keeps each carousel's slides in its own track", () => {
		const { outer, inner } = nest();
		expect(slides(outer)).toHaveLength(2);
		expect(slides(inner)).toHaveLength(2);
		expect(slides(inner).map((s) => s.textContent)).toEqual(["Inner 1", "Inner 2"]);
		expect(track(inner).contains(slides(outer)[0])).toBe(false);
		expect(track(outer).getAttribute("aria-label")).toBe("Outer");
		expect(track(inner).getAttribute("aria-label")).toBe("Inner");
	});

	it("keeps each carousel's chrome to itself", () => {
		const { outer, inner } = nest();
		expect(bar(outer)).not.toBeNull();
		expect(bar(outer)).not.toBe(bar(inner));
		expect(dots(outer)).toHaveLength(2);
		expect(dots(inner)).toHaveLength(2);
		expect(track(outer).getAttribute("data-uid")).not.toBe(track(inner).getAttribute("data-uid"));
	});

	it("still finds its own bar when the inner carousel reflects the same marker on its host", () => {
		// `controls="overlay"` puts `data-controls` on the element itself, which is exactly the marker
		// the fill's control bar carries — so the inner element sits in front of the outer's own bar.
		const { outer, inner } = nest({ controls: "overlay" });
		expect(inner.hasAttribute("data-controls")).toBe(true);
		expect(bar(outer).classList.contains("xtyle-carousel__controls")).toBe(true);
		expect(dots(outer)).toHaveLength(2);
		expect(nav(outer, "next")).not.toBeNull();
		click(nav(outer, "next"));
		expect(activeDot(outer)).toBe(1);
	});

	it("does not page the outer carousel when the inner one is driven", () => {
		const { outer, inner } = nest();
		click(nav(inner, "next"));
		expect(activeDot(inner)).toBe(1);
		expect(activeDot(outer)).toBe(0);
		press(track(inner), "ArrowRight");
		expect(activeDot(outer)).toBe(0);
	});
});

describe("<xtyle-carousel> lifecycle", () => {
	it("re-wires its behavior after being moved in the DOM", () => {
		const el = make({}, 3);
		const holder = document.createElement("div");
		document.body.appendChild(holder);
		holder.appendChild(el);
		expect(slides(el)).toHaveLength(3);
		press(el, "ArrowRight");
		expect(activeDot(el)).toBe(1);
	});

	it("enhances a carousel whose slides arrive after it connects", async () => {
		const el = document.createElement("xtyle-carousel") as CarouselEl;
		document.body.appendChild(el);
		expect(el.querySelector("[data-track]")).toBeNull();
		for (let i = 0; i < 2; i++) {
			const slide = document.createElement("div");
			slide.textContent = `Late ${i + 1}`;
			el.appendChild(slide);
		}
		await new Promise((r) => requestAnimationFrame(() => r(null)));
		expect(track(el)).not.toBeNull();
		expect(slides(el)).toHaveLength(2);
		expect(dots(el)).toHaveLength(2);
	});
});
