import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-link href="/docs">Read the docs</xtyle-link>

<xtyle-link href="https://example.com" target="_blank">External site</xtyle-link>

<nav>
	<xtyle-link variant="muted" href="/about">About</xtyle-link>
	<xtyle-link variant="quiet" href="/legal">Legal</xtyle-link>
</nav>`;

const svelteExample = `<script lang="ts">
	import { Link } from "@xtyle/svelte";
</script>

<Link href="/docs">Read the docs</Link>

<Link href="https://example.com" target="_blank">External site</Link>

<nav>
	<Link variant="muted" href="/about">About</Link>
	<Link variant="quiet" href="/legal">Legal</Link>
</nav>`;

const astroExample = `---
import { Link } from "@xtyle/astro";
---

<Link href="/docs">Read the docs</Link>

<Link href="https://example.com" target="_blank">External site</Link>

<nav>
	<Link variant="muted" href="/about">About</Link>
	<Link variant="quiet" href="/legal">Legal</Link>
</nav>`;

export const linkManifest: ComponentManifest = {
	id: "link",
	name: "Link",
	category: "navigation",
	since: "0.1.0",
	keywords: ["anchor", "hyperlink", "href", "external link"],
	seeAlso: ["button", "breadcrumb", "card-link"],
	summary: "A text hyperlink: the anchor primitive, in three emphasis variants with an automatic external-link affordance.",
	description:
		"Link is the styled `<a>` primitive: inline text that navigates, drawn in the link color with an offset underline and a token-colored focus ring. Three variants tune emphasis: `default` is the full-strength link, `muted` recedes into body text (underline only on hover) for in-prose and secondary nav, and `quiet` is the lowest-key treatment for dense footers and utility nav. When `target=\"_blank\"`, Link automatically appends an external-link glyph, adds a screen-reader-only \"(opens in a new tab)\" hint, and sets `rel=\"noopener noreferrer\"`, handling security and accessibility without ceremony. Given no `href`, it degrades to inert text rather than rendering a broken anchor.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "link",
			description: "The anchor element (or inert span when hrefless) carrying the variant class and link styling.",
			selector: ".xtyle-link",
			tokens: [
				"--font-sans",
				"--link",
				"--border-thin",
				"--space-1",
				"--radius-sm",
				"--duration-fast",
				"--ease-standard",
			],
		},
		{
			name: "external-icon",
			description: "The inline SVG glyph appended after the label when the link opens in a new tab.",
			selector: ".xtyle-link__external-icon",
			tokens: ["--space-1"],
		},
		{
			name: "sr-hint",
			description: "The visually-hidden \"(opens in a new tab)\" text announced to screen readers for external links.",
			selector: ".xtyle-link__sr-only",
		},
	],
	props: [
		{
			name: "variant",
			type: "LinkVariant",
			default: "default",
			description: "Emphasis level. `default` is the full link color; `muted` recedes; `quiet` is the lowest-key, for dense nav.",
			bindings: ["html", "svelte", "astro"],
			options: ["default", "muted", "quiet"],
		},
		{
			name: "href",
			type: "string",
			description: "The destination URL. Without it, Link renders inert text and warns at runtime.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "target",
			type: "string",
			description: "Standard anchor target. `_blank` triggers the external icon, the SR hint, and an automatic `rel`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "rel",
			type: "string",
			description: "Explicit `rel`. When unset and `target=\"_blank\"`, defaults to `noopener noreferrer`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "externalIcon",
			type: "boolean",
			description: "Forces the external-link icon on or off, overriding the `target=\"_blank\"` auto-detection.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "default",
			description: "The full-strength link: link color with a persistent offset underline.",
			className: "xtyle-link",
			tokens: ["--link", "--link-hover"],
		},
		{
			name: "muted",
			description: "Recedes into body text: body-secondary color, underline only on hover, brightening to the link color.",
			className: "xtyle-link--muted",
			tokens: ["--fg-2", "--link"],
		},
		{
			name: "quiet",
			description: "The lowest-key treatment for dense or utility nav: body-tertiary color, no underline until hover.",
			className: "xtyle-link--quiet",
			tokens: ["--fg-3", "--fg-2"],
		},
	],
	sizes: [{ name: "md", description: "Links inherit their surrounding text size.", className: "xtyle-link", isDefault: true }],
	states: [
		{
			name: "hover",
			description: "Pointer over the link: color shifts toward the link/hover color and the underline appears or strengthens.",
			selector: ".xtyle-link:hover",
			tokens: ["--link-hover"],
		},
		{
			name: "focus-visible",
			description: "Keyboard focus: a token-colored ring, plus a transparent outline that becomes real in forced-colors mode.",
			selector: ".xtyle-link:focus-visible",
			tokens: ["--border-normal", "--ring"],
		},
		{
			name: "external",
			description: "An external link (`target=\"_blank\"`): appends the icon and the SR-only new-tab hint, and sets `rel`.",
			selector: ".xtyle-link__external-icon",
		},
	],
	slots: [
		{
			name: "default",
			description: "The link text.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--link",
		"--link-hover",
		"--fg-2",
		"--fg-3",
		"--border-thin",
		"--border-normal",
		"--radius-sm",
		"--space-1",
		"--duration-fast",
		"--ease-standard",
		"--ring",
	],
	composition: [
		"Use `variant=\"muted\"` for in-prose links that shouldn't fight the surrounding text, and `variant=\"quiet\"` for footer and utility nav.",
		"Pair with Breadcrumb and nav layouts once they land; Link is the leaf they wrap.",
		"For button-shaped links (filled or outlined), reach for Button with an `href` instead. Link is for inline text.",
	],
	a11y: [
		"Renders a native `<a>` so keyboard and screen-reader link semantics come for free.",
		"External links (`target=\"_blank\"`) get `rel=\"noopener noreferrer\"` automatically and a visually-hidden \"(opens in a new tab)\" hint so the new-tab behavior is announced, not just shown.",
		"The external-link glyph is decorative (`aria-hidden`); the new-tab meaning lives in the SR-only hint.",
		"Without an `href`, Link renders inert text rather than a clickable-looking dead anchor, and warns at runtime in the custom element.",
		"Focus is shown with a token ring and a transparent outline that the forced-colors base rule promotes to a real system outline.",
	],
	examples: [
		{
			id: "variants-and-external",
			title: "Variants and external links",
			description: "Three emphasis variants, plus the automatic external-link affordance on `target=\"_blank\"`.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
