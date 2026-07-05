<script lang="ts">
	import { type SeriesScheme, composeIcon, primitiveSince, primitiveTags, resolveIconMark, seriesPalette, SERIES_TOKENS } from "@xtyle/core";
	import { AppShell, Button, Dock, Icon, Segment, Segmented, Slider, Swatch, Switch, Toolbar } from "@xtyle/svelte";
	import { isNewComponent } from "../../data/newness.ts";
	import { ACTIVE_CHANGED_EVENT } from "../../lib/theme-active.ts";

	// No `register` prop: the builder is a standalone page that inherits the site's active theme
	// straight from the `:root` cascade, so a mark colors against whatever theme is applied.

	interface MarkLayer {
		id: number;
		keyword: string;
		p: number;
		x: number;
		y: number;
		s: number;
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

	// The properties a lock can pin against Randomize, in the order the layer lock aggregates them.
	// Locks live on the layer at runtime and serialize into the name as a trailing `---` flags section
	// (e.g. `crest--shield-c3--star-s45-c1---l1c-l2ws`), so a template name carries its pinned style and
	// export can trim everything from `---` on for a clean production name.
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
		{ group: "Shapes", keywords: ["circle", "square", "square1", "square2", "square3", "shield", "hex", "diamond", "triangle"] },
		{ group: "Frames", keywords: ["ring", "border", "divider"] },
		{ group: "Bars", keywords: ["top", "row", "column", "diagonal", "cross"] },
		{ group: "Symbols", keywords: ["star", "heart", "crescent", "bolt", "dot"] },
		{ group: "Glyphs", keywords: ["check", "close", "plus", "minus", "search", "menu", "info", "warning", "error", "success", "play", "pause", "stop", "loader"] },
		{ group: "Objects", keywords: ["gear", "folder", "pencil", "trash", "eye", "copy", "palette", "bookmark", "download"] },
	];

	/** Match a palette keyword against a search string: its own name or any of its tags. */
	function primitiveMatches(kw: string, query: string): boolean {
		const q = query.trim().toLowerCase();
		if (!q) return true;
		return kw.toLowerCase().includes(q) || primitiveTags(kw).some((t) => t.includes(q));
	}

	const COLOR_SLOTS: { value: string; label: string }[] = [
		{ value: "inherit", label: "text" },
		{ value: "0", label: "clear" },
		{ value: "1", label: "fg" },
		{ value: "2", label: "bg" },
		{ value: "3", label: "s1" },
		{ value: "4", label: "s2" },
		{ value: "5", label: "s3" },
		{ value: "6", label: "s4" },
		{ value: "7", label: "s5" },
	];

	const SCHEMES: { value: SeriesScheme; label: string }[] = [
		{ value: "accents", label: "Accents" },
		{ value: "skittles", label: "Skittles" },
		{ value: "statuses", label: "Statuses" },
		{ value: "thermal", label: "Thermal" },
	];

	// Backgrounds to preview the mark against — the engine's full surface ladder (`--body-bg` … `--bg-3`,
	// the same tokens the palette itself uses) plus the contrasting ink, so an author can check a mark on
	// the real page, each surface tier the app stacks onto, and an inverted surface.
	const BG_OPTIONS: { token: string; label: string }[] = [
		{ token: "--body-bg", label: "Page" },
		{ token: "--bg-0", label: "Base" },
		{ token: "--bg-1", label: "Panel" },
		{ token: "--bg-2", label: "Raised" },
		{ token: "--bg-3", label: "Float" },
		{ token: "--fg-0", label: "Contrast" },
	];

	// A 3x3 grid of series-colored cells: the same swatch under each palette makes the picker a live
	// preview of what each scheme's `c0..c7` slots resolve to under the current theme. The leading `--`
	// gives it an empty label so the mark is decorative; the segment owns the option's name and tooltip.
	const GRID =
		"--square1-p1-s35--square1-p2-s35-c0--square1-p3-s35-c1--square1-p4-s35-c2--square1-s35-c3--square1-p6-s35-c4--square1-p7-s35-c5--square1-p8-s35-c6--square1-p9-s35-c7";

	let nextId = 1;
	function makeLayer(keyword: string, over: Partial<MarkLayer> = {}): MarkLayer {
		return {
			id: nextId++,
			keyword,
			p: 5,
			x: 0,
			y: 0,
			s: 100,
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

	// A browsable gallery of full marks, authored as icon-name strings so each is its own live preview.
	// Clicking one loads it into the builder (label + layers), which is exactly what the name box parses.
	const EXAMPLES: { name: string; scheme: SeriesScheme }[] = [
		{ name: "Crest--shield-c3--star-s45-c1", scheme: "accents" },
		{ name: "Bolt-badge--circle-c4--bolt-s52-c2", scheme: "accents" },
		{ name: "dice-3--square3--dot-p7-x12-y-12-s20-c2--dot-s20-c2--dot-p3-x-12-y12-s20-c2", scheme: "accents" },
		{ name: "dice-3-wrong--square3-c2--dot-p7-x12-y-12-s20-c1--dot-s20-c1--dot-p3-x-12-y12-s20-c1", scheme: "accents" },
		{ name: "Target--ring-c3--dot-s28-c4", scheme: "statuses" },
		{ name: "Heart-seal--circle-c5--heart-s48-c1", scheme: "skittles" },
		{ name: "Star-hex--hex-c3--star-s50-c2", scheme: "accents" },
		{ name: "Gear-badge--circle-c4--gear-s54-c2", scheme: "accents" },
		{ name: "Eye-shield--shield-c6--eye-s46-c1", scheme: "skittles" },
		{ name: "Check-ring--ring-c3--check-s40-c3", scheme: "statuses" },
		{ name: "Warn-diamond--diamond-c4--warning-s44-c2", scheme: "statuses" },
		{ name: "play-circle--circle-c3--play-s75-c2", scheme: "accents" },
		{ name: "Moon--circle-c5--crescent-s60-c1", scheme: "skittles" },
		{ name: "Cross-shield--shield-c3--cross-s70-c1", scheme: "accents" },
		{ name: "Folder-tab--square-c4--folder-s52-c2", scheme: "accents" },
		{ name: "Bookmark--square1-c5--bookmark-s50-c1", scheme: "skittles" },
		{ name: "Palette-badge--circle-c6--palette-s50-c2", scheme: "skittles" },
		{ name: "Search-lens--circle-c3--search-s44-c2", scheme: "accents" },
		{ name: "Bolt-diamond--diamond-c7--bolt-s54-c1", scheme: "skittles" },
		{ name: "Alert-triangle--triangle-c4--warning-s34-c2", scheme: "statuses" },
		{ name: "Twin-star--star-c3--star-s55-r180-c4", scheme: "accents" },
		{ name: "Pencil-note--square2-c5--pencil-s52-c1", scheme: "skittles" },
		{ name: "Download-badge--circle-c3--download-s48-c2", scheme: "accents" },
		{ name: "heartbeat--heart-c7--heart-s60-c2-ko---d7p8s1t60", scheme: "skittles" },
		{ name: "Gear-hex--hex-c6--gear-s58-c1", scheme: "skittles" },
		{ name: "Dot-grid--square-c3--dot-p1-s16-c1--dot-p3-s16-c1--dot-p7-s16-c1--dot-p9-s16-c1", scheme: "accents" },
		{ name: "shield-column--shield-c3--column-s80-c1", scheme: "accents" },
		{ name: "Thermal-ring--ring-c3--dot-s26-c7", scheme: "thermal" },
		{ name: "Copy-badge--square3-c4--copy-s50-c2", scheme: "accents" },
		{ name: "Crescent-star--circle-c6--crescent-s52-c1--star-p3-s18-c2", scheme: "skittles" },
		{ name: "Trash-badge--circle-c4--trash-s50-c2", scheme: "statuses" },
	];

	function loadIcon(name: string, sch: SeriesScheme): void {
		scheme = sch;
		applyName(name);
	}

	function exampleLabel(name: string): string {
		return name.split("--")[0];
	}
	let exampleQuery = $state("");
	/** Match an example against the filter box: its name (label + shapes + flags) or its palette. */
	function exampleMatches(ex: (typeof EXAMPLES)[number]): boolean {
		const q = exampleQuery.trim().toLowerCase();
		if (!q) return true;
		return ex.name.toLowerCase().includes(q) || ex.scheme.includes(q);
	}
	const shownExamples = $derived(EXAMPLES.filter(exampleMatches));

	interface DropShadow {
		color: number;
		pos: number;
		size: number;
		soft: number;
	}
	const DEFAULT_SHADOW: DropShadow = { color: 1, pos: 8, size: 2, soft: 50 };

	let label = $state("Crest");
	let scheme = $state<SeriesScheme>("accents");
	let previewBg = $state("--body-bg");
	let layers = $state<MarkLayer[]>([]);
	let selectedId = $state<number | null>(null);
	let dropShadow = $state<DropShadow | null>(null);
	type CopyState = "idle" | "done" | "fail";
	let copyState = $state<CopyState>("idle");
	let cleanState = $state<CopyState>("idle");
	const copyGlyph = (s: CopyState): string => (s === "done" ? "check" : s === "fail" ? "close" : "copy");

	// The name box expands into a non-shifting multiline flyout for full view/edit of a long name.
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

	// The shape picker is a popover combobox opened by the "+ Add layer" affordance, mirroring the
	// theme switcher: click-outside and Escape close it. The inspector header opens the same picker to
	// replace the selected layer's primitive in place.
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

	// Until the builder persists your last mark, start on a random example so the page opens on something
	// different each visit rather than always the same default.
	const initialIcon = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)];
	loadIcon(initialIcon.name, initialIcon.scheme);

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
		if (l.p !== 5) parts.push(`p${l.p}`);
		if (l.x) parts.push(`x${l.x}`);
		if (l.y) parts.push(`y${l.y}`);
		if (l.s !== 100) parts.push(`s${l.s}`);
		if (l.r) parts.push(`r${l.r}`);
		if (l.c !== null) parts.push(`c${l.c}`);
		if (l.outline > 0) parts.push(`o${l.outline}${l.outlineColor !== null ? `c${l.outlineColor}` : ""}`);
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
		return `d${ds.color}p${ds.pos}s${ds.size}t${ds.soft}`;
	}

	const iconName = $derived.by(() => {
		if (layers.length === 0) return "";
		const body = layers.map(serializeLayer).join("--");
		const finish = [
			...(dropShadow ? [serializeShadow(dropShadow)] : []),
			...layers.map(serializeLocks).filter(Boolean),
		].join("-");
		return `${slug(label)}--${body}${finish ? `---${finish}` : ""}`;
	});

	/** Lift only the `l…` lock tokens from the finish, keeping any render finish (a drop shadow is part
	 * of the mark and must survive export); drops the `---` entirely when nothing else remains. */
	function stripLocks(name: string): string {
		const i = name.indexOf("---");
		if (i < 0) return name;
		const kept = name
			.slice(i + 3)
			.split("-")
			.filter((token) => !/^l\d/.test(token));
		return kept.length ? `${name.slice(0, i)}---${kept.join("-")}` : name.slice(0, i);
	}
	const hasLocks = $derived(layers.some((l) => LOCK_KEYS.some((k) => l.locks[k])));

	/** The inverse of `serializeLayer`: read a layer segment's tokens back into a `MarkLayer`. */
	function deserializeLayer(segment: string): MarkLayer | null {
		const keyword = /^[a-z]+[0-9]*/.exec(segment)?.[0];
		if (!keyword) return null;
		const over: Partial<MarkLayer> = {};
		const token = /-(?:([pxysrca])(-?\d+)|o(\d+)(?:c(\d+))?|(fh|fv|ko|i))/g;
		let m: RegExpExecArray | null;
		while ((m = token.exec(segment.slice(keyword.length))) !== null) {
			if (m[1] === "p") over.p = Number(m[2]);
			else if (m[1] === "x") over.x = Number(m[2]);
			else if (m[1] === "y") over.y = Number(m[2]);
			else if (m[1] === "s") over.s = Number(m[2]);
			else if (m[1] === "r") over.r = Number(m[2]);
			else if (m[1] === "c") over.c = Number(m[2]);
			else if (m[1] === "a") over.a = Number(m[2]);
			else if (m[3] != null) {
				over.outline = Number(m[3]);
				if (m[4] != null) over.outlineColor = Number(m[4]);
			} else if (m[5] === "fh") over.fh = true;
			else if (m[5] === "fv") over.fv = true;
			else if (m[5] === "ko") over.ko = true;
			else if (m[5] === "i") over.invert = true;
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
		const m = /d(\d+)p([1-9])s([1-9])t(\d{1,3})/.exec(flags);
		if (!m) return null;
		return { color: Number(m[1]), pos: Number(m[2]), size: Number(m[3]), soft: Math.min(100, Number(m[4])) };
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
	}

	function colorValue(c: number | null): string {
		return c === null ? "inherit" : String(c);
	}
	function setColor(l: MarkLayer, v: string): void {
		l.c = v === "inherit" ? null : Number(v);
	}
	function setOutlineColor(l: MarkLayer, v: string): void {
		l.outlineColor = v === "inherit" ? null : Number(v);
	}
	/** The display label for a color-slot value (`3` → `s1`), shown in a field header as the selection. */
	function slotLabel(value: string): string {
		return COLOR_SLOTS.find((s) => s.value === value)?.label ?? value;
	}

	// Resolve every color slot to a real color for the swatch picker, off the live `:root` cascade the
	// mark itself colors against. Recomputes when the scheme changes or the active theme swaps.
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
		for (const token of SERIES_TOKENS) {
			const value = cs.getPropertyValue(token).trim();
			if (value) register[token] = value;
		}
		const fg = cs.getPropertyValue("--fg-0").trim() || "#e6e9ef";
		const bg = cs.getPropertyValue("--bg-0").trim() || "#0b0d12";
		const series = seriesPalette(scheme, 5, register);
		return {
			inherit: fg,
			"0": "transparent",
			"1": fg,
			"2": bg,
			"3": series[0] ?? fg,
			"4": series[1] ?? fg,
			"5": series[2] ?? fg,
			"6": series[3] ?? fg,
			"7": series[4] ?? fg,
		};
	});

	function addLayer(keyword: string): void {
		const l = makeLayer(keyword, { c: layers.length === 0 ? 3 : null });
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
	function move(id: number, dir: -1 | 1): void {
		const idx = layers.findIndex((l) => l.id === id);
		const to = idx + dir;
		if (to < 0 || to >= layers.length) return;
		const next = [...layers];
		[next[idx], next[to]] = [next[to], next[idx]];
		layers = next;
	}

	/** A compact readout of a layer's non-default settings for the layer chip, e.g. `c3 · s80 · r45 · ko`. */
	function layerSummary(l: MarkLayer): string {
		const parts: string[] = [];
		if (l.c !== null) parts.push(`c${l.c}`);
		if (l.p !== 5) parts.push(`p${l.p}`);
		if (l.s !== 100) parts.push(`s${l.s}`);
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

	const RANDOM_FIELDS = ["circle", "square", "shield", "hex", "diamond"];
	const RANDOM_CHARGES = ["star", "heart", "crescent", "bolt", "cross", "dot", "check"];
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

	// Re-roll the mark in place: the layer count and stacking order are the user's, and each unlocked
	// property gets a fresh value while locked ones (and the always-deliberate knockout/invert on the
	// base) stay put. The first layer is the field (a calm backing shape); the rest are charges.
	function clearLayers(): void {
		layers = [];
		selectedId = null;
		dropShadow = null;
	}

	// Reset returns each layer's *unlocked* properties to their factory defaults, leaving locked props and
	// the shapes themselves alone, so it normalizes what you have (mirroring how Randomize honors locks)
	// rather than swapping in a different mark.
	function resetLayers(): void {
		layers = layers.map((l) => {
			const n: MarkLayer = { ...l, locks: { ...l.locks } };
			const free = (k: string): boolean => !l.locks[k];
			if (free("p")) n.p = 5;
			if (free("s")) n.s = 100;
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
				if (free("c")) n.c = 3 + Math.floor(Math.random() * 3);
				if (free("s")) n.s = rint(90, 100, 2);
				if (free("r")) n.r = chance(0.2) ? pick([-90, -45, 45, 90]) : 0;
				if (free("p")) n.p = chance(0.15) ? rint(1, 9) : 5;
				if (free("x")) n.x = chance(0.1) ? rint(-8, 8, 2) : 0;
				if (free("y")) n.y = chance(0.1) ? rint(-8, 8, 2) : 0;
				if (free("a")) n.a = chance(0.08) ? 85 : 100;
				if (free("outline")) {
					n.outline = chance(0.1) ? 1 : 0;
					if (n.outline > 0 && n.outlineColor === null) n.outlineColor = 1;
				}
				if (free("fh")) n.fh = chance(0.1);
				if (free("fv")) n.fv = chance(0.1);
			} else {
				if (free("keyword")) n.keyword = pick(RANDOM_CHARGES);
				if (free("p")) n.p = rint(1, 9);
				if (free("s")) n.s = rint(24, 70, 2);
				if (free("r")) n.r = chance(0.3) ? pick([-135, -90, -45, 45, 90, 135, 180]) : 0;
				if (free("c")) n.c = pick([1, 2, 4, 5, 6, 7]);
				if (free("x")) n.x = chance(0.2) ? rint(-16, 16, 2) : 0;
				if (free("y")) n.y = chance(0.2) ? rint(-16, 16, 2) : 0;
				if (free("a")) n.a = chance(0.15) ? pick([60, 75, 85]) : 100;
				if (free("outline")) {
					n.outline = chance(0.15) ? pick([1, 2]) : 0;
					if (n.outline > 0 && n.outlineColor === null) n.outlineColor = 1;
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

	function toggleShadow(on: boolean): void {
		dropShadow = on ? { ...DEFAULT_SHADOW } : null;
	}

	// The export copy drops the `---` lock flags: the pinned style is authoring metadata, so a production
	// name only needs the renderable part.
	async function copyClean(): Promise<void> {
		try {
			await navigator.clipboard.writeText(stripLocks(iconName));
			cleanState = "done";
		} catch {
			cleanState = "fail";
		}
		setTimeout(() => (cleanState = "idle"), 1400);
	}

	// Bakes the current mark into a self-contained SVG string at `sizePx`: series and token fills resolve
	// to concrete values off the live theme (so the file carries no `var(--…)`), and `currentColor` is
	// pinned to the active ink, so the exported art matches what's on screen with nothing left to inherit.
	function buildExportSvg(sizePx: number): string | null {
		const parsed = resolveIconMark(iconName);
		if (!parsed) return null;
		const cs = getComputedStyle(document.documentElement);
		const register: Record<string, string> = {};
		for (const token of SERIES_TOKENS) {
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
		// `color` as a presentation attribute (not a `style`), so it resolves `currentColor` without
		// colliding with the `style="overflow:visible"` that composeIcon adds when a drop shadow is present
		// (two `style` attributes make invalid XML, which silently fails the PNG rasterizer's image load).
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

	function saveSvg(): void {
		const svg = buildExportSvg(256);
		if (!svg) return;
		downloadBlob(`${slug(label) || "icon"}.svg`, new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
	}

	// Rasterizes the baked SVG through an untouched (transparent) canvas, so the PNG keeps the mark's own
	// alpha rather than flattening onto a background. The blob URL is same-origin, so the canvas is not
	// tainted and `toBlob` succeeds.
	async function savePng(): Promise<void> {
		const svg = buildExportSvg(512);
		if (!svg) return;
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
										spellcheck="false"
										autocomplete="off"
										rows="4"
										aria-label="Icon name (full, editable)"
									></textarea>
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
						<Button size="sm" variant="subtle" onclick={saveSvg} disabled={!iconName} title="Download the mark as a scalable SVG"><Icon name="download" size="sm" /> SVG</Button>
						<Button size="sm" variant="subtle" onclick={savePng} disabled={!iconName} title="Download the mark as a 512px transparent PNG"><Icon name="download" size="sm" /> PNG</Button>
					</div>
				</div>
			{/snippet}
			{#snippet end()}
				<div class="ib-meta">
					<Segmented value={scheme} onchange={(e) => (scheme = (e.target as HTMLInputElement).value as SeriesScheme)} aria-label="Palette">
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
						<Slider label="Size" bind:value={l.s} min={10} max={200} step={5} showValue format={(v) => `${v}%`} />
					</div>
					<div class="ib__prop">
						{@render propLock(l, "r")}
						<Slider label="Rotate" bind:value={l.r} min={-180} max={180} step={15} showValue format={(v) => `${v}°`} />
					</div>
					<div class="ib__prop">
						{@render propLock(l, "x")}
						<Slider label="Nudge X" bind:value={l.x} min={-40} max={40} step={2} showValue format={(v) => `${v}%`} />
					</div>
					<div class="ib__prop">
						{@render propLock(l, "y")}
						<Slider label="Nudge Y" bind:value={l.y} min={-40} max={40} step={2} showValue format={(v) => `${v}%`} />
					</div>
					<div class="ib__prop">
						{@render propLock(l, "a")}
						<Slider label="Opacity" bind:value={l.a} min={0} max={100} step={5} showValue format={(v) => `${v}%`} />
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

					<div class="ib__prop">{@render propLock(l, "fh")}<Switch bind:checked={l.fh} label="Flip H" /></div>
					<div class="ib__prop">{@render propLock(l, "fv")}<Switch bind:checked={l.fv} label="Flip V" /></div>
					<div class="ib__prop">{@render propLock(l, "ko")}<Switch bind:checked={l.ko} label="Knockout" /></div>
					<div class="ib__prop">{@render propLock(l, "invert")}<Switch bind:checked={l.invert} label="Invert" /></div>
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
					<li>
						<div class="ib__chip" class:ib__chip--on={l.id === selectedId}>
							<button type="button" class="ib__chip-main" onclick={() => (selectedId = l.id)}>
								{#key themeTick}<Icon name={`--${l.keyword}${l.c !== null ? `-c${l.c}` : ""}`} colors={scheme} size="sm" />{/key}
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
			<Switch checked={!!dropShadow} onchange={(e) => toggleShadow((e.target as HTMLInputElement).checked)} label="Drop shadow" />
			{#if dropShadow}
				<div class="ib__field">
					<span class="ib__field-label">Shadow color <span class="ib__field-pick">· {slotLabel(String(dropShadow.color))}</span></span>
					<div class="ib__swatches" role="radiogroup" aria-label="Shadow color">
						{#each COLOR_SLOTS.filter((s) => s.value !== "inherit" && s.value !== "0") as slot (slot.value)}
							<Swatch
								color={slotColors[slot.value] ?? "transparent"}
								title={slot.label}
								size="lg"
								interactive
								selected={String(dropShadow.color) === slot.value}
								onselect={() => (dropShadow!.color = Number(slot.value))}
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
		</section>

		<section class="ib__examples" aria-label="Example marks">
			<div class="ib__examples-head">
				<span class="ib__palette-label">Examples</span>
				<input
					class="ib__search"
					type="search"
					bind:value={exampleQuery}
					placeholder="Filter examples…"
					aria-label="Filter examples by name, shape, or palette"
					spellcheck="false"
				/>
			</div>
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
		display: grid;
		place-items: center;
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
	.ib__example-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(2.75rem, 1fr));
		gap: var(--space-2);
	}
	.ib__example {
		aspect-ratio: 1;
		display: grid;
		place-items: center;
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
		display: grid;
		place-items: center;
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
</style>
