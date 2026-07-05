import { describe, expect, it } from "vitest";
import {
	coverComponent,
	coverComponents,
	declaredPropsInCss,
	derive,
	KEYWORD_DOMAINS,
	lintHostControls,
	lintManifest,
	lintStyleQueryDomains,
	listComponents,
	styleQueriedTokensInCss,
	styleQueryPairsInCss,
	tokensInCss,
	type ComponentManifest,
} from "../src/index.js";
import { declaredHostControls } from "../src/elements/host-controls.js";
import { normalizeFieldOptions } from "../src/elements/field-options.js";
import { NATIVE_INPUT_ATTRS } from "../src/elements/native-input-attrs.js";
import { normalizeSegments } from "../src/markup/index.js";
import { xojiDefault } from "../src/batteries.js";

const register = derive(xojiDefault, { constraints: { "--bg-0": "#0f1115", "--accent": "#5b8cff" } });

function cssExportName(id: string): string {
	const camel = id.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
	return `${camel}Css`;
}

const cssModules = import.meta.glob("../src/css/components/*.ts", { eager: true }) as Record<
	string,
	Record<string, unknown>
>;

async function loadCssModule(id: string): Promise<string> {
	const mod = cssModules[`../src/css/components/${id}.ts`];
	if (!mod) {
		throw new Error(`xoji: no css module found at ../src/css/components/${id}.ts`);
	}
	const css = mod[cssExportName(id)];
	if (typeof css !== "string") {
		throw new Error(
			`xoji: css module for "${id}" must export \`${cssExportName(id)}: string\``,
		);
	}
	return css;
}

describe("tokensInCss", () => {
	it("extracts every var(--…) name", () => {
		const css = ".x { color: var(--accent); background: var( --bg-0 ); border: var(--ring); }";
		const tokens = tokensInCss(css);
		expect([...tokens].sort()).toEqual(["--accent", "--bg-0", "--ring"]);
	});

	it("dedupes repeated tokens", () => {
		const css = "var(--accent) var(--accent) var(--accent)";
		expect(tokensInCss(css).size).toBe(1);
	});

	it("returns an empty set for css with no vars", () => {
		expect(tokensInCss(".x { color: red; }").size).toBe(0);
	});
});

describe("styleQueriedTokensInCss", () => {
	it("extracts the token from a style() query", () => {
		const css = "@container style(--selection-cue: marker) { .x { content: '✓'; } }";
		expect([...styleQueriedTokensInCss(css)]).toEqual(["--selection-cue"]);
	});

	it("handles whitespace around the token and colon", () => {
		const css = "@container style( --selection-cue : marker) { .x {} }";
		expect([...styleQueriedTokensInCss(css)]).toEqual(["--selection-cue"]);
	});

	it("returns an empty set when no style() queries are present", () => {
		expect(styleQueriedTokensInCss(".x { color: var(--accent); }").size).toBe(0);
	});

	it("does not count style-queried tokens in declaredPropsInCss", () => {
		const css = "@container style(--selection-cue: marker) { .x { color: red; } }";
		expect(declaredPropsInCss(css).has("--selection-cue")).toBe(false);
	});
});

describe("styleQueryPairsInCss", () => {
	it("extracts the token and value from each style() branch", () => {
		const css = "@container style(--selection-cue: marker) { .x { content: '✓'; } }";
		expect(styleQueryPairsInCss(css)).toEqual([{ token: "--selection-cue", value: "marker" }]);
	});

	it("handles whitespace around the token, colon, and value", () => {
		const css = "@container style( --selection-cue : tint ) { .x {} }";
		expect(styleQueryPairsInCss(css)).toEqual([{ token: "--selection-cue", value: "tint" }]);
	});

	it("returns an empty array when no style() branches are present", () => {
		expect(styleQueryPairsInCss(".x { color: var(--accent); }")).toEqual([]);
	});
});

describe("lintStyleQueryDomains", () => {
	const domains = { "--selection-cue": ["tint", "marker"] as const };

	it("is ok when every branch queries a value in the token's domain", () => {
		const css = "@container style(--selection-cue: marker) { .x { content: '✓'; } }";
		expect(lintStyleQueryDomains(css, domains)).toEqual({ ok: true, invalid: [] });
	});

	it("flags a branch whose value is outside the domain (the silent-typo case)", () => {
		const css = "@container style(--selection-cue: marekr) { .x { content: '✓'; } }";
		const result = lintStyleQueryDomains(css, domains);
		expect(result.ok).toBe(false);
		expect(result.invalid).toEqual([{ token: "--selection-cue", value: "marekr" }]);
	});

	it("ignores a style query on a token with no declared domain", () => {
		const css = "@container style(--undeclared-cue: anything) { .x {} }";
		expect(lintStyleQueryDomains(css, domains)).toEqual({ ok: true, invalid: [] });
	});
});

describe("lintManifest", () => {
	const base: ComponentManifest = {
		id: "demo",
		name: "Demo",
		category: "control",
		summary: "",
		description: "",
		bindings: ["html"],
		anatomy: [],
		props: [],
		variants: [],
		sizes: [],
		states: [],
		slots: [],
		consumedTokens: [],
		composition: [],
		a11y: [],
		examples: [],
	};

	it("is ok when consumedTokens exactly matches the css vars", () => {
		const css = ".x { color: var(--accent); background: var(--bg-0); }";
		const result = lintManifest({ ...base, consumedTokens: ["--accent", "--bg-0"] }, css);
		expect(result).toEqual({ ok: true, undeclared: [], unused: [] });
	});

	it("flags tokens used in css but missing from consumedTokens as undeclared", () => {
		const css = ".x { color: var(--accent); background: var(--bg-0); }";
		const result = lintManifest({ ...base, consumedTokens: ["--accent"] }, css);
		expect(result.ok).toBe(false);
		expect(result.undeclared).toEqual(["--bg-0"]);
		expect(result.unused).toEqual([]);
	});

	it("flags declared tokens absent from css as unused", () => {
		const css = ".x { color: var(--accent); }";
		const result = lintManifest({ ...base, consumedTokens: ["--accent", "--stale"] }, css);
		expect(result.ok).toBe(false);
		expect(result.undeclared).toEqual([]);
		expect(result.unused).toEqual(["--stale"]);
	});

	it("counts style-queried tokens as consumed", () => {
		const css = "@container style(--selection-cue: marker) { .x { content: '✓'; } }";
		const result = lintManifest({ ...base, consumedTokens: ["--selection-cue"] }, css);
		expect(result).toEqual({ ok: true, undeclared: [], unused: [] });
	});

	it("flags style-queried tokens absent from consumedTokens as undeclared", () => {
		const css = "@container style(--selection-cue: marker) { .x { content: '✓'; } }";
		const result = lintManifest({ ...base, consumedTokens: [] }, css);
		expect(result.ok).toBe(false);
		expect(result.undeclared).toContain("--selection-cue");
	});
});

describe("lintHostControls", () => {
	const scaffold = `<pre data-root><code data-code></code></pre><button data-copy hidden><span data-copy-label>Copy</span></button>`;

	it("is ok when every declared marker ships as a standalone attribute", () => {
		expect(lintHostControls(["data-copy"], scaffold)).toEqual({ ok: true, missing: [] });
	});

	it("flags a declared marker the scaffold never ships (the dead-control case)", () => {
		const result = lintHostControls(["data-copy", "data-wrap"], scaffold);
		expect(result.ok).toBe(false);
		expect(result.missing).toEqual(["data-wrap"]);
	});

	it("does not count a marker that only appears as a longer attribute's prefix", () => {
		const result = lintHostControls(["data-copy-toggle"], scaffold);
		expect(result.ok).toBe(false);
		expect(result.missing).toEqual(["data-copy-toggle"]);
	});
});

const fragmentModules = import.meta.glob("../src/elements/fragments/*/source.generated.ts", {
	eager: true,
}) as Record<string, { manifest: unknown; fragmentSources: Record<string, string> }>;

describe("fragment host-control contract", () => {
	it("every fragment's declared hostControls markers ship in its scaffold", () => {
		for (const [path, mod] of Object.entries(fragmentModules)) {
			const markers = declaredHostControls(mod.manifest).map((c) => c.marker);
			if (markers.length === 0) continue;
			const scaffold = Object.entries(mod.fragmentSources)
				.filter(([name]) => name.endsWith(".html"))
				.map(([, source]) => source)
				.join("\n");
			const result = lintHostControls(markers, scaffold);
			expect(result.ok, `${path}: ${JSON.stringify(result.missing)}`).toBe(true);
		}
	});
});

describe("registry token contract", () => {
	const manifests = listComponents();

	it("every registered manifest's consumedTokens matches its css module", async () => {
		for (const manifest of manifests) {
			const css = await loadCssModule(manifest.id);
			const result = lintManifest(manifest, css);
			expect(result.ok, `${manifest.id}: ${JSON.stringify(result)}`).toBe(true);
		}
	});

	it("every component's style-query branches stay within the token's keyword domain", async () => {
		for (const manifest of manifests) {
			const css = await loadCssModule(manifest.id);
			const result = lintStyleQueryDomains(css, KEYWORD_DOMAINS);
			expect(result.ok, `${manifest.id}: ${JSON.stringify(result.invalid)}`).toBe(true);
		}
	});
});

describe("coverComponent / coverComponents", () => {
	const manifest: ComponentManifest = {
		id: "probe",
		name: "Probe",
		category: "control",
		summary: "",
		description: "",
		bindings: ["html"],
		anatomy: [],
		props: [],
		variants: [],
		sizes: [],
		states: [],
		slots: [],
		consumedTokens: ["--accent", "--bg-0"],
		composition: [],
		a11y: [],
		examples: [],
	};

	it("coverComponent reports covered when the register produces the consumed tokens", () => {
		expect(coverComponent(manifest, register).covered).toBe(true);
	});

	it("coverComponent reports the missing token", () => {
		const result = coverComponent(
			{ ...manifest, consumedTokens: ["--accent", "--never-exists"] },
			register,
		);
		expect(result.covered).toBe(false);
		expect(result.missing).toContain("--never-exists");
	});

	it("coverComponents runs over an explicit subset", () => {
		const results = coverComponents(register, [manifest]);
		expect(results).toEqual([{ id: "probe", covered: true, missing: [] }]);
	});

	it("coverComponents over the registry returns one row per registered component", () => {
		const results = coverComponents(register);
		expect(results).toHaveLength(listComponents().length);
	});

	it("every registered component's consumedTokens are actually produced by the register", () => {
		const uncovered = coverComponents(register).filter((r) => !r.covered);
		expect(uncovered, JSON.stringify(uncovered)).toHaveLength(0);
	});
});

describe("tooltip closed-state layout", () => {
	it("hides the closed content with display:none so it never inflates a scroll ancestor", async () => {
		const css = await loadCssModule("tooltip");
		const closed = css.match(/\.xoji-tooltip__content\s*\{[^}]*\}/)?.[0] ?? "";
		expect(closed).toContain("display: none");
		expect(closed).not.toContain("visibility: hidden");
	});

	it("shows the open content as a displayed box", async () => {
		const css = await loadCssModule("tooltip");
		const open = css.match(/\.xoji-tooltip__content\[data-open="true"\]\s*\{[^}]*\}/)?.[0] ?? "";
		expect(open).toContain("display: block");
		expect(open).toContain("opacity: 1");
	});
});

describe("card action button semantics", () => {
	it("declares the action prop across all three bindings", () => {
		const card = listComponents().find((m) => m.id === "card");
		const action = card?.props?.find((p) => p.name === "action");
		expect(action).toBeDefined();
		expect(action?.type).toBe("boolean");
		expect(action?.bindings).toEqual(["html", "svelte", "astro"]);
	});

	it("rings an action card on keyboard focus only, and never on a pointer click", async () => {
		const css = await loadCssModule("card");
		// the action card (it is the button) keys its ring on :focus-visible, so a mouse click never paints it
		expect(css).toContain(".xoji-card--action:focus-visible");
		// the interactive-only ring (focus lands on an inner control) is scoped away from action cards
		expect(css).toContain(".xoji-card--interactive:not(.xoji-card--action):focus-within");
		expect(css).not.toMatch(/\.xoji-card--interactive:focus-within\s*\{/);
	});
});

describe("field type-ahead options", () => {
	it("declares the options prop across all three bindings", () => {
		const field = listComponents().find((m) => m.id === "field");
		const options = field?.props?.find((p) => p.name === "options");
		expect(options).toBeDefined();
		expect(options?.bindings).toEqual(["html", "svelte", "astro"]);
	});

	it("normalizes a string array into value-only options", () => {
		expect(normalizeFieldOptions(["main", "dev"])).toEqual([{ value: "main" }, { value: "dev" }]);
	});

	it("keeps value/label pairs and drops a label equal to the value at render time only", () => {
		expect(normalizeFieldOptions([{ value: "Europe/London", label: "London" }, { value: "x" }])).toEqual([
			{ value: "Europe/London", label: "London" },
			{ value: "x" },
		]);
	});

	it("parses a JSON string (the declarative attribute path) and skips malformed entries", () => {
		expect(normalizeFieldOptions('["a", {"value":"b","label":"B"}, {"nope":1}, 7]')).toEqual([
			{ value: "a" },
			{ value: "b", label: "B" },
		]);
	});

	it("returns an empty list for nullish, non-array, or unparseable input", () => {
		expect(normalizeFieldOptions(null)).toEqual([]);
		expect(normalizeFieldOptions("not json")).toEqual([]);
		expect(normalizeFieldOptions({ value: "x" })).toEqual([]);
	});
});

describe("field / textarea mono + native-attr forwarding", () => {
	it("forwards the form-hygiene allow-list", () => {
		expect([...NATIVE_INPUT_ATTRS]).toEqual([
			"spellcheck",
			"inputmode",
			"autocomplete",
			"autocapitalize",
			"autocorrect",
			"enterkeyhint",
		]);
	});

	for (const id of ["field", "textarea"]) {
		it(`${id} declares a mono prop across all three bindings`, () => {
			const mono = listComponents().find((m) => m.id === id)?.props?.find((p) => p.name === "mono");
			expect(mono).toBeDefined();
			expect(mono?.type).toBe("boolean");
			expect(mono?.bindings).toEqual(["html", "svelte", "astro"]);
		});

		it(`${id} swaps the control to the mono stack under --mono`, async () => {
			const css = await loadCssModule(id);
			expect(css).toContain(`xoji-${id}--mono`);
			const monoRule = css.split("\n").find((line) => line.includes(`xoji-${id}--mono`)) ?? "";
			expect(monoRule).toContain("font-family: var(--font-mono)");
		});
	}
});

describe("splitter keyboard-only focus ring", () => {
	it("keys the ring on the modality attribute, not :focus-visible (so a mouse drag never rings)", async () => {
		const css = await loadCssModule("splitter");
		expect(css).toContain(".xoji-splitter[data-focus-ring]");
		expect(css).not.toContain(":focus-visible");
	});

	it("documents the keyboard-focus state with the data-attr selector", () => {
		const splitter = listComponents().find((m) => m.id === "splitter");
		const focus = splitter?.states?.find((s) => s.selector?.includes("data-focus-ring"));
		expect(focus).toBeDefined();
		expect(focus?.selector).not.toContain(":focus-visible");
	});
});

describe("segmented structured options", () => {
	it("parses the comma-string shorthand: bare labels and label:value pairs", () => {
		expect(normalizeSegments("Day,Week")).toEqual([
			{ value: "Day", label: "Day" },
			{ value: "Week", label: "Week" },
		]);
		expect(normalizeSegments("Left:start,Right:end")).toEqual([
			{ value: "start", label: "Left" },
			{ value: "end", label: "Right" },
		]);
	});

	it("accepts a structured array, defaulting a missing label to the value", () => {
		expect(normalizeSegments([{ value: "md", label: "Markdown" }, { value: "html" }, "epub"])).toEqual([
			{ value: "md", label: "Markdown" },
			{ value: "html", label: "html" },
			{ value: "epub", label: "epub" },
		]);
	});

	it("parses a JSON array string (the declarative attribute path)", () => {
		expect(normalizeSegments('[{"value":"md","label":"Markdown"},"epub"]')).toEqual([
			{ value: "md", label: "Markdown" },
			{ value: "epub", label: "epub" },
		]);
	});

	it("returns an empty list for nullish or non-array, non-string input", () => {
		expect(normalizeSegments(null)).toEqual([]);
		expect(normalizeSegments({ value: "x" })).toEqual([]);
	});

	it("declares the options prop accepting both shapes plus per-option state across all three bindings", () => {
		const options = listComponents().find((m) => m.id === "segmented")?.props?.find((p) => p.name === "options");
		expect(options?.type).toContain("string");
		expect(options?.type).toContain("value: string; label?: string");
		expect(options?.type).toContain("disabled?: boolean");
		expect(options?.type).toContain("badge?: string");
		expect(options?.bindings).toEqual(["html", "svelte", "astro"]);
	});
});

describe("svelte wrappers do not clobber a rest-passed aria-label", () => {
	const svelteWrappers = import.meta.glob("../../svelte/src/*.svelte", {
		query: "?raw",
		import: "default",
		eager: true,
	}) as Record<string, string>;

	it("has wrappers to check", () => {
		expect(Object.keys(svelteWrappers).length).toBeGreaterThan(10);
	});

	for (const [path, source] of Object.entries(svelteWrappers)) {
		const name = path.split("/").pop();
		it(`${name} never sets a bare aria-label={ariaLabel} after a {...rest} spread`, () => {
			// a bare explicit aria-label={ariaLabel} overwrites the rest-passed kebab attribute with undefined;
			// the merge form (aria-label={ariaLabel ?? rest["aria-label"]}) preserves it
			if (source.includes("{...rest}") && source.includes("aria-label={ariaLabel")) {
				expect(source).not.toMatch(/aria-label=\{ariaLabel\}/);
			}
		});
	}
});

describe("button unnamed-check honors the live host attribute", () => {
	const src = import.meta.glob("../src/elements/button.ts", { query: "?raw", import: "default", eager: true }) as Record<
		string,
		string
	>;
	const buttonSource = Object.values(src)[0] ?? "";

	// The button strips `aria-label` off the host into `ariaLabelValue`; on upgrade the attributes fire in
	// DOM order, so the render-time unnamed-check can run before that capture. Reading only the cached value
	// gave a correctly-labelled icon-only button a spurious "no accessible name" warning. Guard that the
	// check still reads the live host attribute so the fix can't silently regress.
	it("reads the live aria-label attribute in the unnamed check", () => {
		const check = buttonSource.slice(buttonSource.indexOf("warnIfUnnamed"));
		const body = check.slice(0, check.indexOf("console.warn"));
		expect(body).toContain('this.getAttribute("aria-label")');
	});
});
