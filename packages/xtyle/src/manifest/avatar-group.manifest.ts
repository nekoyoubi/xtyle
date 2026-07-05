import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-avatar-group label="Contributors" overflow="3">
	<xtyle-avatar alt="Ada Lovelace" tone="accent">AL</xtyle-avatar>
	<xtyle-avatar alt="Alan Turing" tone="success">AT</xtyle-avatar>
	<xtyle-avatar alt="Grace Hopper" tone="warn">GH</xtyle-avatar>
	<xtyle-avatar alt="Katherine Johnson" tone="info">KJ</xtyle-avatar>
</xtyle-avatar-group>`;

const svelteExample = `<script lang="ts">
	import { AvatarGroup, Avatar } from "@xtyle/svelte";

	const people = [
		{ name: "Ada Lovelace", initials: "AL", tone: "accent" },
		{ name: "Alan Turing", initials: "AT", tone: "success" },
		{ name: "Grace Hopper", initials: "GH", tone: "warn" },
		{ name: "Katherine Johnson", initials: "KJ", tone: "info" },
	];
	const shown = people.slice(0, 4);
</script>

<AvatarGroup label="Contributors" overflow={people.length - shown.length + 3}>
	{#each shown as p}
		<Avatar alt={p.name} tone={p.tone}>{p.initials}</Avatar>
	{/each}
</AvatarGroup>`;

const astroExample = `---
import { AvatarGroup, Avatar } from "@xtyle/astro";
const people = [
	{ name: "Ada Lovelace", initials: "AL", tone: "accent" },
	{ name: "Alan Turing", initials: "AT", tone: "success" },
	{ name: "Grace Hopper", initials: "GH", tone: "warn" },
	{ name: "Katherine Johnson", initials: "KJ", tone: "info" },
];
---

<AvatarGroup label="Contributors" overflow={3}>
	{people.map((p) => <Avatar alt={p.name} tone={p.tone}>{p.initials}</Avatar>)}
</AvatarGroup>`;

const sizeHtmlExample = `<xtyle-avatar-group size="sm" spacing="snug" overflow="12" label="Viewers">
	<xtyle-avatar alt="Ada" tone="accent" size="sm">AD</xtyle-avatar>
	<xtyle-avatar alt="Alan" tone="success" size="sm">AL</xtyle-avatar>
	<xtyle-avatar alt="Grace" tone="warn" size="sm">GR</xtyle-avatar>
</xtyle-avatar-group>`;

const sizeSvelteExample = `<script lang="ts">
	import { AvatarGroup, Avatar } from "@xtyle/svelte";
</script>

<AvatarGroup size="sm" spacing="snug" overflow={12} label="Viewers">
	<Avatar alt="Ada" tone="accent" size="sm">AD</Avatar>
	<Avatar alt="Alan" tone="success" size="sm">AL</Avatar>
	<Avatar alt="Grace" tone="warn" size="sm">GR</Avatar>
</AvatarGroup>`;

const sizeAstroExample = `---
import { AvatarGroup, Avatar } from "@xtyle/astro";
---

<AvatarGroup size="sm" spacing="snug" overflow={12} label="Viewers">
	<Avatar alt="Ada" tone="accent" size="sm">AD</Avatar>
	<Avatar alt="Alan" tone="success" size="sm">AL</Avatar>
	<Avatar alt="Grace" tone="warn" size="sm">GR</Avatar>
</AvatarGroup>`;

export const avatarGroupManifest: ComponentManifest = {
	id: "avatar-group",
	name: "Avatar Group",
	since: "0.4.0",
	category: "media",
	summary: "A row of overlapping avatars with a trailing `+N` overflow chip, for a contributor, attendee, or reviewer stack.",
	description:
		"Avatar Group overlaps a set of `Avatar` children into a compact stack, the shape a contributor list, an attendee row, or a \"who's viewing\" strip takes. Each avatar carries a ring in the page background so the overlap reads as distinct faces rather than a blur, and later avatars sit over earlier ones. Slot the avatars you want shown and set `overflow` to the number of people beyond them, and the group renders a trailing `+N` chip in the neutral tone (its accessible name reads \"N more\"). `size` matches the chip to the avatars you used, and `spacing` tightens or loosens the overlap. It's a `role=\"group\"`; give it a `label` to name the set. The overflow count is explicit rather than auto-counted so the stack renders identically with no JavaScript, on the server, and in the browser.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "group",
			description: "The `role=\"group\"` row that overlaps its slotted avatars.",
			selector: ".xtyle-avatar-group",
			tokens: ["--space-3"],
		},
		{
			name: "overflow",
			description: "The trailing `+N` chip summarizing the avatars beyond the shown set.",
			selector: ".xtyle-avatar-group__overflow",
			tokens: ["--neutral-bg", "--neutral-text", "--bg-0", "--border-thick", "--radius-full"],
		},
	],
	props: [
		{
			name: "overflow",
			type: "number",
			description:
				"How many people beyond the slotted avatars to summarize. A positive value renders a trailing `+N` chip (named \"N more\" for assistive tech); zero or omitted renders no chip. Explicit rather than auto-counted, so the stack is identical with no JavaScript.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "size",
			type: '"sm" | "md" | "lg" | "xl"',
			default: "md",
			description: "Sizes the `+N` chip to match the avatars you slotted (each `Avatar` still sets its own size).",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg", "xl"],
		},
		{
			name: "spacing",
			type: '"snug" | "normal" | "loose"',
			default: "normal",
			description: "How far the avatars overlap: `snug` stacks them tighter, `loose` spreads them out.",
			bindings: ["html", "svelte", "astro"],
			options: ["snug", "normal", "loose"],
		},
		{
			name: "label",
			type: "string",
			description: "An accessible name for the group, since it is a set of people (e.g. \"Contributors\").",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [
		{ name: "sm", description: "Compact, for dense lists.", className: "xtyle-avatar-group--sm" },
		{ name: "md", description: "Default.", className: "xtyle-avatar-group", isDefault: true },
		{ name: "lg", description: "Large, for headers.", className: "xtyle-avatar-group--lg" },
		{ name: "xl", description: "Extra large.", className: "xtyle-avatar-group--xl" },
	],
	states: [
		{
			name: "avatar-hover",
			description: "Hovering or focusing an avatar raises it above its neighbours so a covered face reads in full.",
			selector: ".xtyle-avatar-group ::slotted(*:hover)",
			tokens: [],
		},
	],
	slots: [
		{
			name: "default",
			description: "The `Avatar` children to overlap, in stacking order (the first sits at the bottom of the stack).",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--bg-0",
		"--neutral-bg",
		"--neutral-text",
		"--border-thick",
		"--radius-full",
		"--space-2",
		"--space-3",
		"--space-4",
		"--space-6",
		"--space-7",
		"--space-8",
		"--font-sans",
		"--text-xs",
		"--text-sm",
		"--text-body",
		"--text-lg",
		"--weight-semibold",
		"--leading-tight",
	],
	composition: [
		"Slot the avatars to show and pass `overflow` as the remainder: a consumer holding 20 people shows the first 4 (`avatars.slice(0, 4)`) and sets `overflow={16}`, so the row reads `● ● ● ● +16`.",
		"Each avatar keeps its own `tone`, `src`, `shape`, and `size`; the group only lays them out, so a group of image avatars, initial-fallback avatars, or a mix all stack the same way.",
		"The ring around each avatar is the page background (`--bg-0`), so a group over a `Panel` or `Card` needs no change: it's the surface token the algorithm already produced. Pair it with a `Cluster` to sit a group beside a count or a label.",
		"Because the faces overlap, a leading avatar is partly covered by the next; hovering or focusing one raises it above its neighbours so its full face (and initials) reads, no attribute needed.",
	],
	a11y: [
		"The row is a `role=\"group\"`; a `label` names it so assistive tech announces the set (\"Contributors\").",
		"The `+N` chip is a `role=\"img\"` with an accessible name of \"N more\", so the hidden count is spoken rather than read as a bare `+16` glyph.",
		"Each slotted `Avatar` keeps its own accessible name (its `alt` or status), so the people in the stack are individually announced.",
	],
	examples: [
		{
			id: "group",
			title: "A contributor stack",
			description: "Overlapping avatars with a `+N` chip for the rest; each keeps its own tone.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "size",
			title: "Sizes and spacing",
			description: "`size` matches the chip to the avatars and `spacing=\"snug\"` tightens the overlap for a dense viewer strip.",
			source: { html: sizeHtmlExample, svelte: sizeSvelteExample, astro: sizeAstroExample },
		},
	],
};
