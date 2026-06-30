import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

/** The four severities: the meaning axis (glyph + live-region politeness), distinct from color. */
const ALERT_SEVERITIES = ["success", "warn", "danger", "info"] as const;

const htmlExample = `<xoji-alert tone="info" variant="soft">
	<span slot="title">Heads up</span>
	Your changes are saved locally and will sync when you reconnect.
</xoji-alert>

<xoji-alert tone="success" variant="soft">Profile updated.</xoji-alert>

<xoji-alert tone="danger" variant="solid" dismissible>
	<span slot="title">Upload failed</span>
	The file exceeded the 25 MB limit.
	<span slot="actions">
		<xoji-button variant="outline" tone="danger">Try again</xoji-button>
	</span>
</xoji-alert>`;

const svelteExample = `<script lang="ts">
	import { Alert, Button } from "@xoji/svelte";
</script>

<Alert tone="info">
	{#snippet title()}Heads up{/snippet}
	Your changes are saved locally and will sync when you reconnect.
</Alert>

<Alert tone="success">Profile updated.</Alert>

<Alert tone="danger" variant="solid" dismissible ondismiss={() => retry()}>
	{#snippet title()}Upload failed{/snippet}
	The file exceeded the 25 MB limit.
	{#snippet actions()}
		<Button variant="outline" tone="danger">Try again</Button>
	{/snippet}
</Alert>`;

const astroExample = `---
import { Alert, Button } from "@xoji/astro";
---

<Alert tone="info">
	<Fragment slot="title">Heads up</Fragment>
	Your changes are saved locally and will sync when you reconnect.
</Alert>

<Alert tone="success">Profile updated.</Alert>

<Alert tone="danger" variant="solid" dismissible>
	<Fragment slot="title">Upload failed</Fragment>
	The file exceeded the 25 MB limit.
	<Button slot="actions" variant="outline" tone="danger">Try again</Button>
</Alert>`;

export const alertManifest: ComponentManifest = {
	id: "alert",
	name: "Alert",
	category: "feedback",
	summary: "An inline message banner with an optional severity glyph, a title, actions, and a dismissible form; color and meaning on independent axes.",
	description:
		"Alert presents a persistent, inline message. Two axes drive it independently. `severity` (success, warn, danger, info) carries the *meaning*: the leading status glyph and the live-region politeness. `tone` carries the *color*, drawn from the full palette (semantic roles, accent variants, or named hues). By default a severity paints itself its standard color (danger reads red), but a `tone` overrides that, so a `danger` can be repainted pink and still announce as danger, while a color-only notice (a pink awareness banner with no `severity`) shows no glyph and announces politely. A `soft` variant tints the banner; a `solid` variant fills it for higher emphasis. An optional title sits above the message, an actions footer holds buttons, and a `dismissible` form adds a close button (also closable with Escape) that emits a `dismiss` event before removing the banner.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "alert",
			description: "The banner root carrying the variant and tone classes plus the live-region role.",
			selector: ".xoji-alert",
			tokens: [
				"--space-3",
				"--font-sans",
				"--text-body",
				"--leading-normal",
				"--border-thin",
				"--radius-md",
				"--space-4",
			],
		},
		{
			name: "icon",
			description: "The leading status glyph, shown when a `severity` is set, drawn in the banner color and hidden from assistive tech. Project an `icon` slot to override it (the slot shows even on a severity-less banner).",
			selector: ".xoji-alert__icon",
			tokens: ["--text-lg", "--space-0"],
		},
		{
			name: "body",
			description: "The vertical stack holding the title, message, and actions.",
			selector: ".xoji-alert__body",
			tokens: ["--space-1"],
		},
		{
			name: "title",
			description: "The optional bold heading above the message.",
			selector: ".xoji-alert__title",
			tokens: ["--weight-semibold", "--text-lg", "--leading-tight", "--fg-0"],
		},
		{
			name: "message",
			description: "The default-slot body copy.",
			selector: ".xoji-alert__message",
		},
		{
			name: "actions",
			description: "The footer row of buttons rendered below the message.",
			selector: ".xoji-alert__actions",
			tokens: ["--space-2", "--space-1"],
		},
		{
			name: "dismiss",
			description: "The close button shown in the dismissible form, with its own hover/press overlay and focus ring.",
			selector: ".xoji-alert__dismiss",
			tokens: ["--text-lg", "--space-0", "--space-1", "--border-thin", "--radius-sm", "--duration-fast", "--ease-standard"],
		},
	],
	props: [
		{
			name: "tone",
			type: "AlertTone",
			description: "The banner color: any semantic role, accent variant, or named hue. Defaults to the `severity` color (info when neither is set). Set it to recolor a severity (a pink `danger`) or to tint a color-only notice (a pink awareness banner).",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
		{
			name: "severity",
			type: "AlertSeverity",
			description: "The meaning, independent of color: drives the leading status glyph and the live-region politeness (`danger`/`warn` announce assertively). Omit for a color-only notice with no glyph. A bare status-named `tone` (e.g. `danger`) implies the matching severity.",
			bindings: ["html", "svelte", "astro"],
			options: [...ALERT_SEVERITIES],
		},
		{
			name: "variant",
			type: "AlertVariant",
			default: "soft",
			description: "Visual treatment: a soft tone tint or a solid tone fill.",
			bindings: ["html", "svelte", "astro"],
			options: ["soft", "solid"],
		},
		{
			name: "dismissible",
			type: "boolean",
			default: "false",
			description: "Adds a close button and Escape-to-close; emits a cancelable `dismiss` event before removing the banner.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "dismissLabel",
			type: "string",
			default: "Dismiss",
			description: "Accessible label for the close button (kebab `dismiss-label` on the custom element).",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "soft",
			description: "A soft tone-tinted background with tone-colored text, border, and icon.",
			className: "xoji-alert--soft",
			tokens: ["--info-bg", "--info-text", "--info"],
		},
		{
			name: "solid",
			description: "Filled with the tone color and reverse ink; the high-emphasis treatment.",
			className: "xoji-alert--solid",
			tokens: ["--info", "--info-fg"],
		},
	],
	sizes: [{ name: "md", description: "The single size.", className: "xoji-alert", isDefault: true }],
	states: [
		{
			name: "dismiss-hover",
			description: "Pointer over the close button. Overlay paints the hover tint.",
			selector: ".xoji-alert__dismiss:hover::after",
			tokens: ["--state-hover"],
		},
		{
			name: "dismiss-active",
			description: "Close button pressed. Overlay paints the press tint.",
			selector: ".xoji-alert__dismiss:active::after",
			tokens: ["--state-press"],
		},
		{
			name: "dismiss-focus-visible",
			description: "Keyboard focus on the close button: a token-colored ring plus a transparent outline that the forced-colors base rule promotes.",
			selector: ".xoji-alert__dismiss:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
	],
	slots: [
		{
			name: "default",
			description: "The message body.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "title",
			description: "An optional bold heading above the message.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "actions",
			description: "A footer row of buttons rendered below the message.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "icon",
			description: "Overrides the built-in severity glyph; fill it to show your own icon (or to mark a severity-less notice).",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--border-normal",
		"--border-thick",
		"--border-thin",
		"--duration-fast",
		"--ease-standard",
		"--fg-0",
		"--font-sans",
		"--leading-normal",
		"--leading-tight",
		"--radius-md",
		"--radius-sm",
		"--ring",
		"--space-0",
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-4",
		"--state-hover",
		"--state-press",
		"--text-body",
		"--text-lg",
		"--weight-semibold",
		...FULL_TONES.flatMap((t) => [`--${t}`, `--${t}-bg`, `--${t}-fg`, `--${t}-text`]),
	],
	composition: [
		"Drop Button components into the `actions` slot for primary/secondary responses; match the button tone to the alert tone.",
		"For transient, auto-dismissing notices use Toast instead; Alert is for persistent inline messages.",
		"The leading icon is built in per `severity`; project your own into the `icon` slot to override it, or to mark a color-only notice that carries no severity.",
	],
	a11y: [
		"Live-region semantics follow `severity`, not color: danger/warn render `role=\"alert\"` with `aria-live=\"assertive\"`, success/info render `role=\"status\"` with `aria-live=\"polite\"`, and a severity-less notice is polite `role=\"status\"`.",
		"The leading status glyph is decorative (`aria-hidden`) and appears only with a `severity`; meaning is carried by the text and the role, never by color alone.",
		"The dismissible form is closable by pointer or the Escape key and exposes an accessible label on the close button (`dismissLabel`, default \"Dismiss\").",
		"Dismissing fires a cancelable `dismiss` event; calling `preventDefault()` keeps the banner in place so a host can run its own removal animation.",
		"Focus on the close button shows the token ring plus a transparent outline that the forced-colors base rule promotes to a real system outline.",
	],
	examples: [
		{
			id: "tones-variants-and-dismiss",
			title: "Tones, variants, and dismissal",
			description: "The four status tones across the soft and solid variants, with an optional title, an actions footer, and the dismissible form.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
