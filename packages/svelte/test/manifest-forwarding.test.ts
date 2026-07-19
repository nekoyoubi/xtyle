import type { Component } from "svelte";
import { describe, expect, it } from "vitest";
import { listComponents } from "../../xtyle/src/manifest/index.js";
import type { ComponentManifest, PropDef } from "../../xtyle/src/manifest/types.js";
import { kebab, render } from "./harness.js";

// The manifests are the source of truth for what each binding promises, so the sweep is driven off
// them rather than off a hand-kept list: a prop documented for the `svelte` binding is rendered with
// a value and the resulting element is read back. Static analysis proves a prop is *referenced*;
// this proves it lands on the element under the right name with the right value.
const key = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, "");

const wrappers = import.meta.glob<{ default: Component<any> }>("../src/*.svelte", { eager: true });
const byKey = new Map<string, { file: string; component: Component<any> }>();
for (const [path, mod] of Object.entries(wrappers)) {
	const file = path.slice(path.lastIndexOf("/") + 1);
	byKey.set(key(file.slice(0, -".svelte".length)), { file, component: mod.default });
}

type Shape = "enum" | "boolean" | "number" | "string";

interface Case {
	component: string;
	file: string;
	prop: string;
	shape: Shape;
	value: unknown;
	attribute: string;
	expected: string | true;
}

/** Only props that map to a single scalar attribute are swept. Arrays, objects, snippets, callbacks
 * and the `<threshold …>`-style config children reach the element by other means (a DOM property, a
 * slot, an event) and a missing attribute would say nothing about them. */
const shapeOf = (prop: PropDef): Shape | null => {
	const type = prop.type.trim();
	if (type.startsWith("<")) return null;
	if (prop.options?.length) return "enum";
	if (type === "boolean") return "boolean";
	if (type === "number") return "number";
	if (type === "string") return "string";
	return null;
};

const valueFor = (prop: PropDef, shape: Shape): unknown => {
	switch (shape) {
		case "enum": {
			// A non-default option is essential: most wrappers deliberately omit an attribute that still
			// carries its default value, so testing the default would report a passing wrapper as broken.
			const options = prop.options!;
			const picked = options.find((o) => o !== prop.default) ?? options[0];
			// `options` is written in HTML-attribute terms, so a `boolean | "overlay"` prop lists the
			// strings `"true"` / `"false"`. Sending the string to a Svelte binding passes a truthy
			// `"false"`, which is the opposite of what the author means; the boolean is what the prop
			// actually takes, and the wrapper serializes it back to the attribute.
			if (prop.type.includes("boolean") && (picked === "true" || picked === "false")) return picked === "true";
			return picked;
		}
		case "boolean":
			return prop.default !== "true";
		case "number":
			return prop.default === "42" ? 43 : 42;
		case "string":
			return "xtyle-probe";
	}
};

/**
 * Props the sweep cannot judge from a single-prop render, each with the precondition that makes it
 * unreachable in isolation. These were checked and found correct, not skipped for being awkward: the
 * sweep renders one prop at a time, so a prop gated on a *second* prop or on the shape of the data
 * can only ever read as absent here. Each is covered where its precondition can actually be set up —
 * `progress.rampMode` in `progress-forwarding.test.ts`.
 */
const UNREACHABLE_IN_ISOLATION: Record<string, string> = {
	"progress.rampMode": "only emitted when `ramp` is also set, so a lone rampMode is correctly dropped",
	"heatmap.categoryAxis": "only emitted for categorical data with the non-default `row` value",
	"tabs.lazy": "a wrapper-level render concern (which panels mount), never an element attribute",
};

/**
 * Attributes that legitimately deviate from the camelCase→kebab-case convention. The prop reaches
 * the element and the wrapper matches what the element observes; only the spelling is unusual, and
 * the element's observed name is public API that a raw-element consumer already depends on, so
 * renaming it would be a breaking change to fix a wart.
 */
const ATTRIBUTE_NAME_EXCEPTIONS: Record<string, string> = {
	"rating.allowHalf": "the element observes `allowhalf`; wrapper and element agree, and the name is public API",
};

const casesFor = (manifest: ComponentManifest): Case[] => {
	const entry = byKey.get(key(manifest.id));
	if (!entry) return [];
	const cases: Case[] = [];
	for (const prop of manifest.props) {
		if (!prop.bindings.includes("svelte")) continue;
		if (UNREACHABLE_IN_ISOLATION[`${manifest.id}.${prop.name}`]) continue;
		const shape = shapeOf(prop);
		if (!shape) continue;
		const value = valueFor(prop, shape);
		if (shape === "boolean" && value === false) continue;
		cases.push({
			component: manifest.id,
			file: entry.file,
			prop: prop.name,
			shape,
			value,
			attribute: kebab(prop.name),
			expected: shape === "boolean" ? true : String(value),
		});
	}
	return cases;
};

interface Finding extends Case {
	group: "not-rendered" | "attribute-absent" | "attribute-misnamed" | "value-mismatch" | "threw";
	detail: string;
	/** The prop spelling that produced the finding, which is not always the manifest's: a manifest
	 * documenting `line-numbers` is also probed as `lineNumbers`, and only a prop that reaches the
	 * element under neither spelling is genuinely dropped. */
	sentAs: string;
}

const camel = (name: string): string => name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/** Prop and attribute names compared as letters-and-digits only, so `leftMin`, `left-min` and
 * `leftmin` collapse together and naming drift is told apart from a dropped prop. */
const loose = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, "");

const attempt = async (c: Case, sentAs: string): Promise<Finding | null> => {
	const entry = byKey.get(key(c.component))!;
	let rendered: ReturnType<typeof render> | undefined;
	try {
		rendered = render(entry.component, { [sentAs]: c.value });
		const el = rendered.element;
		if (!el) return { ...c, sentAs, group: "not-rendered", detail: "wrapper produced no <xtyle-*> element" };

		// An attribute is only one of the two ways a prop legitimately reaches the element. A value that
		// does not survive attribute serialization (an array of series, a scorer function, a boolean the
		// element reads off a property) is assigned to the host instead, and several wrappers defer that
		// assignment to a microtask so an `open`-by-default element does not fire its popover on mount.
		// Both count as reaching the element, so both are waited for and checked.
		await Promise.resolve();
		await new Promise((r) => setTimeout(r, 0));
		const asProperty = (el as unknown as Record<string, unknown>)[sentAs];
		if (asProperty === c.value) return null;

		const names = el.getAttributeNames();
		const hit = names.find((n) => n === c.attribute) ?? names.find((n) => loose(n) === loose(c.prop));
		if (!hit) return { ...c, sentAs, group: "attribute-absent", detail: `present: [${names.join(", ")}]` };

		const actual = el.getAttribute(hit);
		if (c.expected !== true && actual !== c.expected)
			return { ...c, sentAs, group: "value-mismatch", detail: `${hit}: expected ${JSON.stringify(c.expected)}, got ${JSON.stringify(actual)}` };
		if (hit !== c.attribute && !ATTRIBUTE_NAME_EXCEPTIONS[`${c.component}.${c.prop}`])
			return { ...c, sentAs, group: "attribute-misnamed", detail: `landed as \`${hit}\`, kebab-case would be \`${c.attribute}\`` };
		return null;
	} catch (err) {
		return { ...c, sentAs, group: "threw", detail: (err as Error).message.split("\n")[0] };
	} finally {
		rendered?.destroy();
	}
};

const runCase = async (c: Case): Promise<Finding | null> => {
	const first = await attempt(c, c.prop);
	if (!first) return null;
	// A manifest that documents an already-kebab prop name gets a second pass under the camelCase
	// spelling the wrapper is likely to actually declare; if that one lands, the defect is the
	// manifest's documented name, not the wrapper's forwarding.
	const alt = camel(c.prop);
	if (alt === c.prop) return first;
	const second = await attempt(c, alt);
	return second ? first : { ...first, detail: `${first.detail} — but reaches the element when sent as \`${alt}\`` };
};

describe("manifest-driven prop forwarding", () => {
	const components = listComponents().filter((c) => c.bindings.includes("svelte"));

	it("every component declaring a svelte binding resolves to a wrapper module", () => {
		expect(components.filter((c) => !byKey.has(key(c.id))).map((c) => c.id)).toEqual([]);
	});

	const cases = components.flatMap(casesFor);

	it("sweeps a non-trivial number of props", () => {
		expect(cases.length).toBeGreaterThan(200);
	});

	// An exclusion naming a prop that no longer exists is an exclusion nobody is reading: the prop it
	// was reasoned about may have been renamed or dropped, and the entry now only hides its successor.
	it("every declared exclusion still names a real svelte-bound prop", () => {
		const real = new Set(
			components.flatMap((c) => c.props.filter((p) => p.bindings.includes("svelte")).map((p) => `${c.id}.${p.name}`)),
		);
		const declared = [...Object.keys(UNREACHABLE_IN_ISOLATION), ...Object.keys(ATTRIBUTE_NAME_EXCEPTIONS)];
		expect(declared.filter((k) => !real.has(k))).toEqual([]);
	});

	it("every documented scalar prop reaches the element", async () => {
		const findings = (await Promise.all(cases.map(runCase))).filter((f): f is Finding => f !== null);

		if (findings.length) {
			const byGroup = new Map<string, Finding[]>();
			for (const f of findings) byGroup.set(f.group, [...(byGroup.get(f.group) ?? []), f]);
			const lines: string[] = [`${findings.length} of ${cases.length} swept props did not reach the element`, ""];
			for (const [group, items] of [...byGroup].sort()) {
				lines.push(`## ${group} (${items.length})`);
				for (const f of items.sort((a, b) => a.component.localeCompare(b.component) || a.prop.localeCompare(b.prop)))
					lines.push(`  ${f.component}.${f.prop} [${f.shape}] value=${JSON.stringify(f.value)} attr=${f.attribute} :: ${f.detail}`);
				lines.push("");
			}
			console.error(lines.join("\n"));
		}

		expect(findings.map((f) => `${f.component}.${f.prop} (${f.group})`)).toEqual([]);
	});
});
