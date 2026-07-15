// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
// the public entry point — this module is what `@xtyle/core/elements` resolves to. Everything a mod
// needs (the loader, the type to author the manifest against, and the elements themselves) is imported
// exactly the way a consumer imports it: no deep path into `elements/fragment-host.js`.
import { loadFill, loadedFillNames, XtyleBadge, type FillManifest } from "../src/elements/index.js";

/**
 * The release's central claim is that a third party can override a component's fill. This suite is that
 * claim taken literally: it installs a mod through the *public* surface — one import, no deep path — and
 * checks the override actually reaches the screen. If any of it needed `@xtyle/core/elements/fragment-host.js`,
 * the claim would not be true for anyone outside this repo.
 */
const squareBadge: { manifest: FillManifest; fragmentSources: Record<string, string> } = {
	manifest: {
		$schema: "https://xript.dev/schema/mod/v0.7.json",
		xript: "0.7",
		name: "public-api-badge-square",
		version: "0.0.1",
		title: "public-api-badge-square",
		description: "A test mod overriding the badge fill through the public elements entry point.",
		capabilities: ["xtyle.component.badge"],
		entry: { script: "mod.js", format: "script" },
		fills: {
			"component.badge": [{ id: "badge", format: "text/html+jsml", source: "badge.html" }],
		},
	},
	fragmentSources: {
		"badge.html": "<span data-root data-badge></span>\n",
		"mod.js": `"use strict";
(() => {
	function html(b) {
		var count = b.count === undefined || b.count === null ? "" : String(b.count);
		return '<b class="modded-badge" part="badge" data-tone="' + (b.tone || "neutral") + '">' + count + '</b>';
	}
	hooks.fragment.mount("badge", (b, ops) => { ops.replaceChildren("[data-badge]", html(b)); });
	hooks.fragment.update("badge", (b, ops) => { ops.replaceChildren("[data-badge]", html(b)); });
})();
`,
	},
};

/** Boot: the app installs its mod before anything has painted — the order a real app has. */
beforeAll(async () => {
	await loadFill(squareBadge.manifest, squareBadge.fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function make(attrs: Record<string, string> = {}): ShadowRoot {
	const el = document.createElement("xtyle-badge");
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	return el.shadowRoot as ShadowRoot;
}

describe("installing a component fill through the public elements entry point", () => {
	it("defines the elements as a side effect of the same import the loader came from", () => {
		expect(customElements.get("xtyle-badge")).toBe(XtyleBadge);
	});

	it("overrides the built-in fill end to end — the mod's markup is what renders", () => {
		const root = make({ count: "7", tone: "danger" });
		expect(root.querySelector(".modded-badge")?.textContent).toBe("7");
		expect(root.querySelector(".modded-badge")?.getAttribute("data-tone")).toBe("danger");
		expect(root.querySelector(".xtyle-badge__count")).toBeNull();
	});

	it("keeps the override winning as the element re-renders", () => {
		const el = document.createElement("xtyle-badge");
		el.setAttribute("count", "1");
		document.body.appendChild(el);
		el.setAttribute("count", "42");
		expect((el.shadowRoot as ShadowRoot).querySelector(".modded-badge")?.textContent).toBe("42");
	});

	it("reports the registration order, with xtyle's own fill pulled in ahead of the mod", () => {
		const names = loadedFillNames();
		expect(names.indexOf("xtyle-badge-default")).toBeGreaterThanOrEqual(0);
		expect(names.indexOf("xtyle-badge-default")).toBeLessThan(names.indexOf(squareBadge.manifest.name));
	});
});
