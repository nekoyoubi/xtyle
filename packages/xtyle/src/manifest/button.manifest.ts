import type { ComponentManifest } from "./types.js";
import { FULL_TONES, BUTTON_SIZES } from "../vocab.js";

/** The four-token family every tone exposes: the exact set a tone-driven component consumes. */
const toneTokens = FULL_TONES.flatMap((t) => [`--${t}`, `--${t}-bg`, `--${t}-fg`, `--${t}-text`]);

const htmlExample = `<xtyle-button variant="solid" tone="accent">Save changes</xtyle-button>

<xtyle-button variant="outline" tone="neutral">Cancel</xtyle-button>

<xtyle-button variant="subtle" tone="danger" icon-only aria-label="Delete">
	<svg slot="icon-start" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
		<path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Z" />
	</svg>
</xtyle-button>

<xtyle-button variant="solid" tone="success" loading>Saving…</xtyle-button>

<xtyle-button variant="link" tone="info" href="/docs">Read the docs</xtyle-button>`;

const svelteExample = `<script lang="ts">
	import { Button } from "@xtyle/svelte";
</script>

<Button variant="solid" tone="accent" onclick={() => save()}>Save changes</Button>

<Button variant="outline" tone="neutral">Cancel</Button>

<Button variant="subtle" tone="danger" iconOnly ariaLabel="Delete">
	{#snippet iconStart()}
		<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
			<path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Z" />
		</svg>
	{/snippet}
</Button>

<Button variant="solid" tone="success" loading>Saving…</Button>

<Button variant="link" tone="info" href="/docs">Read the docs</Button>`;

const astroExample = `---
import { Button } from "@xtyle/astro";
---

<Button variant="solid" tone="accent">Save changes</Button>

<Button variant="outline" tone="neutral">Cancel</Button>

<Button variant="subtle" tone="danger" iconOnly aria-label="Delete">
	<svg slot="icon-start" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
		<path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Z" />
	</svg>
</Button>

<Button variant="link" tone="info" href="/docs">Read the docs</Button>`;

const listRowHtml = `<xtyle-button block align="start" variant="ghost" tone="neutral">
	<svg slot="icon-start" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
		<path fill="currentColor" d="M4 4h16v4H4V4Zm0 6h16v4H4v-4Zm0 6h10v4H4v-4Z" />
	</svg>
	Recent projects
	<svg slot="icon-end" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
		<path fill="currentColor" d="m9 6 6 6-6 6-1.4-1.4L11.2 12 7.6 8.4 9 6Z" />
	</svg>
</xtyle-button>`;

const listRowSvelte = `<Button block align="start" variant="ghost" tone="neutral" onclick={() => openRecent()}>
	{#snippet iconStart()}
		<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
			<path fill="currentColor" d="M4 4h16v4H4V4Zm0 6h16v4H4v-4Zm0 6h10v4H4v-4Z" />
		</svg>
	{/snippet}
	Recent projects
	{#snippet iconEnd()}
		<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
			<path fill="currentColor" d="m9 6 6 6-6 6-1.4-1.4L11.2 12 7.6 8.4 9 6Z" />
		</svg>
	{/snippet}
</Button>`;

const listRowAstro = `<Button block align="start" variant="ghost" tone="neutral">
	<svg slot="icon-start" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
		<path fill="currentColor" d="M4 4h16v4H4V4Zm0 6h16v4H4v-4Zm0 6h10v4H4v-4Z" />
	</svg>
	Recent projects
	<svg slot="icon-end" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
		<path fill="currentColor" d="m9 6 6 6-6 6-1.4-1.4L11.2 12 7.6 8.4 9 6Z" />
	</svg>
</Button>`;

const outsideFormHtml = `<form id="profile">
	<xtyle-field label="Display name" name="display-name" required></xtyle-field>
</form>

<xtyle-cluster gap="2" justify="end">
	<xtyle-button type="reset" form="profile" variant="ghost" tone="neutral">Reset</xtyle-button>
	<xtyle-button type="submit" form="profile">Save</xtyle-button>
</xtyle-cluster>`;

const outsideFormSvelte = `<script lang="ts">
	import { Button, Cluster, Field } from "@xtyle/svelte";
</script>

<form id="profile" onsubmit={save}>
	<Field label="Display name" name="display-name" required />
</form>

<Cluster gap={2} justify="end">
	<Button type="reset" form="profile" variant="ghost" tone="neutral">Reset</Button>
	<Button type="submit" form="profile">Save</Button>
</Cluster>`;

const outsideFormAstro = `---
import { Button, Cluster, Field } from "@xtyle/astro";
---

<form id="profile">
	<Field label="Display name" name="display-name" required />
</form>

<Cluster gap={2} justify="end">
	<Button type="reset" form="profile" variant="ghost" tone="neutral">Reset</Button>
	<Button type="submit" form="profile">Save</Button>
</Cluster>`;

const cursorHtml = `<xtyle-stack gap="2" id="pause-menu">
	<xtyle-button block variant="ghost" tone="neutral" focusable="false" cursor>Resume</xtyle-button>
	<xtyle-button block variant="ghost" tone="neutral" focusable="false">Options</xtyle-button>
	<xtyle-button block variant="ghost" tone="neutral" focusable="false">Quit</xtyle-button>
</xtyle-stack>

<script>
	const rows = [...document.querySelectorAll("#pause-menu xtyle-button")];
	let at = 0;
	function moveCursor(step) {
		rows[at].cursor = false;
		at = (at + step + rows.length) % rows.length;
		rows[at].cursor = true;
	}
	input.on("menu-up", () => moveCursor(-1));
	input.on("menu-down", () => moveCursor(1));
	input.on("confirm", () => rows[at].click());
</script>`;

const cursorSvelte = `<script lang="ts">
	import { Button, Stack } from "@xtyle/svelte";

	const rows = ["Resume", "Options", "Quit"];
	let at = $state(0);

	input.on("menu-up", () => (at = (at - 1 + rows.length) % rows.length));
	input.on("menu-down", () => (at = (at + 1) % rows.length));
</script>

<Stack gap={2}>
	{#each rows as row, i}
		<Button block variant="ghost" tone="neutral" focusable={false} cursor={i === at}>{row}</Button>
	{/each}
</Stack>`;

const cursorAstro = `---
import { Button, Stack } from "@xtyle/astro";
---

<Stack gap={2}>
	<Button block variant="ghost" tone="neutral" focusable={false} cursor>Resume</Button>
	<Button block variant="ghost" tone="neutral" focusable={false}>Options</Button>
	<Button block variant="ghost" tone="neutral" focusable={false}>Quit</Button>
</Stack>`;

export const buttonManifest: ComponentManifest = {
	id: "button",
	name: "Button",
	category: "control",
	since: "0.1.0",
	keywords: ["cta", "action", "submit", "link button", "icon button", "toggle"],
	seeAlso: ["link", "segmented", "card-link"],
	summary: "A clickable action: five variants across six semantic tones.",
	description:
		"Button triggers an action or navigates. Visual treatment (`variant`) and semantic color (`tone`) are independent axes: any of the five variants (solid, outline, ghost, subtle, link) can carry any of the six tones (accent, neutral, danger, success, warn, info). It renders a native `<button>` by default and an `<a>` when given an `href`, so the same component covers both actions and links. Icon slots, an icon-only square form, a loading state with an inline accessible spinner, and a full-width block mode round out the surface.",
	bindings: ["html", "svelte", "astro"],
	render: "auto",
	exposedParts: ["button", "icon-end", "icon-start", "label", "spinner"],
	anatomy: [
		{
			name: "root",
			description: "The button or anchor element carrying the variant, tone, and size classes.",
			selector: ".xtyle-button",
			tokens: [
				"--font-sans",
				"--text-body",
				"--weight-medium",
				"--leading-tight",
				"--border-thin",
				"--radius-md",
				"--space-2",
				"--space-4",
				"--duration-fast",
				"--ease-standard",
			],
		},
		{
			name: "overlay",
			description: "The pseudo-element behind the content that paints hover and active state tints.",
			selector: ".xtyle-button::after",
			tokens: ["--state-hover", "--state-press"],
		},
		{
			name: "icon",
			description: "An icon slot rendered before or after the label (icon-start / icon-end).",
			selector: ".xtyle-button__icon",
		},
		{
			name: "label",
			description: "The text content wrapper, hidden while loading so the spinner takes its place.",
			selector: ".xtyle-button__label",
		},
		{
			name: "spinner",
			description: "The inline accessible spinner shown while loading, drawn in currentColor.",
			selector: ".xtyle-button__spinner",
			tokens: ["--border-normal", "--radius-full", "--duration-slow"],
		},
	],
	props: [
		{
			name: "variant",
			type: "ButtonVariant",
			default: "solid",
			description: "Visual treatment. Independent of tone.",
			bindings: ["html", "svelte", "astro"],
			options: ["solid", "outline", "ghost", "subtle", "link"],
		},
		{
			name: "tone",
			type: "FullTone",
			default: "accent",
			description: "Color tone driving fill, text, and border per variant: any semantic role, accent variant, or named hue.",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
		{
			name: "size",
			type: "ButtonSize",
			default: "md",
			description: "Control size.",
			bindings: ["html", "svelte", "astro"],
			options: [...BUTTON_SIZES],
		},
		{
			name: "type",
			type: '"button" | "submit" | "reset"',
			default: "button",
			description:
				"Native button type. `submit` and `reset` act on the button's form whether it renders in light DOM or behind a shadow root, where a native button would have no form at all. Ignored when `href` is set.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "form",
			type: "string",
			description:
				"The id of the form a `submit` or `reset` button acts on, for a button that sits outside it: a dialog footer, a sticky action bar. Same as the native `form` attribute.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "href",
			type: "string",
			description: "When set, the button renders as an `<a>`. Dropped (with `aria-disabled`) when also disabled.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables interaction. On an anchor, applies `aria-disabled` and removes `href`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "loading",
			type: "boolean",
			default: "false",
			description: "Shows the spinner, sets `aria-busy`, and blocks interaction.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "block",
			type: "boolean",
			default: "false",
			description: "Stretches the button to fill its container's width.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "align",
			type: '"start" | "center" | "end"',
			default: "center",
			description:
				"Justifies the content within the button. Visible only when the button is wider than its content (with `block` or an explicit width): `start` left-aligns the label and icons for a list-row button, `end` right-aligns them.",
			bindings: ["html", "svelte", "astro"],
			options: ["start", "center", "end"],
		},
		{
			name: "iconOnly",
			type: "boolean",
			default: "false",
			description: "Square, equal-padding form for a single icon. Requires an accessible name (aria-label).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "pressed",
			type: "boolean",
			description:
				"Turns the button into a toggle and reflects its state to `aria-pressed`. Set it (`pressed` / `pressed=\"true\"`) for on, `pressed=\"false\"` for off, and omit it entirely for a plain button. Controlled: flip it in your own click handler; the button reflects state, it does not self-toggle.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "focusable",
			type: "boolean",
			default: "true",
			description:
				"Set `false` to keep the control out of sequential focus navigation. A component rendering a native control makes it tab-reachable whether or not the app wants it: an app driving selection from its own keyboard cursor otherwise gets two focus rings that diverge, and Enter activates through both, firing one keypress twice. The host's own `tabindex` cannot express this, because focus lands on the inner control rather than the host.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "cursor",
			type: "boolean",
			default: "false",
			description:
				"Marks the button as the one an app-owned keyboard cursor rests on, and draws exactly the `:focus-visible` ring (forced-colors outline included) without moving DOM focus. For a menu driven from the app's own input layer, usually alongside `focusable={false}`: focus never lands, so `:focus-visible` never paints, and `selected` is the wrong state (it means current within a set). Controlled: move it in your own input handler. Changes no ARIA.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "selected",
			type: "boolean",
			description:
				"Marks the button as the current one within a set and reflects its state to `aria-current`; distinct from `pressed`'s on/off toggle. `aria-selected` is only valid on `tab` / `option` / `row` roles, so a button carries `aria-current` instead. Set it (`selected` / `selected=\"true\"`) for selected, `selected=\"false\"` for not, and omit it entirely for a button with no selection semantics. Controlled: flip it in your own click handler; the button reflects state, it does not self-toggle.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "solid",
			description: "Filled with the tone color; the primary, highest-emphasis treatment.",
			className: "xtyle-button--solid",
			tokens: ["--accent", "--accent-fg"],
		},
		{
			name: "outline",
			description: "Transparent fill with a tone-colored border and text.",
			className: "xtyle-button--outline",
			tokens: ["--accent", "--accent-text"],
		},
		{
			name: "ghost",
			description: "No chrome until hover, then a neutral state tint; tone-colored text.",
			className: "xtyle-button--ghost",
			tokens: ["--accent-text", "--state-hover"],
		},
		{
			name: "subtle",
			description: "A soft tone-tinted background with tone-colored text.",
			className: "xtyle-button--subtle",
			tokens: ["--accent-bg", "--accent-text"],
		},
		{
			name: "link",
			description: "Looks like a link: no box, no padding, underline on hover.",
			className: "xtyle-button--link",
			tokens: ["--accent-text", "--radius-sm"],
		},
	],
	sizes: [
		{ name: "xs", description: "Densest, for compact toolbar pills.", className: "xtyle-button--xs" },
		{ name: "sm", description: "Compact.", className: "xtyle-button--sm" },
		{ name: "md", description: "Default.", className: "xtyle-button", isDefault: true },
		{ name: "lg", description: "Large.", className: "xtyle-button--lg" },
	],
	states: [
		{
			name: "hover",
			description: "Pointer over the button: overlay paints the hover tint.",
			selector: ".xtyle-button:hover::after",
			tokens: ["--state-hover"],
		},
		{
			name: "active",
			description: "Button pressed: overlay paints the press tint.",
			selector: ".xtyle-button:active::after",
			tokens: ["--state-press"],
		},
		{
			name: "pressed",
			description: "Toggle engaged: `aria-pressed=\"true\"` paints the press overlay persistently, so an on toggle reads as sunken across every variant.",
			selector: '.xtyle-button[aria-pressed="true"]',
			tokens: ["--state-press"],
		},
		{
			name: "selected",
			description: "Current within a set: `aria-current=\"true\"` paints the selected overlay persistently, so a chosen pill reads as active across every variant.",
			selector: '.xtyle-button[aria-current="true"]',
			tokens: ["--state-selected"],
		},
		{
			name: "focus-visible",
			description: "Keyboard focus: a token-colored ring, plus a transparent outline that becomes real in forced-colors mode.",
			selector: ".xtyle-button:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
		{
			name: "cursor",
			description: "App-owned keyboard cursor: `cursor` puts `data-cursor` on the control, which shares the focus-visible rule, so it draws the same ring and the same forced-colors outline while DOM focus stays where it is.",
			selector: ".xtyle-button[data-cursor]",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
		{
			name: "disabled",
			description: "Non-interactive: muted fill and ink, overlay suppressed.",
			selector: '.xtyle-button:disabled, .xtyle-button[aria-disabled="true"]',
			tokens: ["--fg-disabled", "--state-disabled"],
		},
		{
			name: "loading",
			description: "Busy: content hidden behind the centered spinner, pointer set to progress.",
			selector: ".xtyle-button--loading",
		},
	],
	slots: [
		{
			name: "default",
			description: "The button label.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "icon-start",
			description: "An icon rendered before the label.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "icon-end",
			description: "An icon rendered after the label.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--text-body",
		"--text-xs",
		"--text-sm",
		"--text-lg",
		"--weight-medium",
		"--leading-tight",
		"--border-thin",
		"--border-normal",
		"--border-thick",
		"--radius-md",
		"--radius-sm",
		"--radius-full",
		"--space-0",
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-4",
		"--space-5",
		"--duration-fast",
		"--duration-slow",
		"--ease-standard",
		"--ring",
		"--state-hover",
		"--state-press",
		"--state-selected",
		"--state-disabled",
		"--fg-disabled",
		...toneTokens,
	],
	composition: [
		"Pair with Field for form submit/reset actions; bind the button `type` accordingly. A button outside its form, such as one in a dialog footer, names the form with `form`.",
		"Use the `icon-start` / `icon-end` slots with an Icon component once it lands; for now any inline SVG works.",
		"The icon-only form is the seed of a future IconButton convenience wrapper.",
		"For a left-aligned action row (a settings entry, a recent-file row, or a nav item running a callback), pair `block` with `align=\"start\"` and hang a chevron or meta in the `icon-end` slot.",
	],
	a11y: [
		"Under `forced-colors: active` a pressed (`aria-pressed`) or current (`aria-current`) button fills with the system `Highlight` and `HighlightText`, since the state wash is a background the mode flattens to `Canvas`. The link variant keeps its underline instead.",
		"Renders a native `<button>` (or `<a>` with `href`) so keyboard and screen-reader semantics come for free.",
		"`disabled` blocks interaction; on an anchor it applies `aria-disabled` and drops `href` (anchors cannot be natively disabled).",
		"`loading` sets `aria-busy=\"true\"` and prevents activation.",
		"`pressed` makes it a toggle via `aria-pressed`; it is controlled, so the consumer flips the state on click. The button reflects, it does not self-toggle.",
		"`selected` marks membership in a set via `aria-current` (distinct from `pressed`); it is controlled the same way. The consumer flips it, the button reflects.",
		"The icon-only form has no visible text, so it REQUIRES an `aria-label`; the binding warns at runtime when one is missing.",
		"Focus is shown with a token ring and a transparent outline that the forced-colors base rule promotes to a real system outline.",
		"`cursor` is visual only and sets no ARIA: an app-owned cursor is not focus, so it is not announced as focus, and it is not `aria-current` (that is `selected`). An app that needs the cursor position announced owns that channel itself, typically by moving real focus or with a live region.",
		"The spinner is decorative (`aria-hidden`); busy state is conveyed by `aria-busy`, not the spinner.",
	],
	examples: [
		{
			id: "variants-and-tones",
			title: "Variants and tones",
			description: "The five variants and the six tones are independent. Mix freely.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "list-row",
			title: "List-row button",
			description:
				"A full-width action row that runs a callback: `block` gives it the width, `align=\"start\"` left-aligns the label, and a trailing icon reads as a chevron.",
			source: { html: listRowHtml, svelte: listRowSvelte, astro: listRowAstro },
		},
		{
			id: "outside-its-form",
			title: "A button outside its form",
			description:
				"The footer actions sit outside the form they act on, as in a dialog whose body scrolls. `form` names the form by id, and `submit` runs its validation before it submits.",
			source: { html: outsideFormHtml, svelte: outsideFormSvelte, astro: outsideFormAstro },
		},
		{
			id: "app-owned-cursor",
			title: "An app-owned keyboard cursor",
			description:
				"A menu driven from the app's own input layer rather than DOM focus: `focusable={false}` keeps the browser's tab stop out of it, and `cursor` on the current row draws the focus ring there. `input` stands in for the app's own action bindings.",
			source: { html: cursorHtml, svelte: cursorSvelte, astro: cursorAstro },
		},
	],
};
