export interface Fixture {
	props: Record<string, unknown>;
	childrenHtml: string;
}

export const DEFAULT_FIXTURE: Fixture = { props: {}, childrenHtml: "Xtyle" };

/**
 * A component compared on `DEFAULT_FIXTURE` is compared with no data, and a component with no data
 * renders the same frame through every binding — so the comparison passes without ever exercising the
 * path the bindings actually differ on. Objects and arrays reach the raw element as *properties* and
 * the Astro binding as *attributes*; a collection prop with no fixture is therefore precisely the
 * shape this suite exists to check and the one shape it was blind to.
 */
export const COLLECTION_FIXTURES: Record<string, Fixture> = {
	toc: {
		props: {
			label: "On this page",
			items: [
				{ id: "one", label: "Anchors", level: 1 },
				{ id: "two", label: "Knobs", level: 1 },
				{ id: "three", label: "Density", level: 2 },
			],
		},
		childrenHtml: "",
	},
	tabs: {
		props: {
			tabs: [
				{ key: "a", label: "Overview", panel: "The first panel." },
				{ key: "b", label: "Details", panel: "The second panel." },
			],
		},
		childrenHtml: "",
	},
	tree: {
		props: {
			label: "Files",
			items: [
				{ label: "src", value: "src", expanded: true, children: [{ label: "index.ts", value: "index" }] },
				{ label: "readme.md", value: "readme" },
			],
		},
		childrenHtml: "",
	},
	menu: {
		props: {
			items: [
				{ label: "Rename", value: "rename" },
				{ label: "Duplicate", value: "duplicate" },
				{ separator: true },
				{ label: "Delete", value: "delete", intent: "danger" },
			],
		},
		childrenHtml: "",
	},
	list: {
		props: {
			label: "Recent",
			items: [
				{ value: "a", label: "Anchors", trail: "3" },
				{ value: "b", label: "Knobs", trail: "8" },
			],
		},
		childrenHtml: "",
	},
	"split-button": {
		props: {
			items: [
				{ label: "Save a copy", value: "copy" },
				{ label: "Save all", value: "all" },
			],
		},
		childrenHtml: "Save",
	},
	"bottom-nav": {
		props: {
			tabs: [
				{ value: "home", label: "Home", icon: "home" },
				{ value: "search", label: "Search", icon: "search" },
				{ value: "you", label: "You", icon: "user", badge: 2 },
			],
			value: "home",
		},
		childrenHtml: "",
	},
	"command-palette": {
		props: {
			open: true,
			items: [
				{ id: "new", label: "New file", group: "File" },
				{ id: "open", label: "Open…", group: "File" },
				{ id: "theme", label: "Switch theme", group: "View" },
			],
		},
		childrenHtml: "",
	},
	combobox: {
		props: { label: "Algorithm", options: ["xtyle-default", "xtyle-hc", "xtyle-quiet"] },
		childrenHtml: "",
	},
	field: {
		props: { label: "Algorithm", options: ["xtyle-default", "xtyle-hc"] },
		childrenHtml: "",
	},
	sparkline: {
		props: { values: [3, 7, 4, 9, 6, 11, 8], label: "Throughput" },
		childrenHtml: "",
	},
	pie: {
		props: {
			data: [
				{ label: "Derived", value: 62 },
				{ label: "Pinned", value: 24 },
				{ label: "Inherited", value: 14 },
			],
		},
		childrenHtml: "",
	},
	heatmap: {
		props: {
			values: [
				[0, 2, 4],
				[3, 1, 5],
			],
			rows: ["Mon", "Tue"],
			cols: ["A", "B", "C"],
		},
		childrenHtml: "",
	},
	"theme-swatch": {
		props: { tokens: ["--bg-0", "--fg-0", "--accent", "--success"] },
		childrenHtml: "",
	},
	"theme-picker": {
		props: {
			label: "Theme",
			themes: [
				{ key: "one", name: "Default", algorithm: "xtyle-default", selected: true },
				{ key: "two", name: "High Contrast", algorithm: "xtyle-hc" },
			],
		},
		childrenHtml: "",
	},
	"date-picker": {
		props: { label: "Ships on", value: "2026-03-04", disabledWeekdays: [0, 6] },
		childrenHtml: "",
	},
	calendar: {
		props: { value: "2026-03-04", disabledDates: ["2026-03-06"] },
		childrenHtml: "",
	},
};

export const fixtures: Record<string, Fixture> = {
	...COLLECTION_FIXTURES,
	accordion: {
		props: {},
		childrenHtml:
			'<span data-xtyle-header>Section one</span><span data-xtyle-panel>First panel body.</span>',
	},
	alert: {
		props: { tone: "info", severity: "info" },
		childrenHtml: "A themed message with a little context.",
	},
	avatar: { props: { userName: "Ada Lovelace", size: "md" }, childrenHtml: "" },
	badge: { props: { tone: "success", variant: "soft" }, childrenHtml: "Live" },
	breadcrumb: {
		props: {},
		childrenHtml:
			'<a href="#">Home</a><a href="#">Library</a><span aria-current="page">Data</span>',
	},
	button: {
		props: { variant: "solid", tone: "accent", size: "md" },
		childrenHtml: "Save changes",
	},
	card: {
		props: {},
		childrenHtml: "<p>A themed surface that holds content.</p>",
	},
	checkbox: { props: { checked: true }, childrenHtml: "Remember me" },
	bar: {
		props: {
			categories: ["Q1", "Q2", "Q3", "Q4"],
			series: [
				{ name: "Web", values: [12, 19, 15, 22] },
				{ name: "Mobile", values: [8, 14, 18, 25] },
			],
			label: "Revenue by quarter",
			height: 200,
		},
		childrenHtml: "",
	},
	chart: {
		props: {
			series: [
				{
					name: "Drift",
					points: [-4, -2, 1, -3, 2, 5, 3, 6].map((value, at) => ({ at, value })),
				},
			],
			label: "Clock drift",
			height: 200,
		},
		childrenHtml: "",
	},
	code: {
		props: { lang: "ts", code: "const answer = 42;" },
		childrenHtml: "",
	},
	"color-picker": {
		props: { value: "#5b8cff", label: "Brand" },
		childrenHtml: "",
	},
	dot: { props: { tone: "success" }, childrenHtml: "" },
	eyebrow: { props: {}, childrenHtml: "Overline" },
	heading: { props: { level: 2, size: "lg" }, childrenHtml: "A themed heading" },
	kbd: { props: {}, childrenHtml: "Ctrl" },
	link: { props: { href: "#" }, childrenHtml: "A themed link" },
	markdown: {
		props: { source: "# Title\n\nSome **bold** and _italic_ copy with a [link](#)." },
		childrenHtml: "",
	},
	pagination: { props: { page: 1, total: 12, label: "Pages" }, childrenHtml: "" },
	// INFO: host CSS keys on the `variant` attribute, which wrappers set but a bare raw
	// element omits, so the raw column must set it explicitly for parity
	progress: {
		props: {
			variant: "linear",
			tone: "accent",
			size: "md",
			value: 62,
			min: 0,
			max: 100,
			ramp: ["#2b6cb0", "#c53030"],
		},
		childrenHtml: "",
	},
	select: {
		props: { label: "Timezone", name: "tz" },
		childrenHtml:
			'<option value="utc">UTC</option><option value="est" selected>Eastern</option><option value="pst">Pacific</option>',
	},
	radio: { props: { name: "g", value: "a", checked: true }, childrenHtml: "Option A" },
	rating: { props: { value: 3, max: 5 }, childrenHtml: "" },
	segmented: {
		props: {},
		childrenHtml:
			'<button data-value="a" aria-pressed="true">Day</button><button data-value="b">Week</button><button data-value="c">Month</button>',
	},
	separator: { props: {}, childrenHtml: "" },
	skeleton: { props: { shape: "text", style: "width: 12rem" }, childrenHtml: "" },
	slider: { props: { value: 40, min: 0, max: 100 }, childrenHtml: "" },
	spinner: { props: { size: "md" }, childrenHtml: "" },
	stat: { props: { label: "Tokens" }, childrenHtml: "305" },
	swatch: { props: { color: "#6ea8fe" }, childrenHtml: "" },
	switch: { props: { checked: true }, childrenHtml: "Wireless" },
	text: { props: { size: "md" }, childrenHtml: "A themed paragraph of body text." },
	textarea: { props: { value: "Some text", rows: 3 }, childrenHtml: "" },
	tooltip: { props: { text: "A themed tip" }, childrenHtml: "<button>Hover</button>" },
};

export function fixtureFor(id: string): Fixture {
	return fixtures[id] ?? DEFAULT_FIXTURE;
}
