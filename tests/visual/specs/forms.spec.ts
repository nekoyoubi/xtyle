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

const SUBMITTERS = ["button"];

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
		const missing = (await formAssociated(page)).filter((id) => !RECIPES[id] && !SUBMITTERS.includes(id));
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

const PRE_UPGRADE: Record<string, { prop: string; value: unknown; children?: string; expect: string }> = {
	select: { prop: "value", value: "b", children: `<option value="a">a</option><option value="b">b</option>`, expect: "b" },
	"number-input": { prop: "value", value: "7", expect: "7" },
	field: { prop: "value", value: "typed", expect: "typed" },
	switch: { prop: "checked", value: true, expect: "on" },
};

test.describe("a property written before the element is defined", () => {
	for (const [id, recipe] of Object.entries(PRE_UPGRADE)) {
		test(`${id} still posts it once the class upgrades the instance`, async ({ page }) => {
			await page.goto(`/components/${id}/`);
			const result = await page.evaluate(
				async ({ id, recipe }) => {
					const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
					const Base = customElements.get(`xtyle-${id}`) as CustomElementConstructor;
					const tag = `late-${id}-${Math.random().toString(36).slice(2, 8)}`;
					const form = document.createElement("form");
					const el = document.createElement(tag) as HTMLElement & Record<string, unknown>;
					el.setAttribute("name", "probe");
					el.setAttribute("label", "Late");
					if (id === "switch") el.setAttribute("value", "on");
					el[recipe.prop] = recipe.value;
					if (recipe.children) el.innerHTML = recipe.children;
					form.appendChild(el);
					document.body.appendChild(form);
					customElements.define(tag, class extends Base {});
					await wait(900);
					const entries = [...new FormData(form).entries()].map(([k, v]) => `${k}=${String(v)}`);
					const shadowsSetter = Object.prototype.hasOwnProperty.call(el, recipe.prop);
					form.remove();
					return { entries, shadowsSetter };
				},
				{ id, recipe },
			);
			expect(result.shadowsSetter, `${id}.${recipe.prop} is still an own property shadowing the setter`).toBe(false);
			expect(result.entries).toEqual([`probe=${recipe.expect}`]);
		});
	}
});

test.describe("a form reset returns a control to the value it was authored with", () => {
	const EDITS: Record<string, { prop: string; value: unknown }> = {
		field: { prop: "value", value: "edited" },
		textarea: { prop: "value", value: "edited" },
		select: { prop: "value", value: "a" },
		combobox: { prop: "value", value: "a" },
		checkbox: { prop: "checked", value: false },
		switch: { prop: "checked", value: false },
		radio: { prop: "checked", value: false },
		"number-input": { prop: "value", value: "9" },
		slider: { prop: "value", value: 37 },
		segmented: { prop: "value", value: "p" },
		rating: { prop: "value", value: 1 },
		"color-picker": { prop: "value", value: "#ff0000" },
		"date-picker": { prop: "value", value: "2027-03-04" },
	};

	test("covers every control a recipe reaches", () => {
		expect(Object.keys(EDITS).sort()).toEqual(Object.keys(RECIPES).sort());
	});

	for (const [id, edit] of Object.entries(EDITS)) {
		test(id, async ({ page }) => {
			await page.goto(`/components/${id}/`);
			const recipe = RECIPES[id];
			const result = await page.evaluate(
				async ({ id, recipe, edit }) => {
					const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
					const form = document.createElement("form");
					const el = document.createElement(`xtyle-${id}`) as HTMLElement & Record<string, unknown>;
					el.setAttribute("name", "probe");
					for (const [k, v] of Object.entries(recipe.attrs)) el.setAttribute(k, v);
					if (recipe.children) el.innerHTML = recipe.children;
					form.appendChild(el);
					document.body.appendChild(form);
					await wait(900);
					el[edit.prop] = edit.value;
					await wait(100);
					const before = String(new FormData(form).get("probe"));
					form.reset();
					await wait(100);
					const after = String(new FormData(form).get("probe"));
					const shown = String(el[edit.prop]);
					form.remove();
					return { before, after, shown };
				},
				{ id, recipe, edit },
			);
			expect(result.before, "the edit reached the form").not.toBe(recipe.expect);
			expect(result.after).toBe(recipe.expect);
			expect(result.shown).toBe(edit.prop === "checked" ? "true" : recipe.expect);
		});

		test(`${id} in light DOM`, async ({ page }) => {
			await page.goto(`/components/${id}/`);
			const result = await page.evaluate(
				async ({ id, edit }) => {
					const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
					await wait(900);
					const host = [...document.querySelectorAll(`xtyle-${id}[name]`)].find((el) => !el.shadowRoot) as
						| (HTMLElement & Record<string, unknown>)
						| undefined;
					if (!host) return null;
					const name = host.getAttribute("name")!;
					const anchor = document.createComment("");
					host.parentElement?.insertBefore(anchor, host);
					const form = document.createElement("form");
					document.body.appendChild(form);
					form.appendChild(host);
					await wait(300);
					const authored = String(new FormData(form).get(name));
					const flipped = edit.prop === "checked" ? !host.checked : edit.value;
					host[edit.prop] = flipped;
					await wait(100);
					const before = String(new FormData(form).get(name));
					form.reset();
					await wait(100);
					const after = String(new FormData(form).get(name));
					anchor.parentElement?.insertBefore(host, anchor);
					anchor.remove();
					form.remove();
					return { authored, before, after };
				},
				{ id, edit },
			);
			test.skip(result === null, `no light-DOM ${id} with a name on its page`);
			expect(result!.before, "the edit reached the form").not.toBe(result!.authored);
			expect(result!.after).toBe(result!.authored);
		});
	}
});

test.describe("a submit button outside its form", () => {
	test("submits and resets the form it names, validation first", async ({ page }) => {
		await page.goto("/components/button/");
		const form = page.locator("#button-demo-profile");
		const status = page.locator(".button-demo__form-status");
		const save = page.locator('xtyle-button[form="button-demo-profile"][type="submit"]');
		const reset = page.locator('xtyle-button[form="button-demo-profile"][type="reset"]');
		await expect(save).toHaveJSProperty("form", await form.elementHandle());

		await save.click();
		await expect(status).toHaveText("Nothing submitted yet.");

		await form.locator("input").fill("Ada");
		await save.click();
		await expect(status).toHaveText('Saved "Ada".');

		await reset.click();
		await expect(status).toHaveText("Form reset.");
		await expect(form.locator("input")).toHaveValue("");
	});

	test("submits from behind a shadow root, where a native button has no form", async ({ page }) => {
		await page.goto("/components/button/");
		const submitted = await page.evaluate(async () => {
			const form = document.createElement("form");
			form.id = "probe-form";
			const outside = document.createElement("xtyle-button");
			outside.setAttribute("type", "submit");
			outside.setAttribute("form", "probe-form");
			outside.textContent = "Outside";
			const inside = document.createElement("xtyle-button");
			inside.setAttribute("type", "submit");
			inside.textContent = "Inside";
			form.appendChild(inside);
			document.body.append(form, outside);
			const fired: string[] = [];
			form.addEventListener("submit", (event) => {
				event.preventDefault();
				fired.push((event.submitter as HTMLElement | null)?.textContent ?? "host");
			});
			for (let tries = 0; tries < 60 && ![outside, inside].every((host) => host.shadowRoot?.querySelector("button")); tries++) {
				await new Promise((resolve) => setTimeout(resolve, 50));
			}
			const shadows = [outside, inside].every((host) => host.shadowRoot !== null);
			for (const host of [outside, inside]) host.shadowRoot?.querySelector("button")?.click();
			await new Promise((resolve) => setTimeout(resolve, 50));
			form.remove();
			outside.remove();
			return { shadows, count: fired.length };
		});
		expect(submitted.shadows).toBe(true);
		expect(submitted.count).toBe(2);
	});
});
