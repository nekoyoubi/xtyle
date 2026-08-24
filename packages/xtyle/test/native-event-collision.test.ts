// @vitest-environment happy-dom
import { beforeAll, describe, expect, it } from "vitest";
import { listComponents } from "../src/manifest/registry.js";
import { loadFill } from "../src/elements/fragment-host.js";

/**
 * `input`, `change`, `select` and `click` are native DOM events that bubble out of any inner control a
 * component renders, and `input` and `click` cross a shadow boundary too. A component that declares one
 * of those names and *also* emits its own is heard twice by a consumer listening on the host — once for
 * its event, once for the native one that provoked it, the echo carrying no `detail`.
 *
 * **This catches only what a synthetic event can provoke.** happy-dom does not fire the native `change`
 * a real click produces, so a component whose emit path only runs on a genuine interaction reads clean
 * here — which is how `radio`'s double-fire survived this check. The real guard is `events.spec.ts` in
 * the visual suite, against a browser; this one is the fast gate's cheaper first pass, not the proof.
 */
const NATIVE = ["input", "change", "select", "click"];

const declared = listComponents().map((c) => ({
	id: c.id,
	names: (c.events ?? []).map((e) => e.name).filter((n) => NATIVE.includes(n)),
}));

beforeAll(async () => {
	const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
	proto.attachInternals = function attachInternals() {
		return { setFormValue() {}, setValidity() {}, states: new Set() };
	};
	await import("../src/elements/index.js");
});

async function fillFor(id: string): Promise<void> {
	try {
		const src = (await import(`../src/elements/fragments/${id}/source.generated.js`)) as {
			manifest: unknown;
			fragmentSources: Record<string, string>;
		};
		await loadFill(src.manifest, src.fragmentSources);
	} catch {
		/* the component ships no fill */
	}
}

describe("a component never echoes the native event it answers", () => {
	it.each(declared.filter((c) => c.names.length > 0))("$id", async ({ id, names }) => {
		await fillFor(id);
		document.body.innerHTML = "";
		const el = document.createElement(`xtyle-${id}`);
		el.setAttribute("label", "probe");
		document.body.appendChild(el);
		await new Promise((resolve) => setTimeout(resolve, 25));

		const scope = (el.shadowRoot ?? el) as ParentNode;
		const control = scope.querySelector("input, textarea, select");
		if (!control) return;

		for (const name of names) {
			const heard: string[] = [];
			const listen = (event: Event) =>
				heard.push(event.composedPath()[0] === el ? "own" : "native");
			el.addEventListener(name, listen);
			control.dispatchEvent(new Event(name, { bubbles: true, composed: true }));
			el.removeEventListener(name, listen);

			expect(heard, `<xtyle-${id}> emitted ${heard.join(" + ")} for "${name}"`).not.toEqual([
				"own",
				"native",
			]);
			expect(heard.filter((h) => h === "own").length).toBeLessThanOrEqual(1);
		}
	});
});
