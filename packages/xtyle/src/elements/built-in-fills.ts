export interface BuiltInFill {
	/** The built-in fill mod's name, so a load of the built-in itself is not mistaken for an override of it. */
	name: string;
	load(): Promise<{ manifest: unknown; fragmentSources: Record<string, string> }>;
}

/**
 * Every component slot xtyle ships a built-in fill for, keyed by the slot a mod names in its
 * `fills`. The sources load through a dynamic `import`, so the table itself costs nothing: a page
 * that installs no mod never pulls a fill through here, and one that overrides a single slot pulls
 * only that slot's built-in. The host consults it to guarantee mod-zero registers first — the
 * component runtime concatenates a fragment hook's ops in mod-registration order and the last op
 * wins, so a fill loaded after the built-in overrides it, and one loaded before it would not.
 */
const builtInFills: Record<string, BuiltInFill> = {
	"component.accordion": { name: "xtyle-accordion-default", load: () => import("./fragments/accordion/source.generated.js") },
	"component.alert": { name: "xtyle-alert-default", load: () => import("./fragments/alert/source.generated.js") },
	"component.app-shell": { name: "xtyle-app-shell-default", load: () => import("./fragments/app-shell/source.generated.js") },
	"component.avatar": { name: "xtyle-avatar-default", load: () => import("./fragments/avatar/source.generated.js") },
	"component.avatar-group": { name: "xtyle-avatar-group-default", load: () => import("./fragments/avatar-group/source.generated.js") },
	"component.badge": { name: "xtyle-badge-default", load: () => import("./fragments/badge/source.generated.js") },
	"component.bar": { name: "xtyle-bar-default", load: () => import("./fragments/bar/source.generated.js") },
	"component.bottom-nav": { name: "xtyle-bottom-nav-default", load: () => import("./fragments/bottom-nav/source.generated.js") },
	"component.breadcrumb": { name: "xtyle-breadcrumb-default", load: () => import("./fragments/breadcrumb/source.generated.js") },
	"component.button": { name: "xtyle-button-default", load: () => import("./fragments/button/source.generated.js") },
	"component.calendar": { name: "xtyle-calendar-default", load: () => import("./fragments/calendar/source.generated.js") },
	"component.card": { name: "xtyle-card-default", load: () => import("./fragments/card/source.generated.js") },
	"component.card-link": { name: "xtyle-card-link-default", load: () => import("./fragments/card-link/source.generated.js") },
	"component.carousel": { name: "xtyle-carousel-default", load: () => import("./fragments/carousel/source.generated.js") },
	"component.chart": { name: "xtyle-chart-default", load: () => import("./fragments/chart/source.generated.js") },
	"component.checkbox": { name: "xtyle-checkbox-default", load: () => import("./fragments/checkbox/source.generated.js") },
	"component.cluster": { name: "xtyle-cluster-default", load: () => import("./fragments/cluster/source.generated.js") },
	"component.code": { name: "xtyle-code-default", load: () => import("./fragments/code/source.generated.js") },
	"component.color-picker": { name: "xtyle-color-picker-default", load: () => import("./fragments/color-picker/source.generated.js") },
	"component.combobox": { name: "xtyle-combobox-default", load: () => import("./fragments/combobox/source.generated.js") },
	"component.command-palette": { name: "xtyle-command-palette-default", load: () => import("./fragments/command-palette/source.generated.js") },
	"component.date-picker": { name: "xtyle-date-picker-default", load: () => import("./fragments/date-picker/source.generated.js") },
	"component.dialog": { name: "xtyle-dialog-default", load: () => import("./fragments/dialog/source.generated.js") },
	"component.dock": { name: "xtyle-dock-default", load: () => import("./fragments/dock/source.generated.js") },
	"component.dock-zone": { name: "xtyle-dock-zone-default", load: () => import("./fragments/dock-zone/source.generated.js") },
	"component.dot": { name: "xtyle-dot-default", load: () => import("./fragments/dot/source.generated.js") },
	"component.dropzone": { name: "xtyle-dropzone-default", load: () => import("./fragments/dropzone/source.generated.js") },
	"component.eyebrow": { name: "xtyle-eyebrow-default", load: () => import("./fragments/eyebrow/source.generated.js") },
	"component.field": { name: "xtyle-field-default", load: () => import("./fragments/field/source.generated.js") },
	"component.form-group": { name: "xtyle-form-group-default", load: () => import("./fragments/form-group/source.generated.js") },
	"component.grid": { name: "xtyle-grid-default", load: () => import("./fragments/grid/source.generated.js") },
	"component.heading": { name: "xtyle-heading-default", load: () => import("./fragments/heading/source.generated.js") },
	"component.heatmap": { name: "xtyle-heatmap-default", load: () => import("./fragments/heatmap/source.generated.js") },
	"component.icon": { name: "xtyle-icon-default", load: () => import("./fragments/icon/source.generated.js") },
	"component.image": { name: "xtyle-image-default", load: () => import("./fragments/image/source.generated.js") },
	"component.kbd": { name: "xtyle-kbd-default", load: () => import("./fragments/kbd/source.generated.js") },
	"component.link": { name: "xtyle-link-default", load: () => import("./fragments/link/source.generated.js") },
	"component.menu": { name: "xtyle-menu-default", load: () => import("./fragments/menu/source.generated.js") },
	"component.mobile-shell": { name: "xtyle-mobile-shell-default", load: () => import("./fragments/mobile-shell/source.generated.js") },
	"component.number-input": { name: "xtyle-number-input-default", load: () => import("./fragments/number-input/source.generated.js") },
	"component.pagination": { name: "xtyle-pagination-default", load: () => import("./fragments/pagination/source.generated.js") },
	"component.panel": { name: "xtyle-panel-default", load: () => import("./fragments/panel/source.generated.js") },
	"component.pie": { name: "xtyle-pie-default", load: () => import("./fragments/pie/source.generated.js") },
	"component.popover": { name: "xtyle-popover-default", load: () => import("./fragments/popover/source.generated.js") },
	"component.progress": { name: "xtyle-progress-default", load: () => import("./fragments/progress/source.generated.js") },
	"component.qr": { name: "xtyle-qr-default", load: () => import("./fragments/qr/source.generated.js") },
	"component.radio": { name: "xtyle-radio-default", load: () => import("./fragments/radio/source.generated.js") },
	"component.rating": { name: "xtyle-rating-default", load: () => import("./fragments/rating/source.generated.js") },
	"component.ribbon": { name: "xtyle-ribbon-default", load: () => import("./fragments/ribbon/source.generated.js") },
	"component.section": { name: "xtyle-section-default", load: () => import("./fragments/section/source.generated.js") },
	"component.segmented": { name: "xtyle-segmented-default", load: () => import("./fragments/segmented/source.generated.js") },
	"component.select": { name: "xtyle-select-default", load: () => import("./fragments/select/source.generated.js") },
	"component.separator": { name: "xtyle-separator-default", load: () => import("./fragments/separator/source.generated.js") },
	"component.sheet": { name: "xtyle-sheet-default", load: () => import("./fragments/sheet/source.generated.js") },
	"component.spotlight": { name: "xtyle-spotlight-default", load: () => import("./fragments/spotlight/source.generated.js") },
	"component.redact": { name: "xtyle-redact-default", load: () => import("./fragments/redact/source.generated.js") },
	"component.tour": { name: "xtyle-tour-default", load: () => import("./fragments/tour/source.generated.js") },
	"component.split-button": {
		name: "xtyle-split-button-default",
		load: () => import("./fragments/split-button/source.generated.js"),
	},
	"component.skeleton": { name: "xtyle-skeleton-default", load: () => import("./fragments/skeleton/source.generated.js") },
	"component.slider": { name: "xtyle-slider-default", load: () => import("./fragments/slider/source.generated.js") },
	"component.sparkline": { name: "xtyle-sparkline-default", load: () => import("./fragments/sparkline/source.generated.js") },
	"component.spinner": { name: "xtyle-spinner-default", load: () => import("./fragments/spinner/source.generated.js") },
	"component.splitter": { name: "xtyle-splitter-default", load: () => import("./fragments/splitter/source.generated.js") },
	"component.stack": { name: "xtyle-stack-default", load: () => import("./fragments/stack/source.generated.js") },
	"component.stat": { name: "xtyle-stat-default", load: () => import("./fragments/stat/source.generated.js") },
	"component.statusbar": { name: "xtyle-statusbar-default", load: () => import("./fragments/statusbar/source.generated.js") },
	"component.steps": { name: "xtyle-steps-default", load: () => import("./fragments/steps/source.generated.js") },
	"component.swatch": { name: "xtyle-swatch-default", load: () => import("./fragments/swatch/source.generated.js") },
	"component.switch": { name: "xtyle-switch-default", load: () => import("./fragments/switch/source.generated.js") },
	"component.tabs": { name: "xtyle-tabs-default", load: () => import("./fragments/tabs/source.generated.js") },
	"component.text": { name: "xtyle-text-default", load: () => import("./fragments/text/source.generated.js") },
	"component.textarea": { name: "xtyle-textarea-default", load: () => import("./fragments/textarea/source.generated.js") },
	"component.timeline": { name: "xtyle-timeline-default", load: () => import("./fragments/timeline/source.generated.js") },
	"component.toast": { name: "xtyle-toast-default", load: () => import("./fragments/toast/source.generated.js") },
	"component.toc": { name: "xtyle-toc-default", load: () => import("./fragments/toc/source.generated.js") },
	"component.toolbar": { name: "xtyle-toolbar-default", load: () => import("./fragments/toolbar/source.generated.js") },
	"component.tooltip": { name: "xtyle-tooltip-default", load: () => import("./fragments/tooltip/source.generated.js") },
	"component.tree": { name: "xtyle-tree-default", load: () => import("./fragments/tree/source.generated.js") },
};

/** The built-in fill for a slot, or  for a slot xtyle does not ship one for. */
export function builtInFillFor(slot: string): BuiltInFill | undefined {
	return builtInFills[slot];
}

/** Every slot with a built-in fill — the drift guard's handle on the table. */
export function builtInFillSlots(): string[] {
	return Object.keys(builtInFills);
}
