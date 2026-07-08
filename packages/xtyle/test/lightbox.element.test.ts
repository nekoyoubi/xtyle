// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
// side effect: defines <xtyle-lightbox> and exports the imperative controller
import { openLightbox, closeLightbox } from "../src/elements/lightbox.js";

beforeAll(() => {
	// happy-dom has no top-layer dialog; the controller only needs open/close not to throw
	HTMLDialogElement.prototype.showModal = function showModal(): void {
		this.setAttribute("open", "");
	};
	HTMLDialogElement.prototype.close = function close(): void {
		this.removeAttribute("open");
	};
});

afterEach(() => {
	closeLightbox();
	document.body.innerHTML = "";
});

function dialog(): HTMLDialogElement | null {
	return document.body.querySelector<HTMLDialogElement>(".xtyle-image__lightbox");
}

describe("openLightbox", () => {
	it("portals one dialog to the body with the image, alt, and caption", () => {
		openLightbox("/full.jpg", { alt: "A skyline", caption: "Downtown at dusk" });
		const full = dialog()?.querySelector<HTMLImageElement>(".xtyle-image__full");
		expect(full?.getAttribute("src")).toBe("/full.jpg");
		expect(full?.getAttribute("alt")).toBe("A skyline");
		const caption = dialog()?.querySelector<HTMLElement>(".xtyle-image__lightbox-caption");
		expect(caption?.hidden).toBe(false);
		expect(caption?.textContent).toBe("Downtown at dusk");
	});

	it("reuses the single dialog and hides the caption when none is given", () => {
		openLightbox("/a.jpg", { alt: "A", caption: "cap" });
		openLightbox("/b.jpg", { alt: "B" });
		expect(document.body.querySelectorAll(".xtyle-image__lightbox")).toHaveLength(1);
		const full = dialog()?.querySelector<HTMLImageElement>(".xtyle-image__full");
		expect(full?.getAttribute("src")).toBe("/b.jpg");
		expect(dialog()?.querySelector<HTMLElement>(".xtyle-image__lightbox-caption")?.hidden).toBe(true);
	});
});

describe("<xtyle-lightbox> delegated controller", () => {
	function mount(): HTMLElement {
		const scope = document.createElement("div");
		scope.id = "scope";
		scope.innerHTML =
			`<img src="/thumb.jpg" alt="Sky" data-xtyle-lightbox data-lightbox-src="/full.jpg" data-lightbox-caption="Full sky" />`;
		document.body.appendChild(scope);
		const controller = document.createElement("xtyle-lightbox");
		controller.setAttribute("scope", "#scope");
		document.body.appendChild(controller);
		return scope;
	}

	it("opens the shared lightbox from a click on any tagged image, honoring data overrides", () => {
		const scope = mount();
		const img = scope.querySelector("img") as HTMLImageElement;
		img.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		const full = dialog()?.querySelector<HTMLImageElement>(".xtyle-image__full");
		expect(full?.getAttribute("src")).toBe("/full.jpg");
		expect(full?.getAttribute("alt")).toBe("Sky");
		expect(dialog()?.querySelector<HTMLElement>(".xtyle-image__lightbox-caption")?.textContent).toBe("Full sky");
	});

	it("promotes a non-interactive trigger to keyboard-operable and opens on Enter", () => {
		const scope = mount();
		const img = scope.querySelector("img") as HTMLImageElement;
		expect(img.getAttribute("role")).toBe("button");
		expect(img.getAttribute("tabindex")).toBe("0");
		expect(img.getAttribute("aria-label")).toBe("View image: Sky");
		img.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
		expect(dialog()?.querySelector(".xtyle-image__full")?.getAttribute("src")).toBe("/full.jpg");
	});
});
