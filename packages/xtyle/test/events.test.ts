import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { listComponents } from "../src/manifest/registry.js";

const here = dirname(fileURLToPath(import.meta.url));
const elements = resolve(here, "../src/elements");
const fragments = resolve(elements, "fragments");
const wrappers = resolve(here, "../../svelte/src");

const LITERAL =
	/new (?:Custom)?Event\(\s*"([^"]+)"|this\.emit\(\s*"([^"]+)"|emit:\s*\{\s*type:\s*"([^"]+)"|"(xtyle:[a-z-]+)"/g;
const HANDLER = /^\s*(on[A-Za-z][A-Za-z]*)\??:/gm;

function read(file: string): string {
	return existsSync(file) ? readFileSync(file, "utf8") : "";
}

/** Every event name the element or its fill dispatches as a string literal. Dynamic dispatch (a fill's
 * `intent.emit.type`) is invisible here, which is why this direction is one-way: what it sees must be
 * declared, and what it cannot see is covered by the wrapper check below. */
function emitted(id: string): Set<string> {
	const source = read(resolve(elements, `${id}.ts`)) + read(resolve(fragments, id, "mod.ts"));
	const names = new Set<string>();
	for (const match of source.matchAll(LITERAL)) names.add((match[1] ?? match[2] ?? match[3] ?? match[4])!);
	return names;
}

const pascal = (id: string): string =>
	id
		.split("-")
		.map((part) => part[0]!.toUpperCase() + part.slice(1))
		.join("");

/** The handler props a Svelte wrapper declares, or null when there is no wrapper. */
function handlerProps(id: string): Set<string> | null {
	const file = resolve(wrappers, `${pascal(id)}.svelte`);
	if (!existsSync(file)) return null;
	const source = readFileSync(file, "utf8");
	const start = source.indexOf("interface Props");
	const end = source.search(/\}(?::\s*Props)?\s*=\s*\$props\(\)/);
	if (start < 0 || end < 0) throw new Error(`cannot read the Props block of ${id}`);
	const props = new Set<string>();
	for (const match of source.slice(start, end).matchAll(HANDLER)) props.add(match[1]!);
	return props;
}

/** Every spelling a wrapper could plausibly give this event: the declared one, the flattened one, the
 * camelCased one, and the literal. A hyphenated or namespaced event has no valid identifier, so the
 * wrapper always renames it, and the manifest has to publish which rename it chose. */
function candidates(name: string, declared?: string): string[] {
	const flat = `on${name.replace(/[-:]/g, "")}`;
	const camel =
		"on" +
		name
			.replace(/^xtyle:/, "")
			.split(/[-:]/)
			.map((part) => part[0]!.toUpperCase() + part.slice(1))
			.join("");
	return [declared, flat, camel, `on${name}`].filter((c): c is string => Boolean(c));
}

describe("the manifest says what each component emits", () => {
	it("declares every event the element dispatches by name", () => {
		const gaps: string[] = [];
		for (const manifest of listComponents()) {
			const declared = new Set((manifest.events ?? []).map((event) => event.name));
			for (const name of emitted(manifest.id)) if (!declared.has(name)) gaps.push(`${manifest.id}.${name}`);
		}
		expect(gaps).toEqual([]);
	});

	it("names the wrapper's handler prop wherever it is not `on` plus the event", () => {
		const drift: string[] = [];
		for (const manifest of listComponents()) {
			const props = handlerProps(manifest.id);
			if (!props) continue;
			for (const event of manifest.events ?? []) {
				const found = candidates(event.name, event.handler).find((c) => props.has(c));
				const claimsSvelte = event.bindings.includes("svelte");
				if (found && !claimsSvelte) drift.push(`${manifest.id}.${event.name}: wrapper has ${found}, manifest omits svelte`);
				if (!found && claimsSvelte) drift.push(`${manifest.id}.${event.name}: manifest claims svelte, wrapper has no handler`);
				if (found && found !== `on${event.name}` && event.handler !== found)
					drift.push(`${manifest.id}.${event.name}: wrapper spells it ${found}, manifest says ${event.handler ?? "(nothing)"}`);
			}
		}
		expect(drift).toEqual([]);
	});

	it("leaves the field off a component that emits nothing, rather than publishing an empty promise", () => {
		for (const manifest of listComponents()) {
			if (manifest.events) expect(manifest.events.length, manifest.id).toBeGreaterThan(0);
			if (emitted(manifest.id).size > 0) expect(manifest.events, manifest.id).toBeTruthy();
		}
	});

	it("is reading real manifests, not passing because the registry came back empty", () => {
		const emitters = listComponents().filter((manifest) => manifest.events?.length);
		expect(emitters.length).toBeGreaterThan(40);
	});
});
