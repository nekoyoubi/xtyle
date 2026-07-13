import type { ComponentManifest } from "./types.js";
import { FULL_TONES, TONES } from "../vocab.js";

const htmlExample = `<!-- a photo when one loads -->
<xtyle-avatar user-name="Ada Lovelace" alt="Ada Lovelace" src="/avatars/ada.jpg"></xtyle-avatar>

<!-- no image: the initials fall out of the name ("Grace Hopper" → GH) -->
<xtyle-avatar user-name="Grace Hopper" tone="info" size="lg"></xtyle-avatar>

<xtyle-avatar user-name="Katherine Johnson" tone="purple" shape="square" status="success" status-label="Online"></xtyle-avatar>

<!-- slot your own content to override the derived initials -->
<xtyle-avatar user-name="Project Apollo" tone="warn">🚀</xtyle-avatar>

<xtyle-avatar alt="Unknown user" size="xl">
	<svg slot="icon" viewBox="0 0 24 24" aria-hidden="true">
		<path fill="currentColor" d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6Z" />
	</svg>
</xtyle-avatar>`;

const svelteExample = `<script lang="ts">
	import { Avatar } from "@xtyle/svelte";
</script>

<!-- a photo when one loads -->
<Avatar userName="Ada Lovelace" alt="Ada Lovelace" src="/avatars/ada.jpg" />

<!-- no image: the initials fall out of the name ("Grace Hopper" → GH) -->
<Avatar userName="Grace Hopper" tone="info" size="lg" />

<Avatar userName="Katherine Johnson" tone="purple" shape="square" status="success" statusLabel="Online" />

<!-- slot your own content to override the derived initials -->
<Avatar userName="Project Apollo" tone="warn">🚀</Avatar>

<Avatar alt="Unknown user" size="xl">
	{#snippet icon()}
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path fill="currentColor" d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6Z" />
		</svg>
	{/snippet}
</Avatar>`;

const astroExample = `---
import { Avatar } from "@xtyle/astro";
---

<!-- a photo when one loads -->
<Avatar userName="Ada Lovelace" alt="Ada Lovelace" src="/avatars/ada.jpg" />

<!-- no image: the initials fall out of the name ("Grace Hopper" → GH) -->
<Avatar userName="Grace Hopper" tone="info" size="lg" />

<Avatar userName="Katherine Johnson" tone="purple" shape="square" status="success" statusLabel="Online" />

<!-- slot your own content to override the derived initials -->
<Avatar userName="Project Apollo" tone="warn">🚀</Avatar>

<Avatar alt="Unknown user" size="xl">
	<svg slot="icon" viewBox="0 0 24 24" aria-hidden="true">
		<path fill="currentColor" d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6Z" />
	</svg>
</Avatar>`;

export const avatarManifest: ComponentManifest = {
	id: "avatar",
	name: "Avatar",
	category: "media",
	keywords: ["profile picture", "user photo", "identity", "initials", "gravatar"],
	seeAlso: ["avatar-group", "badge"],
	summary: "An identity chip: a photo when one loads, a tinted initials-or-icon fallback when it doesn't.",
	description:
		"Avatar presents a person or entity as a compact square or circle. Given a `src`, it shows the image, cover-cropped to fill; if the image is absent or fails to load, it falls back to initials derived from `userName` (`\"Ada Lovelace\"` → `AL`) on a soft, hue-tinted background. Slot your own content to override those initials, or use the `icon` slot for a glyph instead. The prop is `userName`, not `name`, because `name` carries form-participation meaning on an element and an avatar is not a form control. The fallback tint follows `tone`, which accepts any of the six semantic roles or the twelve named hues, so a deterministic per-user color is a one-attribute choice. Four sizes (sm, md, lg, xl), two shapes (circle, square), and an optional corner status dot in any semantic tone round out the surface. `alt` names the image; `userName` names the avatar when there is no image, so it is announced either way.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "avatar",
			description: "The root chip carrying the size, shape, and tone classes; sizes the image and fallback and anchors the status dot.",
			selector: ".xtyle-avatar",
			tokens: [
				"--space-7",
				"--font-sans",
				"--text-sm",
				"--weight-semibold",
				"--leading-tight",
				"--neutral-text",
				"--radius-full",
			],
		},
		{
			name: "image",
			description: "The portrait image, cover-cropped to fill the chip and clipped to the chip's shape.",
			selector: ".xtyle-avatar__image",
		},
		{
			name: "fallback",
			description: "The initials-or-icon stand-in shown when no image is present, painted with the tone's soft tint.",
			selector: ".xtyle-avatar__fallback",
			tokens: ["--neutral-bg", "--neutral-text"],
		},
		{
			name: "status-dot",
			description: "The optional corner indicator, ringed in the surface color so it reads against any background.",
			selector: ".xtyle-avatar__status-dot",
			tokens: ["--space-2", "--neutral", "--radius-full", "--border-thick", "--bg-1"],
		},
	],
	props: [
		{
			name: "src",
			type: "string",
			description: "The image URL. When absent or failed, the fallback content shows instead.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "alt",
			type: "string",
			description: "Accessible name for the image. Required when `src` is set; also labels the fallback.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "userName",
			type: "string",
			description:
				"The person the avatar stands for. Derives the fallback initials shown when there is no image and nothing slotted (`\"Ada Lovelace\"` → `AL`, `\"Prince\"` → `P`), and names the avatar when no `alt` is given. Named `userName` rather than `name` because `name` is a form-participation attribute on an element. Attribute: `user-name`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "tone",
			type: "FullTone",
			default: "neutral",
			description: "Soft-tint color for the fallback background: any semantic role, accent variant, or named hue.",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
		{
			name: "size",
			type: "AvatarSize",
			default: "md",
			description: "Chip size.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg", "xl"],
		},
		{
			name: "shape",
			type: "AvatarShape",
			default: "circle",
			description: "Outline shape: a circle or a rounded square.",
			bindings: ["html", "svelte", "astro"],
			options: ["circle", "square"],
		},
		{
			name: "status",
			type: "Tone",
			description: "When set, shows a corner status dot in this semantic tone.",
			bindings: ["html", "svelte", "astro"],
			options: ["accent", "neutral", "danger", "success", "warn", "info"],
		},
		{
			name: "statusLabel",
			type: "string",
			description: "Accessible name for the status dot (e.g. \"Online\"); announced as additional avatar text.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "pulse",
			type: 'boolean | "slow" | "fast"',
			description:
				"Breathe the status dot for a live / online presence: a bare `true` pulses slow, `\"fast\"` quick. A no-op without `status`, and held still under `prefers-reduced-motion`.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "circle",
			description: "Fully rounded, the default identity shape.",
			className: "xtyle-avatar",
			tokens: ["--radius-full"],
		},
		{
			name: "square",
			description: "A rounded square, for entities and projects rather than people.",
			className: "xtyle-avatar--square",
			tokens: ["--radius-md", "--radius-sm", "--radius-lg"],
		},
	],
	sizes: [
		{ name: "sm", description: "Compact, for dense lists.", className: "xtyle-avatar--sm" },
		{ name: "md", description: "Default.", className: "xtyle-avatar", isDefault: true },
		{ name: "lg", description: "Large, for headers.", className: "xtyle-avatar--lg" },
		{ name: "xl", description: "Extra large, for profile hero.", className: "xtyle-avatar--xl" },
	],
	states: [
		{
			name: "fallback",
			description: "No image: the tinted initials-or-icon stand-in fills the chip.",
			selector: ".xtyle-avatar__fallback",
			tokens: ["--neutral-bg", "--neutral-text"],
		},
		{
			name: "status",
			description: "A corner dot conveys presence; its color is the chosen status tone, ringed in the surface.",
			selector: ".xtyle-avatar__status-dot",
			tokens: ["--neutral", "--border-thick", "--bg-1"],
		},
		{
			name: "pulse",
			description: "With `pulse`, the status dot breathes on a soft opacity loop so the avatar reads as live, at a slow or fast cadence; held still under reduced-motion.",
			selector: ".xtyle-avatar--pulse-slow .xtyle-avatar__status-dot",
			tokens: ["--ease-standard"],
		},
	],
	slots: [
		{
			name: "default",
			description:
				"Custom fallback content shown when no image loads. Overrides the initials `userName` derives — leave it empty and those initials are what you get.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "icon",
			description: "An icon fallback, used in place of initials when no image loads.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--space-2",
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
		"--radius-sm",
		"--radius-md",
		"--radius-lg",
		"--radius-full",
		"--border-thick",
		"--bg-1",
		...FULL_TONES.flatMap((t) => [`--${t}-bg`, `--${t}-text`]),
		...TONES.map((t) => `--${t}`),
	],
	composition: [
		"Stack a row of avatars into an avatar group; negative inline margin overlaps them.",
		"Pair with Badge for a labeled identity row, or with the status dot for presence.",
		"Feed `tone` a hash of the user id to get a stable, distinct fallback color per person.",
	],
	a11y: [
		"The image carries `alt`; the binding warns at runtime when `src` is set without it.",
		"`userName` names the avatar when there is no `alt`, so an image-less avatar is announced by the person it stands for rather than by two bare initials.",
		"When the image is absent or errors, the fallback initials or `aria-label`'d icon remain in the accessibility tree so the avatar is still announced.",
		"The decorative status dot is `aria-hidden`; its meaning rides on `statusLabel` as visually-hidden text in the accessibility tree.",
		"`pulse` is decorative motion only, never the carrier of meaning: put the live state in `statusLabel` (\"Online\") so it reads the same to assistive tech and under `prefers-reduced-motion`, where the pulse holds still.",
		"The fallback icon slot is decorative. Provide `alt` (or fallback initials) so the avatar still has a name.",
	],
	examples: [
		{
			id: "image-fallback-status",
			title: "Image, fallback, and status",
			description: "A photo when one loads, tinted initials or an icon when it doesn't, with an optional presence dot.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "live-presence",
			title: "Live presence",
			description: "A pulsing status dot reads as online in real time; `statusLabel` carries the meaning for assistive tech.",
			source: {
				html: '<xtyle-avatar user-name="Grace Hopper" status="success" status-label="Online" pulse></xtyle-avatar>',
				svelte: '<Avatar userName="Grace Hopper" status="success" statusLabel="Online" pulse />',
				astro: '<Avatar userName="Grace Hopper" status="success" statusLabel="Online" pulse />',
			},
		},
	],
};
