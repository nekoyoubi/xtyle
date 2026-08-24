export interface BenchTab {
	value: string;
	label: string;
}

export interface BenchView {
	view: string;
	scene: string;
}

export const MAIN_TABS: BenchTab[] = [
	{ value: "mockups", label: "Mockups" },
	{ value: "components", label: "Components" },
	{ value: "report", label: "Report" },
	{ value: "export", label: "Export" },
	{ value: "help", label: "Help" },
];

export const MOCKUP_TABS: BenchTab[] = [
	{ value: "email", label: "Email Client" },
	{ value: "news", label: "News Site" },
	{ value: "crm", label: "CRM App" },
	{ value: "settings", label: "Settings" },
	{ value: "dashboard", label: "Dashboard" },
	{ value: "editor", label: "Editor" },
	{ value: "order", label: "Order Status" },
	{ value: "brand", label: "Brand Site" },
	{ value: "music", label: "Music Player" },
	{ value: "docs", label: "Docs Reader" },
	{ value: "composer", label: "Composer" },
	{ value: "support", label: "Support Inbox" },
	{ value: "share", label: "Theme Share" },
	{ value: "workspace", label: "Workspace" },
	{ value: "field", label: "Field Notes" },
	{ value: "forum", label: "Forum Thread" },
	{ value: "ops", label: "Ops Console" },
	{ value: "review", label: "Design Review" },
	{ value: "firstrun", label: "First Run" },
	{ value: "launch", label: "Launch Page" },
];

export const COMPONENT_TABS: BenchTab[] = [
	{ value: "buttons", label: "Buttons" },
	{ value: "form", label: "Form" },
	{ value: "feedback", label: "Feedback" },
	{ value: "navigation", label: "Navigation" },
	{ value: "data", label: "Data" },
	{ value: "typography", label: "Type" },
	{ value: "overlays", label: "Overlays" },
];

export const REPORT_TABS: BenchTab[] = [
	{ value: "contrast", label: "Contrast" },
	{ value: "coverage", label: "Coverage" },
	{ value: "gamut", label: "Gamut" },
	{ value: "graph", label: "Graph" },
];

export const EXPORT_TABS: BenchTab[] = [
	{ value: "invocation", label: "Invocation" },
	{ value: "css", label: "CSS" },
	{ value: "tokens", label: "Tokens" },
	{ value: "theme", label: "Theme" },
];

export const HELP_TABS: BenchTab[] = [
	{ value: "overview", label: "Overview" },
	{ value: "tiers", label: "Input tiers" },
	{ value: "authoring", label: "Authoring" },
];

export const SCENES: Record<string, BenchTab[]> = {
	mockups: MOCKUP_TABS,
	components: COMPONENT_TABS,
	report: REPORT_TABS,
	export: EXPORT_TABS,
	help: HELP_TABS,
};

const DEFAULT_VIEW = MAIN_TABS[0].value;

export function defaultScene(view: string): string {
	return SCENES[view]?.[0]?.value ?? "";
}

const known = (tabs: BenchTab[], value: string | null): value is string =>
	value !== null && tabs.some((tab) => tab.value === value);

export function readView(search: string): BenchView {
	const params = new URLSearchParams(search);
	const requested = params.get("view");
	const view = known(MAIN_TABS, requested) ? requested : DEFAULT_VIEW;
	const scene = params.get("scene");
	return { view, scene: known(SCENES[view] ?? [], scene) ? scene : defaultScene(view) };
}

export function applyView(search: string, next: BenchView): string {
	const params = new URLSearchParams(search);
	if (next.view === DEFAULT_VIEW && next.scene === defaultScene(next.view)) {
		params.delete("view");
		params.delete("scene");
	} else {
		params.set("view", next.view);
		params.set("scene", next.scene);
	}
	const query = params.toString();
	return query ? `?${query}` : "";
}
