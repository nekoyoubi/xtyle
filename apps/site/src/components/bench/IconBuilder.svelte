<script lang="ts">
	import { type Palette, composeIcon, embedFontsInSvg, iconFontImports, isFontLoaded, loadGoogleFont, primitiveSince, primitiveTags, resolveIconMark, resolvePalette, seriesPalette, suggestGoogleFonts, PALETTES, PALETTE_TOKENS } from "@xtyle/core";
	import { AppShell, Button, Cluster, ColorPicker, Dock, Icon, Segment, Segmented, Slider, Swatch, Switch, Toolbar } from "@xtyle/svelte";
	import { isNewComponent } from "../../data/newness.ts";
	import { ACTIVE_CHANGED_EVENT } from "../../lib/theme-active.ts";
	import { installGoogleFonts } from "../../lib/google-fonts.ts";

	installGoogleFonts();

	interface MarkLayer {
		id: number;
		keyword: string;
		/** For the `letter` primitive: the glyph to typeset. */
		glyph: string;
		/** For a `letter`: the font slot (0 sans, 1 display, 2 mono). */
		font: number;
		/** For a `poly` / `polyline`: the `pts` run, a registered name or `x,y` pairs in a 0–100 space. */
		pts: string;
		p: number;
		x: number;
		y: number;
		s: number;
		/** Per-axis size (the grammar's `sx`/`sy`), live only while `stretch` is on; off, both axes follow `s`. */
		sx: number;
		sy: number;
		stretch: boolean;
		r: number;
		c: number | null;
		outline: number;
		outlineColor: number | null;
		a: number;
		fh: boolean;
		fv: boolean;
		ko: boolean;
		invert: boolean;
		locks: Record<string, boolean>;
	}

	const LOCK_KEYS = ["keyword", "p", "s", "r", "x", "y", "a", "c", "outline", "fh", "fv", "ko", "invert"] as const;
	const LOCK_CODE: Record<string, string> = {
		keyword: "w",
		p: "p",
		s: "s",
		r: "r",
		x: "x",
		y: "y",
		a: "a",
		c: "c",
		outline: "o",
		fh: "h",
		fv: "v",
		ko: "k",
		invert: "i",
	};
	const CODE_LOCK: Record<string, string> = Object.fromEntries(Object.entries(LOCK_CODE).map(([k, v]) => [v, k]));

	const PRIMITIVE_GROUPS: { group: string; keywords: string[] }[] = [
		{ group: "Shapes", keywords: ["circle", "square", "square1", "square2", "square3", "shield", "hex", "diamond", "triangle", "pentagon", "octagon", "oval", "pill", "squircle", "trapezoid", "ramp", "half", "quarter", "wedge", "arch", "gem"] },
		{ group: "Curves", keywords: ["wave", "water", "swish", "blob", "lens", "leaf", "drop", "egg", "cloud", "mountain", "sun", "flame"] },
		{ group: "Volume", keywords: ["disc", "cylinder", "cone"] },
		{ group: "Markers", keywords: ["banner", "tag", "bubble", "chevron", "arrow"] },
		{ group: "Strokes", keywords: ["line", "arc", "corner", "vee"] },
		{ group: "Frames", keywords: ["ring", "border", "divider"] },
		{ group: "Bars", keywords: ["top", "row", "column", "diagonal", "cross"] },
		{ group: "Symbols", keywords: ["star", "star4", "star6", "star8", "burst", "seal", "heart", "crescent", "bolt", "dot"] },
		{ group: "Text", keywords: ["letter"] },
		{ group: "Custom", keywords: ["poly", "polyline"] },
		{ group: "Glyphs", keywords: ["check", "close", "plus", "minus", "search", "menu", "info", "warning", "error", "success", "play", "pause", "stop", "loader"] },
		{ group: "Objects", keywords: ["gear", "folder", "pencil", "trash", "eye", "copy", "palette", "bookmark", "download"] },
	];

	/** Starting runs for a `poly` / `polyline`, so the field is never a blank prompt. */
	const POINT_PRESETS: { label: string; pts: string }[] = [
		{ label: "Triangle", pts: "50,0,100,100,0,100" },
		{ label: "Arrow", pts: "arrow" },
		{ label: "Pennant", pts: "pennant" },
		{ label: "Chevron", pts: "0,0,60,50,0,100,25,50" },
		{ label: "Zigzag", pts: "0,80,25,20,50,80,75,20,100,80" },
	];

	/** Match a palette keyword against a search string: its own name or any of its tags. */
	function primitiveMatches(kw: string, query: string): boolean {
		const q = query.trim().toLowerCase();
		if (!q) return true;
		return kw.toLowerCase().includes(q) || primitiveTags(kw).some((t) => t.includes(q));
	}

	const COLOR_SLOTS: { value: string; label: string }[] = [
		{ value: "1", label: "s1" },
		{ value: "2", label: "s2" },
		{ value: "3", label: "s3" },
		{ value: "4", label: "s4" },
		{ value: "5", label: "s5" },
		{ value: "6", label: "s6" },
		{ value: "7", label: "s7" },
		{ value: "8", label: "s8" },
		{ value: "9", label: "s9" },
		{ value: "a", label: "active" },
		{ value: "f", label: "fg" },
		{ value: "b", label: "bg" },
		{ value: "0", label: "clear" },
	];

	const SCHEMES: { value: Palette; label: string }[] = PALETTES.map((value) => ({
		value,
		label: value.charAt(0).toUpperCase() + value.slice(1),
	}));

	const BG_OPTIONS: { token: string; label: string }[] = [
		{ token: "--body-bg", label: "Page" },
		{ token: "--bg-0", label: "Base" },
		{ token: "--bg-1", label: "Panel" },
		{ token: "--bg-2", label: "Raised" },
		{ token: "--bg-3", label: "Float" },
		{ token: "--fg-0", label: "Contrast" },
	];

	const GRID =
		"--square1-p1-s35-c1--square1-p2-s35-c2--square1-p3-s35-c3--square1-p4-s35-c4--square1-p5-s35-c5--square1-p6-s35-c6--square1-p7-s35-c7--square1-p8-s35-c8--square1-p9-s35-c9";

	let nextId = 1;
	function makeLayer(keyword: string, over: Partial<MarkLayer> = {}): MarkLayer {
		return {
			id: nextId++,
			keyword,
			glyph: "A",
			font: 0,
			pts: "0,0,100,50,0,100",
			p: 5,
			x: 0,
			y: 0,
			s: 100,
			sx: 100,
			sy: 100,
			stretch: false,
			r: 0,
			c: null,
			outline: 0,
			outlineColor: null,
			a: 100,
			fh: false,
			fv: false,
			ko: false,
			invert: false,
			locks: {},
			...over,
		};
	}

	const EXAMPLES: { name: string; scheme: Palette }[] = [
		{ name: "Crest--shield-c1--star-s45-cf", scheme: "accents" },
		{ name: "Bolt-badge--circle-c2--bolt-s52-cb", scheme: "accents" },
		{ name: "dice-1--square3-c1-o1c2--dot-s20-c2---d3p8s1t20--pc1-e2e0e0--pc2-2d3038--pc3-000000", scheme: "accents" },
		{ name: "dice-2--square3-c1-o1c2--dot-p7-x16-y-16-s20-c2--dot-p3-x-16-y16-s20-c2---d3p8s1t20--pc1-e2e0e0--pc2-2d3038--pc3-000000", scheme: "accents" },
		{ name: "dice-3--square3-c1-o1c2--dot-p7-x12-y-12-s20-c2--dot-s20-c2--dot-p3-x-12-y12-s20-c2---d3p8s1t20--pc1-e2e0e0--pc2-2d3038--pc3-000000", scheme: "accents" },
		{ name: "dice-4--square3-c1-o1c2--dot-p7-x16-y-16-s20-c2--dot-p1-x16-y16-s20-c2--dot-p3-x-16-y16-s20-c2--dot-p9-x-16-y-16-s20-c2---d3p8s1t20--pc1-e2e0e0--pc2-2d3038--pc3-000000", scheme: "accents" },
		{ name: "dice-5--square3-c1-o1c2--dot-p7-x12-y-12-s20-c2--dot-p1-x12-y12-s20-c2--dot-s20-c2--dot-p3-x-12-y12-s20-c2--dot-p9-x-12-y-12-s20-c2---d3p8s1t20--pc1-e2e0e0--pc2-2d3038--pc3-000000", scheme: "accents" },
		{ name: "dice-6--square3-c1-o1c2--dot-p7-x14-y-10-s20-c2--dot-p1-x14-y10-s20-c2--dot-p4-x14-s20-c2--dot-p6-x-14-s20-c2--dot-p3-x-14-y10-s20-c2--dot-p9-x-14-y-10-s20-c2---d3p8s1t20--pc1-e2e0e0--pc2-2d3038--pc3-000000", scheme: "accents" },
		{ name: "Target--ring-c1--dot-s28-c2", scheme: "statuses" },
		{ name: "Heart-seal--circle-c3--heart-s48-cf", scheme: "skittles" },
		{ name: "Star-hex--hex-c1--star-s50-cb", scheme: "accents" },
		{ name: "Gear-badge--circle-c2--gear-s54-cb", scheme: "accents" },
		{ name: "Eye-shield--shield-c4--eye-s46-cf", scheme: "skittles" },
		{ name: "Check-ring--ring-c1--check-s40-c1", scheme: "statuses" },
		{ name: "Warn-diamond--diamond-c2--warning-s44-cb", scheme: "statuses" },
		{ name: "play-circle--circle-c1--play-s75-cb", scheme: "accents" },
		{ name: "Moon--circle-c3--crescent-s60-cf", scheme: "skittles" },
		{ name: "Cross-shield--shield-c1--cross-s70-cf", scheme: "accents" },
		{ name: "Folder-tab--square-c2--folder-s52-cb", scheme: "accents" },
		{ name: "Bookmark--square1-c3--bookmark-s50-cf", scheme: "skittles" },
		{ name: "Palette-badge--circle-c4--palette-s50-cb", scheme: "skittles" },
		{ name: "Search-lens--circle-c1--search-s44-cb", scheme: "accents" },
		{ name: "Bolt-diamond--diamond-c5--bolt-s54-cf", scheme: "skittles" },
		{ name: "Alert-triangle--triangle-c2--warning-s34-cb", scheme: "statuses" },
		{ name: "Twin-star--star-c1--star-s55-r180-c2", scheme: "accents" },
		{ name: "Pencil-note--square2-c3--pencil-s52-cf", scheme: "skittles" },
		{ name: "Download-badge--circle-c1--download-s48-cb", scheme: "accents" },
		{ name: "heartbeat--heart-c5--heart-s60-cb-ko---d5p8s1t60", scheme: "skittles" },
		{ name: "Gear-hex--hex-c4--gear-s58-cf", scheme: "skittles" },
		{ name: "Dot-grid--square-c1--dot-p1-s16-cf--dot-p3-s16-cf--dot-p7-s16-cf--dot-p9-s16-cf", scheme: "accents" },
		{ name: "shield-column--shield-c1--column-s80-cf", scheme: "accents" },
		{ name: "Thermal-ring--ring-c1--dot-s26-c5", scheme: "thermal" },
		{ name: "Copy-badge--square3-c2--copy-s50-cb", scheme: "accents" },
		{ name: "Crescent-star--circle-c4--crescent-s52-cf--star-p3-s18-cb", scheme: "skittles" },
		{ name: "Trash-badge--circle-c2--trash-s50-cb", scheme: "statuses" },
		{ name: "Thermal-chip--hex-c1--dot-s30-c9---ps-thermal", scheme: "accents" },
		{ name: "Skittle-crest--shield-c1--star-s45-c5---ps-skittles", scheme: "accents" },
	];

	function loadIcon(name: string, sch: Palette): void {
		scheme = sch;
		applyName(name);
	}

	function exampleLabel(name: string): string {
		return name.split("--")[0];
	}
	/** Order icons alphabetically by the first piece of their name (the label before the first `--`),
	 * numerically aware so a numbered series sorts `dice-2` before `dice-10`. */
	function byIconName(a: { name: string }, b: { name: string }): number {
		return exampleLabel(a.name).toLowerCase().localeCompare(exampleLabel(b.name).toLowerCase(), undefined, { numeric: true });
	}
	let exampleQuery = $state("");
	/** Match an example against the filter box: its name (label + shapes + flags) or its palette. */
	function exampleMatches(ex: (typeof EXAMPLES)[number]): boolean {
		const q = exampleQuery.trim().toLowerCase();
		if (!q) return true;
		return ex.name.toLowerCase().includes(q) || ex.scheme.includes(q);
	}
	const shownExamples = $derived(EXAMPLES.filter(exampleMatches).sort(byIconName));

	interface DropShadow {
		color: number;
		pos: number;
		size: number;
		soft: number;
	}
	const DEFAULT_SHADOW: DropShadow = { color: 15, pos: 8, size: 2, soft: 50 };

	/** The whole-mark transform finish: `s`/`sx`/`sy` size the composite, `mx`/`my` move it, `center`
	 * re-seats it on its own measured box. Held as one record so the panel reads as one control group. */
	interface MarkTransform {
		s: number;
		/** Per-axis mark size, live only while `stretch` is on; off, both axes follow `s`. */
		sx: number;
		sy: number;
		stretch: boolean;
		mx: number;
		my: number;
		center: boolean;
	}
	const DEFAULT_TRANSFORM: MarkTransform = { s: 100, sx: 100, sy: 100, stretch: false, mx: 0, my: 0, center: false };
	/** True when the size/move dials are all at rest, so the finish emits nothing for them (`center` is its own switch). */
	function transformIsIdle(t: MarkTransform): boolean {
		return t.s === 100 && !t.stretch && t.mx === 0 && t.my === 0;
	}

	let label = $state("Crest");
	let scheme = $state<Palette>("accents");
	let pinScheme = $state(false);
	let previewBg = $state("--body-bg");
	let layers = $state<MarkLayer[]>([]);
	let selectedId = $state<number | null>(null);
	let dropShadow = $state<DropShadow | null>(null);
	let paletteOverrides = $state<Record<string, string> | null>(null);
	let fontOverrides = $state<Record<number, string> | null>(null);
	let transform = $state<MarkTransform>({ ...DEFAULT_TRANSFORM });
	let transformOpen = $state(false);
	let markOutline = $state<{ size: number; color: number | null } | null>(null);
	let expand = $state<number | null>(null);
	/** Finish flags the builder has no control for (`e…` canvas expand, `o…` whole-mark outline, anything a
	 * later engine version adds). They are part of the mark, so they ride the round trip verbatim rather
	 * than being silently dropped the moment the author touches any other control. */
	let extraFinish = $state<string[]>([]);
	const FONT_SLOTS = [
		{ slot: 0, label: "Sans", placeholder: "sans / a family" },
		{ slot: 1, label: "Display", placeholder: "display / sigmar" },
		{ slot: 2, label: "Mono", placeholder: "mono / a family" },
	];
	type CopyState = "idle" | "done" | "fail";
	let copyState = $state<CopyState>("idle");
	let cleanState = $state<CopyState>("idle");
	const copyGlyph = (s: CopyState): string => (s === "done" ? "check" : s === "fail" ? "close" : "copy");

	let nameOpen = $state(false);
	let nameBoxEl = $state<HTMLElement>();
	$effect(() => {
		if (!nameOpen) return;
		const onPointerDown = (e: PointerEvent): void => {
			if (nameBoxEl && !nameBoxEl.contains(e.target as Node)) nameOpen = false;
		};
		const onKeydown = (e: KeyboardEvent): void => {
			if (e.key === "Escape") {
				e.preventDefault();
				nameOpen = false;
			}
		};
		window.addEventListener("pointerdown", onPointerDown);
		window.addEventListener("keydown", onKeydown);
		return () => {
			window.removeEventListener("pointerdown", onPointerDown);
			window.removeEventListener("keydown", onKeydown);
		};
	});

	/**
	 * Enter applies the edited name and closes the flyout. An icon name is one line by construction, so a
	 * newline in this field can only ever be a mistake the parser then has to reject; Enter means "done".
	 * Escape leaves without applying, which the window handler already closes on.
	 */
	function commitName(event: KeyboardEvent): void {
		if (event.key !== "Enter" || event.shiftKey) return;
		event.preventDefault();
		applyName((event.currentTarget as HTMLTextAreaElement).value);
		nameOpen = false;
	}

	let addOpen = $state(false);
	let addBoxEl = $state<HTMLElement>();
	let addQuery = $state("");
	let replaceOpen = $state(false);
	let replaceBoxEl = $state<HTMLElement>();
	let replaceQuery = $state("");
	function toggleAdd(): void {
		addOpen = !addOpen;
		if (!addOpen) addQuery = "";
	}
	function toggleReplace(): void {
		replaceOpen = !replaceOpen;
		if (!replaceOpen) replaceQuery = "";
	}
	/** Swap the selected layer's shape, keeping every other setting (color, transform, locks, …). */
	function replacePrimitive(kw: string): void {
		if (selected) selected.keyword = kw;
		replaceOpen = false;
		replaceQuery = "";
	}
	/** Close a popover on click-outside (of `box`) or Escape while `isOpen()` is true. */
	function dismissable(isOpen: () => boolean, box: () => HTMLElement | undefined, close: () => void): () => void {
		if (!isOpen()) return () => {};
		const onPointerDown = (e: PointerEvent): void => {
			const el = box();
			if (el && !el.contains(e.target as Node)) close();
		};
		const onKeydown = (e: KeyboardEvent): void => {
			if (e.key === "Escape") {
				e.preventDefault();
				close();
			}
		};
		window.addEventListener("pointerdown", onPointerDown);
		window.addEventListener("keydown", onKeydown);
		return () => {
			window.removeEventListener("pointerdown", onPointerDown);
			window.removeEventListener("keydown", onKeydown);
		};
	}
	$effect(() => dismissable(() => addOpen, () => addBoxEl, () => (addOpen = false)));
	$effect(() => dismissable(() => replaceOpen, () => replaceBoxEl, () => (replaceOpen = false)));

	const STORAGE_KEY = "xtyle:icon-builder";
	function restoreSaved(): boolean {
		if (typeof localStorage === "undefined") return false;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return false;
			const saved = JSON.parse(raw) as { name?: string; scheme?: Palette };
			if (!saved?.name) return false;
			loadIcon(saved.name, saved.scheme ?? "accents");
			return layers.length > 0;
		} catch {
			return false;
		}
	}
	if (!restoreSaved()) {
		const initialIcon = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)];
		loadIcon(initialIcon.name, initialIcon.scheme);
	}

	const selected = $derived(layers.find((l) => l.id === selectedId) ?? null);

	function isLocked(l: MarkLayer, key: string): boolean {
		return l.locks[key] === true;
	}
	function toggleLock(l: MarkLayer, key: string): void {
		l.locks[key] = !l.locks[key];
	}
	function layerLockState(l: MarkLayer): "none" | "some" | "all" {
		const n = LOCK_KEYS.filter((k) => l.locks[k]).length;
		return n === 0 ? "none" : n === LOCK_KEYS.length ? "all" : "some";
	}
	function toggleLayerLock(l: MarkLayer): void {
		const lockAll = layerLockState(l) !== "all";
		for (const k of LOCK_KEYS) l.locks[k] = lockAll;
	}

	function slug(text: string): string {
		return text
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "");
	}

	function serializeLayer(l: MarkLayer): string {
		const parts = [l.keyword];
		// INFO: a letter's glyph and font slot must lead the flags; the grammar consumes them before the shared token loop
		if (l.keyword === "letter") {
			parts.push(l.glyph || "A");
			if (l.font) parts.push(`f${l.font}`);
		}
		if (l.keyword === "poly" || l.keyword === "polyline") parts.push(`pts${(l.pts || "").replace(/\s+/g, ",")}`);
		if (l.p !== 5) parts.push(`p${l.p}`);
		if (l.x) parts.push(`x${l.x}`);
		if (l.y) parts.push(`y${l.y}`);
		if (l.s !== 100) parts.push(`s${l.s}`);
		if (l.stretch) parts.push(`sx${l.sx}`, `sy${l.sy}`);
		if (l.r) parts.push(`r${l.r}`);
		if (l.c !== null) parts.push(`c${l.c.toString(16)}`);
		if (l.outline > 0) parts.push(`o${l.outline}${l.outlineColor !== null ? `c${l.outlineColor.toString(16)}` : ""}`);
		if (l.a !== 100) parts.push(`a${l.a}`);
		if (l.fh) parts.push("fh");
		if (l.fv) parts.push("fv");
		if (l.invert) parts.push("i");
		if (l.ko) parts.push("ko");
		return parts.join("-");
	}

	/** Encode a layer's locks as `l<1-based-index><codes>` (or `l<index>*` when the whole layer is pinned). */
	function serializeLocks(l: MarkLayer, index: number): string {
		const locked = LOCK_KEYS.filter((k) => l.locks[k]);
		if (locked.length === 0) return "";
		if (locked.length === LOCK_KEYS.length) return `l${index + 1}*`;
		return `l${index + 1}${locked.map((k) => LOCK_CODE[k]).join("")}`;
	}

	/** The `---` finish is whole-icon metadata: render tokens (`d…` drop shadow) first, then the `l…`
	 * lock convenience-tokens, so an export can lift the locks and leave the render finish intact. */
	function serializeShadow(ds: DropShadow): string {
		return `d${ds.color.toString(16)}p${ds.pos}s${ds.size}t${ds.soft}`;
	}

	/** Each set override as a `pc{nibble}-{hex}` token (`pc-{hex}` for the `*` silhouette). */
	function serializePalette(pc: Record<string, string>): string[] {
		return Object.entries(pc).map(([key, hex]) => `pc${key === "*" ? "" : key}-${hex.replace(/^#/, "")}`);
	}

	/** Each set font override as a `f{slot}-{family}` finish token. */
	function serializeFonts(fo: Record<number, string>): string[] {
		return Object.entries(fo)
			.filter(([, family]) => family.trim())
			.map(([slot, family]) => `f${slot}-${family.trim().replace(/\s+/g, "+")}`);
	}

	/** The whole-mark transform as finish tokens, emitting only the dials that are off their default. */
	function serializeTransform(t: MarkTransform): string[] {
		const out: string[] = [];
		if (t.center) out.push("center");
		if (t.s !== 100) out.push(`s${t.s}`);
		if (t.stretch) out.push(`sx${t.sx}`, `sy${t.sy}`);
		if (t.mx) out.push(`mx${t.mx}`);
		if (t.my) out.push(`my${t.my}`);
		return out;
	}

	/** The whole-mark outline as `o{1-3}[c{nibble}]` — the finish twin of a layer's own outline. */
	function serializeMarkOutline(o: { size: number; color: number | null }): string {
		return `o${o.size}${o.color !== null ? `c${o.color.toString(16)}` : ""}`;
	}

	const iconName = $derived.by(() => {
		if (layers.length === 0) return "";
		const body = layers.map(serializeLayer).join("--");
		const finish = [
			...(dropShadow ? [serializeShadow(dropShadow)] : []),
			...(pinScheme ? [`ps-${scheme}`] : []),
			...(paletteOverrides ? serializePalette(paletteOverrides) : []),
			...(fontOverrides ? serializeFonts(fontOverrides) : []),
			...serializeTransform(transform),
			...(markOutline ? [serializeMarkOutline(markOutline)] : []),
			...(expand !== null ? [`e${expand}`] : []),
			...extraFinish,
			...layers.map(serializeLocks).filter(Boolean),
		].join("--");
		return `${slug(label)}--${body}${finish ? `---${finish}` : ""}`;
	});

	$effect(() => {
		const payload = JSON.stringify({ name: iconName, scheme });
		if (typeof localStorage === "undefined") return;
		try {
			localStorage.setItem(STORAGE_KEY, payload);
		} catch {
			/* storage full or blocked (private mode) — persistence is best-effort */
		}
	});

	interface SavedIcon {
		id: string;
		label: string;
		name: string;
		scheme: Palette;
	}
	const LIBRARY_KEY = "xtyle:icon-library";
	function loadLibrary(): SavedIcon[] {
		if (typeof localStorage === "undefined") return [];
		try {
			const parsed = JSON.parse(localStorage.getItem(LIBRARY_KEY) ?? "[]");
			if (!Array.isArray(parsed)) return [];
			return parsed
				.filter((entry) => entry && typeof entry.name === "string" && entry.name.includes("--"))
				.map((entry) => ({
					id: typeof entry.id === "string" && entry.id ? entry.id : freshId(),
					label: (typeof entry.label === "string" && entry.label.trim()) || exampleLabel(entry.name),
					name: entry.name,
					scheme: entry.scheme ?? "accents",
				}));
		} catch {
			return [];
		}
	}
	let library = $state<SavedIcon[]>(loadLibrary());
	let savedFlash = $state<CopyState>("idle");
	function persistLibrary(): void {
		if (typeof localStorage === "undefined") return;
		try {
			localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
		} catch {
			/* best-effort */
		}
	}
	function freshId(): string {
		return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `icon-${Math.random().toString(36).slice(2, 10)}`;
	}
	function saveToLibrary(): void {
		if (!iconName) return;
		library = [{ id: freshId(), label: label.trim() || "icon", name: iconName, scheme }, ...library];
		persistLibrary();
		savedFlash = "done";
		setTimeout(() => (savedFlash = "idle"), 1400);
	}
	function removeSaved(id: string): void {
		library = library.filter((entry) => entry.id !== id);
		persistLibrary();
	}
	/** Match a saved icon against the filter box: its label, its serialized name, or its palette. */
	function savedMatches(entry: SavedIcon): boolean {
		const q = exampleQuery.trim().toLowerCase();
		if (!q) return true;
		return entry.label.toLowerCase().includes(q) || entry.name.toLowerCase().includes(q) || entry.scheme.includes(q);
	}
	const shownSaved = $derived(library.filter(savedMatches).sort(byIconName));

	let exportFlash = $state<CopyState>("idle");
	let libraryFileInput = $state<HTMLInputElement>();
	async function exportLibrary(): Promise<void> {
		if (library.length === 0) return;
		const payload = [...library].sort(byIconName).map((entry) => entry.name).join("\n");
		try {
			await navigator.clipboard.writeText(payload);
			exportFlash = "done";
		} catch {
			exportFlash = "fail";
		}
		setTimeout(() => (exportFlash = "idle"), 1400);
	}
	/** Parse a name list (one icon name per line) into library entries: blanks and non-name lines are
	 * ignored, surrounding punctuation is stripped, the label comes from the name, and the scheme defaults. */
	function parseNameList(text: string): SavedIcon[] {
		const out: SavedIcon[] = [];
		const seen = new Set<string>();
		for (const line of text.split(/\r?\n/)) {
			const name = line.trim().replace(/^["',\s[\]]+|["',\s[\]]+$/g, "");
			if (!name.includes("--") || /\s/.test(name) || seen.has(name)) continue;
			seen.add(name);
			out.push({ id: freshId(), label: exampleLabel(name), name, scheme: "accents" });
		}
		return out;
	}
	function triggerImport(): void {
		libraryFileInput?.click();
	}
	async function onImportFile(event: Event): Promise<void> {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = "";
		if (!file) return;
		try {
			const entries = parseNameList(await file.text());
			const existing = new Set(library.map((entry) => entry.name));
			const fresh = entries.filter((entry) => !existing.has(entry.name));
			if (fresh.length === 0) return;
			library = [...fresh, ...library];
			persistLibrary();
		} catch {
			/* unreadable file — ignore */
		}
	}

	/** Lift only the `l…` lock tokens from the finish, keeping any render finish (a drop shadow is part
	 * of the mark and must survive export); drops the `---` entirely when nothing else remains. */
	function stripLocks(name: string): string {
		const i = name.indexOf("---");
		if (i < 0) return name;
		const kept = name
			.slice(i + 3)
			.split("--")
			.filter((token) => !/^l\d/.test(token));
		return kept.length ? `${name.slice(0, i)}---${kept.join("--")}` : name.slice(0, i);
	}
	const hasLocks = $derived(layers.some((l) => LOCK_KEYS.some((k) => l.locks[k])));

	/** The inverse of `serializeLayer`: read a layer segment's tokens back into a `MarkLayer`. */
	function deserializeLayer(segment: string): MarkLayer | null {
		const keyword = /^[a-z]+[0-9]*/.exec(segment)?.[0];
		if (!keyword) return null;
		const over: Partial<MarkLayer> = {};
		let rest = segment.slice(keyword.length);
		// INFO: a letter's glyph and font slot are consumed before the shared flag loop, matching the engine grammar
		if (keyword === "letter") {
			const lm = /^-(.)(?:-f(\d))?/.exec(rest);
			if (lm) {
				over.glyph = lm[1];
				if (lm[2] != null) over.font = Number(lm[2]);
				rest = rest.slice(lm[0].length);
			}
		}
		if (keyword === "poly" || keyword === "polyline") {
			const pm = /^-pts([a-z0-9.,]+)/.exec(rest);
			if (pm) {
				over.pts = pm[1];
				rest = rest.slice(pm[0].length);
			}
		}
		const token = /-(?:(sx|sy|[pxysra])(-?\d+)|c([0-9a-f])|o(\d+)(?:c([0-9a-f]))?|(fh|fv|ko|i))/g;
		let m: RegExpExecArray | null;
		while ((m = token.exec(rest)) !== null) {
			if (m[1] === "p") over.p = Number(m[2]);
			else if (m[1] === "x") over.x = Number(m[2]);
			else if (m[1] === "y") over.y = Number(m[2]);
			else if (m[1] === "s") over.s = Number(m[2]);
			else if (m[1] === "sx") {
				over.sx = Number(m[2]);
				over.stretch = true;
			} else if (m[1] === "sy") {
				over.sy = Number(m[2]);
				over.stretch = true;
			} else if (m[1] === "r") over.r = Number(m[2]);
			else if (m[1] === "a") over.a = Number(m[2]);
			else if (m[3] != null) over.c = parseInt(m[3], 16);
			else if (m[4] != null) {
				over.outline = Number(m[4]);
				if (m[5] != null) over.outlineColor = parseInt(m[5], 16);
			} else if (m[6] === "fh") over.fh = true;
			else if (m[6] === "fv") over.fv = true;
			else if (m[6] === "ko") over.ko = true;
			else if (m[6] === "i") over.invert = true;
		}
		return makeLayer(keyword, over);
	}

	/** Read the `---` flags tail (`l1c-l2*`) onto the freshly parsed layers, pinning the encoded props. */
	function applyLocks(flags: string, target: MarkLayer[]): void {
		const spec = /l(\d+)(\*|[wpsrxyacohvki]+)/g;
		let m: RegExpExecArray | null;
		while ((m = spec.exec(flags)) !== null) {
			const layer = target[Number(m[1]) - 1];
			if (!layer) continue;
			if (m[2] === "*") {
				for (const k of LOCK_KEYS) layer.locks[k] = true;
			} else {
				for (const ch of m[2]) {
					const key = CODE_LOCK[ch];
					if (key) layer.locks[key] = true;
				}
			}
		}
	}

	/** Read a `d…` drop-shadow token from the finish tail back into builder state (null when absent). */
	function parseShadow(flags: string): DropShadow | null {
		const m = /d([0-9a-f])p([1-9])s([1-9])t(\d{1,3})/.exec(flags);
		if (!m) return null;
		return { color: parseInt(m[1], 16), pos: Number(m[2]), size: Number(m[3]), soft: Math.min(100, Number(m[4])) };
	}

	/** Read every `pc…` palette-override token from the finish into the override map (null when absent). */
	function parsePalette(flags: string): Record<string, string> | null {
		const re = /pc([0-9a-f])?-([0-9a-f]{3,8})/g;
		const out: Record<string, string> = {};
		let m: RegExpExecArray | null;
		while ((m = re.exec(flags)) !== null) out[m[1] ?? "*"] = `#${m[2]}`;
		return Object.keys(out).length ? out : null;
	}

	/** Read the `ps…` palette token from the finish: the palette the name pins for itself, validated
	 * against the shipped set (null when absent or unknown, so the builder's own palette still stands). */
	function parseScheme(flags: string): Palette | null {
		for (const flag of flags.split("--")) {
			const m = /^ps-(.+)$/.exec(flag);
			if (m) {
				const resolved = resolvePalette(m[1] as string);
				if (resolved) return resolved;
			}
		}
		return null;
	}

	/** Read every `f…` font-override token from the finish (`--`-delimited) into the slot→family map. */
	function parseFonts(flags: string): Record<number, string> | null {
		const out: Record<number, string> = {};
		for (const flag of flags.split("--")) {
			const m = /^f(\d)?-(.+)$/.exec(flag);
			if (m) out[m[1] != null ? Number(m[1]) : 0] = (m[2] as string).replace(/\+/g, " ");
		}
		return Object.keys(out).length ? out : null;
	}

	/** Read the whole-mark transform tokens (`center`, `s…`, `sx…`, `sy…`, `mx…`, `my…`) from the finish. */
	function parseTransform(flags: string): MarkTransform {
		const out: MarkTransform = { ...DEFAULT_TRANSFORM };
		for (const flag of flags.split("--")) {
			if (flag === "center") {
				out.center = true;
				continue;
			}
			const m = /^(sx|sy|s|mx|my)(-?\d{1,4})$/.exec(flag);
			if (!m) continue;
			const value = Number(m[2]);
			if (m[1] === "s") out.s = value;
			else if (m[1] === "sx") {
				out.sx = value;
				out.stretch = true;
			} else if (m[1] === "sy") {
				out.sy = value;
				out.stretch = true;
			} else if (m[1] === "mx") out.mx = value;
			else out.my = value;
		}
		return out;
	}

	/** Read the `o…` whole-mark outline from the finish (null when absent). Anchored per flag so it never
	 * catches a layer's outline, which lives in the object segment rather than the finish. */
	function parseMarkOutline(flags: string): { size: number; color: number | null } | null {
		for (const flag of flags.split("--")) {
			const m = /^o([1-3])(?:c([0-9a-f]))?$/.exec(flag);
			if (m) return { size: Number(m[1]), color: m[2] != null ? parseInt(m[2], 16) : null };
		}
		return null;
	}

	/** Read the `e{n}` canvas expansion from the finish (null when absent). */
	function parseExpand(flags: string): number | null {
		for (const flag of flags.split("--")) {
			const m = /^e(\d{1,3})$/.exec(flag);
			if (m) return Math.min(100, Number(m[1]));
		}
		return null;
	}

	/** Every finish flag no builder control owns, kept verbatim so an author who types one into the name
	 * field does not lose it the next time they touch a slider. Locks are excluded: they are rebuilt from
	 * the layers' own lock maps, so passing them through too would duplicate every one. */
	const KNOWN_FINISH = /^(?:d[0-9a-f]|ps-|pc\d?-|pc-|f\d?-|l\d|center$|o[1-3]|e\d|(?:sx|sy|s|mx|my)-?\d)/;
	function parseExtraFinish(flags: string): string[] {
		return flags.split("--").filter((flag) => flag && !KNOWN_FINISH.test(flag));
	}

	/** Parse an edited icon name back into the builder: the label prefix, one layer per segment, and the
	 * optional `---` finish (a `d…` drop shadow and `l…` lock flags). Invalid input reverts on next render. */
	function applyName(raw: string): void {
		const trimmed = raw.trim();
		const sep = trimmed.indexOf("---");
		const main = sep < 0 ? trimmed : trimmed.slice(0, sep);
		const flags = sep < 0 ? "" : trimmed.slice(sep + 3);
		const idx = main.indexOf("--");
		if (idx < 0) return;
		const next = main
			.slice(idx + 2)
			.split("--")
			.map(deserializeLayer)
			.filter((l): l is MarkLayer => l !== null);
		if (next.length === 0) return;
		if (flags) applyLocks(flags, next);
		label = main.slice(0, idx);
		layers = next;
		selectedId = next[0].id;
		dropShadow = flags ? parseShadow(flags) : null;
		paletteOverrides = flags ? parsePalette(flags) : null;
		fontOverrides = flags ? parseFonts(flags) : null;
		transform = flags ? parseTransform(flags) : { ...DEFAULT_TRANSFORM };
		transformOpen = !transformIsIdle(transform);
		markOutline = flags ? parseMarkOutline(flags) : null;
		expand = flags ? parseExpand(flags) : null;
		extraFinish = flags ? parseExtraFinish(flags) : [];
		const pinned = flags ? parseScheme(flags) : null;
		pinScheme = pinned !== null;
		if (pinned) scheme = pinned;
	}

	// INFO: null fill renders as currentColor, the "active" slot; it drops from the serialized name and reads back as active
	function colorValue(c: number | null): string {
		return c === null ? "a" : c.toString(16);
	}
	/** A palette slot's key in the name grammar: a hex nibble, never a decimal. Slots run past 9 (`a` active,
	 * `b` bg, `f` fg), so a slot read or written in base 10 is a different slot from the tenth on, and no slot
	 * at all past `f` — which is how the drop shadow ended up serializing `dNaN`. */
	function slotKey(c: number): string {
		return c.toString(16);
	}
	function setColor(l: MarkLayer, v: string): void {
		l.c = v === "a" ? null : parseInt(v, 16);
	}
	function setOutlineColor(l: MarkLayer, v: string): void {
		l.outlineColor = v === "a" ? null : parseInt(v, 16);
	}
	/** The display label for a color-slot value (`1` → `s1`), shown in a field header as the selection. */
	function slotLabel(value: string): string {
		return COLOR_SLOTS.find((s) => s.value === value)?.label ?? value;
	}

	let themeTick = $state(0);
	$effect(() => {
		const bump = (): void => void themeTick++;
		window.addEventListener(ACTIVE_CHANGED_EVENT, bump);
		return () => window.removeEventListener(ACTIVE_CHANGED_EVENT, bump);
	});
	const slotColors = $derived.by<Record<string, string>>(() => {
		void themeTick;
		if (typeof document === "undefined") return {};
		const cs = getComputedStyle(document.documentElement);
		const register: Record<string, string> = {};
		for (const token of PALETTE_TOKENS) {
			const value = cs.getPropertyValue(token).trim();
			if (value) register[token] = value;
		}
		const fg = cs.getPropertyValue("--fg-0").trim() || "#e6e9ef";
		const bg = cs.getPropertyValue("--bg-0").trim() || "#0b0d12";
		const series = seriesPalette(scheme, 9, register);
		return {
			inherit: fg,
			"0": "transparent",
			"1": series[0] ?? fg,
			"2": series[1] ?? fg,
			"3": series[2] ?? fg,
			"4": series[3] ?? fg,
			"5": series[4] ?? fg,
			"6": series[5] ?? fg,
			"7": series[6] ?? fg,
			"8": series[7] ?? fg,
			"9": series[8] ?? fg,
			a: fg,
			b: bg,
			f: fg,
		};
	});

	function addLayer(keyword: string): void {
		const l = makeLayer(keyword, { c: layers.length === 0 ? 1 : null });
		layers = [...layers, l];
		selectedId = l.id;
		addOpen = false;
		addQuery = "";
	}
	function removeLayer(id: number): void {
		const idx = layers.findIndex((l) => l.id === id);
		layers = layers.filter((l) => l.id !== id);
		if (selectedId === id) selectedId = layers[Math.max(0, idx - 1)]?.id ?? null;
	}
	/** Clone a layer (a fresh id, a copied lock map) and drop it in just above the original, selected. */
	function duplicateLayer(id: number): void {
		const idx = layers.findIndex((l) => l.id === id);
		if (idx < 0) return;
		const copy: MarkLayer = { ...(layers[idx] as MarkLayer), id: nextId++, locks: { ...(layers[idx] as MarkLayer).locks } };
		const next = [...layers];
		next.splice(idx + 1, 0, copy);
		layers = next;
		selectedId = copy.id;
	}
	function move(id: number, dir: -1 | 1): void {
		const idx = layers.findIndex((l) => l.id === id);
		const to = idx + dir;
		if (to < 0 || to >= layers.length) return;
		const next = [...layers];
		[next[idx], next[to]] = [next[to], next[idx]];
		layers = next;
	}

	/** A compact readout of a layer's non-default settings for the layer chip, e.g. `c1 · s80 · r45 · ko`. */
	function layerSummary(l: MarkLayer): string {
		const parts: string[] = [];
		if (l.keyword === "letter") parts.push(`"${l.glyph}"${l.font ? ` f${l.font}` : ""}`);
		if (l.keyword === "poly" || l.keyword === "polyline") {
			const pairs = ((l.pts || "").match(/[\d.]+/g)?.length ?? 0) >> 1;
			parts.push(pairs > 0 ? `${pairs} pts` : l.pts || "no pts");
		}
		if (l.c !== null) parts.push(`c${l.c.toString(16)}`);
		if (l.p !== 5) parts.push(`p${l.p}`);
		if (l.s !== 100) parts.push(`s${l.s}`);
		if (l.stretch) parts.push(`sx${l.sx}`, `sy${l.sy}`);
		if (l.r) parts.push(`r${l.r}°`);
		if (l.x) parts.push(`x${l.x}`);
		if (l.y) parts.push(`y${l.y}`);
		if (l.a !== 100) parts.push(`a${l.a}`);
		if (l.outline > 0) parts.push(`o${l.outline}`);
		if (l.fh) parts.push("↔");
		if (l.fv) parts.push("↕");
		if (l.ko) parts.push("ko");
		if (l.invert) parts.push("inv");
		return parts.join(" · ");
	}

	const RANDOM_FIELDS = ["circle", "square", "shield", "hex", "diamond", "octagon", "squircle", "blob", "arch", "gem", "banner", "cylinder"];
	const RANDOM_CHARGES = ["star", "star4", "star6", "star8", "heart", "crescent", "bolt", "cross", "dot", "check", "leaf", "flame", "swish", "wave", "lens", "burst", "seal", "chevron", "arrow", "disc"];
	function pick<T>(arr: T[]): T {
		return arr[Math.floor(Math.random() * arr.length)];
	}
	function rint(min: number, max: number, step = 1): number {
		const n = Math.floor((max - min) / step) + 1;
		return min + Math.floor(Math.random() * n) * step;
	}
	function chance(p: number): boolean {
		return Math.random() < p;
	}

	function clearLayers(): void {
		layers = [];
		selectedId = null;
		dropShadow = null;
		paletteOverrides = null;
		fontOverrides = null;
		pinScheme = false;
		transform = { ...DEFAULT_TRANSFORM };
		transformOpen = false;
		markOutline = null;
		expand = null;
		extraFinish = [];
	}

	function resetLayers(): void {
		layers = layers.map((l) => {
			const n: MarkLayer = { ...l, locks: { ...l.locks } };
			const free = (k: string): boolean => !l.locks[k];
			if (free("p")) n.p = 5;
			if (free("s")) {
				n.s = 100;
				n.sx = 100;
				n.sy = 100;
				n.stretch = false;
			}
			if (free("r")) n.r = 0;
			if (free("x")) n.x = 0;
			if (free("y")) n.y = 0;
			if (free("a")) n.a = 100;
			if (free("c")) n.c = null;
			if (free("outline")) {
				n.outline = 0;
				n.outlineColor = null;
			}
			if (free("fh")) n.fh = false;
			if (free("fv")) n.fv = false;
			if (free("ko")) n.ko = false;
			if (free("invert")) n.invert = false;
			return n;
		});
	}

	function randomize(): void {
		layers = layers.map((l, i) => {
			const n: MarkLayer = { ...l, locks: { ...l.locks } };
			const free = (k: string): boolean => !l.locks[k];
			if (i === 0) {
				if (free("keyword")) n.keyword = pick(RANDOM_FIELDS);
				if (free("c")) n.c = 1 + Math.floor(Math.random() * 3);
				if (free("s")) {
					n.s = rint(90, 100, 2);
					n.stretch = false;
				}
				if (free("r")) n.r = chance(0.2) ? pick([-90, -45, 45, 90]) : 0;
				if (free("p")) n.p = chance(0.15) ? rint(1, 9) : 5;
				if (free("x")) n.x = chance(0.1) ? rint(-8, 8, 2) : 0;
				if (free("y")) n.y = chance(0.1) ? rint(-8, 8, 2) : 0;
				if (free("a")) n.a = chance(0.08) ? 85 : 100;
				if (free("outline")) {
					n.outline = chance(0.1) ? 1 : 0;
					if (n.outline > 0 && n.outlineColor === null) n.outlineColor = 15;
				}
				if (free("fh")) n.fh = chance(0.1);
				if (free("fv")) n.fv = chance(0.1);
			} else {
				if (free("keyword")) n.keyword = pick(RANDOM_CHARGES);
				if (free("p")) n.p = rint(1, 9);
				if (free("s")) {
					n.s = rint(24, 70, 2);
					n.stretch = chance(0.12);
					n.sx = n.stretch ? rint(30, 110, 5) : 100;
					n.sy = n.stretch ? rint(30, 110, 5) : 100;
				}
				if (free("r")) n.r = chance(0.3) ? pick([-135, -90, -45, 45, 90, 135, 180]) : 0;
				if (free("c")) n.c = pick([15, 11, 2, 3, 4, 5]);
				if (free("x")) n.x = chance(0.2) ? rint(-16, 16, 2) : 0;
				if (free("y")) n.y = chance(0.2) ? rint(-16, 16, 2) : 0;
				if (free("a")) n.a = chance(0.15) ? pick([60, 75, 85]) : 100;
				if (free("outline")) {
					n.outline = chance(0.15) ? pick([1, 2]) : 0;
					if (n.outline > 0 && n.outlineColor === null) n.outlineColor = 15;
				}
				if (free("fh")) n.fh = chance(0.2);
				if (free("fv")) n.fv = chance(0.2);
				if (free("ko")) n.ko = chance(0.12);
				if (free("invert")) n.invert = chance(0.08);
			}
			return n;
		});
	}

	async function copyName(): Promise<void> {
		try {
			await navigator.clipboard.writeText(iconName);
			copyState = "done";
		} catch {
			copyState = "fail";
		}
		setTimeout(() => (copyState = "idle"), 1400);
	}

	function setMarkOutline(size: number): void {
		markOutline = size === 0 ? null : { size, color: markOutline?.color ?? null };
	}
	function toggleShadow(on: boolean): void {
		dropShadow = on ? { ...DEFAULT_SHADOW } : null;
	}
	/** Open or close the whole-mark size/move dials. Closing resets them to rest so the name loses the
	 * flags rather than keeping an invisible transform the panel no longer shows; `center` is untouched. */
	function toggleTransform(on: boolean): void {
		transformOpen = on;
		if (!on) transform = { ...DEFAULT_TRANSFORM, center: transform.center };
	}
	function togglePalette(on: boolean): void {
		paletteOverrides = on ? {} : null;
	}
	function setOverride(key: string, hex: string): void {
		paletteOverrides = { ...(paletteOverrides ?? {}), [key]: hex };
	}
	function clearOverride(key: string): void {
		if (!paletteOverrides) return;
		const next = { ...paletteOverrides };
		delete next[key];
		paletteOverrides = next;
	}

	function toggleFonts(on: boolean): void {
		fontOverrides = on ? {} : null;
	}
	function setFont(slot: number, family: string): void {
		const next = { ...(fontOverrides ?? {}) };
		if (family.trim()) next[slot] = family;
		else delete next[slot];
		fontOverrides = next;
	}
	const fontImports = $derived.by(() => {
		const parsed = resolveIconMark(iconName);
		return parsed ? iconFontImports(parsed.composition) : [];
	});
	let fontCopyState = $state<CopyState>("idle");
	async function copyFontImports(): Promise<void> {
		try {
			const links = fontImports.map((f) => f.googleLink).filter((l): l is string => l !== null);
			await navigator.clipboard.writeText(links.join("\n"));
			fontCopyState = "done";
		} catch {
			fontCopyState = "fail";
		}
		setTimeout(() => (fontCopyState = "idle"), 1400);
	}

	function typedFamily(slot: number): string {
		return (fontOverrides?.[slot] ?? "").replace(/\+/g, " ").trim();
	}
	function familySuggestions(slot: number): string[] {
		const typed = typedFamily(slot);
		return typed.length >= 2 ? suggestGoogleFonts(typed, 8) : [];
	}
	// INFO: fontImports gives the resolved (capitalized) family, fontOverrides the raw typed one, so match case-insensitively
	function slotForFamily(family: string): number {
		const needle = family.toLowerCase();
		return FONT_SLOTS.find((fs) => typedFamily(fs.slot).toLowerCase() === needle)?.slot ?? 0;
	}

	// INFO: the engine's loaded-font record is a plain Set, not reactive, so loadedTick forces pendingFonts to re-derive after a load
	let loadedTick = $state(0);
	let loadingFont = $state<string | null>(null);
	let fontError = $state<string | null>(null);

	const pendingFonts = $derived.by(() => {
		loadedTick;
		return fontImports.filter((f) => f.google && !isFontLoaded(f.family));
	});

	async function loadFonts(): Promise<void> {
		const families = pendingFonts.map((f) => f.family);
		if (!families.length) return;
		fontError = null;
		for (const family of families) {
			loadingFont = family;
			try {
				await loadGoogleFont(family);
			} catch {
				fontError = `Couldn't load ${family} from Google Fonts.`;
			}
			loadedTick += 1;
		}
		loadingFont = null;
	}

	async function copyClean(): Promise<void> {
		try {
			await navigator.clipboard.writeText(stripLocks(iconName));
			cleanState = "done";
		} catch {
			cleanState = "fail";
		}
		setTimeout(() => (cleanState = "idle"), 1400);
	}

	function buildExportSvg(sizePx: number): string | null {
		const parsed = resolveIconMark(iconName);
		if (!parsed) return null;
		const cs = getComputedStyle(document.documentElement);
		const register: Record<string, string> = {};
		for (const token of PALETTE_TOKENS) {
			const value = cs.getPropertyValue(token).trim();
			if (value) register[token] = value;
		}
		const bakeToken = (color?: string): void => {
			if (color?.startsWith("--")) {
				const value = cs.getPropertyValue(color).trim();
				if (value) register[color] = value;
			}
		};
		for (const layer of parsed.composition.layers) {
			bakeToken(layer.fill);
			bakeToken(layer.outline?.color);
		}
		bakeToken(parsed.composition.dropShadow?.color);
		const ink = cs.getPropertyValue("--fg-0").trim() || "#ffffff";
		// INFO: color as a presentation attribute, not a style; a second style attribute beside composeIcon's overflow:visible makes invalid XML that silently fails the PNG rasterizer
		return composeIcon(parsed.composition, { register, scheme })
			.replace('width="1em" height="1em"', `width="${sizePx}" height="${sizePx}"`)
			.replace(/^<svg /, `<svg color="${ink}" `);
	}

	function downloadBlob(filename: string, blob: Blob): void {
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 0);
	}

	// INFO: an SVG loaded as an image (the PNG rasterizer's view) refuses external resources, so Google fonts must be inlined as data-URI @font-face, not @import
	async function withFonts(svg: string): Promise<string> {
		const requests = fontImports.filter((f) => f.google).map((f) => ({ family: f.family, text: f.glyphs }));
		if (!requests.length) return svg;
		try {
			return await embedFontsInSvg(svg, requests);
		} catch {
			return svg;
		}
	}

	let exporting = $state(false);

	async function saveSvg(): Promise<void> {
		const base = buildExportSvg(256);
		if (!base) return;
		exporting = true;
		try {
			const svg = await withFonts(base);
			downloadBlob(`${slug(label) || "icon"}.svg`, new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
		} finally {
			exporting = false;
		}
	}

	// INFO: the blob URL is same-origin so the canvas isn't tainted and toBlob succeeds; an untouched transparent canvas keeps the mark's alpha
	async function savePng(): Promise<void> {
		const base = buildExportSvg(512);
		if (!base) return;
		exporting = true;
		const svg = await withFonts(base);
		const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
		try {
			const img = new Image();
			await new Promise<void>((resolve, reject) => {
				img.onload = () => resolve();
				img.onerror = () => reject(new Error("raster load failed"));
				img.src = url;
			});
			const canvas = document.createElement("canvas");
			canvas.width = 512;
			canvas.height = 512;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			ctx.drawImage(img, 0, 0, 512, 512);
			const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
			if (png) downloadBlob(`${slug(label) || "icon"}.png`, png);
		} finally {
			URL.revokeObjectURL(url);
			exporting = false;
		}
	}
</script>

{#snippet lockGlyph(mode: "on" | "off" | "some")}
	<svg class="ib__lock-svg" viewBox="0 0 24 24" aria-hidden="true">
		<path class="ib__lock-shackle" d="M8 10V7a4 4 0 0 1 8 0v3" />
		<rect class="ib__lock-body" x="5" y="10" width="14" height="10" rx="2" />
		{#if mode === "some"}<line class="ib__lock-dash" x1="9" y1="15" x2="15" y2="15" />{/if}
	</svg>
{/snippet}

{#snippet propLock(l: MarkLayer, key: string)}
	<button
		type="button"
		class="ib__lock"
		class:ib__lock--on={isLocked(l, key)}
		aria-pressed={isLocked(l, key)}
		title={isLocked(l, key) ? "Locked, kept when you randomize" : "Lock, keep this when you randomize"}
		onclick={() => toggleLock(l, key)}
	>
		{@render lockGlyph(isLocked(l, key) ? "on" : "off")}
	</button>
{/snippet}

{#snippet colorField(fieldName: string, current: string, onpick: (v: string) => void)}
	<div class="ib__field">
		<span class="ib__field-label">{fieldName} <span class="ib__field-pick">· {slotLabel(current)}</span></span>
		<div class="ib__swatches" role="radiogroup" aria-label={`${fieldName} color`}>
			{#each COLOR_SLOTS as slot (slot.value)}
				<Swatch
					color={slotColors[slot.value] ?? "transparent"}
					title={slot.label}
					size="lg"
					interactive
					selected={current === slot.value}
					onselect={() => onpick(slot.value)}
				/>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet primitivePicker(query: string, setQuery: (v: string) => void, onpick: (kw: string) => void, verb: string)}
	<input
		class="ib__search"
		type="search"
		value={query}
		oninput={(e) => setQuery((e.currentTarget as HTMLInputElement).value)}
		placeholder="Search primitives…"
		aria-label="Search primitives by name or tag"
		spellcheck="false"
	/>
	<div class="ib__addpop-scroll">
		{#each PRIMITIVE_GROUPS as grp (grp.group)}
			{@const shown = grp.keywords.filter((kw) => primitiveMatches(kw, query))}
			{#if shown.length > 0}
				<div class="ib__palette-group">
					<span class="ib__palette-label">{grp.group}</span>
					<div class="ib__palette-row">
						{#each shown as kw (kw)}
							<button
								type="button"
								class="ib__addtile"
								class:ib__addtile--new={isNewComponent(primitiveSince(kw))}
								title={`${verb} ${kw}${isNewComponent(primitiveSince(kw)) ? " (new)" : ""}`}
								onclick={() => onpick(kw)}
							>
								<Icon name={`--${kw}`} />
							</button>
						{/each}
					</div>
				</div>
			{/if}
		{/each}
		{#if PRIMITIVE_GROUPS.every((grp) => grp.keywords.filter((kw) => primitiveMatches(kw, query)).length === 0)}
			<p class="ib__empty">No primitives match “{query}”.</p>
		{/if}
	</div>
{/snippet}

<div class="ib-shell-wrap">
<AppShell mainId="ib-main" rightSize={370} rightResizable rightMin={288} rightMax={560} class="ib-shell">
	{#snippet toolbar()}
		<Toolbar>
			{#snippet start()}
				<div class="ib-start">
					<span class="ib-brand">
						<span class="ib-brand__tag">Icon Builder</span>
						<span class="ib-name" bind:this={nameBoxEl}>
							<input
								class="ib-name__input"
								type="text"
								value={iconName}
								title={iconName}
								onchange={(e) => applyName((e.currentTarget as HTMLInputElement).value)}
								spellcheck="false"
								autocomplete="off"
								aria-label="Icon name (editable: paste or edit to rebuild the mark)"
								placeholder="name--…"
							/>
							<button
								type="button"
								class="ib-name__expand"
								onclick={() => (nameOpen = !nameOpen)}
								aria-haspopup="true"
								aria-expanded={nameOpen}
								aria-label="Expand icon name for full view"
								title="Expand"
							>⤢</button>
							{#if nameOpen}
								<div class="ib-name__flyout">
									<textarea
										class="ib-name__area"
										value={iconName}
										onchange={(e) => applyName((e.currentTarget as HTMLTextAreaElement).value)}
										onkeydown={commitName}
										spellcheck="false"
										autocomplete="off"
										rows="4"
										aria-label="Icon name (full, editable). Enter applies and closes, Escape discards"
									></textarea>
									<p class="ib-name__hint">Enter applies · Esc discards</p>
								</div>
							{/if}
						</span>
					</span>
					<div class="ib-name-actions">
						<Button size="sm" variant="subtle" iconOnly onclick={copyName} disabled={!iconName} title="Copy name" aria-label="Copy name">
							<Icon name={copyGlyph(copyState)} />
						</Button>
						{#if hasLocks}
							<Button size="sm" variant="subtle" iconOnly onclick={copyClean} disabled={!iconName} title="Copy clean name (no ---lock flags, for production use)" aria-label="Copy clean name">
								<Icon name={copyGlyph(cleanState)} />
							</Button>
						{/if}
						<Button size="sm" variant="subtle" onclick={saveToLibrary} disabled={!iconName} title="Save this icon to your library"><Icon name={savedFlash === "done" ? "check" : "bookmark"} size="sm" /> Save</Button>
						<Button size="sm" variant="subtle" onclick={saveSvg} disabled={!iconName || exporting} title="Download the mark as a scalable SVG, with any Google font embedded"><Icon name="download" size="sm" /> SVG</Button>
						<Button size="sm" variant="subtle" onclick={savePng} disabled={!iconName || exporting} title="Download the mark as a 512px transparent PNG, with any Google font embedded"><Icon name="download" size="sm" /> PNG</Button>
					</div>
				</div>
			{/snippet}
			{#snippet end()}
				<div class="ib-meta">
					<Segmented value={scheme} onchange={(e) => (scheme = (e.target as HTMLInputElement).value as Palette)} aria-label="Palette">
						{#each SCHEMES as s (s.value)}
							<Segment value={s.value} label={s.label}>{#key themeTick}<Icon name={GRID} colors={s.value} />{/key}</Segment>
						{/each}
					</Segmented>
				</div>
			{/snippet}
		</Toolbar>
	{/snippet}

	{#snippet right()}
		<Dock side="right" label="Inspector" class="ib__dock">
			<div class="ib__dock-body">
			<section class="ib__inspector" aria-label="Layer inspector">
				{#if selected}
					{@const l = selected}
					<div class="ib__prop">
						{@render propLock(l, "keyword")}
						<div class="ib__replace" bind:this={replaceBoxEl}>
							<button
								type="button"
								class="ib__replace-btn"
								aria-haspopup="true"
								aria-expanded={replaceOpen}
								title="Replace this layer's shape (keeps its settings)"
								onclick={toggleReplace}
							>
								<Icon name={`--${l.keyword}`} size="sm" />
								<span class="ib__replace-name">{l.keyword}</span>
								<span class="ib__replace-caret" aria-hidden="true">▾</span>
							</button>
							{#if replaceOpen}
								<div class="ib__addpop ib__addpop--replace" role="menu" aria-label="Replace shape">
									{@render primitivePicker(replaceQuery, (v) => (replaceQuery = v), replacePrimitive, "Use")}
								</div>
							{/if}
						</div>
					</div>

					{#if l.keyword === "poly" || l.keyword === "polyline"}
						<div class="ib__prop ib__prop--stack">
							<div class="ib__prop-body">
								<div class="ib__field ib__field--wide">
									<span class="ib__field-label">Points</span>
									<input
										class="ib__pts"
										type="text"
										value={l.pts}
										oninput={(e) => (l.pts = (e.currentTarget as HTMLInputElement).value)}
										aria-label="Polygon points, x,y pairs in a 0-100 space or a registered name"
										placeholder="0,0 100,50 0,100"
										spellcheck="false"
										autocomplete="off"
									/>
								</div>
								<p class="ib__hint">
									<code>x,y</code> pairs in a 0–100 space, or a registered name. Three pairs minimum;
									anything shorter draws the placeholder.
								</p>
								<div class="ib__field ib__field--wide">
									<span class="ib__field-label">Presets</span>
									<Cluster gap={1}>
										{#each POINT_PRESETS as preset (preset.label)}
											<Button size="sm" variant="subtle" onclick={() => (l.pts = preset.pts)}>{preset.label}</Button>
										{/each}
									</Cluster>
								</div>
							</div>
						</div>
					{/if}

					{#if l.keyword === "letter"}
						<div class="ib__prop ib__prop--stack">
							<div class="ib__prop-body">
								<div class="ib__field">
									<span class="ib__field-label">Glyph</span>
									<input
										class="ib__glyph"
										type="text"
										value={l.glyph}
										oninput={(e) => { const v = (e.currentTarget as HTMLInputElement).value; if (v) l.glyph = v.slice(-1); }}
										aria-label="Letter glyph"
										spellcheck="false"
										autocomplete="off"
									/>
								</div>
								<div class="ib__field">
									<span class="ib__field-label">Font</span>
									<Segmented
										value={String(l.font)}
										options={[
											{ value: "0", label: "Sans" },
											{ value: "1", label: "Display" },
											{ value: "2", label: "Mono" },
										]}
										onchange={(e) => (l.font = Number((e.target as HTMLInputElement).value))}
										aria-label="Letter font slot"
									/>
								</div>
							</div>
						</div>
					{/if}

					<div class="ib__prop ib__prop--stack">
						{@render propLock(l, "p")}
						<div class="ib__prop-body">
							<span class="ib__field-label">Position</span>
							<div class="ib__keypad" role="group" aria-label="Grid position">
								{#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as cell (cell)}
									<button type="button" class="ib__pad" class:ib__pad--on={l.p === cell} aria-pressed={l.p === cell} onclick={() => (l.p = cell)} aria-label={`Cell ${cell}`}></button>
								{/each}
							</div>
						</div>
					</div>

					<div class="ib__prop">
						{@render propLock(l, "s")}
						<Slider label="Size" bind:value={l.s} min={10} max={200} step={5} altStep={1} overflow showValue format={(v) => `${v}%`} />
					</div>
					<div class="ib__prop">
						{@render propLock(l, "s")}
						<Switch bind:checked={l.stretch} label="Stretch per axis" labelSide="end" />
					</div>
					{#if l.stretch}
						<div class="ib__prop">
							{@render propLock(l, "s")}
							<Slider label="Stretch X" bind:value={l.sx} min={10} max={250} step={5} altStep={1} overflow showValue format={(v) => `${v}%`} />
						</div>
						<div class="ib__prop">
							{@render propLock(l, "s")}
							<Slider label="Stretch Y" bind:value={l.sy} min={10} max={250} step={5} altStep={1} overflow showValue format={(v) => `${v}%`} />
						</div>
					{/if}
					<div class="ib__prop">
						{@render propLock(l, "r")}
						<Slider label="Rotate" bind:value={l.r} min={-180} max={180} step={15} altStep={1} overflow showValue format={(v) => `${v}°`} />
					</div>
					<div class="ib__prop">
						{@render propLock(l, "x")}
						<Slider label="Nudge X" bind:value={l.x} min={-40} max={40} step={2} altStep={1} overflow showValue format={(v) => `${v}%`} />
					</div>
					<div class="ib__prop">
						{@render propLock(l, "y")}
						<Slider label="Nudge Y" bind:value={l.y} min={-40} max={40} step={2} altStep={1} overflow showValue format={(v) => `${v}%`} />
					</div>
					<div class="ib__prop">
						{@render propLock(l, "a")}
						<Slider label="Opacity" bind:value={l.a} min={0} max={100} step={5} altStep={1} showValue format={(v) => `${v}%`} />
					</div>

					<div class="ib__prop ib__prop--stack">
						{@render propLock(l, "c")}
						<div class="ib__prop-body">
							{@render colorField("Fill", colorValue(l.c), (v) => setColor(l, v))}
						</div>
					</div>

					<div class="ib__prop ib__prop--stack">
						{@render propLock(l, "outline")}
						<div class="ib__prop-body">
							<span class="ib__field-label">Outline</span>
							<Segmented
								value={String(l.outline)}
								options={[
									{ value: "0", label: "None" },
									{ value: "1", label: "Thin" },
									{ value: "2", label: "Med" },
									{ value: "3", label: "Thick" },
								]}
								onchange={(e) => (l.outline = Number((e.target as HTMLInputElement).value))}
								aria-label="Outline weight"
							/>
							{#if l.outline > 0}
								{@render colorField("Outline fill", colorValue(l.outlineColor), (v) => setOutlineColor(l, v))}
							{/if}
						</div>
					</div>

					<div class="ib__prop">{@render propLock(l, "fh")}<Switch bind:checked={l.fh} label="Flip H" labelSide="end" /></div>
					<div class="ib__prop">{@render propLock(l, "fv")}<Switch bind:checked={l.fv} label="Flip V" labelSide="end" /></div>
					<div class="ib__prop">{@render propLock(l, "ko")}<Switch bind:checked={l.ko} label="Knockout" labelSide="end" /></div>
					<div class="ib__prop">{@render propLock(l, "invert")}<Switch bind:checked={l.invert} label="Invert" labelSide="end" /></div>
				{:else}
					<p class="ib__empty">Select a layer to edit its placement, color, and transform.</p>
				{/if}
			</section>
			</div>
		</Dock>
	{/snippet}

	<div class="ib__content">
		<section class="ib__stage" aria-label="Composed mark" style={`background-color: var(${previewBg})`}>
			<div class="ib__canvas" data-grid>
				{#if iconName}
					{#key themeTick}<Icon name={iconName} colors={scheme} size="xl" label={slug(label) || undefined} />{/key}
				{:else}
					<p class="ib__empty">Add a primitive to start building.</p>
				{/if}
			</div>
			<div class="ib__preview-foot">
				<div class="ib__sizes">
					{#if iconName}
						{#each ["sm", "md", "lg", "xl"] as sz (sz)}
							<div class="ib__size">
								{#key themeTick}<Icon name={iconName} colors={scheme} size={sz} label={slug(label) || undefined} />{/key}
								<span class="ib__size-tag">{sz}</span>
							</div>
						{/each}
					{/if}
				</div>
				<div class="ib__bg-picker" role="radiogroup" aria-label="Preview background">
					{#each BG_OPTIONS as opt (opt.token)}
						<Swatch
							color={`var(${opt.token})`}
							title={opt.label}
							size="lg"
							interactive
							selected={previewBg === opt.token}
							onselect={() => (previewBg = opt.token)}
						/>
					{/each}
				</div>
			</div>
		</section>

		<section class="ib__layers" aria-label="Layers">
			<div class="ib__section-head">
				<h4>Layers</h4>
				<div class="ib__layer-actions">
					<Button size="sm" variant="subtle" onclick={randomize} disabled={!iconName}>Randomize</Button>
					<Button size="sm" variant="subtle" tone="warn" onclick={resetLayers} disabled={!iconName}>Reset</Button>
					<Button size="sm" variant="subtle" tone="danger" onclick={clearLayers} disabled={!iconName}>Clear</Button>
				</div>
			</div>
			<ol class="ib__stack">
				{#each layers as l, i (l.id)}
					{@const lockState = layerLockState(l)}
					{@const chipColor = l.c !== null ? `-c${l.c.toString(16)}` : ""}
					{@const chipName = l.keyword === "letter" ? `--letter-${l.glyph || "A"}${chipColor}` : `--${l.keyword}${chipColor}`}
					<li>
						<div class="ib__chip" class:ib__chip--on={l.id === selectedId}>
							<button type="button" class="ib__chip-main" onclick={() => (selectedId = l.id)}>
								{#key themeTick}<Icon name={chipName} colors={scheme} size="sm" />{/key}
								<span class="ib__chip-name">{l.keyword}</span>
								{#if layerSummary(l)}
									<span class="ib__chip-meta">{layerSummary(l)}</span>
								{/if}
							</button>
							<span class="ib__chip-ops">
								<button
									type="button"
									class="ib__layerlock ib__layerlock--{lockState}"
									aria-pressed={lockState === "all"}
									title={lockState === "all"
										? "Layer locked, click to unlock"
										: lockState === "some"
											? "Partially locked, click to lock all"
											: "Lock layer against randomize"}
									onclick={() => toggleLayerLock(l)}
								>
									{@render lockGlyph(lockState === "all" ? "on" : lockState === "some" ? "some" : "off")}
								</button>
								<button type="button" title="Duplicate layer" aria-label="Duplicate layer" onclick={() => duplicateLayer(l.id)}><Icon name="copy" size="sm" /></button>
								<button type="button" title="Move up" aria-label="Move up" disabled={i === 0} onclick={() => move(l.id, -1)}>↑</button>
								<button type="button" title="Move down" aria-label="Move down" disabled={i === layers.length - 1} onclick={() => move(l.id, 1)}>↓</button>
								<button type="button" title="Remove" aria-label="Remove" onclick={() => removeLayer(l.id)}>✕</button>
							</span>
						</div>
					</li>
				{/each}
			</ol>

			<div class="ib__addbox" bind:this={addBoxEl}>
					<button type="button" class="ib__addbtn" aria-haspopup="true" aria-expanded={addOpen} onclick={toggleAdd}>
						<span class="ib__addbtn-plus" aria-hidden="true">+</span>
						<span>Add layer</span>
					</button>
					{#if addOpen}
						<div class="ib__addpop" role="menu" aria-label="Add a primitive">
							{@render primitivePicker(addQuery, (v) => (addQuery = v), addLayer, "Add")}
						</div>
					{/if}
			</div>
		</section>

		<section class="ib__finish" aria-label="Whole-icon finish">
			<h4>Finish</h4>
			<Switch checked={pinScheme} onchange={(e) => (pinScheme = (e.target as HTMLInputElement).checked)} label="Pin palette in name" labelSide="end" />
			{#if pinScheme}
				<p class="ib__hint">The name carries <code>---ps-{scheme}</code>, so the mark keeps this palette wherever it lands instead of taking the host's <code>colors</code>. Switch the palette above and the pin follows it.</p>
			{:else}
				<p class="ib__hint">The palette above is the host's <code>colors</code>: the mark takes whatever scheme it's rendered under. Pin it to bake the choice into the name.</p>
			{/if}

			<Switch checked={transform.center} onchange={(e) => (transform.center = (e.target as HTMLInputElement).checked)} label="Re-center on the art" labelSide="end" />
			<p class="ib__hint">
				<code>---center</code> measures what the mark actually covers and seats that box on the canvas
				center, so a composition built off to one side needs no hand-tuning of every layer's nudge.
			</p>

			<Switch checked={transformOpen} onchange={(e) => toggleTransform((e.target as HTMLInputElement).checked)} label="Size and move the whole mark" labelSide="end" />
			{#if transformOpen}
				<p class="ib__hint">The finish-side twins of a layer's own size and nudge: these move the finished composite, outline and shadow with it.</p>
				<Slider label="Mark size" bind:value={transform.s} min={10} max={200} step={5} altStep={1} overflow showValue format={(v) => `${v}%`} />
				<Switch bind:checked={transform.stretch} label="Stretch per axis" labelSide="end" />
				{#if transform.stretch}
					<Slider label="Stretch X" bind:value={transform.sx} min={10} max={250} step={5} altStep={1} overflow showValue format={(v) => `${v}%`} />
					<Slider label="Stretch Y" bind:value={transform.sy} min={10} max={250} step={5} altStep={1} overflow showValue format={(v) => `${v}%`} />
				{/if}
				<Slider label="Mark move X" bind:value={transform.mx} min={-50} max={50} step={2} altStep={1} overflow showValue format={(v) => `${v}%`} />
				<Slider label="Mark move Y" bind:value={transform.my} min={-50} max={50} step={2} altStep={1} overflow showValue format={(v) => `${v}%`} />
			{/if}

			<div class="ib__field">
				<span class="ib__field-label">Mark outline</span>
				<Segmented
					value={String(markOutline?.size ?? 0)}
					options={[
						{ value: "0", label: "None" },
						{ value: "1", label: "Thin" },
						{ value: "2", label: "Med" },
						{ value: "3", label: "Thick" },
					]}
					onchange={(e) => setMarkOutline(Number((e.target as HTMLInputElement).value))}
					aria-label="Whole-mark outline weight"
				/>
			</div>
			{#if markOutline}
				<p class="ib__hint">One stroke ringing the silhouette of <em>everything</em> the mark paints, knockouts included — the layer outline strokes one shape, this rings the composite.</p>
				{@render colorField("Mark outline fill", colorValue(markOutline.color), (v) => (markOutline = { ...markOutline!, color: v === "a" ? null : parseInt(v, 16) }))}
			{/if}

			<Switch checked={expand !== null} onchange={(e) => (expand = (e.target as HTMLInputElement).checked ? 12 : null)} label="Expand canvas" labelSide="end" />
			{#if expand !== null}
				<p class="ib__hint">Pads the viewBox while the rendered box stays the same, so the art maps smaller inside its own footprint and gains a margin. Its reason to exist: Firefox clips a filter at the viewport edge, so a shadow cast from edge-hugging art streaks without it.</p>
				<Slider label="Canvas margin" bind:value={expand} min={0} max={100} step={2} altStep={1} showValue format={(v) => `${v}%`} />
			{/if}

			<Switch checked={!!dropShadow} onchange={(e) => toggleShadow((e.target as HTMLInputElement).checked)} label="Drop shadow" labelSide="end" />
			{#if dropShadow}
				<div class="ib__field">
					<span class="ib__field-label">Shadow color <span class="ib__field-pick">· {slotLabel(slotKey(dropShadow.color))}</span></span>
					<div class="ib__swatches" role="radiogroup" aria-label="Shadow color">
						{#each COLOR_SLOTS.filter((s) => s.value !== "inherit" && s.value !== "0") as slot (slot.value)}
							<Swatch
								color={slotColors[slot.value] ?? "transparent"}
								title={slot.label}
								size="lg"
								interactive
								selected={slotKey(dropShadow.color) === slot.value}
								onselect={() => (dropShadow!.color = parseInt(slot.value, 16))}
							/>
						{/each}
					</div>
				</div>
				<div class="ib__field">
					<span class="ib__field-label">Cast toward</span>
					<div class="ib__keypad" role="group" aria-label="Shadow direction">
						{#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as cell (cell)}
							<button type="button" class="ib__pad" class:ib__pad--on={dropShadow.pos === cell} aria-pressed={dropShadow.pos === cell} onclick={() => (dropShadow!.pos = cell)} aria-label={`Direction ${cell}`}></button>
						{/each}
					</div>
				</div>
				<Slider label="Distance" bind:value={dropShadow.size} min={1} max={5} step={1} showValue />
				<Slider label="Softness" bind:value={dropShadow.soft} min={0} max={100} step={5} showValue format={(v) => `${v}%`} />
			{/if}

			<Switch checked={!!fontOverrides} onchange={(e) => toggleFonts((e.target as HTMLInputElement).checked)} label="Custom fonts" labelSide="end" />
			{#if fontOverrides}
				<p class="ib__hint">Bind a <code>letter</code> font slot to a theme font (<code>sans</code>, <code>display</code>, <code>mono</code>) or a web font (<code>sigmar</code>, <code>noto+sans+symbols</code>). A web font renders only where it's loaded.</p>
				{#each FONT_SLOTS as fs (fs.slot)}
					<div class="ib__field">
						<span class="ib__field-label">{fs.label} <span class="ib__field-pick">· slot {fs.slot}</span></span>
						<input
							class="ib__search"
							type="text"
							value={fontOverrides[fs.slot] ?? ""}
							oninput={(e) => setFont(fs.slot, (e.currentTarget as HTMLInputElement).value)}
							placeholder={fs.placeholder}
							spellcheck="false"
							autocomplete="off"
							list={`ib-fonts-${fs.slot}`}
							aria-label={`${fs.label} font override`}
						/>
						<datalist id={`ib-fonts-${fs.slot}`}>
							{#each familySuggestions(fs.slot) as family (family)}
								<option value={family}></option>
							{/each}
						</datalist>
					</div>
				{/each}

				{#each fontImports.filter((f) => !f.google) as miss (miss.family)}
					<p class="ib__hint ib__hint--warn">
						Google Fonts has no <code>{miss.family}</code>.
						{#if miss.suggestions.length}
							Did you mean {#each miss.suggestions.slice(0, 3) as s, i (s)}{#if i > 0}, {/if}<button type="button" class="ib__suggest" onclick={() => setFont(slotForFamily(miss.family), s)}>{s}</button>{/each}?
						{:else}
							It will render in whatever font the viewer's machine substitutes.
						{/if}
					</p>
				{/each}

				{#if fontImports.some((f) => f.google)}
					<div class="ib__field">
						<div class="ib__fonts-load-head">
							<span class="ib__field-label">Load these fonts</span>
							<Button size="sm" variant="subtle" iconOnly onclick={copyFontImports} title="Copy the loading tags" aria-label="Copy font loading code"><Icon name={copyGlyph(fontCopyState)} /></Button>
						</div>
						{#each fontImports.filter((f) => f.google) as f (f.family)}
							<code class="ib__fonts-load">{f.googleLink}</code>
						{/each}
						<div class="ib__fonts-fetch">
							<Button size="sm" variant="subtle" onclick={loadFonts} disabled={!!loadingFont || !pendingFonts.length}>
								<Icon name="download" size="sm" />
								{#if loadingFont}Loading {loadingFont}…{:else if !pendingFonts.length}Loaded{:else}Load from Google Fonts{/if}
							</Button>
							<p class="ib__notice">
								Fetches the font from Google. Your browser asks <code>fonts.googleapis.com</code> for it directly, which
								tells Google your IP address. Nothing is fetched until you click; exports embed the font so they render
								the same everywhere.
							</p>
						</div>
						{#if fontError}<p class="ib__hint ib__hint--warn">{fontError}</p>{/if}
					</div>
				{/if}
			{/if}

			<Switch checked={!!paletteOverrides} onchange={(e) => togglePalette((e.target as HTMLInputElement).checked)} label="Palette overrides" labelSide="end" />
			{#if paletteOverrides}
				<div class="ib__field">
					<span class="ib__field-label">Flatten to <span class="ib__field-pick">· {paletteOverrides["*"] ?? "off"}</span></span>
					<div class="ib__pc-flatten">
						<ColorPicker trigger format="hex" value={paletteOverrides["*"] ?? "#424242"} title="Silhouette color" aria-label="Silhouette color" oninput={(e) => setOverride("*", (e.target as HTMLInputElement).value)} onchange={(e) => setOverride("*", (e.target as HTMLInputElement).value)} />
						{#if paletteOverrides["*"]}
							<Button size="sm" variant="subtle" onclick={() => clearOverride("*")}>Clear</Button>
						{/if}
					</div>
				</div>
				<div class="ib__field">
					<span class="ib__field-label">Per-slot</span>
					<div class="ib__pc-slots">
						{#each ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as n (n)}
							<div class="ib__pc-slot" class:ib__pc-slot--on={!!paletteOverrides[n]}>
								{#key themeTick}<ColorPicker trigger format="hex" value={paletteOverrides[n] ?? slotColors[n] ?? "#888888"} title={`Slot ${n}`} aria-label={`Slot ${n} color`} oninput={(e) => setOverride(n, (e.target as HTMLInputElement).value)} onchange={(e) => setOverride(n, (e.target as HTMLInputElement).value)} />{/key}
								{#if paletteOverrides[n]}
									<button type="button" class="ib__pc-clear" onclick={() => clearOverride(n)} aria-label={`Clear slot ${n} override`}>×</button>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</section>

		<section class="ib__examples" aria-label="Icon library">
			<div class="ib__examples-head">
				<span class="ib__palette-label">Library</span>
				<input
					class="ib__search"
					type="search"
					bind:value={exampleQuery}
					placeholder="Filter icons…"
					aria-label="Filter icons by name, shape, or palette"
					spellcheck="false"
				/>
				<div class="ib__lib-io">
					<Button size="sm" variant="subtle" iconOnly onclick={triggerImport} title="Import icons from a text file (one name per line)" aria-label="Import icons">
						<Icon name="download" size="sm" />
					</Button>
					<Button size="sm" variant="subtle" iconOnly onclick={exportLibrary} disabled={library.length === 0} title="Copy your saved icons as a name list (one per line)" aria-label="Export saved icons">
						<Icon name={copyGlyph(exportFlash)} size="sm" />
					</Button>
					<input class="ib__file" type="file" accept=".txt,.text,text/plain" bind:this={libraryFileInput} onchange={onImportFile} tabindex="-1" aria-hidden="true" />
				</div>
			</div>

			{#if library.length > 0}
				<div class="ib__lib-group">
					<span class="ib__lib-label">User created</span>
					<div class="ib__example-grid">
						{#each shownSaved as ex (ex.id)}
							<div class="ib__saved">
								<button
									type="button"
									class="ib__example"
									title={ex.label}
									aria-label={`Load ${ex.label}`}
									onclick={() => loadIcon(ex.name, ex.scheme)}
								>
									{#key themeTick}<Icon name={ex.name} colors={ex.scheme} />{/key}
								</button>
								<button
									type="button"
									class="ib__saved-remove"
									title={`Remove ${ex.label}`}
									aria-label={`Remove ${ex.label} from your library`}
									onclick={() => removeSaved(ex.id)}
								>×</button>
							</div>
						{/each}
						{#if shownSaved.length === 0}
							<p class="ib__empty">No saved icons match “{exampleQuery}”.</p>
						{/if}
					</div>
				</div>
			{/if}

			<div class="ib__lib-group">
				<span class="ib__lib-label">Examples</span>
				<div class="ib__example-grid">
					{#each shownExamples as ex (ex.name)}
						<button
							type="button"
							class="ib__example"
							title={exampleLabel(ex.name)}
							aria-label={`Load ${exampleLabel(ex.name)}`}
							onclick={() => loadIcon(ex.name, ex.scheme)}
						>
							{#key themeTick}<Icon name={ex.name} colors={ex.scheme} />{/key}
						</button>
					{/each}
					{#if shownExamples.length === 0}
						<p class="ib__empty">No examples match “{exampleQuery}”.</p>
					{/if}
				</div>
			</div>
		</section>
	</div>
</AppShell>
</div>

<style>
	/* Cancel the bench page's `--space-5` padding so the studio sits flush like the Themes bench, and
	   zero the shell's own `main` padding so the toolbar and content set their own tighter insets. */
	.ib-shell-wrap {
		position: relative;
		display: flex;
		flex-direction: column;
		margin: calc(var(--space-5) * -1);
		height: calc(100% + var(--space-5) * 2);
	}
	:global(.ib-shell::part(app)) {
		height: 100%;
	}
	:global(.ib-shell::part(main)) {
		padding: 0;
	}

	/* A 2x2 board: preview + layers on top, the whole-icon finish panel + the examples gallery below,
	   left column sized to the preview, right column flexible. The inspector dock sits outside this. */
	.ib__content {
		padding: var(--space-4) var(--space-4) var(--space-6);
		display: grid;
		grid-template-columns: minmax(0, 17rem) minmax(0, 1fr);
		grid-auto-rows: min-content;
		gap: var(--space-5) var(--space-6);
		align-items: start;
	}
	@media (max-width: 720px) {
		.ib__content {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	.ib__dock-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		padding: var(--space-4) var(--space-3) var(--space-4) 0;
		height: 100%;
		/* Vertical scroll only (a control's internal min-width can spill a hairline horizontally); always
		   reserve the scrollbar track so nothing shifts when the panel overflows. Left inset comes from the
		   dock; the right keeps a small pad so nothing butts the scrollbar. */
		overflow: hidden auto;
		scrollbar-gutter: stable;
	}

	/*
	 * The dock is a child component, so its `xtyle-dock` element sits outside this component's
	 * style scope — reach it with `:global`. The nested shell's right cell sizes to content, so
	 * the dock can't resolve a percentage height and its tall control stack won't scroll. Pin the
	 * dock to the shell body (a definite-height, position:relative ancestor) so it fills the body,
	 * and let the dock's own body scroll. Desktop only — below the breakpoint the dock stacks under
	 * the main.
	 */
	/* The dock fills its resizable rail (the AppShell sizes the rail column); the dock's own body
	   scrolls. Below the breakpoint the rail stacks under the main and the dock flows normally. */
	@media (min-width: 901px) {
		:global(.ib__dock) {
			position: absolute;
			inset: 0;
			width: auto;
		}
	}

	.ib-start {
		display: flex;
		align-items: flex-end;
		gap: var(--space-3);
	}
	.ib-name-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	.ib-brand {
		display: flex;
		flex-direction: column;
		line-height: 1.15;
	}
	.ib-brand__tag {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--fg-3);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.ib-name {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-1) var(--space-1) var(--space-1) var(--space-2);
		background: var(--bg-1);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-sm);
	}
	.ib-name__input {
		width: 56ch;
		max-width: 50vw;
		padding: 0;
		background: transparent;
		border: none;
		color: var(--fg-1);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
	}
	.ib-name__input:focus-visible {
		outline: none;
		color: var(--fg-0);
	}
	.ib-name__expand {
		flex: none;
		display: grid;
		place-items: center;
		width: var(--space-4);
		height: var(--space-4);
		font-size: var(--text-sm);
		line-height: 1;
		color: var(--fg-2);
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
	}
	.ib-name__expand:hover {
		color: var(--accent);
		background: var(--state-hover);
	}
	.ib-name__flyout {
		position: absolute;
		top: calc(100% + var(--space-2));
		left: 0;
		z-index: 60;
		width: min(44rem, 80vw);
		padding: var(--space-3);
		background: var(--surface-overlay, var(--bg-1));
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg, 0 1.5rem 3rem rgba(0, 0, 0, 0.35));
	}
	.ib-name__area {
		width: 100%;
		min-height: 6rem;
		padding: var(--space-2);
		color: var(--fg-1);
		background: var(--bg-1);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		line-height: 1.5;
		resize: vertical;
		white-space: pre-wrap;
		word-break: break-all;
	}
	.ib-name__area:focus-visible {
		outline: none;
		border-color: var(--accent);
	}
	.ib-name__hint {
		margin: var(--space-1) 0 0;
		color: var(--fg-3);
		font-size: var(--text-xs);
	}
	.ib-meta {
		display: flex;
		align-items: center;
		gap: var(--space-5);
		flex-wrap: wrap;
	}
	.ib__layer-actions {
		display: flex;
		gap: var(--space-2);
	}

	/* The whole preview stage is one tinted surface: the selected preview background lives here and the
	   canvas, size strip, and swatch picker all sit transparently on top so they share a single fill. */
	.ib__stage {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		min-width: 0;
		padding: var(--space-4);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-lg);
		transition: background-color 0.15s ease;
	}
	.ib__canvas {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		max-width: 15rem;
		aspect-ratio: 1;
		margin-inline: auto;
		/* No padding: the mark's 24-unit box fills the canvas so its coordinate space lines up with the
		   3x3 grid (grid lines fall on icon-units 8 and 16), and scaling reads against the cells. */
		padding: 0;
		overflow: hidden;
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-md);
		color: var(--fg-0);
	}
	/* Solid thirds (the icon's own 8/16-unit gridlines) with dotted sixth-lines subdividing each cell.
	   Both tiers use `--line` so the grid tracks the theme; the sixths are dotted to read as minor. */
	.ib__canvas[data-grid] {
		background-image:
			linear-gradient(to right, transparent calc(33.333% - 0.5px), var(--line) calc(33.333% - 0.5px), var(--line) calc(33.333% + 0.5px), transparent calc(33.333% + 0.5px), transparent calc(66.666% - 0.5px), var(--line) calc(66.666% - 0.5px), var(--line) calc(66.666% + 0.5px), transparent calc(66.666% + 0.5px)),
			linear-gradient(to bottom, transparent calc(33.333% - 0.5px), var(--line) calc(33.333% - 0.5px), var(--line) calc(33.333% + 0.5px), transparent calc(33.333% + 0.5px), transparent calc(66.666% - 0.5px), var(--line) calc(66.666% - 0.5px), var(--line) calc(66.666% + 0.5px), transparent calc(66.666% + 0.5px)),
			repeating-linear-gradient(to bottom, var(--line) 0 2px, transparent 2px 5px),
			repeating-linear-gradient(to bottom, var(--line) 0 2px, transparent 2px 5px),
			repeating-linear-gradient(to bottom, var(--line) 0 2px, transparent 2px 5px),
			repeating-linear-gradient(to right, var(--line) 0 2px, transparent 2px 5px),
			repeating-linear-gradient(to right, var(--line) 0 2px, transparent 2px 5px),
			repeating-linear-gradient(to right, var(--line) 0 2px, transparent 2px 5px);
		background-size:
			100% 100%, 100% 100%,
			1px 5px, 1px 5px, 1px 5px,
			5px 1px, 5px 1px, 5px 1px;
		background-position:
			center, center,
			16.666% 0, 50% 0, 83.333% 0,
			0 16.666%, 0 50%, 0 83.333%;
		background-repeat:
			no-repeat, no-repeat,
			repeat-y, repeat-y, repeat-y,
			repeat-x, repeat-x, repeat-x;
	}
	.ib__canvas :global(xtyle-icon) {
		/* xl doubles this, so 7.5rem → a 15rem mark that exactly fills the 15rem canvas. */
		font-size: 7.5rem;
	}

	.ib__preview-foot {
		display: flex;
		align-items: stretch;
		gap: var(--space-3);
	}
	.ib__preview-foot .ib__sizes {
		flex: 1;
		min-width: 0;
	}
	.ib__sizes {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: var(--space-4);
		padding: var(--space-3);
	}
	/* The preview-background picker: a 3x2 block of surface swatches beside the size strip. */
	.ib__bg-picker {
		flex: none;
		display: grid;
		grid-template-columns: repeat(3, auto);
		gap: var(--space-1);
		place-content: center;
		padding: var(--space-2);
	}
	.ib__bg-picker :global(xtyle-swatch) {
		font-size: 1.4rem;
	}
	.ib__size {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
	}
	.ib__size-tag {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--fg-3);
	}

	.ib__layers,
	.ib__inspector {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.ib__section-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.ib__layers h4,
	.ib__inspector h4 {
		margin: 0;
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--fg-1);
	}

	/* The chip list scrolls within a bounded height so a tall stack keeps the board tidy; Add layer
	   lives outside it so its primitive popover is never clipped by the scroll container. */
	.ib__stack {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		max-height: 19rem;
		overflow-y: auto;
	}
	.ib__chip {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		padding: var(--space-1) var(--space-2);
		background: var(--bg-1);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-sm);
	}
	.ib__chip--on {
		border-color: var(--accent);
		box-shadow: 0 0 0 var(--border-thin) var(--accent);
	}
	.ib__chip-main {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex: 1;
		min-width: 0;
		background: none;
		border: none;
		color: inherit;
		font: inherit;
		cursor: pointer;
		padding: var(--space-1);
		text-align: start;
	}
	.ib__chip-name {
		font-size: var(--text-sm);
		flex: none;
	}
	.ib__chip-meta {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--fg-3);
	}
	.ib__chip-ops {
		display: flex;
		gap: var(--space-1);
	}
	.ib__chip-ops button {
		width: 1.5rem;
		height: 1.5rem;
		display: grid;
		place-items: center;
		background: var(--surface-overlay);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-sm);
		color: var(--fg-2);
		cursor: pointer;
		font-size: var(--text-xs);
	}
	.ib__chip-ops button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.ib__chip-ops button:not(:disabled):hover {
		color: var(--fg-0);
		border-color: var(--line-2);
	}

	/* Per-property lock affordance (inspector) and the tri-state layer lock (chip). */
	.ib__lock {
		flex: none;
		display: grid;
		place-items: center;
		width: 1.4rem;
		height: 1.4rem;
		padding: 0;
		background: none;
		border: none;
		color: var(--fg-3);
		border-radius: var(--radius-sm);
		cursor: pointer;
	}
	.ib__lock:hover {
		color: var(--fg-1);
		background: var(--state-hover);
	}
	.ib__lock--on {
		color: var(--accent);
	}
	.ib__lock-svg {
		display: block;
		width: 0.85rem;
		height: 0.85rem;
	}
	.ib__lock-shackle,
	.ib__lock-body {
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
	}
	.ib__lock--on .ib__lock-body,
	.ib__chip-ops .ib__layerlock--all .ib__lock-body {
		fill: currentColor;
	}
	.ib__lock-dash {
		stroke: currentColor;
		stroke-width: 2.5;
		stroke-linecap: round;
	}
	.ib__chip-ops .ib__layerlock--all,
	.ib__chip-ops .ib__layerlock--some {
		color: var(--accent);
		border-color: var(--accent);
	}

	/* Every inspector property is a row: a left-butted lock in the rail, the control filling the rest.
	   The uniform lock column is a rail you run down to pin several props without chasing each field. */
	.ib__prop {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: var(--space-2);
	}
	.ib__prop--stack {
		align-items: start;
	}
	/* Let the control shrink with the panel instead of overflowing it (a grid item's default
	   `min-width: auto` would keep a slider at its min-content width and spill a horizontal scrollbar). */
	.ib__prop > :not(.ib__lock) {
		min-width: 0;
	}
	.ib__prop-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-width: 0;
	}
	.ib__field-label {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--fg-2);
	}
	.ib__finish {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		align-self: start;
	}
	.ib__finish h4 {
		margin: 0;
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--fg-1);
	}

	.ib__examples {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.ib__examples-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}
	.ib__examples-head .ib__search {
		flex: 1;
		min-width: 0;
		max-width: 16rem;
	}
	.ib__lib-io {
		flex: none;
		display: flex;
		gap: var(--space-1);
	}
	.ib__file {
		display: none;
	}
	/* A titled sub-group within the library (User created / Examples), each with its own grid. */
	.ib__lib-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.ib__lib-label {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--fg-3);
	}
	.ib__example-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(2.75rem, 1fr));
		gap: var(--space-2);
	}
	/* A saved tile carries a hover-revealed remove affordance in its corner. */
	.ib__saved {
		position: relative;
	}
	.ib__saved-remove {
		position: absolute;
		top: calc(var(--space-1) * -1);
		inset-inline-end: calc(var(--space-1) * -1);
		width: 1.1rem;
		height: 1.1rem;
		display: grid;
		place-items: center;
		padding: 0;
		font-size: var(--text-xs);
		line-height: 1;
		color: var(--fg-1);
		background: var(--bg-3, var(--bg-1));
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-full);
		cursor: pointer;
		opacity: 0;
		transition: opacity var(--duration-fast, 0.12s) var(--ease-standard, ease);
	}
	.ib__saved:hover .ib__saved-remove,
	.ib__saved-remove:focus-visible {
		opacity: 1;
	}
	.ib__saved-remove:hover {
		color: var(--danger-text, var(--danger));
		border-color: var(--danger);
	}
	.ib__example {
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-2);
		background: var(--bg-1);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-sm);
		color: var(--fg-0);
		cursor: pointer;
	}
	.ib__example:hover {
		border-color: var(--accent);
	}
	.ib__example :global(xtyle-icon) {
		font-size: 2rem;
	}
	.ib__palette-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.ib__palette-label {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--fg-3);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.ib__palette-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}
	/* The "+ Add layer" affordance and its shape-picker popover, mirroring the theme switcher. */
	.ib__addbox {
		position: relative;
	}
	.ib__addbtn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-2);
		font: inherit;
		font-size: var(--text-sm);
		color: var(--fg-2);
		background: var(--bg-1);
		border: var(--border-thin) dashed var(--line);
		border-radius: var(--radius-sm);
		cursor: pointer;
	}
	.ib__addbtn:hover {
		color: var(--accent);
		border-color: var(--accent);
	}
	.ib__addbtn-plus {
		font-size: var(--text-body);
		line-height: 1;
	}
	.ib__addpop {
		position: absolute;
		top: calc(100% + var(--space-2));
		left: 0;
		right: 0;
		z-index: 50;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		max-height: min(24rem, 60vh);
		padding: var(--space-3);
		background: var(--surface-overlay, var(--bg-1));
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg, 0 1.5rem 3rem rgba(0, 0, 0, 0.35));
	}
	/* The inspector header's shape-replace picker: same popover, sized from the button left rather than
	   stretched across a full-width row. */
	.ib__addpop--replace {
		right: auto;
		min-width: 15rem;
	}

	/* The inspector header is a shape-swap surface: the current primitive, clickable to replace it. */
	.ib__replace {
		position: relative;
		min-width: 0;
	}
	.ib__replace-btn {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-1) var(--space-2);
		background: var(--bg-1);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-sm);
		color: var(--fg-1);
		font: inherit;
		text-align: start;
		cursor: pointer;
	}
	.ib__replace-btn:hover {
		border-color: var(--accent);
		color: var(--fg-0);
	}
	.ib__replace-btn:focus-visible {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 var(--border-thin) var(--ring);
	}
	.ib__replace-name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
	}
	.ib__replace-caret {
		flex: none;
		font-size: var(--text-xs);
		color: var(--fg-3);
	}
	.ib__addpop-scroll {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		overflow-y: auto;
	}
	.ib__search {
		font: inherit;
		font-size: var(--text-sm);
		padding: var(--space-1) var(--space-2);
		color: var(--fg-1);
		background: var(--bg-1);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-sm);
	}
	.ib__search:focus-visible {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 var(--border-thin) var(--accent);
	}
	.ib__addtile {
		position: relative;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-1);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-sm);
		color: var(--fg-1);
		cursor: pointer;
	}
	.ib__addtile:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
	/* A bigger glyph in the same 2rem tile — less padding, more icon. */
	.ib__addtile :global(xtyle-icon) {
		font-size: 1.5rem;
	}
	/* A quiet "new" dot in the corner of a recently-added primitive. */
	.ib__addtile--new::after {
		content: "";
		position: absolute;
		top: -2px;
		right: -2px;
		width: 6px;
		height: 6px;
		border-radius: var(--radius-full);
		background: var(--success-vivid);
		box-shadow: 0 0 0 2px var(--bg-2);
	}

	.ib__field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.ib__pc-flatten {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	.ib__pc-slots {
		display: grid;
		grid-template-columns: repeat(9, minmax(0, 1fr));
		gap: var(--space-2) var(--space-1);
	}
	.ib__pc-slot {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.ib__pc-slot--on::after {
		content: "";
		position: absolute;
		inset: -2px;
		border: var(--border-normal) solid var(--accent);
		border-radius: var(--radius-sm);
		pointer-events: none;
	}
	.ib__pc-clear {
		position: absolute;
		top: -0.4rem;
		right: -0.4rem;
		width: 1rem;
		height: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		font-size: var(--text-xs);
		line-height: 1;
		color: var(--fg-1);
		background: var(--bg-2);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-full);
		cursor: pointer;
	}
	.ib__pc-clear:hover {
		color: var(--danger);
		border-color: var(--danger);
	}
	.ib__field > span {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--fg-2);
	}
	.ib__field-pick {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--accent-text, var(--accent));
	}
	.ib__swatches {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}
	/* The swatch dot is `1em`; its `size` prop only steps the font a little, so bump it here for a
	   proper, easy-to-hit color chip. */
	.ib__swatches :global(xtyle-swatch) {
		font-size: 1.6rem;
	}
	.ib__input {
		padding: var(--space-2);
		background: var(--bg-1);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-sm);
		color: var(--fg-0);
		font: inherit;
		font-size: var(--text-sm);
	}
	.ib__input:focus-visible {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 var(--border-thin) var(--ring);
	}

	.ib__keypad {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-1);
		width: 5.25rem;
	}
	.ib__pad {
		aspect-ratio: 1;
		background: var(--bg-1);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-sm);
		cursor: pointer;
	}
	.ib__pad:hover {
		border-color: var(--line-2);
	}
	.ib__pad--on {
		background: var(--accent);
		border-color: var(--accent);
	}

	.ib__empty {
		margin: 0;
		color: var(--fg-3);
		font-size: var(--text-sm);
	}

	.ib__field--wide {
		flex: 1 1 100%;
		align-items: stretch;
	}
	.ib__pts {
		width: 100%;
		padding: var(--space-1) var(--space-2);
		background: var(--bg-1);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-sm);
		color: var(--fg-0);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
	}
	.ib__pts:focus-visible {
		outline: none;
		border-color: var(--accent);
	}

	.ib__glyph {
		width: 3rem;
		padding: var(--space-1) var(--space-2);
		text-align: center;
		background: var(--bg-1);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-sm);
		color: var(--fg-0);
		font-family: var(--font-mono);
		font-size: var(--text-md);
	}
	.ib__glyph:focus-visible {
		outline: none;
		border-color: var(--accent);
	}

	.ib__hint {
		margin: 0;
		color: var(--fg-3);
		font-size: var(--text-xs);
		line-height: 1.4;
	}
	.ib__hint code {
		font-family: var(--font-mono);
		color: var(--fg-2);
	}
	.ib__hint--warn {
		color: var(--warning, var(--fg-2));
	}
	.ib__suggest {
		padding: 0;
		border: 0;
		background: none;
		color: var(--accent);
		font: inherit;
		text-decoration: underline;
		cursor: pointer;
	}
	.ib__suggest:hover {
		color: var(--fg-0);
	}

	.ib__fonts-fetch {
		margin-top: var(--space-2);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.ib__notice {
		margin: 0;
		color: var(--fg-3);
		font-size: var(--text-xs);
		line-height: 1.4;
	}
	.ib__notice code {
		font-family: var(--font-mono);
		color: var(--fg-2);
	}

	.ib__fonts-load-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
	}
	.ib__fonts-load {
		display: block;
		margin-top: var(--space-1);
		padding: var(--space-1) var(--space-2);
		background: var(--bg-1);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-sm);
		color: var(--fg-2);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		word-break: break-all;
	}
</style>
