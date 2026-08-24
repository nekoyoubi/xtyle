import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The component CSS lives in template literals, so a backtick inside a *CSS* comment closes the string
 * and the file stops parsing, throwing a cascade of syntax errors nowhere near the comment that caused
 * them. It is an easy habit to fall into when writing prose about `--tokens` and `.selectors`, so the
 * rule is enforced rather than remembered.
 *
 * A backtick in a TypeScript doc comment is fine, so only comments *inside* a literal are checked: at
 * any offset, an odd number of preceding backticks means the literal is still open.
 */
const cssDir = join(import.meta.dirname, "..", "src", "css", "components");

function insideTemplateLiteral(source: string, offset: number): boolean {
	let backticks = 0;
	for (let i = 0; i < offset; i++) {
		if (source[i] === "`" && source[i - 1] !== "\\") backticks++;
	}
	return backticks % 2 === 1;
}

describe("component css source", () => {
	const files = readdirSync(cssDir).filter((f) => f.endsWith(".ts"));

	it("has css modules to check", () => {
		expect(files.length).toBeGreaterThan(0);
	});

	for (const file of files) {
		it(`${file} keeps backticks out of its css comments`, () => {
			const source = readFileSync(join(cssDir, file), "utf8");
			const offenders: string[] = [];
			for (const match of source.matchAll(/\/\*[\s\S]*?\*\//g)) {
				if (match.index === undefined) continue;
				if (!insideTemplateLiteral(source, match.index)) continue;
				if (match[0].includes("`")) offenders.push(match[0].split("\n")[0]!.trim());
			}
			expect(
				offenders,
				`a backtick inside a css comment closes the template literal: ${offenders.join(" | ")}`,
			).toEqual([]);
		});
	}
});

/**
 * A variant that opts *out* of a shared treatment has to be declared after the rule it opts out of.
 * Equal specificity is decided by source order, so a `--link` override placed before the generic
 * `.xtyle-button:hover::after` silently loses and the variant paints a state wash it promised not to.
 * That has happened twice — once for padding, once for the hover overlay — so the ordering is checked
 * rather than remembered.
 */
describe("button variant opt-outs", () => {
	const source = readFileSync(join(cssDir, "button.ts"), "utf8");

	const firstIndexOf = (needle: string): number => {
		const at = source.indexOf(needle);
		expect(at, `expected to find ${needle}`).toBeGreaterThan(-1);
		return at;
	};

	it("declares the link variant's state opt-out after the generic state rules", () => {
		const genericHover = firstIndexOf(".xtyle-button:hover::after");
		const genericPressed = firstIndexOf('.xtyle-button[aria-pressed="true"]:hover::after');
		const genericSelected = firstIndexOf('.xtyle-button[aria-current="true"]:hover::after');
		const linkOptOut = firstIndexOf(".xtyle-button--link:hover::after");
		expect(linkOptOut).toBeGreaterThan(genericHover);
		expect(linkOptOut).toBeGreaterThan(genericPressed);
		expect(linkOptOut).toBeGreaterThan(genericSelected);
	});

	it("declares the link variant's icon padding opt-out after the base icon padding", () => {
		expect(firstIndexOf(".xtyle-button--icon.xtyle-button--link")).toBeGreaterThan(
			firstIndexOf(".xtyle-button--icon {"),
		);
	});
});

/**
 * A fill writes a state attribute and the component's stylesheet keys the state's rules on it. They are
 * two files that must agree on one attribute name, nothing links them, and a disagreement fails
 * silently: the state applies, the ARIA is announced, and no rule matches, so the state is simply
 * invisible. `selected` shipped that way — the fill wrote `aria-current`, the sheet read
 * `aria-selected`.
 */
const stateAttrs: { component: string; fill: string; attr: string }[] = [
	{ component: "button", fill: "button", attr: "aria-current" },
	{ component: "button", fill: "button", attr: "aria-pressed" },
];

describe("fill and stylesheet agree on state attributes", () => {
	for (const { component, fill, attr } of stateAttrs) {
		it(`${component}: the sheet keys on the \`${attr}\` its fill writes`, () => {
			const fillSource = readFileSync(
				join(import.meta.dirname, "..", "src", "elements", "fragments", fill, "mod.ts"),
				"utf8",
			);
			const css = readFileSync(join(cssDir, `${component}.ts`), "utf8");
			expect(fillSource, `${fill}/mod.ts never writes ${attr}`).toContain(attr);
			expect(css, `${component}.ts has no rule keyed on ${attr}`).toContain(`[${attr}="true"]`);
		});
	}

	it("the button sheet keys no state on an attribute its fill never writes", () => {
		const fillSource = readFileSync(
			join(import.meta.dirname, "..", "src", "elements", "fragments", "button", "mod.ts"),
			"utf8",
		);
		const css = readFileSync(join(cssDir, "button.ts"), "utf8");
		const keyed = new Set(Array.from(css.matchAll(/\.xtyle-button[^\s,{]*\[(aria-[a-z]+)=/g), (m) => m[1] as string));
		for (const attr of keyed) {
			expect(fillSource, `button.ts styles [${attr}] but the fill never writes it`).toContain(attr);
		}
	});
});

/**
 * A component that documents BEM classes on light-DOM children needs those rules to survive the shadow
 * boundary. Inherited properties cross it and non-inherited ones do not, so the bar renders in the right
 * font and colour while its layout silently does nothing — which reads as correct markup wired up wrong.
 * `::slotted()` is the only selector that reaches an assigned node from inside the shadow sheet.
 */
describe("slotted layout survives the shadow boundary", () => {
	const slottedLayout: { component: string; selectors: string[] }[] = [
		{
			component: "statusbar",
			selectors: ["::slotted(.xtyle-statusbar__item)", "::slotted(.xtyle-statusbar__spacer)"],
		},
	];

	for (const { component, selectors } of slottedLayout) {
		for (const selector of selectors) {
			it(`${component} styles ${selector}`, () => {
				const css = readFileSync(join(cssDir, `${component}.ts`), "utf8");
				expect(
					css,
					`${component} documents this class on a light-DOM child, so a bare class rule in the shadow sheet never reaches it`,
				).toContain(selector);
			});
		}
	}

	it("the statusbar spacer actually grows through the slot", () => {
		const css = readFileSync(join(cssDir, "statusbar.ts"), "utf8");
		const rule = css.slice(css.indexOf("::slotted(.xtyle-statusbar__spacer)"));
		expect(rule.slice(0, rule.indexOf("}"))).toContain("flex: 1");
	});
});
