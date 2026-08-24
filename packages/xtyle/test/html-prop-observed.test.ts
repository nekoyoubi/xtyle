// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import "../src/elements/index.js";
import { components } from "../src/manifest/index.js";
import type { PropDef } from "../src/manifest/types.js";

const elementsDir = join(import.meta.dirname, "..", "src", "elements");

const UA_OWNED_FORM_ATTRS = new Set(["name", "form"]);

function kebab(name: string): string {
	return name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

function attributeOf(prop: PropDef): string {
	return prop.attr ?? kebab(prop.name);
}

function elementFor(tag: string): { observedAttributes?: string[]; formAssociated?: boolean } | undefined {
	return customElements.get(tag) as { observedAttributes?: string[]; formAssociated?: boolean } | undefined;
}

function sourceFor(id: string): string {
	try {
		return readFileSync(join(elementsDir, `${id}.ts`), "utf8");
	} catch {
		return "";
	}
}

function readsAttribute(source: string, attribute: string): boolean {
	return source.includes(`getAttribute("${attribute}")`) || source.includes(`hasAttribute("${attribute}")`);
}

function styleSheetFor(id: string): string {
	try {
		return readFileSync(join(import.meta.dirname, "..", "src", "css", "components", `${id}.ts`), "utf8");
	} catch {
		return "";
	}
}

const htmlManifests = Object.values(components).filter((m) => m.bindings.includes("html") && m.props.length > 0);

const markupProps = htmlManifests.flatMap((manifest) => {
	const element = elementFor(`xtyle-${manifest.id}`);
	if (!element) return [];
	const observed = new Set(element.observedAttributes ?? []);
	const source = sourceFor(manifest.id);
	return manifest.props
		.filter((prop) => prop.bindings.includes("html"))
		.filter((prop) => !prop.name.includes("("))
		.map((prop) => ({ manifest, prop, element, observed, source }));
});

describe("a prop the manifest says you can write in markup is one the host observes", () => {
	it("has props to check, so a green run is not an empty one", () => {
		expect(markupProps.length).toBeGreaterThan(400);
	});

	it("covers every registered element, including the ones that observe nothing at all", () => {
		const unreached = htmlManifests
			.filter((m) => m.props.some((p) => p.bindings.includes("html")))
			.filter((m) => !markupProps.some((entry) => entry.manifest.id === m.id))
			.map((m) => `${m.id} declares html-bound props that no check ever reads`);
		expect(unreached).toEqual([]);
	});

	it("observes every attribute it offers, or says why it does not", () => {
		const stale = markupProps
			.filter(({ prop }) => !prop.readonly && !prop.propertyOnly && !prop.attrOn && !prop.unobserved)
			.filter(({ prop, element, observed }) => {
				const attribute = attributeOf(prop);
				if (observed.has(attribute)) return false;
				return !(element.formAssociated && UA_OWNED_FORM_ATTRS.has(attribute));
			})
			.map(
				({ manifest, prop }) =>
					`<xtyle-${manifest.id} ${attributeOf(prop)}> — the manifest offers that attribute and the element never observes it, so writing it in initial markup may work and every later change is silently ignored (give it an \`unobserved\` reason if not observing it is deliberate)`,
			);
		expect(stale).toEqual([]);
	});
});

describe("the escapes from that rule are claims, not mute buttons", () => {
	it("never lets a prop claim two different reasons at once", () => {
		const confused = markupProps
			.filter(({ prop }) => [prop.readonly, prop.propertyOnly, prop.attrOn, prop.unobserved].filter(Boolean).length > 1)
			.map(({ manifest, prop }) => `${manifest.id}.${prop.name}`);
		expect(confused).toEqual([]);
	});

	it("backs every `propertyOnly` with an accessor the element actually defines", () => {
		const missing = markupProps
			.filter(({ prop, source }) => prop.propertyOnly && source && !source.includes(`get ${prop.name}(`) && !source.includes(`set ${prop.name}(`))
			.map(
				({ manifest, prop }) =>
					`<xtyle-${manifest.id}>.${prop.name} — declared \`propertyOnly\`, so JS assignment is the only way to set it, but the element defines no such accessor`,
			);
		expect(missing).toEqual([]);
	});

	it("never offers a `propertyOnly` prop through the static Astro binding", () => {
		const unreachable = markupProps
			.filter(({ prop }) => prop.propertyOnly && prop.bindings.includes("astro"))
			.map(
				({ manifest, prop }) =>
					`${manifest.id}.${prop.name} claims an \`astro\` binding, but Astro renders on the server and hands back no instance, so a value only a JS assignment can deliver never arrives`,
			);
		expect(unreachable).toEqual([]);
	});

	it("makes every `unobserved` reason answer for itself", () => {
		const hollow: string[] = [];
		for (const { manifest, prop, observed, source } of markupProps) {
			const reason = prop.unobserved;
			if (!reason) continue;
			const attribute = attributeOf(prop);
			if (observed.has(attribute)) {
				hollow.push(`${manifest.id}.${prop.name} claims the host does not observe \`${attribute}\`, and the host observes it`);
				continue;
			}
			if (reason === "seed" && source && !readsAttribute(source, attribute)) {
				hollow.push(`${manifest.id}.${prop.name} claims \`${attribute}\` seeds state, but the element never reads it, so nothing is seeded from it`);
			}
			if (reason === "css" && !styleSheetFor(manifest.id).includes(`[${attribute}`)) {
				hollow.push(
					`${manifest.id}.${prop.name} claims the cascade applies \`${attribute}\`, but the component's stylesheet never selects on it, so writing it does nothing at all`,
				);
			}
		}
		expect(hollow).toEqual([]);
	});

	it("keeps the host out of any attribute it says belongs elsewhere", () => {
		const contradicted = markupProps
			.filter(({ prop, observed }) => prop.attrOn && observed.has(attributeOf(prop)))
			.map(
				({ manifest, prop }) =>
					`<xtyle-${manifest.id} ${attributeOf(prop)}> — declared as living on \`${prop.attrOn}\`, yet the host observes it too, so one of the two is wrong`,
			);
		expect(contradicted).toEqual([]);
	});

	it("holds a sibling element named by `attrOn` to the attribute it was handed", () => {
		const broken: string[] = [];
		for (const { manifest, prop } of markupProps) {
			const target = prop.attrOn;
			if (!target?.startsWith("xtyle-")) continue;
			const sibling = elementFor(target);
			if (!sibling) {
				broken.push(`${manifest.id}.${prop.name} names \`${target}\`, which the library never registers`);
				continue;
			}
			if (sibling.observedAttributes?.includes(attributeOf(prop))) continue;
			broken.push(
				`${manifest.id}.${prop.name} says its attribute lives on \`<${target}>\`, but that element does not observe \`${attributeOf(prop)}\` either`,
			);
		}
		expect(broken).toEqual([]);
	});
});
