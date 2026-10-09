import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

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

const gemHtml = `<xtyle-avatar shape="diamond" frame="gradient" frame-tone="yellow" frame-tone-2="orange" bevel tone="purple" alt="Ring of embers" data-fx="glare?repeat:infinite,rest:3,width:6%" style="--fx-glare-repeat:infinite;--fx-glare-rest:3;--fx-glare-width:6%">
	<xtyle-icon slot="icon" name="ember--flame" aria-hidden="true"></xtyle-icon>
</xtyle-avatar>
<xtyle-avatar shape="diamond" frame="solid" frame-tone="gray" bevel tone="cyan" alt="Tide charm" data-fx="holo">
	<xtyle-icon slot="icon" name="tide--drop" aria-hidden="true"></xtyle-icon>
</xtyle-avatar>
<xtyle-avatar shape="square" frame="solid" frame-tone="accent" user-name="Ada Lovelace"></xtyle-avatar>`;

const gemSvelte = `<script lang="ts">
	import { Avatar, Icon } from "@xtyle/svelte";
</script>

<Avatar shape="diamond" frame="gradient" frameTone="yellow" frameTone2="orange" bevel tone="purple" alt="Ring of embers" data-fx="glare?repeat:infinite,rest:3,width:6%" style="--fx-glare-repeat:infinite;--fx-glare-rest:3;--fx-glare-width:6%">
	{#snippet icon()}<Icon name="ember--flame" aria-hidden="true" />{/snippet}
</Avatar>
<Avatar shape="diamond" frame="solid" frameTone="gray" bevel tone="cyan" alt="Tide charm" data-fx="holo">
	{#snippet icon()}<Icon name="tide--drop" aria-hidden="true" />{/snippet}
</Avatar>
<Avatar shape="square" frame="solid" frameTone="accent" userName="Ada Lovelace" />`;

const gemAstro = `---
import { Avatar, Icon } from "@xtyle/astro";
---

<Avatar shape="diamond" frame="gradient" frameTone="yellow" frameTone2="orange" bevel tone="purple" alt="Ring of embers" data-fx="glare?repeat:infinite,rest:3,width:6%" style="--fx-glare-repeat:infinite;--fx-glare-rest:3;--fx-glare-width:6%">
	<Icon slot="icon" name="ember--flame" aria-hidden="true" />
</Avatar>
<Avatar shape="diamond" frame="solid" frameTone="gray" bevel tone="cyan" alt="Tide charm" data-fx="holo">
	<Icon slot="icon" name="tide--drop" aria-hidden="true" />
</Avatar>
<Avatar shape="square" frame="solid" frameTone="accent" userName="Ada Lovelace" />`;

const modMarksExample = `<!-- a mod's avatar fill reads bindings.hostData.rank and paints pips into the empty marks part -->
<xtyle-avatar shape="diamond" frame="solid" tone="green" alt="Oak ring, rank 3 of 5" data-rank="3" data-rank-max="5">
	<xtyle-icon slot="icon" name="oak--leaf" aria-hidden="true"></xtyle-icon>
</xtyle-avatar>`;

export const avatarManifest: ComponentManifest = {
	id: "avatar",
	name: "Avatar",
	category: "media",
	since: "0.1.0",
	keywords: ["profile picture", "user photo", "identity", "initials", "gravatar"],
	seeAlso: ["avatar-group", "badge"],
	summary: "An identity chip: a photo when one loads, a tinted initials-or-icon fallback when it doesn't.",
	description:
		"Avatar presents a person or entity as a compact square or circle. Given a `src`, it shows the image, cover-cropped to fill; if the image is absent or fails to load, it falls back to initials derived from `userName` (`\"Ada Lovelace\"` → `AL`) on a soft, hue-tinted background. Slot your own content to override those initials, or use the `icon` slot for a glyph instead. The prop is `userName`, not `name`, because `name` carries form-participation meaning on an element and an avatar is not a form control. The fallback tint follows `tone`, which accepts any of the six semantic roles or the twelve named hues, so a deterministic per-user color is a one-attribute choice. Four sizes (sm, md, lg, xl), three shapes (circle, square, and a diamond that clips the content, the frame, and any effect painted on the host), and an optional corner status dot in any semantic tone round out the surface. `frame` rings the content in a `solid` tone or a `gradient` between two, `bevel` shades that ring as a raised edge, and the `--xtyle-avatar-frame` (any color or gradient) and `--xtyle-avatar-frame-width` custom properties override both. Anything more particular, such as rank pips, a count, or a corner mark, belongs to a mod: the fill renders an empty `marks` part over the chip and receives the host's own `data-*` attributes as `bindings.hostData`, so `data-rank=\"3\"` is all a mod needs. `alt` names the image; `userName` names the avatar when there is no image, so it is announced either way.",
	bindings: ["html", "svelte", "astro"],
	render: "auto",
	exposedParts: ["avatar", "fallback", "image", "initials", "status-dot", "marks"],
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
			description: "The initials-or-icon stand-in shown when no image is present, painted with the tone's soft tint inside a hairline edge that clears 3:1 against the page.",
			selector: ".xtyle-avatar__fallback",
			tokens: ["--neutral-bg", "--neutral-text", "--line-strong", "--border-thin"],
		},
		{
			name: "status-dot",
			description: "The optional corner indicator, ringed in the surface color so it reads against any background.",
			selector: ".xtyle-avatar__status-dot",
			tokens: ["--space-2", "--neutral", "--radius-full", "--border-thick", "--bg-1"],
		},
		{
			name: "marks",
			description: "An empty layer over the whole chip, rendered for mods: a fill that paints pips, a count, or a corner badge targets it, and `bindings.hostData` carries the host's `data-*` attributes to draw from. Hidden while empty.",
			selector: ".xtyle-avatar__marks",
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
			description: "Outline shape: a circle, a rounded square, or a diamond (a square turned 45°, content kept upright). A diamond clips the overlays an effect paints on the host, so `glare` or `holo` stays inside the shape, while the `marks` layer and the status dot are free to sit over its corners.",
			bindings: ["html", "svelte", "astro"],
			options: ["circle", "square", "diamond"],
		},
		{
			name: "frame",
			type: "AvatarFrame",
			default: "none",
			description: "A ring around the content: `solid` paints it in `frameTone` (the line color by default), `gradient` runs from `frameTone` to `frameTone2` (the accent pair by default). The `--xtyle-avatar-frame` custom property takes any color or gradient instead, and `--xtyle-avatar-frame-width` sets the thickness.",
			bindings: ["html", "svelte", "astro"],
			options: ["none", "solid", "gradient"],
		},
		{
			name: "frameTone",
			type: "FullTone",
			description: "The frame's color, or the gradient's first stop. Attribute: `frame-tone`.",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
		{
			name: "frameTone2",
			type: "FullTone",
			description: "The gradient frame's second stop. Attribute: `frame-tone-2`.",
			bindings: ["html", "svelte", "astro"],
			attr: "frame-tone-2",
			options: [...FULL_TONES],
		},
		{
			name: "bevel",
			type: "boolean",
			default: "false",
			description: "Shades the frame as a raised edge lit from the top left, from the theme's own `--white` and `--black`. Implies a `solid` frame when `frame` is not set.",
			bindings: ["html", "svelte", "astro"],
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
		{
			name: "diamond",
			description: "A square turned 45° with the content kept upright, for items, charms, and gems rather than people.",
			className: "xtyle-avatar--diamond",
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
		{
			name: "framed",
			description: "With `frame`, the content sits inside a ring painted in a tone, a gradient, or whatever `--xtyle-avatar-frame` holds.",
			selector: ".xtyle-avatar--frame-solid, .xtyle-avatar--frame-gradient",
			tokens: ["--border-thick", "--line-2", "--accent", "--accent-2"],
		},
		{
			name: "bevel",
			description: "With `bevel`, the frame catches a highlight on its top-left edge and a shade on its bottom-right.",
			selector: ".xtyle-avatar--bevel",
			tokens: ["--white", "--black"],
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
		"--line-2",
		"--line-strong",
		"--border-thin",
		"--white",
		"--black",
		...FULL_TONES.map((t) => `--${t}`),
		...FULL_TONES.flatMap((t) => [`--${t}-bg`, `--${t}-text`]),
	],
	composition: [
		"Stack a row of avatars into an avatar group; negative inline margin overlaps them.",
		"Pair with Badge for a labeled identity row, or with the status dot for presence.",
		"Feed `tone` a hash of the user id to get a stable, distinct fallback color per person.",
		"An avatar is any framed, proportional chip, not only a person: a diamond with an icon, a frame, and `data-fx=\"holo\"` is an inventory gem.",
		"Put `data-fx` on the avatar for motion: `glare?repeat:infinite,rest:3,width:6%` is a thin glint that passes now and then, `holo` a slow iridescent foil, and the two stack.",
	],
	a11y: [
		"The image carries `alt`; the binding warns at runtime when `src` is set without it.",
		"`userName` names the avatar when there is no `alt`, so an image-less avatar is announced by the person it stands for rather than by two bare initials.",
		"When the image is absent or errors, the fallback initials or `aria-label`'d icon remain in the accessibility tree so the avatar is still announced.",
		"The decorative status dot is `aria-hidden`; its meaning rides on `statusLabel` as visually-hidden text in the accessibility tree.",
		"`pulse` is decorative motion only, never the carrier of meaning: put the live state in `statusLabel` (\"Online\") so it reads the same to assistive tech and under `prefers-reduced-motion`, where the pulse holds still.",
		"The fallback icon slot is decorative. Provide `alt` (or fallback initials) so the avatar still has a name.",
		"A frame, a bevel, and a diamond are decoration only. Anything a mod paints into `marks` (a rank, a count) belongs in `alt` as well, so it is announced and not only seen.",
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
		{
			id: "shapes-and-frames",
			title: "Diamonds, frames, and effects",
			description: "A diamond with a gradient, bevelled frame and a repeating thin glint; a holo foil on a solid frame; a framed square.",
			source: { html: gemHtml, svelte: gemSvelte, astro: gemAstro },
		},
		{
			id: "mod-marks",
			title: "Data for a mod's marks",
			description: "The host's `data-*` attributes reach every fill as `bindings.hostData`, and the empty `marks` part is where a mod paints from them.",
			source: { html: modMarksExample },
		},
	],
};
