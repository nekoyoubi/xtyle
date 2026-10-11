import { test, expect } from "@playwright/test";

const CASES = [
	{ tag: "xtyle-progress", attrs: { value: "40", max: "100", "aria-label": "Load" }, attr: "value", other: "60" },
	{ tag: "xtyle-switch", attrs: { label: "Wi-Fi", checked: "" }, attr: "label", other: "Bluetooth" },
	{ tag: "xtyle-icon", attrs: { name: "check" }, attr: "name", other: "close" },
] as const;

for (const { tag, attrs, attr, other } of CASES) {
	test(`a same-value write leaves ${tag}'s render root untouched`, async ({ page }) => {
		await page.goto("/components/progress/");
		const counts = await page.evaluate(
			async ({ tag, attrs, attr, other }) => {
				await customElements.whenDefined(tag);
				const el = document.createElement(tag);
				for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
				document.body.appendChild(el);
				const settle = () => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 50)));
				await settle();
				const root: Node = el.shadowRoot ?? el;
				let mutations = 0;
				const observer = new MutationObserver((records) => (mutations += records.filter((record) => record.target !== el).length));
				observer.observe(root, { subtree: true, childList: true, attributes: true, characterData: true });
				for (let quiet = 0; quiet < 3; ) {
					const last = mutations;
					await settle();
					quiet = last === mutations ? quiet + 1 : 0;
				}
				mutations = 0;
				el.setAttribute(attr, el.getAttribute(attr) ?? "");
				await settle();
				const same = mutations;
				el.setAttribute(attr, other);
				await settle();
				observer.disconnect();
				el.remove();
				return { same, moved: mutations - same };
			},
			{ tag, attrs, attr, other },
		);
		expect(counts.same, "a write that changes nothing must not repaint").toBe(0);
		expect(counts.moved, "the observer must see a write that does change something").toBeGreaterThan(0);
	});
}
