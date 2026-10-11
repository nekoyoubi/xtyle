// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import "../src/elements/progress.js";
import "../src/elements/toc.js";
import { hostData, loadFill } from "../src/elements/fragment-host.js";
import * as progress from "../src/elements/fragments/progress/source.generated.js";
import * as toc from "../src/elements/fragments/toc/source.generated.js";

beforeAll(async () => {
	await loadFill(progress.manifest, progress.fragmentSources);
	await loadFill(toc.manifest, toc.fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function mount(markup: string): HTMLElement {
	document.body.innerHTML = markup;
	return document.body.firstElementChild as HTMLElement;
}

describe("the host's data-* attributes", () => {
	it("re-render any component when an author's data attribute changes", async () => {
		const el = mount(`<xtyle-progress value="40" aria-label="Load" data-rank="1"></xtyle-progress>`);
		const render = vi.spyOn(el as unknown as Record<string, () => void>, "render");
		el.setAttribute("data-rank", "2");
		await tick();
		expect(render).toHaveBeenCalledTimes(1);
	});

	it("leave a component alone when a data write lands on the value already there", async () => {
		const el = mount(`<xtyle-progress value="40" aria-label="Load" data-rank="1"></xtyle-progress>`);
		const render = vi.spyOn(el as unknown as Record<string, () => void>, "render");
		el.removeAttribute("data-rank");
		el.setAttribute("data-rank", "1");
		await tick();
		expect(render).not.toHaveBeenCalled();
	});

	it("never reach a fill or a re-render when the element wrote them itself", async () => {
		const el = mount(`<xtyle-toc items='[{"id":"a","label":"A"}]'></xtyle-toc>`);
		await tick();
		const render = vi.spyOn(el as unknown as Record<string, () => void>, "render");
		el.removeAttribute("data-spy");
		el.setAttribute("data-spy", "");
		await tick();
		expect(render).not.toHaveBeenCalled();
		expect(hostData(el)).not.toHaveProperty("spy");
	});
});
