import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-button variant="solid" tone="accent" onclick="document.getElementById('confirm').showModal()">
	Delete account
</xtyle-button>

<xtyle-dialog id="confirm" heading="Delete account?">
	<p>This permanently removes your account and all of its data. This cannot be undone.</p>
	<div slot="footer">
		<xtyle-button variant="ghost" tone="neutral" onclick="document.getElementById('confirm').close()">
			Cancel
		</xtyle-button>
		<xtyle-button variant="solid" tone="danger">Delete</xtyle-button>
	</div>
</xtyle-dialog>`;

const svelteExample = `<script lang="ts">
	import { Button, Dialog } from "@xtyle/svelte";

	let open = $state(false);
</script>

<Button variant="solid" tone="accent" onclick={() => (open = true)}>Delete account</Button>

<Dialog bind:open heading="Delete account?" size="sm">
	<p>This permanently removes your account and all of its data. This cannot be undone.</p>
	{#snippet footer()}
		<Button variant="ghost" tone="neutral" onclick={() => (open = false)}>Cancel</Button>
		<Button variant="solid" tone="danger" onclick={() => (open = false)}>Delete</Button>
	{/snippet}
</Dialog>`;

const astroExample = `---
import { Button, Dialog } from "@xtyle/astro";
---

<Button variant="solid" tone="accent" id="open-confirm">Delete account</Button>

<Dialog heading="Delete account?">
	<p>This permanently removes your account and all of its data. This cannot be undone.</p>
	<div slot="footer">
		<Button variant="ghost" tone="neutral" id="cancel-confirm">Cancel</Button>
		<Button variant="solid" tone="danger">Delete</Button>
	</div>
</Dialog>

<script>
	const dialog = document.querySelector("xtyle-dialog");
	document.getElementById("open-confirm")?.addEventListener("click", () => dialog?.showModal());
	document.getElementById("cancel-confirm")?.addEventListener("click", () => dialog?.close());
</script>`;

export const dialogManifest: ComponentManifest = {
	id: "dialog",
	name: "Dialog",
	category: "overlay",
	keywords: ["modal", "popup", "overlay", "lightbox", "confirm", "sheet"],
	seeAlso: ["tooltip", "menu", "toast"],
	summary: "A centered modal built on the native `<dialog>` element: scrim, focus trap, and Esc-to-close come for free.",
	description:
		"Dialog is a centered modal that wraps the platform `<dialog>` element, so the native modal machinery (the top-layer scrim, the focus trap, focus restore on close, `Escape` to dismiss, and the `role`/`aria-modal` semantics) all comes from the browser rather than re-implemented JavaScript. Open and close it imperatively with `showModal()` / `close()` (or the reactive `open` prop in the framework wrappers). It lays out a header, a scrolling body, and a footer via named slots, and ships a close button by default. The header is wired to the dialog with `aria-labelledby` whenever a `heading` (or explicit `labelledby`) is supplied; a dialog that brings its own `header` slot instead names itself with `label`, since `aria-labelledby` cannot reach a slotted title across the shadow boundary. Three sizes (sm, md, lg) cap its width while it stays responsive on small screens.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "dialog",
			description: "The native `<dialog>` surface holding the modal; the elevated panel above the scrim.",
			selector: ".xtyle-dialog",
			tokens: [
				"--font-sans",
				"--text-body",
				"--leading-normal",
				"--fg-0",
				"--surface-overlay",
				"--surface-overlay-border",
				"--border-thin",
				"--radius-lg",
				"--elevation-5",
				"--space-5",
				"--space-6",
			],
		},
		{
			name: "scrim",
			description: "The native `::backdrop` pseudo-element dimming the page behind the modal.",
			selector: ".xtyle-dialog::backdrop",
			tokens: ["--scrim"],
		},
		{
			name: "header",
			description: "The top region carrying the title slot and the close button, separated by a hairline.",
			selector: ".xtyle-dialog__header",
			tokens: ["--space-3", "--space-4", "--space-5", "--border-thin", "--line"],
		},
		{
			name: "body",
			description: "The scrolling content region between header and footer.",
			selector: ".xtyle-dialog__body",
			tokens: ["--space-5", "--fg-1"],
		},
		{
			name: "footer",
			description: "The bottom region for actions, right-aligned with a hairline above.",
			selector: ".xtyle-dialog__footer",
			tokens: ["--space-2", "--space-4", "--space-5", "--border-thin", "--line"],
		},
		{
			name: "close",
			description: "The default dismiss button in the header corner, drawn in currentColor.",
			selector: ".xtyle-dialog__close",
			tokens: [
				"--fg-2",
				"--fg-0",
				"--radius-sm",
				"--duration-fast",
				"--ease-standard",
				"--state-hover",
				"--state-press",
				"--border-normal",
				"--border-thick",
				"--ring",
			],
		},
	],
	props: [
		{
			name: "open",
			type: "boolean",
			default: "false",
			description: "Whether the modal is shown. Set it true to open; the wrappers bind it two-way.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "size",
			type: "Size",
			default: "md",
			description: "Caps the dialog's width.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
		{
			name: "heading",
			type: "string",
			description: "Title text rendered in the header and wired to the dialog via `aria-labelledby`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "Accessible name applied as `aria-label`: the way to name a dialog that supplies its own `header` slot instead of a `heading`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "labelledby",
			type: "string",
			description: "Id of an external element naming the dialog. Overrides the generated heading id.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "closeLabel",
			type: "string",
			default: "Close",
			description: "Accessible label for the built-in close button.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "noCloseButton",
			type: "boolean",
			default: "false",
			description: "Suppresses the built-in close button when the dialog supplies its own dismiss control.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [
		{ name: "sm", description: "Compact: for short confirmations.", className: "xtyle-dialog--sm" },
		{ name: "md", description: "Default.", className: "xtyle-dialog", isDefault: true },
		{ name: "lg", description: "Roomy: for richer content.", className: "xtyle-dialog--lg" },
	],
	states: [
		{
			name: "open",
			description: "Shown as a modal via `showModal()`, placed in the top layer with the scrim painted by `::backdrop`.",
			selector: ".xtyle-dialog::backdrop",
			tokens: ["--scrim"],
		},
		{
			name: "close-hover",
			description: "Pointer over the close button; overlay paints the hover tint and the icon brightens.",
			selector: ".xtyle-dialog__close:hover",
			tokens: ["--fg-0", "--state-hover"],
		},
		{
			name: "close-active",
			description: "Close button pressed; overlay paints the press tint.",
			selector: ".xtyle-dialog__close:active::after",
			tokens: ["--state-press"],
		},
		{
			name: "close-focus-visible",
			description: "Keyboard focus on the close button; a token ring plus the transparent outline promoted in forced-colors mode.",
			selector: ".xtyle-dialog__close:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
	],
	slots: [
		{
			name: "default",
			description: "The dialog body content.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "header",
			description: "Custom header content, replacing the generated title. Falls back to the `heading` text; pair it with `label` to give the dialog an accessible name.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "footer",
			description: "Footer actions, right-aligned.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--text-body",
		"--text-lg",
		"--leading-normal",
		"--leading-tight",
		"--weight-semibold",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--surface-overlay",
		"--surface-overlay-border",
		"--scrim",
		"--line",
		"--border-thin",
		"--border-normal",
		"--border-thick",
		"--radius-lg",
		"--radius-sm",
		"--ring",
		"--elevation-5",
		"--space-2",
		"--space-3",
		"--space-4",
		"--space-5",
		"--space-6",
		"--duration-fast",
		"--ease-standard",
		"--state-hover",
		"--state-press",
	],
	composition: [
		"Pair the footer with Button for the action row; wire a ghost neutral Cancel to `close()` and the primary action to its handler.",
		"Use `heading` for the common titled case; drop in a `header` slot when the title needs an icon, badge, or subtitle.",
		"Set `no-close-button` when the dialog is a blocking confirm whose only exits are explicit footer actions.",
	],
	a11y: [
		"Built on the native `<dialog>` element, so `role=\"dialog\"`, `aria-modal=\"true\"`, the focus trap, focus restore on close, and `Escape`-to-dismiss all come from the browser.",
		"`showModal()` places the dialog in the top layer and renders the `::backdrop` scrim; a click on the backdrop closes it.",
		"A `heading` (or explicit `labelledby`) wires the dialog to its title via `aria-labelledby`; a `header`-slot dialog names itself with `label` (an `aria-label`) instead, since the IDREF cannot cross into the slotted light DOM. The binding warns at runtime when none is present.",
		"The built-in close button carries an `aria-label` (default \"Close\", overridable via `closeLabel`) and its glyph is `aria-hidden`.",
		"Focus on the close button is shown with a token ring and a transparent outline that the forced-colors base rule promotes to a real system outline.",
		"Closing (by `Escape`, the close button, a backdrop click, or `close()`) fires a `close` event and clears the `open` state.",
	],
	examples: [
		{
			id: "confirm-dialog",
			title: "Confirmation dialog",
			description: "A titled modal with a body message and a Cancel / Delete action row in the footer.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
