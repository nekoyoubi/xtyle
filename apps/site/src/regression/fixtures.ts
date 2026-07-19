export interface Fixture {
	props: Record<string, unknown>;
	childrenHtml: string;
}

export const DEFAULT_FIXTURE: Fixture = { props: {}, childrenHtml: "Xtyle" };

// One canonical instance per component: the same props + children rendered
// through all three bindings, so the parity harness can prove they agree.
// Props are camelCase (the wrapper API); the raw column converts to kebab
// attributes. childrenHtml is injected identically into every column.
export const fixtures: Record<string, Fixture> = {
	accordion: {
		props: {},
		childrenHtml:
			'<xtyle-accordion-item label="Section one">First panel body.</xtyle-accordion-item>',
	},
	alert: {
		props: { tone: "info", heading: "Heads up" },
		childrenHtml: "A themed message with a little context.",
	},
	avatar: { props: { name: "Ada Lovelace", size: "md" }, childrenHtml: "" },
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
	// Match the attributes the wrappers reflect by default, so the hand-authored
	// raw column is configured identically (the host CSS keys on the `variant`
	// attribute, which the wrappers set and a bare raw element otherwise omits).
	progress: {
		props: { variant: "linear", tone: "accent", size: "md", value: 62, min: 0, max: 100 },
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
	skeleton: { props: { width: "12rem", height: "1rem" }, childrenHtml: "" },
	slider: { props: { value: 40, min: 0, max: 100 }, childrenHtml: "" },
	spinner: { props: { size: "md" }, childrenHtml: "" },
	stat: { props: { label: "Tokens", value: "305" }, childrenHtml: "" },
	swatch: { props: { color: "#6ea8fe" }, childrenHtml: "" },
	switch: { props: { checked: true }, childrenHtml: "Wireless" },
	text: { props: { size: "md" }, childrenHtml: "A themed paragraph of body text." },
	textarea: { props: { value: "Some text", rows: 3 }, childrenHtml: "" },
	tooltip: { props: { text: "A themed tip" }, childrenHtml: "<button>Hover</button>" },
};

export function fixtureFor(id: string): Fixture {
	return fixtures[id] ?? DEFAULT_FIXTURE;
}
