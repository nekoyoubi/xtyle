import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-qr data="https://xtyle.dev"></xtyle-qr>`;

const iconHtmlExample = `<xtyle-qr
	data="https://xtyle.dev"
	icon="palette"
	frame
	size="240"
></xtyle-qr>`;

const overlayHtmlExample = `<!-- Lay the mark over the code (error correction recovers the covered modules) -->
<xtyle-qr
	data="https://xtyle.dev"
	icon="palette"
	icon-overlay
	icon-outline
	icon-scale="0.26"
></xtyle-qr>`;

const framedHtmlExample = `<!-- The caption is a real link; the button swaps themed <-> bitonal live -->
<xtyle-qr data="https://xtyle.dev" frame mode-toggle></xtyle-qr>`;

const framedSvelteExample = `<script lang="ts">
	import { QrCode } from "@xtyle/svelte";
</script>

<QrCode data="https://xtyle.dev" frame modeToggle />`;

const framedAstroExample = `---
import QrCode from "@xtyle/astro/Qr.astro";
---

<QrCode data="https://xtyle.dev" frame modeToggle />`;

const bitonalHtmlExample = `<!-- Guaranteed-scannable black-on-white, whatever the theme -->
<xtyle-qr data="https://xtyle.dev" mode="bitonal"></xtyle-qr>`;

const autoHtmlExample = `<!-- Theme colors when they clear the scannability floor, bitonal when they don't -->
<xtyle-qr data="https://xtyle.dev" mode="auto" module-shape="dot"></xtyle-qr>`;

const svelteExample = `<script lang="ts">
	import { QrCode } from "@xtyle/svelte";
</script>

<QrCode data="https://xtyle.dev" />`;

const iconSvelteExample = `<script lang="ts">
	import { QrCode } from "@xtyle/svelte";
</script>

<QrCode data="https://xtyle.dev" icon="palette" frame size={240} />`;

const overlaySvelteExample = `<script lang="ts">
	import { QrCode } from "@xtyle/svelte";
</script>

<QrCode data="https://xtyle.dev" icon="palette" iconOverlay iconOutline iconScale={0.26} />`;

const bitonalSvelteExample = `<script lang="ts">
	import { QrCode } from "@xtyle/svelte";
</script>

<QrCode data="https://xtyle.dev" mode="bitonal" />`;

const astroExample = `---
import QrCode from "@xtyle/astro/Qr.astro";
---

<QrCode data="https://xtyle.dev" />`;

const iconAstroExample = `---
import QrCode from "@xtyle/astro/Qr.astro";
---

<QrCode data="https://xtyle.dev" icon="palette" frame size={240} />`;

const overlayAstroExample = `---
import QrCode from "@xtyle/astro/Qr.astro";
---

<QrCode data="https://xtyle.dev" icon="palette" iconOverlay iconOutline iconScale={0.26} />`;

const bitonalAstroExample = `---
import QrCode from "@xtyle/astro/Qr.astro";
---

<QrCode data="https://xtyle.dev" mode="bitonal" />`;

export const qrManifest: ComponentManifest = {
	id: "qr",
	name: "QR Code",
	since: "0.7.0",
	category: "media",
	keywords: ["barcode", "2d barcode", "link", "url", "deep link", "scan", "vcard", "wifi"],
	seeAlso: ["icon", "image", "code"],
	summary: "A themeable QR code that derives its colors from the active theme, drops an icon in the middle, and can fall back to guaranteed-scannable black-on-white.",
	description:
		"QR Code encodes any string into a scannable symbol with a self-contained encoder that runs at build and in the browser alike, so a themed code costs no runtime and no network. It follows ISO/IEC 18004: automatic mode selection (numeric, alphanumeric, or byte over UTF-8), the full error-correction tables for versions 1-40, Reed-Solomon parity, and the eight data masks scored for the cleanest read. Because the modules ink themselves from the theme (`--fg-0` on `--bg-0` by default, overridable through the `--qr-module` / `--qr-bg` custom properties), a QR that matches the surrounding UI is the default, not a manual export. Drop an icon in the center with `icon` (any xtyle icon name) or a bitmap with `logo`, sized by `icon-scale` to the conventional logo fraction; the component bumps error correction to level H so the mark never costs a byte the scanner needs. By default it knocks a clean hole in the modules and pads the mark against the background; set `icon-overlay` to instead lay the mark straight over the code the way a printed logo does, letting error correction recover the covered modules, and `icon-outline` for a background-colored halo so the mark stays distinct against the pattern. `module-shape` renders squares, dots, or rounded cells; `frame` wraps the code and prints the payload beneath it so a human can read the link a camera would follow. The load-bearing rule is scannability: `mode=\"theme\"` inks from the theme and flags a low-contrast pairing, `mode=\"bitonal\"` forces the guaranteed black-on-white a reader never misses, and `mode=\"auto\"` measures the live theme and silently falls back to bitonal only when the theme's own colors drop below the scannable floor. The floor is xtyle's own contrast infrastructure pointed at a new surface, so a themed code that would fail to scan is caught, not shipped.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "code",
			description: "The square that holds the symbol; sized by `size` and rounded off the radius scale.",
			selector: ".xtyle-qr__code",
			tokens: ["--radius-md"],
		},
		{
			name: "background",
			description: "The full-bleed background rect behind the modules; inks from `--qr-bg` (defaulting to `--bg-0`).",
			selector: ".xtyle-qr__bg",
			tokens: ["--bg-0"],
		},
		{
			name: "modules",
			description: "The single path drawing every dark module; inks from `--qr-module` (defaulting to `--fg-0`).",
			selector: ".xtyle-qr__modules",
			tokens: ["--fg-0"],
		},
		{
			name: "logo",
			description: "The centered icon or bitmap; knocked out of the grid on a background pad, or (overlay) laid over it with an optional halo.",
			selector: ".xtyle-qr__logo",
			tokens: ["--radius-md"],
		},
		{
			name: "caption",
			description: "The payload printed beneath the symbol when `frame` is set, in the mono type; a real link when the payload is one, plain text otherwise.",
			selector: ".xtyle-qr__caption",
			tokens: ["--fg-1", "--font-mono", "--text-sm"],
		},
		{
			name: "toggle",
			description: "The optional button on the frame that swaps between the themed and bitonal renderings.",
			selector: ".xtyle-qr__toggle",
			tokens: ["--fg-0", "--fg-1", "--bg-0", "--radius-md", "--ring"],
		},
		{
			name: "frame",
			description: "The optional surrounding surface that groups the code, its caption, and the toggle.",
			selector: ".xtyle-qr--framed",
			tokens: ["--bg-1", "--radius-lg", "--space-3"],
		},
	],
	props: [
		{
			name: "data",
			type: "string",
			description: "The payload to encode: a URL, plain text, a `mailto:`/`tel:`/`WIFI:`/`BEGIN:VCARD` string, anything. The encoder picks numeric, alphanumeric, or byte mode and the smallest version that fits.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "mode",
			type: "QrMode",
			default: "theme",
			description: "How the two colors are chosen: `theme` inks from the tokens (and flags a low-contrast pairing), `bitonal` forces guaranteed-scannable black-on-white, `auto` uses the theme when it clears the scannability floor and falls back to bitonal when it doesn't.",
			bindings: ["html", "svelte", "astro"],
			options: ["theme", "bitonal", "auto"],
		},
		{
			name: "ecLevel",
			type: "QrEcLevel",
			default: "M",
			description: "Error-correction level: `L` (~7%), `M` (~15%), `Q` (~25%), `H` (~30%) recoverable. Higher survives more damage or occlusion at the cost of density; an injected `icon`/`logo` forces `H`.",
			bindings: ["html", "svelte", "astro"],
			options: ["L", "M", "Q", "H"],
		},
		{
			name: "icon",
			type: "string",
			description: "An xtyle icon name to drop in the center. Bumps error correction to `H` and clears the center modules so the mark never costs a scannable byte.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "logo",
			type: "string",
			description: "An image URL to drop in the center instead of an `icon`; same sizing, `H` bump, and overlay/knockout behavior.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "iconSize",
			type: "QrIconSize",
			default: "md",
			description: "The center mark's size as a named preset: `sm` (18%), `md` (24%), `lg` (28%), `xl` (32% of the symbol width). Larger leans harder on error correction; every preset stays scannable in both knockout and overlay at level H.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg", "xl"],
		},
		{
			name: "iconScale",
			type: "number",
			description: "An exact fraction of the symbol width for the center mark (clamped to 0.1-0.4), the escape hatch when a preset `iconSize` isn't the size you want. Overrides `iconSize` when set.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "iconOverlay",
			type: "boolean",
			default: "false",
			description: "Lay the mark over the modules (error correction recovers the covered ones) instead of knocking a hole in them. Pair with `iconOutline` so the mark reads against the pattern.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "iconOutline",
			type: "boolean",
			default: "false",
			description: "Give the center mark a background-colored halo so it stays distinct against the modules; most useful with `iconOverlay`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "moduleShape",
			type: "QrModuleShape",
			default: "square",
			description: "How each dark module is drawn: `square` (densest, scans most reliably), `dot`, or `rounded`.",
			bindings: ["html", "svelte", "astro"],
			options: ["square", "dot", "rounded"],
		},
		{
			name: "frame",
			type: "boolean",
			default: "false",
			description: "Wrap the code in a surface and print the payload beneath it. When the payload is a link (`http(s)`, `mailto:`, `tel:`, or a bare host), the caption renders as a real, followable link rather than plain text.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "caption",
			type: "string",
			description: "Override the frame's caption text (defaults to the payload). Only shown when `frame` is set.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "modeToggle",
			type: "boolean",
			default: "false",
			description: "Show a small button on the frame that swaps the rendering between its themed and bitonal (guaranteed black-on-white) modes live, so a viewer can flip to the high-contrast version if their scanner struggles. Requires the runtime.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "size",
			type: "number",
			default: "200",
			description: "The rendered pixel size of the symbol.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "quietZone",
			type: "number",
			default: "4",
			description: "Modules of empty margin around the symbol. The spec floor is 4; going lower risks a reader that can't find the edges.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "The accessible name announced for the symbol. Defaults to the payload.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "low-contrast",
			description: "Set on the figure when the theme colors fall below the scannability floor (in `theme` mode, or `auto` before it falls back), so a failing pairing is visible to a linter or a designer.",
			selector: ".xtyle-qr[data-contrast=\"low\"]",
		},
	],
	slots: [],
	consumedTokens: [
		"--bg-0",
		"--bg-1",
		"--fg-0",
		"--fg-1",
		"--font-mono",
		"--radius-lg",
		"--radius-md",
		"--ring",
		"--space-2",
		"--space-3",
		"--text-sm",
	],
	composition: [
		"Point `data` at a URL and drop the code into a `Card` footer or a `Panel` so a printed page or a slide carries a scannable link.",
		"Set `icon` to a brand-shaped xtyle icon (or `logo` to a bitmap) for a centered mark; error correction bumps to `H` automatically so it still scans.",
		"Add `frame` where a human might need to type the link a camera would otherwise follow; the payload prints beneath the symbol in mono.",
		"Reach for `mode=\"bitonal\"` on anything printed or shown over an uncertain background, and `mode=\"auto\"` when a themed code should self-downgrade only if its colors can't be scanned.",
		"Override `--qr-module` / `--qr-bg` for a bespoke pairing the algorithm didn't derive, but audit it: the contrast floor is there for a reason.",
	],
	a11y: [
		"The symbol is an `<svg role=\"img\">` with an `aria-label` naming the payload, so assistive tech announces the destination a sighted user would scan.",
		"`frame` prints the payload beneath the code as a real, keyboard-focusable link when it is one (a non-camera path to the same destination), or plain text otherwise. Only safe schemes (`http(s)`, `mailto:`, `tel:`) are linkified, so a `javascript:` payload never becomes a live link.",
		"The `modeToggle` button is a real `<button>` with an `aria-label` and an `aria-pressed` state reflecting whether the bitonal rendering is active, so the swap is operable and announced.",
		"Scannability is treated as an accessibility contract: `theme` mode flags a low-contrast pairing via `data-contrast`, and `auto` falls back to guaranteed black-on-white rather than shipping a code that can't be read.",
		"Module color and background come from the same tokens the rest of the theme is graded against, so a QR never becomes the one un-audited patch of a themed page.",
	],
	examples: [
		{
			id: "link",
			title: "A themed link",
			description: "The default: encode a URL and let the modules ink themselves from the active theme.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "icon-framed",
			title: "Centered icon, framed",
			description: "Drop an xtyle icon in the middle (error correction bumps to `H`) and frame the code so the link prints beneath it.",
			source: { html: iconHtmlExample, svelte: iconSvelteExample, astro: iconAstroExample },
		},
		{
			id: "icon-overlay",
			title: "Overlay logo with an outline",
			description: "`icon-overlay` lays the mark straight over the code the way a printed logo does; `icon-outline` gives it a halo so it stays distinct while error correction recovers the covered modules.",
			source: { html: overlayHtmlExample, svelte: overlaySvelteExample, astro: overlayAstroExample },
		},
		{
			id: "framed-interactive",
			title: "Framed with a live link and swap",
			description: "`frame` renders the payload as a real followable link beneath the code, and `mode-toggle` adds a button that swaps between the themed and bitonal renderings on the spot.",
			source: { html: framedHtmlExample, svelte: framedSvelteExample, astro: framedAstroExample },
		},
		{
			id: "bitonal",
			title: "Bitonal fallback",
			description: "Force guaranteed-scannable black-on-white regardless of theme, for print or an uncertain background.",
			source: { html: bitonalHtmlExample, svelte: bitonalSvelteExample, astro: bitonalAstroExample },
		},
		{
			id: "auto",
			title: "Auto scannability",
			description: "`mode=\"auto\"` keeps the theme colors while they clear the scannability floor and silently drops to bitonal when they don't.",
			source: { html: autoHtmlExample },
		},
	],
};
