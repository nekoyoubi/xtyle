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
 * guards is what happens on the *second* one: a built-in that keys its class op to `[data-root]` — the very
 * hook a mod must keep in order to inherit the behavior — stamps its own name back over the mod's on every
 * repaint, so the reskin survives exactly until the component's state changes and then quietly reverts.
 *
 * A class is a fill's *private* name for a node. Only `data-*` is shared.
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
