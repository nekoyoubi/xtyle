// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import "../src/elements/badge.js";
import "../src/elements/dot.js";
import { loadFill, loadedFillNames } from "../src/elements/fragment-host.js";
import { manifest as badgeManifest, fragmentSources as badgeSources } from "../src/elements/fragments/badge/source.generated.js";
import { manifest as dotManifest, fragmentSources as dotSources } from "../src/elements/fragments/dot/source.generated.js";

/**
 * Precedence is load order — every registered fill's ops for a fragment hook are concatenated in
 * registration order and the last one wins — so the host guarantees xtyle's own fill registers first
 * for its slot, whatever the app does. The mod-override suites cover the order an app actually has
 * (install at boot, paint later); these are the two orders around it: a built-in already warm when
 * the mod arrives, and a mod arriving after the component is already on screen.
 */

function fill(name: string, slot: string, id: string, html: string, script: string) {
	return {
		manifest: {
			$schema: "https://xript.dev/schema/mod/v0.7.json",
			xript: "0.7",
			name,
			version: "0.0.1",
			title: name,
			description: `A test mod overriding ${slot}.`,
			capabilities: [`xtyle.${slot}`],
			entry: { script: "mod.js", format: "script" },
			fills: { [slot]: [{ id, format: "text/html+jsml", source: "fill.html" }] },
		},
		fragmentSources: {
			"fill.html": html,
			"mod.js": script,
		},
	};
}

const squareBadge = fill(
	"test-badge-square",
	"component.badge",
	"badge",
	"<span data-root data-badge></span>\n",
	`"use strict";
(() => {
	function html(b) {
		return '<b class="modded-badge" part="badge">' + (b.count === undefined || b.count === null ? '' : String(b.count)) + '</b>';
	}
	hooks.fragment.mount("badge", (b, ops) => { ops.replaceChildren("[data-badge]", html(b)); });
	hooks.fragment.update("badge", (b, ops) => { ops.replaceChildren("[data-badge]", html(b)); });
})();
`,
);

const crossDot = fill(
	"test-dot-cross",
	"component.dot",
	"dot",
	"<span data-root data-dot></span>\n",
	`"use strict";
(() => {
	function html(b) {
		return '<i class="modded-dot" part="dot" data-tone="' + (b.tone || 'neutral') + '">x</i>';
	}
	hooks.fragment.mount("dot", (b, ops) => { ops.replaceChildren("[data-dot]", html(b)); });
	hooks.fragment.update("dot", (b, ops) => { ops.replaceChildren("[data-dot]", html(b)); });
})();
`,
);

afterEach(() => {
	document.body.innerHTML = "";
});

/** Badge and Dot resolve `auto` styling to a shadow root when created client-side, so their fill's
 * markup lives there — the surface a mod's ops land on. */
function make(tag: string, attrs: Record<string, string> = {}): ShadowRoot {
	const el = document.createElement(tag);
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	return el.shadowRoot as ShadowRoot;
}

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe("a mod loaded after the built-in is already warm", () => {
	it("still lands last, so it still wins", async () => {
		await loadFill(badgeManifest, badgeSources);
		await loadFill(squareBadge.manifest, squareBadge.fragmentSources);

		const names = loadedFillNames();
		expect(names.indexOf(badgeManifest.name)).toBeLessThan(names.indexOf(squareBadge.manifest.name));

		const root = make("xtyle-badge", { count: "7" });
		expect(root.querySelector(".modded-badge")?.textContent).toBe("7");
		expect(root.querySelector(".xtyle-badge__count")).toBeNull();
	});
});

describe("a mod loaded after the component has already painted", () => {
	it("repaints what is on screen instead of waiting for the next state change", async () => {
		const root = make("xtyle-dot", { tone: "danger" });
		await loadFill(dotManifest, dotSources);
		await flush();
		expect(root.querySelector(".xtyle-dot")).not.toBeNull();
		expect(root.querySelector(".modded-dot")).toBeNull();

		await loadFill(crossDot.manifest, crossDot.fragmentSources);

		const modded = root.querySelector(".modded-dot");
		expect(modded).not.toBeNull();
		expect(modded?.getAttribute("data-tone")).toBe("danger");
		expect(root.querySelector(".xtyle-dot")).toBeNull();
	});
});
