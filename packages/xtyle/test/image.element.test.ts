// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
// side effect: defines the <xtyle-image> custom element on the happy-dom registry
import "../src/elements/image.js";
import { closeLightbox } from "../src/elements/lightbox.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/image/source.generated.js";

beforeAll(async () => {
	// happy-dom has no top-layer dialog and no media playback; the element only needs them not to throw
	HTMLDialogElement.prototype.showModal = function showModal(): void {
		this.setAttribute("open", "");
	};
	HTMLDialogElement.prototype.close = function close(): void {
		this.removeAttribute("open");
	};
	HTMLMediaElement.prototype.play = function play(): Promise<void> {
		return Promise.resolve();
	};
	HTMLMediaElement.prototype.pause = function pause(): void {};
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	closeLightbox();
	document.body.innerHTML = "";
});

function image(attrs: Record<string, string> = {}): HTMLElement {
	const el = document.createElement("xtyle-image");
	el.setAttribute("src", "/a.jpg");
	el.setAttribute("alt", "A skyline");
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	return el;
}

function shadow(el: HTMLElement, selector: string): HTMLElement | null {
	return el.shadowRoot?.querySelector<HTMLElement>(selector) ?? null;
}

function lightboxOpen(): boolean {
	return document.body.querySelector("xtyle-dialog.xtyle-lightbox[open]") !== null;
}

describe("<xtyle-image> chrome comes from the fill", () => {
	it("draws no zoom button by default, and the frame is the trigger", () => {
		const el = image({ lightbox: "" });
		expect(shadow(el, ".xtyle-image__zoom")).toBeNull();
		expect(shadow(el, ".xtyle-image__frame")?.getAttribute("role")).toBe("button");
		shadow(el, ".xtyle-image__frame")?.click();
		expect(lightboxOpen()).toBe(true);
	});

	it("draws the zoom button with trigger=button, and the frame stops being the trigger", () => {
		const el = image({ lightbox: "", trigger: "button" });
		const zoom = shadow(el, ".xtyle-image__zoom");
		expect(zoom).not.toBeNull();
		expect(zoom?.getAttribute("part")).toBe("zoom");
		expect(zoom?.getAttribute("aria-label")).toBe("View image: A skyline");
		expect(zoom?.querySelector("svg")).not.toBeNull();
		expect(shadow(el, ".xtyle-image__frame")?.hasAttribute("role")).toBe(false);
	});

	it("opens the lightbox from the fill's zoom button, through the fill's own handler", () => {
		const el = image({ lightbox: "", trigger: "button" });
		shadow(el, ".xtyle-image__zoom")?.click();
		expect(lightboxOpen()).toBe(true);
	});

	it("redraws the chrome when the trigger flips", () => {
		const el = image({ lightbox: "", trigger: "button" });
		expect(shadow(el, ".xtyle-image__zoom")).not.toBeNull();
		el.setAttribute("trigger", "frame");
		expect(shadow(el, ".xtyle-image__zoom")).toBeNull();
		el.setAttribute("trigger", "button");
		expect(shadow(el, ".xtyle-image__zoom")).not.toBeNull();
		el.removeAttribute("lightbox");
		expect(shadow(el, ".xtyle-image__zoom")).toBeNull();
	});

	it("relabels the zoom button in place when the alt changes, without rebuilding it", () => {
		const el = image({ lightbox: "", trigger: "button" });
		const zoom = shadow(el, ".xtyle-image__zoom");
		el.setAttribute("alt", "A harbour");
		expect(shadow(el, ".xtyle-image__zoom")).toBe(zoom);
		expect(zoom?.getAttribute("aria-label")).toBe("View image: A harbour");
	});

	it("ships the failure mark in the fill and reveals it with the frame's error state", () => {
		const el = image();
		const mark = shadow(el, ".xtyle-image__error");
		expect(mark).not.toBeNull();
		expect(mark?.querySelector("svg")).not.toBeNull();
		expect(mark?.getAttribute("aria-hidden")).toBe("true");
		const frame = shadow(el, ".xtyle-image__frame");
		expect(frame?.hasAttribute("data-error")).toBe(false);

		shadow(el, ".xtyle-image__img")?.dispatchEvent(new Event("error"));

		expect(frame?.hasAttribute("data-error")).toBe(true);
		expect(frame?.hasAttribute("data-loading")).toBe(false);
	});
});

describe("<xtyle-image> hover audio", () => {
	function video(el: HTMLElement): HTMLVideoElement | null {
		return el.querySelector<HTMLVideoElement>('video[slot="hover"]');
	}

	it("draws no mute toggle without hover-audio", () => {
		expect(shadow(image({ "hover-src": "/p.mp4" }), ".xtyle-image__audio")).toBeNull();
	});

	it("draws no mute toggle when the preview is not a video", () => {
		expect(shadow(image({ "hover-src": "/p.gif", "hover-audio": "off" }), ".xtyle-image__audio")).toBeNull();
	});

	it("draws the toggle as a frame control, with both glyphs and a muted pressed state", () => {
		const el = image({ "hover-src": "/p.mp4", "hover-audio": "off" });
		const button = shadow(el, ".xtyle-image__audio");
		expect(button).not.toBeNull();
		// a frame control, not a child of the hover region: a rebuild refills that region from the slot
		expect(button?.parentElement?.classList.contains("xtyle-image__frame")).toBe(true);
		expect(button?.querySelectorAll(".xtyle-image__audio-glyph")).toHaveLength(2);
		expect(button?.getAttribute("aria-pressed")).toBe("false");
		expect(button?.getAttribute("aria-label")).toBe("Unmute preview");
	});

	it("flips the preview's sound on the same button node, never rebuilding it", () => {
		const el = image({ "hover-src": "/p.mp4", "hover-audio": "off" });
		const button = shadow(el, ".xtyle-image__audio");
		const media = video(el);
		expect(media).not.toBeNull();
		const before = media!.muted;

		button?.click();

		expect(media!.muted).toBe(!before);
		expect(button?.getAttribute("aria-pressed")).toBe(String(!media!.muted));
		expect(button?.getAttribute("aria-label")).toBe(media!.muted ? "Unmute preview" : "Mute preview");
		// the identity of the node survives, so focus does too
		expect(shadow(el, ".xtyle-image__audio")).toBe(button);
	});

	it("keeps a click on the mute toggle from opening the lightbox behind it", () => {
		const el = image({ "hover-src": "/p.mp4", "hover-audio": "off", lightbox: "" });
		shadow(el, ".xtyle-image__audio")?.click();
		expect(lightboxOpen()).toBe(false);

		shadow(el, ".xtyle-image__frame")?.click();
		expect(lightboxOpen()).toBe(true);
	});

	it("reveals the preview on pointerenter and resets it on leave", () => {
		const el = image({ "hover-src": "/p.mp4", "hover-audio": "off" });
		const frame = shadow(el, ".xtyle-image__frame");
		frame?.dispatchEvent(new Event("pointerenter"));
		expect(frame?.hasAttribute("data-hover-active")).toBe(true);
		frame?.dispatchEvent(new Event("pointerleave"));
		expect(frame?.hasAttribute("data-hover-active")).toBe(false);
	});
});

// Last: the override registers hooks on the shared runtime for the rest of the file.
describe("a component.image override", () => {
	it("reshapes the zoom button the element used to hand-build", async () => {
		await loadFill(
			{
				xript: "0.7",
				name: "test-image-override",
				version: "0.0.1",
				capabilities: ["xtyle.component.image"],
				entry: { script: "mod.js", format: "script" },
				fills: {
					"component.image": [{ id: "image", format: "text/html+jsml", source: "image.html" }],
				},
			},
			{
				"mod.js": `hooks.fragment.mount("image", function (b, ops) {
					if (!b.zoom) return;
					ops.replaceChildren(".xtyle-image__zoom", '<em class="modded-zoom">zoom</em>');
					ops.setAttr(".xtyle-image__zoom", "data-modded", "yes");
				});`,
				"image.html": "",
			},
		);

		const el = image({ lightbox: "", trigger: "button" });
		const zoom = shadow(el, ".xtyle-image__zoom");
		expect(zoom?.getAttribute("data-modded")).toBe("yes");
		expect(zoom?.querySelector(".modded-zoom")).not.toBeNull();

		// and the override's button still drives the built-in behavior
		zoom?.click();
		expect(lightboxOpen()).toBe(true);
	});
});
