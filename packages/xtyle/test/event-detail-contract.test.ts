// @vitest-environment happy-dom
import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { listComponents } from "../src/manifest/registry.js";

const here = dirname(fileURLToPath(import.meta.url));
const read = (path: string): string => (existsSync(path) ? readFileSync(path, "utf8") : "");
const escape = (name: string): string => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * A manifest that declares `detail` is a promise the reference page renders and the MCP server serves.
 * An element that answers it with a plain `Event` leaves `event.detail` undefined, so a consumer reading
 * the documented payload gets `undefined` — or throws reaching through it. The two must agree.
 */
const declared = listComponents().flatMap((component) =>
	(component.events ?? [])
		.filter((event) => event.detail)
		.map((event) => ({ id: component.id, name: event.name, detail: event.detail as string })),
);

beforeAll(() => {
	expect(declared.length).toBeGreaterThan(50);
});

describe("an event that documents a payload dispatches one", () => {
	it.each(declared)("$id emits $name with its detail", ({ id, name }) => {
		const body =
			read(resolve(here, `../src/elements/${id}.ts`)) +
			"\n" +
			read(resolve(here, `../src/elements/fragments/${id}/mod.ts`));
		if (!body.trim()) return;

		const bare = new RegExp(`new Event\\(\\s*["\`]${escape(name)}["\`]`).test(body);
		expect(
			bare,
			`<xtyle-${id}> dispatches "${name}" as a plain Event, so event.detail is undefined — ` +
				`but its manifest documents a payload. Emit it through emitOwn(type, source, detail).`,
		).toBe(false);
	});
});

describe("emitOwn carries a detail wherever a payload is documented", () => {
	it("no element calls the bare one-argument form for a documented event", () => {
		const offenders: string[] = [];
		for (const { id, name } of declared) {
			const body = read(resolve(here, `../src/elements/${id}.ts`));
			if (!body.trim()) continue;
			if (new RegExp(`emitOwn\\(\\s*["\`]${escape(name)}["\`]\\s*\\)`).test(body)) {
				offenders.push(`${id}.${name}`);
			}
		}
		expect(offenders).toEqual([]);
	});
});
