import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-tabs variant="underline" label="Account settings" value="profile">
	<button slot="tab" value="profile">Profile</button>
	<div slot="panel">
		<p>Your public profile information.</p>
	</div>

	<button slot="tab" value="billing">Billing</button>
	<div slot="panel">
		<p>Manage your subscription and payment methods.</p>
	</div>

	<button slot="tab" value="api" disabled>API</button>
	<div slot="panel">
		<p>API keys (coming soon).</p>
	</div>
</xtyle-tabs>`;

const svelteExample = `<script lang="ts">
	import { Tabs } from "@xtyle/svelte";

	let active = $state("profile");
	const tabs = [
		{ value: "profile", label: "Profile" },
		{ value: "billing", label: "Billing" },
		{ value: "api", label: "API", disabled: true },
	];
</script>

<Tabs {tabs} variant="pill" label="Account settings" bind:value={active}>
	{#snippet panel(value)}
		{#if value === "profile"}<p>Your public profile information.</p>{/if}
		{#if value === "billing"}<p>Manage your subscription and payment methods.</p>{/if}
		{#if value === "api"}<p>API keys (coming soon).</p>{/if}
	{/snippet}
</Tabs>`;

const astroExample = `---
import { Tabs } from "@xtyle/astro";
---

<Tabs variant="enclosed" label="Account settings" value="profile">
	<button slot="tab" value="profile">Profile</button>
	<div slot="panel">
		<p>Your public profile information.</p>
	</div>

	<button slot="tab" value="billing">Billing</button>
	<div slot="panel">
		<p>Manage your subscription and payment methods.</p>
	</div>
</Tabs>`;

const headlessSvelte = `<script lang="ts">
	import { Tabs } from "@xtyle/svelte";

	let view = $state("editor");
	const tabs = [
		{ value: "editor", label: "Editor" },
		{ value: "preview", label: "Preview" },
		{ value: "diff", label: "Diff" },
	];
</script>

<!-- No panel snippet: Tabs is a bare tablist driving \`view\`. -->
<Tabs {tabs} label="Workspace view" bind:value={view} />

<div class="workspace">
	<main>
		{#if view === "editor"}<CodeEditor />{/if}
		{#if view === "preview"}<Preview />{/if}
		{#if view === "diff"}<DiffView />{/if}
	</main>
	<!-- The inspector lives outside the tabs, so it keeps its scroll and selection across switches. -->
	<aside><Inspector /></aside>
</div>`;

const headlessHtml = `<xtyle-tabs id="view-tabs" tablist label="Workspace view" value="editor">
	<button slot="tab" value="editor">Editor</button>
	<button slot="tab" value="preview">Preview</button>
	<button slot="tab" value="diff">Diff</button>
</xtyle-tabs>

<div class="workspace">
	<main id="view"><!-- rendered by your own change listener --></main>
	<aside><!-- persists across tab switches --></aside>
</div>

<script type="module">
	const tabs = document.getElementById("view-tabs");
	tabs.addEventListener("change", (e) => renderView(e.detail.value));
</script>`;

export const tabsManifest: ComponentManifest = {
	id: "tabs",
	name: "Tabs",
	category: "navigation",
	summary: "Sectioned content switching with a full WAI-ARIA tablist: three visual treatments, keyboard-driven.",
	description:
		"Tabs presents one panel of content at a time, switched by a row of tab triggers. It implements the complete WAI-ARIA tabs pattern: a `role=\"tablist\"` of `role=\"tab\"` buttons paired with `role=\"tabpanel\"` regions, roving tabindex (only the selected tab is in the tab order), arrow-key navigation with Home/End jumps, and `aria-selected` / `aria-controls` / `aria-labelledby` wiring done for you. The `activation` knob chooses automatic activation (arrowing selects as you move) or manual (arrow to move focus, Enter/Space to select). Three visual treatments (underline, pill, and enclosed) change the chrome without touching the semantics. Authors declare each tab as a `slot=\"tab\"` element and its content as the matching `slot=\"panel\"` element; the element pairs them by order, assigns ids, and owns the selection state.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "tabs",
			description: "The root wrapper carrying the variant and size classes; stacks the tablist over the active panel.",
			selector: ".xtyle-tabs",
			tokens: ["--space-3", "--font-sans", "--fg-0"],
		},
		{
			name: "tablist",
			description: "The horizontal row of tab triggers (role=tablist).",
			selector: ".xtyle-tabs__tablist",
			tokens: ["--space-1", "--space-2", "--bg-2", "--line", "--border-thin", "--radius-lg"],
		},
		{
			name: "tab",
			description: "A single tab trigger (role=tab). Selected, hover, active, focus, and disabled states all live here.",
			selector: ".xtyle-tabs__tab",
			tokens: [
				"--text-body",
				"--weight-medium",
				"--leading-tight",
				"--fg-2",
				"--radius-md",
				"--space-2",
				"--space-4",
				"--border-thin",
				"--duration-fast",
				"--ease-standard",
			],
		},
		{
			name: "panel",
			description: "A content region (role=tabpanel) shown only when its tab is selected; focusable so keyboard users can scroll it.",
			selector: ".xtyle-tabs__panel",
			tokens: ["--fg-1", "--radius-sm"],
		},
		{
			name: "overlay",
			description: "The pseudo-element behind each tab that paints hover and active state tints.",
			selector: ".xtyle-tabs__tab::after",
			tokens: ["--state-hover", "--state-press"],
		},
	],
	props: [
		{
			name: "variant",
			type: "TabsVariant",
			default: "underline",
			description: "Visual treatment of the tablist. Does not affect behavior or semantics.",
			bindings: ["html", "svelte", "astro"],
			options: ["underline", "pill", "enclosed"],
		},
		{
			name: "size",
			type: "Size",
			default: "md",
			description: "Tab trigger size. Only `sm` and `md` are supported.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md"],
		},
		{
			name: "activation",
			type: "TabsActivation",
			default: "automatic",
			description:
				"Automatic activation selects a tab as soon as it receives focus via arrow keys; manual moves focus first and requires Enter or Space to select.",
			bindings: ["html", "svelte", "astro"],
			options: ["automatic", "manual"],
		},
		{
			name: "value",
			type: "string",
			description:
				"The selected tab's `value` (or its zero-based index if no value is set). Reflected on change; bindable in Svelte. Defaults to the first enabled tab.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "Accessible name for the tablist, applied as `aria-label`. Required unless `labelledby` is set.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "labelledby",
			type: "string",
			description: "Id of an external element naming the tablist, applied as `aria-labelledby`. Takes precedence over `label`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "sticky",
			type: "boolean",
			default: "false",
			description:
				"Pins the tablist in place while the active panel scrolls under it, for tall, app-like panels where the tabs should stay reachable. Off by default so inline tabs scroll away with their content. Offset it past a fixed header with `xtyle-tabs::part(tablist) { top: … }`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "tablist",
			type: "boolean",
			default: "false",
			description:
				"Render only the tab strip, no panel region: the element drives selection, roving focus, and keyboard nav as a bare `role=\"tablist\"` while you render the content yourself against the `change` event / bound `value`. Lets a persistent sidebar or split live outside the panel region and keep its own state across switches. In Svelte, omit the `panel` snippet to get this automatically. Tabs omit `aria-controls` in this mode since the element owns no panels.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "tabs",
			type: "TabItem[]",
			description:
				"Svelte only: an array of `{ value, label, disabled? }` declaring the tabs; panel content comes from the `panel` snippet keyed by value.",
			bindings: ["svelte"],
		},
		{
			name: "lazy",
			type: "boolean",
			default: "false",
			description:
				"Svelte only: mount a panel's `panel` snippet only once its tab is first shown, then keep it mounted (keep-alive). Off by default (every panel renders up front). Reach for it when panels are heavy (an editor, a chart, a data grid) or must lay out only while visible; the tab strip, roving focus, and a11y are unchanged. The active panel mounts on the client after hydration, so an SSR page shows it a beat later.",
			bindings: ["svelte"],
		},
	],
	variants: [
		{
			name: "underline",
			description: "A minimal row with a moving underline under the selected tab. The default.",
			className: "xtyle-tabs--underline",
			tokens: ["--accent", "--accent-text", "--line"],
		},
		{
			name: "pill",
			description: "Tabs sit in a tinted track; the selected tab becomes a solid accent pill.",
			className: "xtyle-tabs--pill",
			tokens: ["--bg-2", "--accent", "--accent-fg"],
		},
		{
			name: "enclosed",
			description: "Folder-style tabs that connect to the panel; the selected tab joins the content surface.",
			className: "xtyle-tabs--enclosed",
			tokens: ["--bg-1", "--line", "--accent-text"],
		},
	],
	sizes: [
		{ name: "sm", description: "Compact.", className: "xtyle-tabs--sm" },
		{ name: "md", description: "Default.", className: "xtyle-tabs", isDefault: true },
	],
	states: [
		{
			name: "selected",
			description:
				"The active tab. Tone-colored text, plus the variant's selection chrome (underline / pill / folder). When the theme's `--selection-cue` resolves to `marker` (a high-contrast or redundant-cues algorithm), the selected tab gains a non-color check glyph so selection never rests on color alone.",
			selector: '.xtyle-tabs__tab[aria-selected="true"]',
			tokens: ["--accent", "--accent-text", "--accent-fg", "--bg-1", "--line", "--selection-cue"],
		},
		{
			name: "hover",
			description: "Pointer over an unselected tab; overlay paints the hover tint and the text brightens.",
			selector: ".xtyle-tabs__tab:hover",
			tokens: ["--fg-0", "--state-hover"],
		},
		{
			name: "active",
			description: "Tab pressed. Overlay paints the press tint.",
			selector: ".xtyle-tabs__tab:active::after",
			tokens: ["--state-press"],
		},
		{
			name: "focus-visible",
			description: "Keyboard focus on a tab or panel. A token-colored ring, plus a transparent outline that becomes real in forced-colors mode.",
			selector: ".xtyle-tabs__tab:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
		{
			name: "disabled",
			description: "A non-selectable tab. Muted ink, overlay suppressed, skipped by arrow-key navigation.",
			selector: '.xtyle-tabs__tab:disabled, .xtyle-tabs__tab[aria-disabled="true"]',
			tokens: ["--fg-disabled"],
		},
	],
	slots: [
		{
			name: "tab",
			description: "A tab trigger's label. Each `slot=\"tab\"` element becomes a tab; its `value` attribute keys it and `disabled` marks it unselectable. (html / astro)",
			bindings: ["html", "astro"],
		},
		{
			name: "panel",
			description:
				"A tab's content. Each `slot=\"panel\"` element is paired with the `slot=\"tab\"` of the same order. In Svelte this is a `panel` snippet receiving the active value.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--accent",
		"--accent-fg",
		"--accent-text",
		"--bg-1",
		"--bg-2",
		"--border-normal",
		"--border-thick",
		"--border-thin",
		"--duration-fast",
		"--ease-standard",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--fg-disabled",
		"--font-sans",
		"--leading-tight",
		"--line",
		"--radius-lg",
		"--radius-md",
		"--radius-none",
		"--radius-sm",
		"--ring",
		"--selection-cue",
		"--space-0",
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-4",
		"--state-hover",
		"--state-press",
		"--text-body",
		"--text-sm",
		"--weight-medium",
	],
	composition: [
		"Pair each panel's content with any other component: a Field-laden form, a Card grid, a table.",
		"Use `activation=\"manual\"` when switching tabs is expensive (each panel fetches data), so arrowing previews focus without triggering loads.",
		"Drive `value` from app state and listen for the `change` event (CustomEvent with `detail.value`) to keep tabs and routing in sync.",
		"Set `tablist` (or omit the Svelte `panel` snippet) when the tabs control only part of a layout: an editor whose left pane switches per tab while a right sidebar persists across all of them, keeping its own scroll and selection.",
	],
	a11y: [
		"Implements the WAI-ARIA tabs pattern: `role=\"tablist\"` / `role=\"tab\"` / `role=\"tabpanel\"` with `aria-selected`, `aria-controls`, and `aria-labelledby` wired automatically; in `tablist` mode the element owns no panels, so tabs omit `aria-controls` and stand as a bare tablist.",
		"Roving tabindex: only the selected tab is in the tab order; arrow keys move between tabs, Home/End jump to the first/last enabled tab.",
		"`activation` chooses automatic (select on focus) or manual (Enter/Space to select) per the WAI-ARIA guidance for cheap vs. expensive panels.",
		"Disabled tabs are announced as disabled and skipped by arrow-key navigation.",
		"Each panel is focusable (`tabindex=\"0\"`) so keyboard users can reach and scroll content with no focusable children.",
		"The tablist REQUIRES an accessible name; provide `label` or `labelledby`. The binding warns at runtime when neither is set.",
		"Focus is shown with a token ring and a transparent outline that the forced-colors base rule promotes to a real system outline.",
		"Selection carries a non-color channel on demand: when the theme sets `--selection-cue: marker`, the selected tab gains a check glyph alongside the color, satisfying WCAG 1.4.1. High-contrast emits `marker` by default, and any algorithm can opt in via the `cues` knob.",
	],
	examples: [
		{
			id: "variants-and-activation",
			title: "Variants and activation",
			description:
				"The same tablist semantics across the three treatments; declare tabs and panels as paired slotted elements (or, in Svelte, a `tabs` array plus a `panel` snippet).",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "headless-tablist",
			title: "Headless tablist",
			description:
				"Omit the panels and the element is a bare tablist that drives a value: the tabs switch the main view while a sidebar persists outside the panel region, keeping its own state. In Svelte, drop the `panel` snippet; in html / astro, set `tablist`.",
			source: { html: headlessHtml, svelte: headlessSvelte },
		},
	],
};
