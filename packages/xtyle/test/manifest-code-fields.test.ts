import { describe, expect, it } from "vitest";
import { components } from "../src/manifest/index.js";

type Field = { id: string; where: string; value: string };

const codeFields: Field[] = [];
const proseFields: Field[] = [];

const code = (id: string, where: string, value: string | undefined) => {
	if (typeof value === "string") codeFields.push({ id, where, value });
};
const prose = (id: string, where: string, value: string | undefined) => {
	if (typeof value === "string") proseFields.push({ id, where, value });
};

for (const manifest of Object.values(components)) {
	const { id } = manifest;
	prose(id, "summary", manifest.summary);
	prose(id, "description", manifest.description);
	(manifest.composition ?? []).forEach((note, i) => prose(id, `composition[${i}]`, note));
	(manifest.a11y ?? []).forEach((note, i) => prose(id, `a11y[${i}]`, note));

	for (const p of manifest.props) {
		code(id, `props.${p.name}.type`, p.type);
		code(id, `props.${p.name}.default`, p.default);
		(p.options ?? []).forEach((o, i) => code(id, `props.${p.name}.options[${i}]`, o));
		prose(id, `props.${p.name}.description`, p.description);
	}
	for (const e of manifest.events ?? []) {
		code(id, `events.${e.name}.detail`, e.detail);
		code(id, `events.${e.name}.handler`, e.handler);
		prose(id, `events.${e.name}.description`, e.description);
	}
	for (const m of manifest.methods ?? []) {
		code(id, `methods.${m.name}.params`, m.params);
		code(id, `methods.${m.name}.returns`, m.returns);
		prose(id, `methods.${m.name}.description`, m.description);
	}
	for (const group of ["variants", "sizes", "states", "anatomy", "slots"] as const) {
		for (const entry of manifest[group] ?? [])
			prose(id, `${group}.${entry.name ?? entry.id}.description`, entry.description);
	}
	for (const example of manifest.examples) {
		prose(id, `examples.${example.id}.title`, example.title);
		prose(id, `examples.${example.id}.description`, example.description);
	}
}

describe("a manifest field carries backticks only where the page runs markdown over it", () => {
	it("found fields of both kinds, so a green run is not an empty one", () => {
		expect(codeFields.length).toBeGreaterThan(200);
		expect(proseFields.length).toBeGreaterThan(500);
	});

	it("leaves backticks out of the fields that render as code", () => {
		const marked = codeFields
			.filter((f) => f.value.includes("`"))
			.map((f) => `${f.id} ${f.where}: ${f.value} — renders mono verbatim, so the backticks reach the page as themselves`);
		expect(marked).toEqual([]);
	});

	it("keeps the prose fields balanced, so no stray backtick survives the markdown pass", async () => {
		const { renderMarkdownInline } = await import("../src/markup/index.js");
		const stray = proseFields
			.filter((f) => f.value.includes("`") && renderMarkdownInline(f.value).includes("`"))
			.map((f) => `${f.id} ${f.where}: an unpaired backtick renders as itself`);
		expect(stray).toEqual([]);
	});
});
