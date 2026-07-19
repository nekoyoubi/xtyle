// @vitest-environment happy-dom
import { beforeAll, describe, expect, it } from "vitest";
import "../src/elements/index.js";
import { builtInFillSlots } from "../src/elements/built-in-fills.js";
import { loadFill } from "../src/elements/fragment-host.js";

/**
 * The library's whole promise is that a component's markup is yours to replace. This is the test that says
 * so out loud, across every component at once.
 *
 * A fill reshapes a component through *ops*, and every loaded fill's ops are concatenated in registration
 * order — built-in first, mod last — so a mod that renames the root wins the first paint. The failure this
 * guards is what happens on the *second* one: a built-in that keys its class op to a hook the mod had to
 * keep stamps its own name back over the mod's on every repaint, so the reskin survives exactly until the
 * component's state changes and then quietly reverts.
 *
 * **A class is a fill's *private* name for a node. `data-*` and `part` are shared.** A built-in may key an
 * op to its own class — a mod that renames the node simply won't match, which is the correct outcome. It
 * may not key one to a hook the mod is obliged to keep, because then the mod cannot get out of the way.
 *
 * Two shapes are covered, and the second exists because the first missed 27 fills:
 *
 * 1. `skinMod` — renames the root *and re-asserts the name through its own op*, which runs last. It proves
 *    a mod can win a fight it chooses to have.
 * 2. `staticSkinMod` — a **mount-only** reskin that keeps `part` and names its node in *markup*. A static
 *    reskin has nothing to update, and `part` is the consumer's `::part()` contract, so keeping it is
 *    correct rather than careless. With nothing re-asserting on `update`, a built-in keyed to `[part="x"]`
 *    wiped it on the first state change — proven against `badge` and `stack` before the fills were rekeyed
 *    onto their own classes.
 */
// happy-dom ships no ElementInternals, and the form-associated components reach for it on construction
beforeAll(() => {
	const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
	if (!proto.attachInternals) {
		proto.attachInternals = function attachInternals() {
			return { setFormValue() {}, setValidity() {}, form: null, willValidate: true } as unknown as ElementInternals;
		};
	}
});

type Skinnable = { slot: string; id: string; tag: string };

function fillsUnderTest(): Skinnable[] {
	return builtInFillSlots().map((slot) => {
		const id = slot.replace(/^component\./, "");
		return { slot, id, tag: `xtyle-${id}` };
	});
}

/** A mod that renames the root and does nothing else — the smallest possible reskin. */
function skinMod(id: string, slot: string) {
	return {
		manifest: {
			$schema: "https://xript.dev/schema/mod/v0.7.json",
			xript: "0.7",
			name: `test-skin-${id}`,
			version: "0.0.1",
			title: `test-skin-${id}`,
			description: `A mod that renames ${id}'s root, and nothing else.`,
			capabilities: [`xtyle.${slot}`],
			entry: { script: "mod.js", format: "script" },
			fills: { [slot]: [{ id, format: "text/html+jsml", source: "skin.html" }] },
		},
		fragmentSources: {
			"skin.html": "<div data-root></div>\n",
			"mod.js": `"use strict";
(() => {
	hooks.fragment.mount(${JSON.stringify(id)}, (b, ops) => {
		ops.setAttr("[data-root]", "class", "skinned-${id}");
	});
})();
`,
		},
	};
}

/**
 * The reskin that doesn't fight back: it builds its markup once, names its node in that markup, and keeps
 * `part` so a consumer's `::part()` selectors survive the reskin. Nothing here re-asserts anything on
 * `update`, because a static reskin has nothing to update — so if the built-in reaches through `part`, the
 * name is gone the first time the component changes state and no one is left to put it back.
 */
function staticSkinMod(id: string, slot: string, marker: string) {
	return {
		manifest: {
			$schema: "https://xript.dev/schema/mod/v0.7.json",
			xript: "0.7",
			name: `test-static-skin-${id}`,
			version: "0.0.1",
			title: `test-static-skin-${id}`,
			description: `A mount-only reskin of ${id} that keeps its part.`,
			capabilities: [`xtyle.${slot}`],
			entry: { script: "mod.js", format: "script" },
			fills: { [slot]: [{ id, format: "text/html+jsml", source: "skin.html" }] },
		},
		fragmentSources: {
			"skin.html": `<div data-root ${marker}></div>\n`,
			"mod.js": `"use strict";
(() => {
	hooks.fragment.mount(${JSON.stringify(id)}, (b, ops) => {
		ops.replaceChildren("[${marker}]", '<span part="${id}" class="static-skinned-${id}">skinned</span>');
	});
})();
`,
		},
	};
}

/** Force the component to repaint through the door a real app repaints it through: a state change. */
function repaint(el: HTMLElement): boolean {
	const observed = (el.constructor as unknown as { observedAttributes?: string[] }).observedAttributes ?? [];
	const attr = observed[0];
	if (!attr) return false;
	el.setAttribute(attr, el.getAttribute(attr) ?? "");
	return true;
}

describe("a mod's own class survives the built-in fill's repaint", () => {
	const fills = fillsUnderTest();

	it("covers every component that has a built-in fill", () => {
		expect(fills.length).toBeGreaterThan(60);
	});

	for (const { id, slot, tag } of fills) {
		it(`${id}: the built-in never stamps its class back over the mod's`, async () => {
			const mod = skinMod(id, slot);
			await loadFill(mod.manifest, mod.fragmentSources);

			const el = document.createElement(tag);
			// content-driven components (carousel, tabs, tree…) decline to paint an empty shell, so every
			// element under test gets something to render
			el.innerHTML = "<div>one</div><div>two</div>";
			document.body.appendChild(el);
			const root = (el.shadowRoot ?? el) as ShadowRoot | HTMLElement;

			const painted = root.querySelector(`.skinned-${id}`);
			expect(painted, `${id}: the mod's class never made it onto the first paint`).not.toBeNull();

			const repainted = repaint(el);
			if (repainted) {
				const after = root.querySelector(`.skinned-${id}`);
				expect(after, `${id}: the built-in fill stamped its class back over the mod's on repaint`).not.toBeNull();
			}
			el.remove();
		});
	}
});

/**
 * The same promise, for a mod that doesn't re-assert itself every paint.
 *
 * These are the components whose built-in draws its markup inside a `data-*` marker — the shape where the
 * built-in used to address its own output through `[part="x"]` and, in doing so, reached through a hook a
 * mod keeps for the consumer's sake. Rekeying those ops onto the built-in's own class is what makes a
 * renamed node stop matching, which is how a mod gets out of the way without a fight.
 */
const STATIC_SKINS: { id: string; slot: string; marker: string; tag: string }[] = [
	{ id: "badge", slot: "component.badge", marker: "data-badge", tag: "xtyle-badge" },
	{ id: "stack", slot: "component.stack", marker: "data-stack", tag: "xtyle-stack" },
	{ id: "text", slot: "component.text", marker: "data-text", tag: "xtyle-text" },
	{ id: "kbd", slot: "component.kbd", marker: "data-kbd", tag: "xtyle-kbd" },
	{ id: "button", slot: "component.button", marker: "data-button", tag: "xtyle-button" },
	{ id: "card", slot: "component.card", marker: "data-card", tag: "xtyle-card" },
	{ id: "heading", slot: "component.heading", marker: "data-heading", tag: "xtyle-heading" },
	{ id: "link", slot: "component.link", marker: "data-link", tag: "xtyle-link" },
	{ id: "spinner", slot: "component.spinner", marker: "data-spinner", tag: "xtyle-spinner" },
	{ id: "dot", slot: "component.dot", marker: "data-dot", tag: "xtyle-dot" },
];

describe("a mount-only reskin keeps its name without re-asserting it", () => {
	for (const { id, slot, marker, tag } of STATIC_SKINS) {
		it(`${id}: the built-in does not reach through the part the mod kept`, async () => {
			const mod = staticSkinMod(id, slot, marker);
			await loadFill(mod.manifest, mod.fragmentSources);

			const el = document.createElement(tag);
			el.innerHTML = "<span>one</span>";
			document.body.appendChild(el);
			const root = (el.shadowRoot ?? el) as ShadowRoot | HTMLElement;

			expect(
				root.querySelector(`.static-skinned-${id}`),
				`${id}: the mod's class never made it onto the first paint`,
			).not.toBeNull();

			if (repaint(el)) {
				expect(
					root.querySelector(`.static-skinned-${id}`),
					`${id}: the built-in reached through part= and wiped the mod's class on repaint — a static reskin has no update hook to put it back`,
				).not.toBeNull();
			}
			el.remove();
		});
	}
});
