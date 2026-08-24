import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { listComponents } from "@xtyle/core";

/**
 * The engine suite cannot cover this: happy-dom has no real form owner, so a control that posts
 * nothing, posts twice, or ignores its own `required` looks identical there to one that works. The
 * whole contract is visible in one `new FormData(form)` and in no other way.
 *
 * **Both render modes, because they disagree.** A themed element renders light DOM over Astro-SSR
 * structure and shadow when built bare, and form participation is exactly where that seam bites: in
 * light DOM an inner native control is already inside the form and posts on its own, while behind a
 * shadow root it is invisible and the host's `ElementInternals` is the only channel. A component that
 * uses both posts twice; one that uses neither posts nothing. The site only ever renders the light
 * half, so a Svelte or raw-elements consumer was the only one who could see the shadow half break.
 *
 * A component no recipe reaches proves nothing, so the roster is checked against the elements that
 * actually claim form participation rather than letting a hand-kept list read as coverage.
 */

type Recipe = { attrs: Record<string, string>; children?: string; expect: string };

const RECIPES: Record<string, Recipe> = {
	field: { attrs: { label: "F", value: "v1" }, expect: "v1" },
	textarea: { attrs: { label: "T", value: "v2" }, expect: "v2" },
	select: {
		attrs: { label: "S", value: "b" },
		children: `<option value="a">a</option><option value="b">b</option>`,
		expect: "b",
	},
	combobox: { attrs: { label: "C", options: "a,b", value: "b" }, expect: "b" },
	checkbox: { attrs: { label: "K", value: "on", checked: "" }, expect: "on" },
	switch: { attrs: { label: "W", value: "on", checked: "" }, expect: "on" },
	radio: { attrs: { label: "R", value: "r1", checked: "" }, expect: "r1" },
	"number-input": { attrs: { label: "N", value: "7" }, expect: "7" },
	slider: { attrs: { label: "L", value: "30" }, expect: "30" },
	segmented: { attrs: { label: "G", options: "p,q", value: "q" }, expect: "q" },
	rating: { attrs: { label: "A", value: "3" }, expect: "3" },
	"color-picker": { attrs: { label: "P", value: "#336699" }, expect: "#336699" },
	"date-picker": { attrs: { label: "D", value: "2026-01-02" }, expect: "2026-01-02" },
};

/** Elements that claim form participation, not every component with a prop spelled `name`: `icon`'s
 * `name` is a glyph, and a prop-name heuristic sweeps it in. */
async function formAssociated(page: Page): Promise<string[]> {
	const ids = listComponents().map((c) => c.id);
	return page.evaluate(
		(ids) =>
			ids.filter((id) => {
				const ctor = customElements.get(`xtyle-${id}`) as (CustomElementConstructor & { formAssociated?: boolean }) | undefined;
				return !!ctor?.formAssociated;
			}),
		ids,
	);
}

function declares(id: string, prop: string): boolean {
	const component = listComponents().find((c) => c.id === id);
	return (component?.props ?? []).some((p) => p.name === prop);
}

async function shadowProbe(page: Page, id: string, recipe: Recipe, extra: Record<string, string> = {}) {
	return page.evaluate(
		async ({ id, recipe, extra }) => {
			const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
			const form = document.createElement("form");
			const el = document.createElement(`xtyle-${id}`);
			el.setAttribute("name", "probe");
			for (const [k, v] of Object.entries({ ...recipe.attrs, ...extra })) el.setAttribute(k, v);
			if (recipe.children) el.innerHTML = recipe.children;
			form.appendChild(el);
			document.body.appendChild(form);
			await wait(900);
			const entries = [...new FormData(form).entries()].map(([k, v]) => `${k}=${String(v)}`);
			const valid = form.checkValidity();
			const isShadow = !!(el as HTMLElement & { shadowRoot: ShadowRoot | null }).shadowRoot;
			form.remove();
			return { entries, valid, isShadow };
		},
		{ id, recipe, extra },
	);
}

/**
 * Deliberately renames nothing: an inner control's `name` is written into the SSR scaffold, so setting
 * a different one on the host afterwards reads as a missing entry rather than the duplicate it is.
 * What this mode has to prove is that one control does not post under one key twice, and that survives
 * whatever name and value the demo happened to use.
 */
async function lightKeys(page: Page, id: string): Promise<string[] | null> {
	return page.evaluate(
		async (id) => {
			const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
			const hosts = [...document.querySelectorAll(`xtyle-${id}[name]`)];
			if (hosts.length === 0) return null;
			const seen: string[] = [];
			for (const host of hosts) {
				const anchor = document.createComment("");
				host.parentElement?.insertBefore(anchor, host);
				const form = document.createElement("form");
				document.body.appendChild(form);
				form.appendChild(host);
				await wait(350);
				const keys = [...new FormData(form).keys()];
				anchor.parentElement?.insertBefore(host, anchor);
				anchor.remove();
				form.remove();
				const duplicated = keys.filter((k, i) => keys.indexOf(k) !== i);
				if (duplicated.length > 0) return keys;
				seen.push(...keys);
			}
			return seen;
		},
		id,
	);
}

test.describe("form contract", () => {
	test("every form-associated control is reachable by a recipe", async ({ page }) => {
		await page.goto("/components/field/");
		const missing = (await formAssociated(page)).filter((id) => !RECIPES[id]);
		expect(missing, "a form-associated control with no recipe is untested, not passing").toEqual([]);
	});

	for (const id of Object.keys(RECIPES)) {
		test(`${id} posts its value exactly once`, async ({ page }) => {
			test.setTimeout(90_000);
			await page.goto(`/components/${id}/`);
			const recipe = RECIPES[id];

			const shadow = await shadowProbe(page, id, recipe);
			expect(shadow.entries, `${id} built bare must post exactly one entry`).toEqual([
				`probe=${recipe.expect}`,
			]);

			const keys = await lightKeys(page, id);
			expect(
				keys,
				`${id}'s page renders no host carrying a \`name\`, so the light-DOM half of this test cannot run. A skip here reads as coverage and is not: give the demo a named instance.`,
			).not.toBeNull();
			const duplicated = (keys ?? []).filter((k, i) => (keys ?? []).indexOf(k) !== i);
			expect(
				duplicated,
				`${id} (light DOM) posted a key twice — the inner control and the host both reported`,
			).toEqual([]);
		});
	}

	for (const id of ["field", "select", "textarea"]) {
		test(`${id} renamed in light DOM posts under the new name`, async ({ page }) => {
			await page.goto(`/components/${id}/`);
			const keys = await page.evaluate(async (id) => {
				const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
				const host = document.querySelector(`xtyle-${id}[name]`);
				if (!host) return null;
				const form = document.createElement("form");
				host.parentElement?.insertBefore(form, host);
				form.appendChild(host);
				await wait(700);
				host.setAttribute("name", "renamed");
				await wait(700);
				const out = [...new FormData(form).keys()];
				form.remove();
				return out;
			}, id);
			if (!keys) return;
			expect(
				keys,
				`${id} kept posting under the name the SSR scaffold baked in — the inner control never resynced`,
			).toEqual(["renamed"]);
		});
	}

	for (const id of Object.keys(RECIPES).filter((id) => declares(id, "required"))) {
		test(`${id} required blocks an empty form`, async ({ page }) => {
			await page.goto(`/components/${id}/`);
			const empty: Recipe = { ...RECIPES[id], attrs: { ...RECIPES[id].attrs, value: "" }, expect: "" };
			const probe = await shadowProbe(page, id, empty, { required: "" });
			expect(probe.valid, `${id} (shadow) with \`required\` and no value must not validate`).toBe(false);
		});
	}

	for (const id of Object.keys(RECIPES).filter((id) => declares(id, "requiredMessage"))) {
		test(`${id} lets the required message be replaced`, async ({ page }) => {
			await page.goto(`/components/${id}/`);
			const empty: Recipe = { ...RECIPES[id], attrs: { ...RECIPES[id].attrs, value: "" }, expect: "" };
			const message = await page.evaluate(
				async ({ id, recipe }) => {
					const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
					const form = document.createElement("form");
					const el = document.createElement(`xtyle-${id}`) as HTMLElement & { validationMessage?: string };
					el.setAttribute("name", "probe");
					el.setAttribute("required", "");
					el.setAttribute("required-message", "Veuillez remplir ce champ.");
					for (const [k, v] of Object.entries(recipe.attrs)) el.setAttribute(k, v);
					if (recipe.children) el.innerHTML = recipe.children;
					form.appendChild(el);
					document.body.appendChild(form);
					await wait(900);
					const out = el.validationMessage ?? "";
					form.remove();
					return out;
				},
				{ id, recipe: empty },
			);
			expect(
				message,
				`${id} ignored \`required-message\`, so a non-English app cannot replace a string xtyle hardcoded`,
			).toBe("Veuillez remplir ce champ.");
		});
	}

	for (const id of Object.keys(RECIPES).filter((id) => declares(id, "invalid"))) {
		test(`${id} invalid blocks the form`, async ({ page }) => {
			await page.goto(`/components/${id}/`);
			const probe = await shadowProbe(page, id, RECIPES[id], { invalid: "", error: "nope" });
			expect(probe.valid, `${id} marked \`invalid\` must not validate`).toBe(false);
		});
	}
});
