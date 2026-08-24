// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import "../src/elements/toc.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/toc/source.generated.js";

type ObserverCallback = (entries: { target: { id: string }; isIntersecting: boolean }[]) => void;

let fire: ObserverCallback | undefined;

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
	fire = undefined;
	vi.unstubAllGlobals();
});

/**
 * The band the spy watches is a thin strip near the top of the viewport, so two headings sit inside it
 * at once whenever a section is shorter than the strip is tall. Which one wins is the whole behavior.
 */
function mount(ids: string[]): HTMLElement {
	vi.stubGlobal(
		"IntersectionObserver",
		class {
			constructor(cb: ObserverCallback) {
				fire = cb;
			}
			observe(): void {}
			disconnect(): void {}
			unobserve(): void {}
		},
	);
	for (const id of ids) {
		const heading = document.createElement("h2");
		heading.id = id;
		document.body.appendChild(heading);
	}
	const toc = document.createElement("xtyle-toc");
	toc.setAttribute("items", JSON.stringify(ids.map((id) => ({ id, label: id.toUpperCase() }))));
	document.body.appendChild(toc);
	return toc;
}

function active(toc: HTMLElement): string | null {
	const root = toc.shadowRoot ?? toc;
	return root.querySelector("[aria-current]")?.getAttribute("data-toc-link") ?? null;
}

describe("the table of contents' scroll spy", () => {
	it("follows the section the reader just entered, not the one still trailing the band", () => {
		const toc = mount(["intro", "middle", "end"]);
		fire?.([{ target: { id: "intro" }, isIntersecting: true }]);
		expect(active(toc)).toBe("intro");

		fire?.([{ target: { id: "middle" }, isIntersecting: true }]);
		expect(active(toc)).toBe("middle");
	});

	it("falls back to the trailing section once the newer one leaves the band", () => {
		const toc = mount(["intro", "middle", "end"]);
		fire?.([
			{ target: { id: "intro" }, isIntersecting: true },
			{ target: { id: "middle" }, isIntersecting: true },
		]);
		expect(active(toc)).toBe("middle");

		fire?.([{ target: { id: "middle" }, isIntersecting: false }]);
		expect(active(toc)).toBe("intro");
	});

	it("reads document order rather than the order the observer reports entries in", () => {
		const toc = mount(["intro", "middle", "end"]);
		fire?.([
			{ target: { id: "end" }, isIntersecting: true },
			{ target: { id: "intro" }, isIntersecting: true },
		]);
		expect(active(toc)).toBe("end");
	});
});
