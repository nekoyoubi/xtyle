import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-button variant="solid" tone="accent" onclick="document.getElementById('filters').showModal()">
	Filters
</xtyle-button>

<xtyle-sheet id="filters" side="bottom" size="md" heading="Filters">
	<p>Narrow the results. The body scrolls; the header and the action row stay put.</p>
	<div slot="footer">
		<xtyle-button variant="ghost" tone="neutral" onclick="document.getElementById('filters').close()">
			Reset
		</xtyle-button>
		<xtyle-button variant="solid" tone="accent" onclick="document.getElementById('filters').close()">
			Apply
		</xtyle-button>
	</div>
</xtyle-sheet>`;

const svelteExample = `<script lang="ts">
	import { Button, Sheet } from "@xtyle/svelte";

	let filters = $state(false);
	let nav = $state(false);
</script>

<Button variant="solid" tone="accent" onclick={() => (filters = true)}>Filters</Button>
<Button variant="outline" tone="neutral" onclick={() => (nav = true)}>Menu</Button>

<Sheet bind:open={filters} side="bottom" size="md" heading="Filters">
	<p>Narrow the results. Drag the grabber down, press Escape, or tap the scrim to dismiss.</p>
	{#snippet footer()}
		<Button variant="ghost" tone="neutral" onclick={() => (filters = false)}>Reset</Button>
		<Button variant="solid" tone="accent" onclick={() => (filters = false)}>Apply</Button>
	{/snippet}
</Sheet>

<Sheet bind:open={nav} side="left" size="sm" heading="Navigate" noGrabber>
	<nav>…</nav>
</Sheet>`;

const astroExample = `---
import { Button, Sheet } from "@xtyle/astro";
---

<Button variant="solid" tone="accent" id="open-filters">Filters</Button>

<Sheet id="filters" side="bottom" size="md" heading="Filters">
	<p>Narrow the results.</p>
	<div slot="footer">
		<Button variant="ghost" tone="neutral" id="reset-filters">Reset</Button>
		<Button variant="solid" tone="accent" id="apply-filters">Apply</Button>
	</div>
</Sheet>

<script>
	const sheet = document.getElementById("filters") as HTMLElement & {
		showModal(): void;
		close(): void;
	};
	document.getElementById("open-filters")?.addEventListener("click", () => sheet.showModal());
	document.getElementById("reset-filters")?.addEventListener("click", () => sheet.close());
	document.getElementById("apply-filters")?.addEventListener("click", () => sheet.close());
</script>`;

export const sheetManifest: ComponentManifest = {
	id: "sheet",
	name: "Sheet",
	category: "overlay",
	since: "0.8.0",
	keywords: ["drawer", "bottom sheet", "side panel", "slide-over", "off-canvas", "tray", "swipe", "modal"],
	seeAlso: ["dialog", "popover", "mobile-shell", "bottom-nav"],
	summary:
		"An edge-anchored overlay built on the native `<dialog>`: a drawer that slides in from any of the four sides, safe-area aware and swipe-dismissible.",
	description:
		"Sheet is the drawer half of the overlay family, and the touch-app counterpart to Dialog. It wraps the same platform `<dialog>` element, so the top-layer scrim, the focus trap, focus restore on close, `Escape`-to-dismiss, and the `role`/`aria-modal` semantics all come from the browser rather than re-implemented JavaScript; what it adds is the axis Dialog has no answer for. A `side` (top, right, bottom, left) anchors the panel to a viewport edge and sets the direction it slides and swipes along; a `size` (sm, md, lg, full) sets its extent across that edge — a height for a top or bottom sheet, a width for a left or right one. It is safe-area aware the way MobileShell is: the panel grows by its edge's `env(safe-area-inset-*)` and pads that inset back out of its content, so it meets the hardware edge without any content sliding under a notch or a home indicator. `non-modal` opens it beside a live page — no scrim, no focus trap, the rest of the app still interactive — which is what a persistent side drawer or an inspector panel wants; the keyboard `Escape` path is wired explicitly there, since the platform only honors it for a modal dialog. A pointer swipe from the grabber or the header dismisses it, layered strictly on top of the keyboard paths (never in place of them). Its chrome — the panel, the drag handle and grabber, the header, the close button — renders through the `component.sheet` fragment, so a mod can reshape the whole drawer.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "sheet",
			description: "The native `<dialog>` pinned to its edge by an auto margin: the elevated panel above the scrim.",
			selector: ".xtyle-sheet",
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
				"--duration-base",
				"--ease-emphasized",
			],
		},
		{
			name: "scrim",
			description: "The native `::backdrop` pseudo-element dimming the page behind a modal sheet; a `non-modal` sheet paints none.",
			selector: ".xtyle-sheet::backdrop",
			tokens: ["--scrim", "--duration-base", "--ease-emphasized"],
		},
		{
			name: "handle",
			description: "The drag region at the sheet's inner edge — the swipe-to-dismiss hit area, `touch-action: none` so a drag never becomes a scroll.",
			selector: ".xtyle-sheet__handle",
			tokens: ["--space-2", "--space-3", "--space-4"],
		},
		{
			name: "grabber",
			description: "The bar drawn inside the handle: the visible affordance that the sheet can be dragged. Horizontal on a top/bottom sheet, vertical on a left/right one.",
			selector: ".xtyle-sheet__grabber",
			tokens: ["--fg-2", "--radius-full"],
		},
		{
			name: "panel",
			description: "The content column inside the sheet, holding the header, the scrolling body, and the footer beside the handle.",
			selector: ".xtyle-sheet__panel",
		},
		{
			name: "header",
			description: "The top region carrying the title slot and the close button, separated by a hairline. Doubles as a swipe surface.",
			selector: ".xtyle-sheet__header",
			tokens: ["--space-3", "--space-4", "--space-5", "--border-thin", "--line"],
		},
		{
			name: "body",
			description: "The scrolling content region between header and footer; overscroll is contained so a flick never scrolls the page behind.",
			selector: ".xtyle-sheet__body",
			tokens: ["--space-5", "--fg-1"],
		},
		{
			name: "footer",
			description: "The bottom region for actions, right-aligned with a hairline above. Collapses when the slot is empty.",
			selector: ".xtyle-sheet__footer",
			tokens: ["--space-2", "--space-4", "--space-5", "--border-thin", "--line"],
		},
		{
			name: "close",
			description: "The default dismiss button in the header corner, drawn in currentColor.",
			selector: ".xtyle-sheet__close",
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
			description: "Whether the sheet is shown. Set it true to open; the wrappers bind it two-way.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "side",
			type: "SheetSide",
			default: "bottom",
			description: "Which viewport edge the sheet is anchored to; also the axis it slides and swipes along.",
			bindings: ["html", "svelte", "astro"],
			options: ["top", "right", "bottom", "left"],
		},
		{
			name: "size",
			type: "SheetSize",
			default: "md",
			description:
				"The sheet's extent across its anchored edge: a height for `top` / `bottom`, a width for `left` / `right`. For an exact extent, set `--sheet-block` / `--sheet-inline` on `::part(sheet)`.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg", "full"],
		},
		{
			name: "nonModal",
			type: "boolean",
			default: "false",
			description:
				"Opens the sheet beside a live page — no scrim, no focus trap, no inert background — for a persistent drawer or inspector. `Escape` still closes it whenever focus is inside.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "heading",
			type: "string",
			description: "Title text rendered in the header and wired to the sheet via `aria-labelledby`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description:
				"Accessible name applied as `aria-label`: the way to name a sheet that supplies its own `header` slot instead of a `heading`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "labelledby",
			type: "string",
			description: "Id of an external element naming the sheet. Overrides the generated heading id.",
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
			description: "Suppresses the built-in close button when the sheet supplies its own dismiss control.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "noGrabber",
			type: "boolean",
			default: "false",
			description:
				"Suppresses the drag handle and its grabber bar. The swipe gesture still works from the header; pair with `noSwipe` to drop the gesture entirely.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "noSwipe",
			type: "boolean",
			default: "false",
			description:
				"Disables swipe-to-dismiss. The keyboard, close-button, and scrim paths are untouched — the gesture was never the only way out.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "bottom",
			description: "Pinned to the bottom edge, sliding up. The default, and the phone-native posture.",
			className: "xtyle-sheet--bottom",
			tokens: ["--radius-lg", "--border-thin"],
		},
		{
			name: "top",
			description: "Pinned to the top edge, sliding down. For a notification tray or a search bar.",
			className: "xtyle-sheet--top",
			tokens: ["--radius-lg", "--border-thin"],
		},
		{
			name: "left",
			description: "Pinned to the left edge, sliding in. The classic navigation drawer.",
			className: "xtyle-sheet--left",
			tokens: ["--radius-lg", "--border-thin"],
		},
		{
			name: "right",
			description: "Pinned to the right edge, sliding in. For an inspector or a detail pane.",
			className: "xtyle-sheet--right",
			tokens: ["--radius-lg", "--border-thin"],
		},
	],
	sizes: [
		{ name: "sm", description: "Compact: 28dvh tall, or 16rem wide.", className: "xtyle-sheet--sm" },
		{ name: "md", description: "Default: 45dvh tall, or 22rem wide.", className: "xtyle-sheet", isDefault: true },
		{ name: "lg", description: "Roomy: 72dvh tall, or 30rem wide.", className: "xtyle-sheet--lg" },
		{ name: "full", description: "The whole edge-to-edge screen, insets included.", className: "xtyle-sheet--full" },
	],
	states: [
		{
			name: "open",
			description:
				"Shown via `showModal()` (top layer, scrim painted by `::backdrop`) or `show()` under `non-modal`. The panel slides in from its edge.",
			selector: ".xtyle-sheet[open]",
			tokens: ["--duration-base", "--ease-emphasized"],
		},
		{
			name: "dragging",
			description: "A swipe is in flight; the panel tracks the pointer, so its easing is suspended and text selection is off.",
			selector: ".xtyle-sheet[data-dragging]",
		},
		{
			name: "non-modal",
			description: "Opened beside a live page: no scrim, no focus trap, and a stacking position of its own since it is not in the top layer.",
			selector: ".xtyle-sheet--non-modal",
		},
		{
			name: "close-hover",
			description: "Pointer over the close button; overlay paints the hover tint and the icon brightens.",
			selector: ".xtyle-sheet__close:hover",
			tokens: ["--fg-0", "--state-hover"],
		},
		{
			name: "close-focus-visible",
			description: "Keyboard focus on the close button; a token ring plus the transparent outline promoted in forced-colors mode.",
			selector: ".xtyle-sheet__close:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
	],
	slots: [
		{ name: "default", description: "The sheet's body content. Scrolls on its own when it overflows.", bindings: ["html", "svelte", "astro"] },
		{
			name: "header",
			description:
				"Custom header content, replacing the generated title. Falls back to the `heading` text; pair it with `label` to give the sheet an accessible name.",
			bindings: ["html", "svelte", "astro"],
		},
		{ name: "footer", description: "Footer actions, right-aligned. Collapses entirely when unfilled.", bindings: ["html", "svelte", "astro"] },
	],
	consumedTokens: [
		"--border-normal",
		"--border-thick",
		"--border-thin",
		"--duration-base",
		"--duration-fast",
		"--ease-emphasized",
		"--ease-standard",
		"--elevation-5",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--font-sans",
		"--leading-normal",
		"--leading-tight",
		"--line",
		"--radius-full",
		"--radius-lg",
		"--radius-sm",
		"--ring",
		"--scrim",
		"--space-2",
		"--space-3",
		"--space-4",
		"--space-5",
		"--state-hover",
		"--state-press",
		"--surface-overlay",
		"--surface-overlay-border",
		"--text-body",
		"--text-lg",
		"--weight-semibold",
	],
	composition: [
		"Reach for Sheet over Dialog whenever the overlay belongs to an edge rather than the center: a phone filter tray (`side=\"bottom\"`), a navigation drawer (`side=\"left\"`), an inspector (`side=\"right\"`), a notification shade (`side=\"top\"`).",
		"Pair it with MobileShell and BottomNav for the full touch-app frame: the shell holds the bar and the nav, and a bottom Sheet rises over both.",
		"Set `non-modal` for a drawer that sits alongside a still-usable page (an inspector, a persistent filter rail). Leave it modal for anything that demands an answer before the app continues.",
		"Set `--sheet-block` / `--sheet-inline` on `::part(sheet)` for an exact extent the four size steps do not cover (`xtyle-sheet::part(sheet) { --sheet-inline: 26rem; }`).",
		"Drop `noGrabber` on a left/right drawer that reads better without a bar; the swipe still works from the header. Drop `noSwipe` too when the sheet must not be dismissible by gesture (a blocking confirm).",
	],
	a11y: [
		"Built on the native `<dialog>` element, so `role=\"dialog\"`, the focus trap, focus restore on close, `Escape`-to-dismiss, and (when modal) `aria-modal=\"true\"` all come from the browser.",
		"`showModal()` places the sheet in the top layer and renders the `::backdrop` scrim; a click on the scrim closes it. `non-modal` opens with `show()` — no scrim, no trap — and the element wires `Escape` itself, since the platform only closes a *modal* dialog on that key.",
		"A `heading` (or explicit `labelledby`) wires the sheet to its title via `aria-labelledby`; a `header`-slot sheet names itself with `label` (an `aria-label`) instead, since the IDREF cannot cross into the slotted light DOM. The binding warns at runtime when none is present.",
		"Swipe-to-dismiss is strictly additive, never a substitute: every sheet stays dismissible by `Escape`, by the close button, and by the scrim, so a pointer gesture is never the only way out. The grabber is `aria-hidden` and takes no tab stop, because it duplicates a path already reachable.",
		"The gesture only starts on the grabber or the header's own chrome — never in the scrolling body, and never on an interactive control inside the header — so a drag can never eat a scroll or swallow a button press.",
		"The built-in close button carries an `aria-label` (default \"Close\", overridable via `closeLabel`) and its glyph is `aria-hidden`; keyboard focus on it paints a token ring plus the transparent outline forced-colors mode promotes to a real system outline.",
		"The slide-in honors `prefers-reduced-motion`: the transform transition is dropped and the sheet simply appears at its edge.",
		"Closing (by `Escape`, the close button, a scrim click, a swipe, or `close()`) fires a `close` event and clears the `open` state.",
	],
	examples: [
		{
			id: "filter-sheet",
			title: "Bottom filter sheet",
			description: "The phone-native posture: a titled tray that rises from the bottom edge, dismissible by grabber, Escape, scrim, or the action row.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
