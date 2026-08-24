import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { listComponents } from "../src/manifest/registry.js";

const here = dirname(fileURLToPath(import.meta.url));
const read = (path: string): string => (existsSync(path) ? readFileSync(path, "utf8") : "");
const escape = (name: string): string => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const shared = read(resolve(here, "../src/elements/base.ts"));

/**
 * An event a manifest declares is a name a consumer writes into `addEventListener`, and a wrapper
 * turns into an `on*` prop. A declared name the element never dispatches is a listener that silently
 * never fires — no error, no warning, and nothing to distinguish it from an event that simply has not
 * happened yet. `splitter` declared `resizeend` while dispatching `resize-end`, so the documented
 * handler and the Svelte wrapper's `onresizeend` were both dead for the life of the component.
 *
 * This is the name half of the promise; `event-detail-contract` covers the payload half.
 */
const declared = listComponents().flatMap((component) =>
	(component.events ?? []).map((event) => ({ id: component.id, name: event.name })),
);

describe("a declared event is one the element actually dispatches", () => {
	it("covers the whole event surface", () => {
		expect(declared.length).toBeGreaterThan(80);
	});

	it.each(declared)("$id dispatches $name", ({ id, name }) => {
		const body =
			read(resolve(here, `../src/elements/${id}.ts`)) +
			"\n" +
			read(resolve(here, `../src/elements/fragments/${id}/mod.ts`));
		if (!body.trim()) return;

		const literal = new RegExp(`["'\`]${escape(name)}["'\`]`);
		expect(
			literal.test(body) || literal.test(shared),
			`<xtyle-${id}>'s manifest declares a "${name}" event, but that name appears nowhere in its ` +
				`element or fragment source — so a consumer's addEventListener("${name}") never fires. ` +
				`Either dispatch it, or correct the manifest to the name that is dispatched.`,
		).toBe(true);
	});
});

/**
 * A declared `handler` is the prop name a consumer writes in a framework binding, so it is only true
 * if the wrapper actually exposes it. The naming is deliberately not asserted: the roster carries both
 * `onlistaction` and `onLayoutChange`, and each matches the wrapper it describes.
 */
const withHandler = listComponents().flatMap((component) =>
	(component.events ?? [])
		.filter((event) => event.handler && (component.bindings ?? []).includes("svelte"))
		.map((event) => ({ id: component.id, name: event.name, handler: event.handler as string })),
);

describe("a declared event handler is one the Svelte wrapper exposes", () => {
	const WRAPPER_DIR = resolve(here, "../../svelte/src/");

	it.each(withHandler)("$id's $name binds as $handler", ({ id, name, handler }) => {
		const pascal = id
			.split("-")
			.map((part) => part[0]?.toUpperCase() + part.slice(1))
			.join("");
		const wrapper = read(resolve(WRAPPER_DIR, `${pascal}.svelte`));
		if (!wrapper.trim()) return;

		expect(
			new RegExp(`\\b${escape(handler)}\\b`).test(wrapper),
			`<xtyle-${id}>'s manifest says "${name}" is bound as \`${handler}\`, but ${pascal}.svelte ` +
				`never mentions that name — so the documented prop does not exist.`,
		).toBe(true);
	});
});
