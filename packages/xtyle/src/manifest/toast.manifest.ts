import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

/** The four severities: the meaning axis (glyph + live-region politeness), distinct from color. */
const TOAST_SEVERITIES = ["success", "warn", "danger", "info"] as const;

const htmlExample = `<xtyle-toast-region id="toasts" placement="bottom-right"></xtyle-toast-region>

<script type="module">
	const region = document.getElementById("toasts");

	region.toast({ message: "Settings saved." });

	region.toast({
		tone: "success",
		variant: "solid",
		message: "Your profile is live.",
	});

	region.toast({
		tone: "danger",
		message: "Upload failed.",
		actionLabel: "Retry",
		onAction: () => retryUpload(),
	});

	region.toast({
		tone: "info",
		message: "Sync paused while offline.",
		duration: 0,
	});

	region.toast({
		severity: "success",
		message: "Copied to clipboard.",
		closable: false,
		duration: 2000,
	});
</script>`;

const svelteExample = `<script lang="ts">
	import { Toast } from "@xtyle/svelte";
</script>

<Toast tone="success" variant="soft">Settings saved.</Toast>

<Toast tone="danger" actionLabel="Retry" onaction={() => retryUpload()}>
	Upload failed.
</Toast>

<Toast tone="info" closable={false}>Sync paused while offline.</Toast>`;

const astroExample = `---
import { Toast } from "@xtyle/astro";
---

<Toast tone="success" variant="soft">Settings saved.</Toast>

<Toast tone="danger" actionLabel="Retry">Upload failed.</Toast>

<Toast tone="info" closable={false}>Sync paused while offline.</Toast>`;

export const toastManifest: ComponentManifest = {
	id: "toast",
	name: "Toast",
	category: "feedback",
	since: "0.1.0",
	keywords: ["notification", "snackbar", "flash", "transient message", "alert"],
	seeAlso: ["alert", "dialog"],
	summary: "A transient notification that announces itself and slips away; color and meaning on independent axes, in a live-region stack.",
	description:
		"Toast surfaces brief, transient feedback without stealing focus. Two axes drive it independently. `severity` (success, warn, danger, info) carries the *meaning*: the status glyph and the live-region politeness, so `danger`/`warn` announce assertively. `tone` carries the *color*, from the full palette. A severity paints its standard color by default (danger reads red), but a `tone` overrides it, and a color-only toast (a non-status `tone`, no `severity`) shows no glyph and announces politely. A `xtyle-toast-region` is a fixed live-region container with an imperative `toast(opts)` method that pushes cards; each carries one of two variants: `soft`, an overlay card with a colored edge, or `solid`, a fully filled card. Toasts enter and leave with a tokened transition, auto-dismiss after a configurable delay that pauses while the pointer or focus rests on them, and may carry a single action button and a close button. A standalone `xtyle-toast` element is also exposed for declarative, statically-placed notices.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "toast-region",
			description: "The fixed, non-focus-stealing live-region container that stacks and announces toasts.",
			selector: ".xtyle-toast-region",
			tokens: ["--space-3", "--space-5", "--space-6", "--layer-toast"],
		},
		{
			name: "toast",
			description: "A single notification card carrying the variant and tone classes.",
			selector: ".xtyle-toast",
			tokens: [
				"--font-sans",
				"--text-body",
				"--leading-normal",
				"--surface-overlay",
				"--surface-overlay-border",
				"--fg-0",
				"--border-thin",
				"--radius-md",
				"--shadow",
				"--space-3",
				"--space-4",
				"--duration-base",
				"--ease-emphasized",
			],
		},
		{
			name: "icon",
			description: "The severity glyph, shown when a `severity` is set, drawn in the card color (soft) or the on-fill ink (solid). Project an `icon` slot to override it (declarative `xtyle-toast` / `Toast`).",
			selector: ".xtyle-toast__icon",
			tokens: ["--text-lg"],
		},
		{
			name: "message",
			description: "The notification text; the content that gets announced.",
			selector: ".xtyle-toast__message",
			tokens: ["--weight-medium"],
		},
		{
			name: "action",
			description: "An optional inline action button that runs a callback then dismisses the toast.",
			selector: ".xtyle-toast__action",
			tokens: [
				"--text-sm",
				"--weight-semibold",
				"--leading-tight",
				"--border-thin",
				"--radius-sm",
				"--space-1",
				"--space-3",
				"--state-hover",
				"--state-press",
			],
		},
		{
			name: "close",
			description: "The dismiss button in the top corner.",
			selector: ".xtyle-toast__close",
			tokens: ["--text-lg", "--radius-sm", "--space-0", "--space-1", "--state-hover", "--state-press"],
		},
	],
	props: [
		{
			name: "tone",
			type: "ToastTone",
			description: "The card color: any semantic role, accent variant, or named hue. Defaults to the `severity` color (info when neither is set); set it to recolor a severity or to tint a color-only notice.",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
		{
			name: "severity",
			type: "ToastSeverity",
			description: "The meaning, independent of color: drives the status glyph and the live-region politeness (`danger`/`warn` announce assertively). Omit for a color-only toast with no glyph. A bare status-named `tone` implies the matching severity.",
			bindings: ["html", "svelte", "astro"],
			options: [...TOAST_SEVERITIES],
		},
		{
			name: "variant",
			type: "ToastVariant",
			default: "soft",
			description: "Visual treatment: a tone-edged overlay card or a fully tone-filled one.",
			bindings: ["html", "svelte", "astro"],
			options: ["soft", "solid"],
		},
		{
			name: "message",
			type: "string",
			description: "The toast text. Required by the imperative `toast(opts)` API; the slot carries it declaratively.",
			bindings: ["html"],
		},
		{
			name: "duration",
			type: "number",
			default: "5000",
			description: "Auto-dismiss delay in milliseconds; `0` keeps the toast until dismissed. Pauses on hover/focus. (Imperative API.)",
			bindings: ["html"],
		},
		{
			name: "actionLabel",
			type: "string",
			description: "Label for an optional inline action button.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "closable",
			type: "boolean",
			default: "true",
			description: "Whether to render the close button. On by default; pass `false` (`closable=\"false\"` in raw HTML) to drop it, and pair that with a `duration` so the toast can still leave.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "closeLabel",
			type: "string",
			default: "Dismiss",
			description: "Accessible label for the close button.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "placement",
			type: "string",
			default: "bottom-right",
			description: "Region anchor: bottom-right, top, top-left, bottom-left, top-center, or bottom-center.",
			bindings: ["html"],
		},
		{
			name: "max",
			type: "number",
			default: "5",
			description: "Maximum visible toasts; the oldest is dismissed when the cap is exceeded. (Region.)",
			bindings: ["html"],
		},
	],
	variants: [
		{
			name: "soft",
			description: "An overlay surface card with a tone-colored border and tone-colored icon.",
			className: "xtyle-toast--soft",
			tokens: ["--surface-overlay", "--fg-0", "--info"],
		},
		{
			name: "solid",
			description: "Filled with the tone color, with on-fill ink and icon.",
			className: "xtyle-toast--solid",
			tokens: ["--info", "--info-fg"],
		},
	],
	sizes: [],
	states: [
		{
			name: "enter",
			description: "Mount transition: the toast fades and slides into place over `--duration-base`.",
			selector: ".xtyle-toast--enter",
			tokens: ["--space-3", "--duration-base", "--ease-emphasized"],
		},
		{
			name: "leave",
			description: "Dismiss transition: the toast fades and slides out before removal.",
			selector: ".xtyle-toast--leave",
			tokens: ["--space-3", "--duration-base", "--ease-emphasized"],
		},
		{
			name: "action-hover",
			description: "Pointer over the action button: overlay paints the hover tint.",
			selector: ".xtyle-toast__action:hover::after",
			tokens: ["--state-hover"],
		},
		{
			name: "focus-visible",
			description: "Keyboard focus on the action or close button: a token ring plus a transparent outline promoted in forced-colors mode.",
			selector: ".xtyle-toast__action:focus-visible, .xtyle-toast__close:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
	],
	slots: [
		{
			name: "default",
			description: "The toast message (declarative `xtyle-toast` / `Toast`).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "icon",
			description: "Overrides the built-in severity glyph on a declarative toast; fill it to show your own icon (not available through the imperative `toast(opts)` API).",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--layer-toast",
		"--font-sans",
		"--text-body",
		"--text-sm",
		"--text-lg",
		"--weight-medium",
		"--weight-semibold",
		"--leading-normal",
		"--leading-tight",
		"--border-thin",
		"--border-normal",
		"--border-thick",
		"--radius-md",
		"--radius-sm",
		"--space-0",
		"--space-1",
		"--space-3",
		"--space-4",
		"--space-5",
		"--space-6",
		"--duration-base",
		"--duration-fast",
		"--ease-standard",
		"--ease-emphasized",
		"--shadow",
		"--ring",
		"--state-hover",
		"--state-press",
		"--surface-overlay",
		"--surface-overlay-border",
		"--fg-0",
		...FULL_TONES.flatMap((t) => [`--${t}`, `--${t}-fg`]),
	],
	composition: [
		"Mount one `xtyle-toast-region` near the document root and push toasts from anywhere via its `toast(opts)` method.",
		"A pushed toast *is* an `xtyle-toast`: the region builds the element and the same fill draws the card, so a restyle or an override lands on both paths at once.",
		"Use the `action` slot/`actionLabel` to pair a toast with a single Button-like recovery action (Retry, Undo); keep it to one.",
		"For persistent, in-flow status that should not auto-dismiss, reach for Alert instead; Toast is for the transient.",
	],
	a11y: [
		"The region is an `aria-live` container that never receives focus, so toasts never interrupt the user's place.",
		"Politeness follows `severity`, not color: `danger`/`warn` get `role=\"alert\"` (assertive); other severities and color-only toasts get `role=\"status\"` (polite).",
		"Each toast is `aria-atomic` so the whole message is announced as a unit.",
		"Auto-dismiss pauses while the pointer hovers or focus rests inside a toast, so action and close controls stay reachable.",
		"The tone icon is decorative (`aria-hidden`); the close button carries an `aria-label`.",
		"Focus on the action and close buttons shows a token ring plus a transparent outline the forced-colors base rule promotes to a real system outline.",
	],
	examples: [
		{
			id: "tones-and-region",
			title: "Tones, variants, and the imperative region",
			description:
				"Push toasts from a region, or place a standalone toast declaratively. The four status tones span both variants.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
