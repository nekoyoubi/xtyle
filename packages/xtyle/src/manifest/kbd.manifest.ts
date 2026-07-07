import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

const htmlExample = `<xtyle-kbd>Ctrl</xtyle-kbd>
<xtyle-kbd>K</xtyle-kbd>

<xtyle-kbd size="sm">Esc</xtyle-kbd>
<xtyle-kbd size="lg">Enter</xtyle-kbd>`;

const toneHtmlExample = `<xtyle-kbd tone="accent">⌘</xtyle-kbd>
<xtyle-kbd tone="success">Enter</xtyle-kbd>
<xtyle-kbd tone="danger">Del</xtyle-kbd>`;

const svelteExample = `<script lang="ts">
	import { Kbd } from "@xtyle/svelte";
</script>

<Kbd>Ctrl</Kbd>
<Kbd>K</Kbd>`;

const toneSvelteExample = `<script lang="ts">
	import { Kbd } from "@xtyle/svelte";
</script>

<Kbd tone="accent">⌘</Kbd>
<Kbd tone="danger">Del</Kbd>`;

const astroExample = `---
import Kbd from "@xtyle/astro/Kbd.astro";
---

<Kbd>Ctrl</Kbd>
<Kbd>K</Kbd>`;

const toneAstroExample = `---
import Kbd from "@xtyle/astro/Kbd.astro";
---

<Kbd tone="accent">⌘</Kbd>
<Kbd tone="danger">Del</Kbd>`;

export const kbdManifest: ComponentManifest = {
	id: "kbd",
	name: "Kbd",
	category: "content",
	keywords: ["keycap", "shortcut", "hotkey", "key", "keyboard key"],
	seeAlso: ["code", "badge"],
	summary: "A keycap for the keys in a shortcut.",
	description:
		"Kbd renders a single key as a physical keycap: a mono-faced label on a raised surface, the depth read from a heavier bottom edge rather than a drop shadow, so it sits cleanly inline in running text. It carries no layout of its own: set a few side by side in a `Cluster` to spell a chord (`Ctrl` `+` `K`). Everything about its look is derived chrome: the surface, the edge, the radius all come from the same tokens the rest of the theme does, so a keycap matches the UI it documents. The `size` prop steps it with the surrounding type from `sm` to `lg`, and an optional `tone` tints the whole keycap (face, edge, and label) to any of the semantic roles or named hues for a primary-chord or status key.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "kbd",
			description: "The keycap root: a raised surface with a weighted bottom edge.",
			selector: ".xtyle-kbd",
			tokens: ["--bg-2", "--fg-1", "--line-2", "--border-thick", "--radius-sm", "--font-mono"],
		},
	],
	props: [
		{
			name: "size",
			type: "KbdSize",
			default: "md",
			description: "The keycap size, stepping with the type scale: `sm`, `md`, or `lg`.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
		{
			name: "tone",
			type: "KbdTone",
			description:
				"Tints the keycap face, edge, and label to a semantic role (accent, success, danger, …) or a named hue (red … black). Omit for the neutral keycap.",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
	],
	variants: [],
	sizes: [
		{ name: "sm", description: "A compact keycap for dense inline hints.", className: "xtyle-kbd--sm" },
		{ name: "md", description: "The default keycap, sized with body text.", className: "xtyle-kbd", isDefault: true },
		{ name: "lg", description: "A prominent keycap for a featured shortcut.", className: "xtyle-kbd--lg" },
	],
	states: [],
	slots: [
		{
			name: "default",
			description: "The key label: a glyph or short word like `K`, `Esc`, or `Enter`.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--bg-2",
		"--fg-1",
		"--line-2",
		"--border-thin",
		"--border-thick",
		"--radius-sm",
		"--font-mono",
		"--text-sm",
		"--text-xs",
		"--text-lg",
		"--weight-medium",
		"--leading-tight",
		...FULL_TONES.flatMap((t) => [`--${t}`, `--${t}-bg`, `--${t}-text`]),
	],
	composition: [
		"Spell a chord by setting keys in a `Cluster` with a small gap: `Ctrl` `+` `K`.",
		"Drop a Kbd inline in `Text` to name a shortcut mid-sentence. It sits on the baseline without breaking the line.",
		"Pair shortcuts with their actions in a `Table` or a `Stack` of `Cluster`s for a key map.",
	],
	a11y: [
		"Renders the semantic `<kbd>` element, so assistive tech announces the content as keyboard input.",
		"Keep the label the literal key name; the keycap styling is presentational and adds no meaning of its own.",
	],
	examples: [
		{
			id: "keys-and-sizes",
			title: "Keys and sizes",
			description: "Single keys and a chord, shown across the three sizes.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "toned-keys",
			title: "Toned keycaps",
			description: "A `tone` tints the whole keycap for a primary-chord or status key.",
			source: { html: toneHtmlExample, svelte: toneSvelteExample, astro: toneAstroExample },
		},
	],
};
