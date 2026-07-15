import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-popover label="Filters" arrow placement="bottom" align="start">
	<button slot="trigger" type="button">Filters</button>
	<form>
		<label><input type="checkbox" checked /> Open</label>
		<label><input type="checkbox" /> Merged</label>
		<button type="submit">Apply</button>
	</form>
</xtyle-popover>

<script>
	const popover = document.querySelector("xtyle-popover");
	popover.addEventListener("open", () => console.log("opened"));
	popover.addEventListener("close", (e) => console.log("closed:", e.detail.reason));
</script>`;

const svelteExample = `<script lang="ts">
	import { Popover, Button, Checkbox } from "@xtyle/svelte";
</script>

<Popover label="Filters" arrow placement="bottom" align="start" onclose={(e) => console.log(e.detail.reason)}>
	{#snippet trigger()}
		<Button>Filters</Button>
	{/snippet}
	<Checkbox label="Open" checked />
	<Checkbox label="Merged" />
</Popover>`;

const astroExample = `---
import Popover from "@xtyle/astro/Popover.astro";
import Button from "@xtyle/astro/Button.astro";
---

<Popover label="Filters" arrow placement="bottom" align="start">
	<Button slot="trigger">Filters</Button>
	<p>Anything at all lives in the panel — it is your content, not the component's.</p>
</Popover>`;

const htmlPointExample = `<div id="canvas">Click anywhere in here.</div>

<!-- no trigger slot: the host takes no layout, and the popover opens at a point -->
<xtyle-popover id="peek" label="Point details" arrow></xtyle-popover>

<script>
	const peek = document.querySelector("#peek");
	peek.innerHTML = "<p>Opened right where you clicked.</p>";

	document.querySelector("#canvas").addEventListener("click", (event) => {
		peek.openAt(event.clientX, event.clientY);
	});
</script>`;

const sveltePointExample = `<script lang="ts">
	import { Popover } from "@xtyle/svelte";

	let peek: { openAt(x: number, y: number): void };
</script>

<div onclick={(e) => peek.openAt(e.clientX, e.clientY)}>Click anywhere in here.</div>

<Popover bind:this={peek} label="Point details" arrow>
	<p>Opened right where you clicked.</p>
</Popover>`;

const astroPointExample = `---
import Popover from "@xtyle/astro/Popover.astro";
---

<div id="canvas">Click anywhere in here.</div>
<Popover id="peek" label="Point details" arrow>
	<p>Opened right where you clicked.</p>
</Popover>

<script>
	const peek = document.querySelector("#peek");
	document.querySelector("#canvas").addEventListener("click", (event) => {
		peek.openAt(event.clientX, event.clientY);
	});
</script>`;

const htmlModalExample = `<!-- \`modal\` opens the panel as a modal <dialog>: the platform makes the page behind it
     inert, so \`aria-modal\` is a fact. Tab, the pointer, and a screen reader in browse mode
     all stay inside — and a click outside is swallowed, not passed through to what it hit. -->
<xtyle-popover label="Confirm delete" modal arrow>
	<button slot="trigger" type="button">Delete…</button>
	<p>This cannot be undone. The page behind this panel is out of play until you answer.</p>
	<button id="confirm" type="button">Delete</button>
	<button id="cancel" type="button">Cancel</button>
</xtyle-popover>

<script>
	const popover = document.querySelector("xtyle-popover");
	for (const id of ["#confirm", "#cancel"]) {
		document.querySelector(id).addEventListener("click", (event) => {
			// a bubbling \`select\` closes the panel — the same discipline Menu and Dialog use
			event.currentTarget.dispatchEvent(new CustomEvent("select", { bubbles: true, detail: { id } }));
		});
	}
	popover.addEventListener("close", (e) => console.log("closed:", e.detail.reason));
</script>`;

const svelteModalExample = `<script lang="ts">
	import { Popover, Button, Text } from "@xtyle/svelte";

	let popover: { hide(): void };
</script>

<Popover bind:this={popover} label="Confirm delete" modal arrow>
	{#snippet trigger()}
		<Button variant="danger">Delete…</Button>
	{/snippet}
	<Text size="sm">This cannot be undone. The page behind this panel is out of play until you answer.</Text>
	<Button variant="danger" size="sm" onclick={() => popover.hide()}>Delete</Button>
	<Button variant="neutral" size="sm" onclick={() => popover.hide()}>Cancel</Button>
</Popover>`;

const astroModalExample = `---
import Popover from "@xtyle/astro/Popover.astro";
import Button from "@xtyle/astro/Button.astro";
---

<Popover label="Confirm delete" modal arrow>
	<Button slot="trigger" variant="danger">Delete…</Button>
	<p>This cannot be undone. The page behind this panel is out of play until you answer.</p>
</Popover>`;

const htmlSubstrateExample = `<!-- the shape a Combobox / CommandPalette builds on: an anchor the sibling owns,
     a flush panel, no focus theft, and the panel role its content actually is -->
<input id="filter" role="combobox" aria-autocomplete="list" placeholder="Filter…" />

<xtyle-popover id="results" for="filter" panel-role="listbox" flush align="start" gap="4"></xtyle-popover>

<script>
	const input = document.querySelector("#filter");
	const results = document.querySelector("#results");
	results.innerHTML = "<ul role='none'><li role='option'>alpha</li><li role='option'>beta</li></ul>";

	input.addEventListener("input", () => {
		// anchor to the element the sibling owns; the caret never leaves the input
		results.openFrom(input, { focus: "none" });
		results.reposition(); // the list resized as it filtered
	});

	// a \`select\` bubbling out of the panel closes it — the same discipline Menu and Dialog use
	results.addEventListener("close", (e) => console.log("closed:", e.detail.reason));
</script>`;

const svelteSubstrateExample = `<script lang="ts">
	import { Popover, Field } from "@xtyle/svelte";

	let anchor: HTMLElement;
	let results: { openFrom(el: HTMLElement, opts?: { focus?: "none" }): void; reposition(): void };

	function onInput() {
		results.openFrom(anchor, { focus: "none" });
		results.reposition();
	}
</script>

<div bind:this={anchor}><Field label="Filter" oninput={onInput} /></div>

<Popover bind:this={results} panel-role="listbox" flush align="start" gap={4}>
	<ul role="none"><li role="option">alpha</li><li role="option">beta</li></ul>
</Popover>`;

const astroSubstrateExample = `---
import Popover from "@xtyle/astro/Popover.astro";
import Field from "@xtyle/astro/Field.astro";
---

<Field id="filter" label="Filter" />
<Popover id="results" for="filter" panelRole="listbox" flush align="start" gap={4}>
	<ul role="none"><li role="option">alpha</li><li role="option">beta</li></ul>
</Popover>

<script>
	const input = document.querySelector("#filter");
	const results = document.querySelector("#results");
	input.addEventListener("input", () => results.openFrom(input, { focus: "none" }));
</script>`;

export const popoverManifest: ComponentManifest = {
	id: "popover",
	name: "Popover",
	category: "overlay",
	since: "0.8.0",
	keywords: ["anchored surface", "floating panel", "dropdown", "disclosure", "flyout", "hovercard", "coachmark"],
	seeAlso: ["menu", "tooltip", "dialog", "select"],
	summary: "The generic anchored surface: a floating panel tethered to a trigger, an element, or a point.",
	description:
		"Popover is the substrate the rest of the anchored family is built from. Tooltip describes; Menu commands; Dialog interrupts. Popover holds *anything* — a filter form, a profile card, a color picker, a date grid, a list of results — and answers the one question all of them share: where does the panel go, and how does it leave. It owns no content. The trigger is yours (slot it, or point `for` at an element anywhere in the document) and the body is yours (the default slot). What Popover owns is the surface around them: the panel, the arrow, the placement, the dismissal, and the focus.\n\nThe panel renders in the top layer — no z-index war, no clipping by an ancestor's `overflow` — and it gets there through whichever platform door the posture actually needs. A non-modal panel is a native Popover, so light-dismiss and Escape come from the platform rather than a document listener, and the page stays live behind it. Placement flips: it prefers the side you name and takes the opposite one when the panel does not fit, and it flips the cross-axis alignment `start` ↔ `end` before it ever slides the panel off its anchor, so a panel near the right edge right-aligns the way a native menu does. The optional `arrow` is a real node in the fragment (not a CSS pseudo-element, so a mod can reshape it), and it tracks the anchor's *center* whatever the alignment and the viewport clamp did — a `start`-aligned panel still points at the middle of its trigger.\n\nThere are three ways to open it, one API. `show()` opens against the declared anchor — the slotted trigger, or the `for` element. `openAt(x, y)` opens at a bare viewport point (a click, a right-click, a caret position), exactly as Menu's context mode does. `openFrom(element, opts)` opens against any element you hand it, which is the hook a component that owns its own trigger reaches for. All three take the same options, and all three place the panel *synchronously*, so it never paints a frame at the origin before it lands.\n\nFocus has two postures. Non-modal (the default) is an ordinary disclosure: Tab walks out of the panel, and a click anywhere else dismisses it. Add `modal` and the *same panel* opens as a modal `<dialog>` instead — so the background is made inert by the platform, exactly as it is for Dialog and Sheet, and the panel's `aria-modal` is a fact rather than a decoration. That distinction is the whole reason the modal posture is not just a scrim: the Popover API alone never makes the background inert, so a scrim and a JavaScript focus trap would still leave a screen reader free to browse straight out of a panel insisting it cannot be left. On top of the platform's inertness the modal posture adds what a dialog does not give for free — a pointer landing outside dismisses *and* is swallowed, so the button it happened to hit does not also fire.\n\n`focus-on-open` decides where focus lands — `first` (the default), `panel`, or `none` for a surface whose caret must stay in an input it doesn't own. Closing hands focus back to wherever it came from, and the `close` event says why (`escape`, `dismiss`, `select`, `api`). A `select` event bubbling out of the panel closes it, so an option list, a menu, or a command list dismisses the surface it was chosen from with nothing wired.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "popover",
			description:
				"The wrapper holding the trigger and its panel. `display: contents`, so the popover puts nothing in flow but the trigger — and a triggerless (point-anchored) popover takes no layout at all, wherever it is declared.",
			selector: ".xtyle-popover",
		},
		{
			name: "trigger",
			description:
				"The box around the consumer's own trigger, and the rect the panel anchors to. Hidden entirely when nothing is slotted into it.",
			selector: ".xtyle-popover__trigger",
		},
		{
			name: "panel",
			description:
				"The floating surface: a `<dialog popover>` rendered in the top layer, so it escapes ancestor clipping and stacking. It opens as a native popover when non-modal and through `showModal()` when `modal` is set, which is what makes the modal posture's inertness the platform's rather than a claim. Carries `data-placement` and `data-align` with the side and alignment it actually landed on.",
			selector: ".xtyle-popover__panel",
			tokens: [
				"--surface-overlay",
				"--surface-overlay-border",
				"--border-thin",
				"--border-thick",
				"--radius-md",
				"--elevation-3",
				"--ring",
				"--font-sans",
				"--text-sm",
				"--leading-normal",
				"--fg-1",
				"--space-8",
				"--duration-fast",
				"--ease-standard",
			],
		},
		{
			name: "arrow",
			description:
				"The beak: a real node in the fragment, not a pseudo-element, so a mod can reshape it. Tethered to the anchor's center, bounded so it never rounds the panel's corner. Off unless `arrow` is set.",
			selector: ".xtyle-popover__arrow",
			tokens: ["--space-2", "--surface-overlay", "--surface-overlay-border", "--border-thin"],
		},
		{
			name: "content",
			description:
				"The scroll box holding the consumer's slotted body. Overflows on its own so a long panel scrolls without the arrow being clipped along with it.",
			selector: ".xtyle-popover__content",
			tokens: ["--space-3", "--space-8"],
		},
	],
	props: [
		{
			name: "open",
			type: "boolean",
			default: "false",
			description:
				"Reflects (and controls) whether the panel is open. Setting it places the panel but never moves focus — `show()` / `openAt()` / `openFrom()` are the focus-managing doors.",
			bindings: ["html", "svelte"],
		},
		{
			name: "placement",
			type: '"top" | "bottom" | "left" | "right"',
			default: '"bottom"',
			description: "The preferred side of the anchor. Flips to the opposite side when the panel does not fit there.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "align",
			type: '"start" | "center" | "end"',
			default: '"center"',
			description:
				"Cross-axis alignment against the anchor. `start` ↔ `end` flip near a viewport edge before the panel is ever clamped sideways; `center` goes straight to the clamp.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "gap",
			type: "number",
			default: "8",
			description: "Space between the anchor and the panel, in px. The default leaves room for the arrow.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "arrow",
			type: "boolean",
			default: "false",
			description:
				"Draw the arrow. It points at the anchor's center whatever the alignment did, and it is a real node, so a mod can restyle or replace it.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "modal",
			type: "boolean",
			default: "false",
			description:
				"Modal posture: the same panel opens as a modal `<dialog>`, so the platform makes the background inert — unreachable by pointer, by Tab, and by a screen reader's browse mode alike — behind a scrim. On top of that, a pointer landing outside dismisses the panel *and* is swallowed, so the control it hit does not also fire. Non-modal leaves the page live behind an ordinary light-dismissible surface.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "flush",
			type: "boolean",
			default: "false",
			description:
				"Drop the panel's padding so slotted content reaches its edges — what a list, a menu, an image, or a calendar grid wants.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "for",
			type: "string",
			description:
				"The `id` of an element elsewhere in the document that anchors *and* toggles the popover, for a trigger that cannot be a child (a toolbar button, an input a sibling component owns).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "The panel's accessible name. A `dialog`-role panel needs one (or `labelledby`).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "labelledby",
			type: "string",
			description: "The id of an element that names the panel, when the name is already on screen.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "panelRole",
			type: '"dialog" | "listbox" | "menu" | "grid" | "tree" | "none"',
			default: '"dialog"',
			description:
				"The ARIA role the panel carries, and the `aria-haspopup` value the trigger advertises. Content that brings its own semantics names the role it really is; `none` makes the panel a transparent box around the consumer's own widget.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "focusOnOpen",
			type: '"first" | "panel" | "none"',
			default: '"first"',
			description:
				"Where focus lands when `show` / `openAt` / `openFrom` open the panel: the first focusable node inside it, the panel itself, or nowhere. A type-ahead surface passes `none` so the caret never leaves its input.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "noCloseOnSelect",
			type: "boolean",
			default: "false",
			description:
				"Keep the panel open when a `select` event bubbles out of its content. By default a chosen option, command, or menu action closes the surface it was chosen from.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "noLightDismiss",
			type: "boolean",
			default: "false",
			description:
				"Suppress the panel's own light-dismiss: it opens as a `manual` popover, so an outside click and `Escape` no longer close it. For a host that owns dismissal itself (a Spotlight, whose veil is the dismiss surface), where the panel's independent close would fight the host and flicker.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "show(opts?)",
			type: "(opts?: PopoverOpenOptions) => void",
			description:
				"Method: open against the declared anchor (the slotted trigger, or the `for` element). `PopoverOpenOptions` is `{ placement?, align?, gap?, focus? }`, each overriding the matching attribute for this open only.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "openAt(x, y, opts?)",
			type: "(x: number, y: number, opts?: PopoverOpenOptions) => void",
			description:
				"Method: open at a point in viewport coordinates — `openAt(event.clientX, event.clientY)`. Defaults to dropping from the point with its leading edge on it, flipping above and right-aligning near a viewport edge, the way a native menu does.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "openFrom(element, opts?)",
			type: "(anchor: HTMLElement, opts?: PopoverOpenOptions) => void",
			description:
				"Method: open against any element. The hook a component that owns its own trigger reaches for — a combobox input, a palette launcher — so it never has to re-derive placement. The anchor holds until the panel closes.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "hide(reason?, returnFocus?)",
			type: '(reason?: "escape" | "dismiss" | "select" | "api", returnFocus?: boolean) => void',
			description:
				"Method: close the panel, handing focus back to wherever it was when the panel opened (pass `false` to leave focus alone). The reason rides out on the `close` event.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "toggle()",
			type: "() => void",
			description: "Method: open if closed, close if open — what a trigger click does.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "reposition()",
			type: "() => void",
			description:
				"Method: re-place the panel against its current anchor. Call it after the panel's content changes size — a list filtering down, an async body arriving — so the surface stays tethered. Scroll and resize already re-place on their own.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "flush",
			className: "xtyle-popover--flush",
			description:
				"The panel drops its padding so slotted content reaches the edges: a list, a menu, an image, a calendar grid.",
		},
	],
	sizes: [],
	states: [
		{
			name: "open",
			description:
				"The panel while it is in the top layer through the Popover API — the non-modal posture. Fades in from `@starting-style`; the closed panel is not rendered at all.",
			selector: ".xtyle-popover__panel:popover-open",
			tokens: ["--duration-fast", "--ease-standard"],
		},
		{
			name: "open-modal",
			description:
				"The same panel in the top layer through `<dialog>.showModal()` — the modal posture, where the `[open]` the dialog reflects is the state, not `:popover-open`. Style both if you restyle the open panel.",
			selector: ".xtyle-popover__panel[open]",
			tokens: ["--duration-fast", "--ease-standard"],
		},
		{
			name: "modal",
			description:
				"The modal posture: the panel's backdrop takes the scrim, the platform holds the page behind it inert, and clicks outside are swallowed rather than passed through.",
			selector: '.xtyle-popover__panel[data-modal="true"]::backdrop',
			tokens: ["--scrim"],
		},
		{
			name: "placed",
			description:
				"The side the panel actually landed on, after any flip: `data-placement` on the panel (and `data-align` for the cross axis). The arrow's side, and any consumer styling keyed on direction, read from these.",
			selector: '.xtyle-popover__panel[data-placement="top"]',
		},
		{
			name: "panel-focus",
			description: "The panel itself holding keyboard focus (`focus-on-open=\"panel\"`, or a body with nothing focusable in it).",
			selector: ".xtyle-popover__panel:focus-visible",
			tokens: ["--ring", "--border-thick"],
		},
	],
	slots: [
		{
			name: "trigger",
			description:
				"The consumer's own trigger — a Button, an avatar, an icon button. The popover wires its click, stamps `aria-haspopup` / `aria-expanded` / `aria-controls` on it (on the real control inside a wrapper element, where assistive tech will actually find them), and anchors the panel to it. Leave it empty and the popover renders nothing until `openAt` / `openFrom` opens it.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "default",
			description: "The panel's body. Anything at all: a form, a card, a list, a chart. It is your content; Popover only frames it.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--space-2",
		"--space-3",
		"--space-8",
		"--font-sans",
		"--text-sm",
		"--leading-normal",
		"--fg-1",
		"--surface-overlay",
		"--surface-overlay-border",
		"--scrim",
		"--ring",
		"--border-thin",
		"--border-thick",
		"--radius-md",
		"--elevation-3",
		"--duration-fast",
		"--ease-standard",
	],
	composition: [
		"Reach for Popover when the floating thing is neither a description (Tooltip) nor a list of commands (Menu) nor a page-blocking interruption (Dialog): a filter form, a profile hovercard, a share sheet, a color picker, a date grid.",
		"Slot your own trigger, or point `for` at an element anywhere in the document when the trigger cannot be a child.",
		"Building an anchored surface of your own? Anchor with `openFrom(el, { focus: \"none\" })`, set `panel-role` to what the content really is, add `flush`, and let a bubbling `select` close it — that is the whole seam, and it is why the placement math is not re-derived per component.",
		"`openAt(x, y)` makes it a right-click or click-at-a-point surface, the same door Menu's `context` mode uses.",
		"Add `modal` when the panel must own the interaction until it is answered, but a full Dialog would be too heavy a frame for it. The panel still lands on its anchor; what changes is that the page behind it goes inert.",
	],
	a11y: [
		"The panel defaults to `role=\"dialog\"` and wants an accessible name: pass `label`, or `labelledby` when the name is already on screen. A panel whose content brings its own semantics sets `panel-role` (`listbox`, `menu`, `grid`, `tree`) or `none` instead, and the trigger's `aria-haspopup` follows it.",
		"The trigger carries `aria-haspopup`, `aria-expanded`, and `aria-controls`. When the trigger is a wrapper element (an `<xtyle-button>`), the state is stamped on the real control inside it — the node assistive tech actually lands on.",
		"Escape closes the panel from anywhere, and a click outside dismisses it, in both postures — Escape and light-dismiss come from the Popover API for a non-modal panel, and Escape from the `<dialog>` for a modal one.",
		"Focus moves into the panel on open (`focus-on-open=\"first\"`, the default) and returns to whatever had it when the panel opened. `panel` focuses the panel itself for a body of static content; `none` leaves focus alone, which is what a type-ahead surface needs so the caret stays in its input. `none` has no meaning under `modal`: the platform focuses a modal dialog on open, and it must, because the page it would otherwise leave focus on is inert.",
		"`modal` is not a costume. The panel opens as a modal `<dialog>`, so the background is genuinely inert — the same inertness Dialog and Sheet get — and `aria-modal` is earned rather than asserted. A scrim plus a JavaScript focus trap over a plain popover would stop the pointer and Tab but not a screen reader in browse mode, which would walk straight out of a panel whose ARIA insists it cannot be left. The non-modal default deliberately does not trap at all: Tab walks out of a disclosure surface, which is what a keyboard user expects of one.",
		"Give the popover a real `<button>` trigger (or an element that fires `click` on Enter/Space). Popover does not invent keyboard activation for a non-interactive trigger, because it would then have to guess at the trigger's role.",
		"The arrow is `aria-hidden`: it is a pointer, not content.",
	],
	examples: [
		{
			id: "trigger-popover",
			title: "A trigger-anchored panel",
			description: "The common shape: slot a trigger, slot a body, and let Popover place and dismiss it.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "modal-popover",
			title: "The modal posture",
			description:
				"`modal` opens the same panel as a modal `<dialog>`, so the platform holds the page behind it inert — pointer, Tab, and browse mode alike — and a click outside is swallowed rather than passed through.",
			source: { html: htmlModalExample, svelte: svelteModalExample, astro: astroModalExample },
		},
		{
			id: "point-popover",
			title: "Opened at a point",
			description:
				"No trigger at all: `openAt(x, y)` anchors the panel to a bare viewport point (a click, a right-click, a caret). The host takes no layout until it opens.",
			source: { html: htmlPointExample, svelte: sveltePointExample, astro: astroPointExample },
		},
		{
			id: "substrate-popover",
			title: "As a substrate",
			description:
				"The shape a sibling component builds on: anchor to an element it owns with `openFrom`, keep focus in its input, name the panel's real role, and let a bubbling `select` close it.",
			source: { html: htmlSubstrateExample, svelte: svelteSubstrateExample, astro: astroSubstrateExample },
		},
	],
};
