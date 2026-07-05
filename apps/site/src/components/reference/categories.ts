import type { ComponentCategory } from "@xoji/core";

export interface CategoryMeta {
	id: ComponentCategory;
	label: string;
	blurb: string;
}

export const categoryOrder: ComponentCategory[] = [
	"shell",
	"layout",
	"control",
	"form",
	"navigation",
	"feedback",
	"overlay",
	"content",
	"media",
	"metrics",
];

export const categoryMeta: Record<ComponentCategory, CategoryMeta> = {
	shell: {
		id: "shell",
		label: "Shell",
		blurb: "The app frame: the chrome this very site is rendered in.",
	},
	layout: {
		id: "layout",
		label: "Layout",
		blurb: "The primitives that arrange everything else: stacks, clusters, grids.",
	},
	control: {
		id: "control",
		label: "Controls",
		blurb: "The things people click, toggle, and drag: buttons, switches, checkboxes, radios, sliders.",
	},
	form: {
		id: "form",
		label: "Form",
		blurb: "The fields people fill in and the structure that binds them.",
	},
	navigation: {
		id: "navigation",
		label: "Navigation",
		blurb: "The paths between views: tabs, breadcrumbs, links.",
	},
	feedback: {
		id: "feedback",
		label: "Feedback",
		blurb: "The signals that say what's happening: alerts, progress, spinners, toasts.",
	},
	overlay: {
		id: "overlay",
		label: "Overlay",
		blurb: "The layers above the page: dialogs, tooltips, toasts.",
	},
	content: {
		id: "content",
		label: "Content",
		blurb: "The shapes that carry words and structured detail: headings, prose, code, keycaps, tables.",
	},
	media: {
		id: "media",
		label: "Media",
		blurb: "The purely visual pieces: icons, images, avatars, badges, and banner canvases.",
	},
	metrics: {
		id: "metrics",
		label: "Metrics",
		blurb: "The shapes that turn numbers into a read at a glance: charts and single-figure stats.",
	},
};

export function categoryLabel(category: ComponentCategory): string {
	return categoryMeta[category]?.label ?? category;
}
