import { describe, expect, it } from "vitest";
import { appShellCss } from "../src/css/components/app-shell.js";

function ruleBody(selector: string): string {
	const match = appShellCss.match(new RegExp(`(?:^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]*)\\}`));
	expect(match, `${selector} not found in the app-shell sheet`).not.toBeNull();
	return match?.[1] ?? "";
}

describe("the shell's off-screen skip link hides against the shell", () => {
	it("parks the link outside the box it is positioned in", () => {
		expect(ruleBody(".xtyle-app__skip-link")).toMatch(/position:\s*absolute/);
		expect(ruleBody(".xtyle-app__skip-link")).toMatch(/transform:\s*translateY\(calc\(-100%/);
	});

	it("makes the shell root the box that positions it", () => {
		expect(ruleBody(".xtyle-app")).toMatch(/position:\s*relative/);
	});
});
