import { describe, expect, it } from "vitest";
import { appShellCss } from "../src/css/components/app-shell.js";
import { componentsCss } from "../src/css/components.js";

const dockSelectors = (): string[] =>
	appShellCss
		.split("}")
		.map((block) => block.slice(0, block.indexOf("{")))
		.filter((block) => block.includes("xtyle-dock"))
		.flatMap((block) => block.split(","))
		.map((selector) => selector.trim())
		.filter(Boolean);

describe("a dock inside a shell rail fills its column in either render mode", () => {
	it("gives the dock a standalone width to be overridden", () => {
		expect(componentsCss).toMatch(/xtyle-dock\[size="sm"\]\s*\{\s*width:/);
	});

	it("reaches a slotted dock from the host, which is light DOM under a shadow render", () => {
		const selectors = dockSelectors();
		expect(selectors).toContain('xtyle-app-shell > [slot="left"] xtyle-dock');
		expect(selectors).toContain('xtyle-app-shell > [slot="right"] xtyle-dock');
		expect(selectors).toContain('xtyle-app-shell > xtyle-dock[slot="left"]');
		expect(selectors).toContain('xtyle-app-shell > [slot="left"] xtyle-dock-zone');
	});

	it("outranks the standalone width, which is an attribute selector", () => {
		for (const selector of dockSelectors()) {
			if (!selector.startsWith("xtyle-app-shell")) continue;
			expect(selector, `${selector} ties or loses against xtyle-dock[size="sm"]`).toMatch(/\[[^\]]+\]/);
		}
	});

	it("leaves a dock that is not in a rail alone", () => {
		for (const selector of dockSelectors()) {
			expect(selector, `${selector} would stretch every dock on a page inside a shell`).not.toMatch(
				/^xtyle-app-shell\s+xtyle-dock(-zone)?$/,
			);
		}
	});
});
