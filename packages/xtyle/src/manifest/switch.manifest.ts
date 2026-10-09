import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

const htmlExample = `<xtyle-switch label="Wi-Fi" checked></xtyle-switch>

<xtyle-switch label="Notifications" on-label="On" off-label="Off"></xtyle-switch>

<xtyle-switch size="sm" label="Compact mode"></xtyle-switch>

<xtyle-switch label="Alerts" tone="danger" checked></xtyle-switch>

<xtyle-switch label="Square" shape="square" checked></xtyle-switch>

<xtyle-switch label="Vertical" orientation="vertical" checked></xtyle-switch>

<xtyle-switch label="Reversed" reverse checked></xtyle-switch>

<xtyle-switch label="Label after" label-side="end" checked></xtyle-switch>

<xtyle-switch label="Sync" name="sync" value="enabled" checked></xtyle-switch>

<xtyle-switch label="Locked" disabled checked></xtyle-switch>`;

const spreadHtml = `<xtyle-stack gap="3">
	<xtyle-switch spread label="Email notifications" checked></xtyle-switch>
	<xtyle-switch spread label="Reduced motion"></xtyle-switch>
	<xtyle-switch spread label="Beta channel" disabled checked></xtyle-switch>
</xtyle-stack>`;

const spreadSvelte = `<script lang="ts">
	import { Stack, Switch } from "@xtyle/svelte";

	let email = $state(true);
	let motion = $state(false);
</script>

<Stack gap={3}>
	<Switch spread label="Email notifications" bind:checked={email} />
	<Switch spread label="Reduced motion" bind:checked={motion} />
	<Switch spread label="Beta channel" disabled checked />
</Stack>`;

const spreadAstro = `---
import { Stack, Switch } from "@xtyle/astro";
---

<Stack gap={3}>
	<Switch spread label="Email notifications" checked />
	<Switch spread label="Reduced motion" />
	<Switch spread label="Beta channel" disabled checked />
</Stack>`;

const svelteExample = `<script lang="ts">
	import { Switch } from "@xtyle/svelte";

	let wifi = $state(true);
	let notify = $state(false);
</script>

<Switch label="Wi-Fi" bind:checked={wifi} />

<Switch label="Notifications" onLabel="On" offLabel="Off" bind:checked={notify} />

<Switch size="sm" label="Compact mode" />

<Switch label="Alerts" tone="danger" checked />

<Switch label="Square" shape="square" checked />

<Switch label="Vertical" orientation="vertical" checked />

<Switch label="Reversed" reverse checked />

<Switch label="Label after" labelSide="end" checked />

<Switch label="Sync" name="sync" value="enabled" bind:checked={wifi} />

<Switch label="Locked" disabled checked />`;

const astroExample = `---
import { Switch } from "@xtyle/astro";
---

<Switch label="Wi-Fi" checked />

<Switch label="Notifications" onLabel="On" offLabel="Off" />

<Switch size="sm" label="Compact mode" />

<Switch label="Alerts" tone="danger" checked />

<Switch label="Square" shape="square" checked />

<Switch label="Vertical" orientation="vertical" checked />

<Switch label="Reversed" reverse checked />

<Switch label="Label after" labelSide="end" checked />

<Switch label="Sync" name="sync" value="enabled" checked />

<Switch label="Locked" disabled checked />`;

const cursorHtml = `<xtyle-stack gap="3" id="settings">
	<xtyle-switch spread label="Subtitles" focusable="false" cursor checked></xtyle-switch>
	<xtyle-switch spread label="Screen shake" focusable="false"></xtyle-switch>
	<xtyle-switch spread label="Vibration" focusable="false" checked></xtyle-switch>
</xtyle-stack>

<script>
	const rows = [...document.querySelectorAll("#settings xtyle-switch")];
	let at = 0;
	function moveCursor(step) {
		rows[at].cursor = false;
		at = (at + step + rows.length) % rows.length;
		rows[at].cursor = true;
	}
	input.on("menu-up", () => moveCursor(-1));
	input.on("menu-down", () => moveCursor(1));
	input.on("confirm", () => (rows[at].checked = !rows[at].checked));
</script>`;

const cursorSvelte = `<script lang="ts">
	import { Stack, Switch } from "@xtyle/svelte";

	const rows = $state([
		{ label: "Subtitles", on: true },
		{ label: "Screen shake", on: false },
		{ label: "Vibration", on: true },
	]);
	let at = $state(0);

	input.on("menu-up", () => (at = (at - 1 + rows.length) % rows.length));
	input.on("menu-down", () => (at = (at + 1) % rows.length));
	input.on("confirm", () => (rows[at].on = !rows[at].on));
</script>

<Stack gap={3}>
	{#each rows as row, i}
		<Switch spread label={row.label} focusable={false} cursor={i === at} bind:checked={row.on} />
	{/each}
</Stack>`;

const cursorAstro = `---
import { Stack, Switch } from "@xtyle/astro";
---

<Stack gap={3}>
	<Switch spread label="Subtitles" focusable={false} cursor checked />
	<Switch spread label="Screen shake" focusable={false} />
	<Switch spread label="Vibration" focusable={false} checked />
</Stack>`;

export const switchManifest: ComponentManifest = {
	id: "switch",
	name: "Switch",
	category: "control",
	since: "0.1.0",
	keywords: ["toggle", "on off", "boolean", "flip"],
	seeAlso: ["checkbox", "segmented"],
	summary: "An on/off toggle that applies immediately, with an accessible name and optional state labels.",
	description:
		"Switch is a `role=\"switch\"` toggle for a setting that takes effect immediately, distinct from a checkbox that stages a value until a form submit. It renders a native `<button>` track with a sliding thumb, so pointer, Space, and Enter all flip it and the state lives in `aria-checked`. An optional leading label and optional `on-label`/`off-label` state text make the toggle self-describing; clicking the label flips it like a native `<label>`, and `spread` stretches the row full width so a column of settings lines its tracks up at the far edge. It is form-associated: give it a `name` (and optional `value`) and it contributes to form data only while on. Two sizes: the default `md` and a compact `sm`.",
	bindings: ["html", "svelte", "astro"],
	render: "auto",
	exposedParts: ["label", "state", "switch", "thumb", "track"],
	anatomy: [
		{
			name: "switch",
			description: "The row wrapper carrying the size, variant, and disabled classes and laying out label, track, and state text; inline by default, a full-width row under `spread`.",
			selector: ".xtyle-switch",
			tokens: ["--font-sans", "--text-body", "--leading-tight", "--fg-0", "--space-2"],
		},
		{
			name: "track",
			description: "The interactive `role=\"switch\"` button: the pill the thumb slides within.",
			selector: ".xtyle-switch__track",
			tokens: [
				"--space-7",
				"--space-5",
				"--space-2",
				"--border-thin",
				"--line-strong",
				"--radius-full",
				"--neutral-bg",
				"--duration-base",
				"--ease-emphasized",
				"--duration-fast",
				"--ease-standard",
			],
		},
		{
			name: "thumb",
			description: "The circular knob: a darkened cast of the track's tone, kept visible on and off.",
			selector: ".xtyle-switch__thumb",
			tokens: ["--space-1", "--radius-full", "--elevation-1"],
		},
		{
			name: "label",
			description: "The visible leading label that names the toggle and is referenced as its accessible name. It is a pointer target: a click flips the switch once, as a native `<label>` would, and does nothing while disabled. It takes no focus; the track stays the one focusable control. Under `spread` it grows to fill the row.",
			selector: ".xtyle-switch__label",
		},
		{
			name: "state",
			description: "Optional trailing on/off state text; becomes the accessible name when no other label is given.",
			selector: ".xtyle-switch__state",
			tokens: ["--fg-2", "--text-sm"],
		},
		{
			name: "overlay",
			description: "The pseudo-element behind the track that paints hover and active state tints.",
			selector: ".xtyle-switch__track::after",
			tokens: ["--state-hover", "--state-press"],
		},
	],
	props: [
		{
			name: "checked",
			type: "boolean",
			default: "false",
			description: "The on/off state. Two-way bindable in Svelte; reflected to `aria-checked` and the element's `.checked`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "focusable",
			type: "boolean",
			default: "true",
			description:
				"Set `false` to keep the control out of sequential focus navigation, for an app driving selection from its own keyboard cursor. The host's own `tabindex` cannot express this, because focus lands on the inner control rather than the host, and setting it there from outside does not survive the next render.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "cursor",
			type: "boolean",
			default: "false",
			description:
				"Marks the switch as the one an app-owned keyboard cursor rests on, and draws exactly the track's `:focus-visible` ring (forced-colors outline included) without moving DOM focus. For a settings list driven from the app's own input layer, usually alongside `focusable={false}`. Controlled: move it in your own input handler. Changes no ARIA.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables interaction; mutes the track, suppresses the overlay, and sets `aria-disabled`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "size",
			type: "Size",
			default: "md",
			description: "Control size. Only `sm` differs from the default.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md"],
		},
		{
			name: "tone",
			type: "FullTone",
			default: "accent",
			description: "Color of the on-state track and thumb ink. Any of the semantic roles, accent variants, or named hues.",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
		{
			name: "shape",
			type: "\"pill\" | \"square\"",
			default: "pill",
			description: "Track and thumb corner shape: the default rounded pill, or a squared track for a chunkier control.",
			bindings: ["html", "svelte", "astro"],
			options: ["pill", "square"],
		},
		{
			name: "orientation",
			type: "\"horizontal\" | \"vertical\"",
			default: "horizontal",
			description: "Track axis. Horizontal slides the thumb left-to-right (on at the right); vertical stands the track up and follows a wall switch: down is off, up is on.",
			bindings: ["html", "svelte", "astro"],
			options: ["horizontal", "vertical"],
		},
		{
			name: "reverse",
			type: "boolean",
			default: "false",
			description: "Flip the on/off direction: horizontal puts on at the left, vertical puts on at the bottom. The label is unaffected.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "labelSide",
			type: "\"start\" | \"end\"",
			default: "start",
			description: "Which side the label sits on relative to the track. `end` puts the control first and the label after it.",
			bindings: ["html", "svelte", "astro"],
			options: ["start", "end"],
		},
		{
			name: "spread",
			type: "boolean",
			default: "false",
			description:
				"Stretch the switch into a full-width row with the label growing to fill it, so the label and the track sit at opposite edges and a column of switches lines its tracks up. Follows `labelSide` (with `end` the track leads and the label is end-aligned) and the writing direction; `orientation` only stands the track up, so a vertical spread switch keeps the same row.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "Visible leading label, also wired as the accessible name via `aria-labelledby`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "labelledby",
			type: "string",
			description: "ID of an external element that names the toggle. Takes precedence over `label`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "onLabel",
			type: "string",
			description: "State text shown (and announced as the name, absent `label`) when on.",
			bindings: ["html", "svelte", "astro"],
		
			aliases: ["label-on"],
		},
		{
			name: "offLabel",
			type: "string",
			description: "State text shown (and announced as the name, absent `label`) when off.",
			bindings: ["html", "svelte", "astro"],
		
			aliases: ["label-off"],
		},
		{
			name: "name",
			type: "string",
			description: "Form field name; the toggle contributes `value` to form data only while on.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "value",
			type: "string",
			default: "on",
			description: "The value submitted with the form when the toggle is on.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	events: [
		{ name: "change", detail: "{ checked, value }", description: "The switch was toggled.", bindings: ["html", "svelte", "astro"] },
	],
	variants: [
		{ name: "square", description: "Squared track and thumb corners.", className: "xtyle-switch--square" },
		{ name: "vertical", description: "Track stood on its end; down is off, up is on.", className: "xtyle-switch--vertical" },
		{ name: "reverse", description: "On/off direction flipped (on at the left, or the bottom when vertical).", className: "xtyle-switch--reverse" },
		{ name: "label-end", description: "Label after the control instead of before it.", className: "xtyle-switch--label-end" },
		{ name: "spread", description: "A full-width row: label and track at opposite edges.", className: "xtyle-switch--spread" },
	],
	sizes: [
		{ name: "sm", description: "Compact.", className: "xtyle-switch--sm" },
		{ name: "md", description: "Default.", className: "xtyle-switch", isDefault: true },
	],
	states: [
		{
			name: "on",
			description: "Toggle is on: the track fills with the chosen tone (accent by default) and the thumb slides to the end.",
			selector: '.xtyle-switch__track[aria-checked="true"]',
			tokens: ["--accent", "--accent-fg"],
		},
		{
			name: "hover",
			description: "Pointer over the track: overlay paints the hover tint.",
			selector: ".xtyle-switch__track:hover::after",
			tokens: ["--state-hover"],
		},
		{
			name: "active",
			description: "Track pressed: overlay paints the press tint.",
			selector: ".xtyle-switch__track:active::after",
			tokens: ["--state-press"],
		},
		{
			name: "focus-visible",
			description: "Keyboard focus: a token-colored ring, plus a transparent outline that becomes real in forced-colors mode.",
			selector: ".xtyle-switch__track:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
		{
			name: "cursor",
			description: "App-owned keyboard cursor: `cursor` puts `data-cursor` on the track, which shares the focus-visible rule, so it draws the same ring and the same forced-colors outline while DOM focus stays where it is.",
			selector: ".xtyle-switch__track[data-cursor]",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
		{
			name: "disabled",
			description: "Non-interactive: muted track and thumb, overlay suppressed.",
			selector: '.xtyle-switch__track:disabled, .xtyle-switch__track[aria-disabled="true"]',
			tokens: ["--state-disabled", "--fg-disabled"],
		},
	],
	slots: [],
	consumedTokens: [
		"--font-sans",
		"--text-body",
		"--text-sm",
		"--leading-tight",
		"--fg-0",
		"--fg-2",
		"--fg-disabled",
		"--border-thin",
		"--border-normal",
		"--border-thick",
		"--radius-full",
		"--radius-sm",
		"--space-1",
		"--space-2",
		"--space-4",
		"--space-5",
		"--space-6",
		"--space-7",
		"--line-strong",
		"--neutral-bg",
		...FULL_TONES.flatMap((t) => [`--${t}`, `--${t}-fg`]),
		"--elevation-1",
		"--duration-base",
		"--duration-fast",
		"--ease-emphasized",
		"--ease-standard",
		"--ring",
		"--state-hover",
		"--state-press",
		"--state-disabled",
	],
	composition: [
		"Pair with Field or a form to capture the toggle; give it a `name` so it contributes to submitted data.",
		"Use `label` for a persistent name, or `on-label`/`off-label` for a control whose name is its current state.",
		"For a staged value that only applies on submit, reach for a checkbox instead. A switch applies immediately.",
	],
	a11y: [
		"The track's edge is drawn in `--line-strong`, so the off state still shows where the control is (3:1 against the page).",
		"The host's `aria-label` / `aria-labelledby` names the inner `role=\"switch\"` track, ahead of the component's own naming; `aria-labelledby` ids are read from the host's own tree.",
		"Under `forced-colors: active` the thumb draws in `CanvasText`, and an on track fills with `Highlight` behind a `HighlightText` thumb (`GrayText` when disabled); the thumb is a background the mode would otherwise flatten to `Canvas`, leaving on and off identical.",
		"Renders a native `<button>` with `role=\"switch\"`, so click, Space, and Enter all toggle it; Space's default scroll is prevented.",
		"The visible label is a click target like a native `<label>`: one click flips the switch once and a disabled switch ignores it. The label is not focusable, so keyboard users still reach and operate the track alone.",
		"State is carried in `aria-checked` and mirrored on the element's reflected `.checked`, never by color alone.",
		"Requires an accessible name: `labelledby` wins, then `label`, then the on/off state text; the binding warns at runtime when none is present.",
		"The thumb and state-only labels are wired so the toggle is always announced with a name, even when only `on-label`/`off-label` are given.",
		"Focus is shown with a token ring and a transparent outline that the forced-colors base rule promotes to a real system outline.",
		"`cursor` is visual only and sets no ARIA: an app-owned cursor is not focus, so it is not announced as focus, and the switch's state stays in `aria-checked` alone. An app that needs the cursor position announced owns that channel itself, typically by moving real focus or with a live region.",
		"`disabled` blocks interaction and sets `aria-disabled`; the track is muted and the overlay suppressed.",
	],
	examples: [
		{
			id: "labels-tones-shapes-and-form",
			title: "Labels, tones, shapes, and form association",
			description: "A named toggle, on/off state text, the compact size, a toned switch, the square / vertical / reversed variants, a form-bound switch, and a disabled one.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "spread-settings-column",
			title: "A spread settings column",
			description: "`spread` stretches each switch across its row, so the labels sit at the start, the tracks line up at the end, and a click anywhere on a label flips its switch.",
			source: { html: spreadHtml, svelte: spreadSvelte, astro: spreadAstro },
		},
		{
			id: "app-owned-cursor",
			title: "An app-owned keyboard cursor",
			description:
				"A settings list driven from the app's own input layer rather than DOM focus: `focusable={false}` keeps the browser's tab stop out of it, and `cursor` on the current row draws the focus ring on its track. `input` stands in for the app's own action bindings.",
			source: { html: cursorHtml, svelte: cursorSvelte, astro: cursorAstro },
		},
	],
};
