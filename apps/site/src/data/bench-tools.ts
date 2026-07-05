/** The Bench tools — the interactive studios under the Bench nav category. One registry drives the
 * nav entries (and their "new" badges), the tools count/stat, and any future tool index. Add a tool
 * here and its count, badge, and nav row follow. */
export interface BenchTool {
	id: string;
	label: string;
	href: string;
	/** The version the tool first shipped in; drives the "new" badge the same way a component's `since` does. */
	since: string;
}

export const BENCH_TOOLS: BenchTool[] = [
	{ id: "themes", label: "Themes", href: "/bench/themes", since: "0.2.0" },
	{ id: "icons", label: "Icons", href: "/bench/icons", since: "0.4.0" },
];
