import { describe, expect, it } from "vitest";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";

describe("radio description + card", () => {
	it("wires a description to the input's aria-describedby and renders it as a part", async () => {
		const html = await renderFragmentLight("radio", {
			name: "sync",
			value: "linked",
			label: "Linked",
			description: "Changes sync both ways.",
			descriptionId: "desc-1",
			checked: true,
		});
		expect(html).toContain('aria-describedby="desc-1"');
		expect(html).toContain('part="description"');
		expect(html).toContain('id="desc-1"');
		expect(html).toContain(">Changes sync both ways.</span>");
		// the description span is visible (not hidden) when there is text
		expect(html).not.toMatch(/part="description"[^>]*hidden/);
	});

	it("hides the description and adds no aria-describedby when there is no description", async () => {
		const html = await renderFragmentLight("radio", {
			name: "sync",
			value: "manual",
			label: "Manual",
			descriptionId: "desc-2",
		});
		expect(html).not.toContain("aria-describedby");
		expect(html).toMatch(/part="description"[^>]*hidden/);
	});

	it("adds the card class when card is set", async () => {
		const html = await renderFragmentLight("radio", {
			name: "sync",
			value: "linked",
			label: "Linked",
			card: true,
			descriptionId: "desc-3",
		});
		expect(html).toContain("xtyle-radio--card");
	});

	it("escapes description markup", async () => {
		const html = await renderFragmentLight("radio", {
			name: "x",
			value: "y",
			label: "Y",
			description: "<b>hi</b>",
			descriptionId: "desc-4",
		});
		expect(html).toContain("&lt;b&gt;hi&lt;/b&gt;");
		expect(html).not.toContain("<b>hi</b>");
	});
});
