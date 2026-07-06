/**
 * The component class layer — the visual half of the component contract,
 * authored once here as `:host`-free, token-consuming classes so every binding
 * shares one source: `@xtyle/core/elements` adopts this sheet into its shadow roots,
 * `@xtyle/astro` emits the same classes into light DOM, and an app is composed
 * from them.
 *
 * Each component's classes live in its own module under `./components/`;
 * `componentsCss` concatenates them. Controls and app-shell chrome (toolbar,
 * dock, panel, statusbar) are the same kind of thing — token-class components —
 * so building the app is just composition.
 */

import { baseCss } from "./components/base.js";
import { buttonCss } from "./components/button.js";
import { cardCss } from "./components/card.js";
import { fieldCss } from "./components/field.js";
import { badgeCss } from "./components/badge.js";
import { switchCss } from "./components/switch.js";
import { alertCss } from "./components/alert.js";
import { linkCss } from "./components/link.js";
import { appShellCss } from "./components/app-shell.js";
import { toolbarCss } from "./components/toolbar.js";
import { dockCss } from "./components/dock.js";
import { panelCss } from "./components/panel.js";
import { statusbarCss } from "./components/statusbar.js";
import { checkboxCss } from "./components/checkbox.js";
import { radioCss } from "./components/radio.js";
import { selectCss } from "./components/select.js";
import { textareaCss } from "./components/textarea.js";
import { formGroupCss } from "./components/form-group.js";
import { headingCss } from "./components/heading.js";
import { textCss } from "./components/text.js";
import { separatorCss } from "./components/separator.js";
import { stackCss } from "./components/stack.js";
import { clusterCss } from "./components/cluster.js";
import { gridCss } from "./components/grid.js";
import { spinnerCss } from "./components/spinner.js";
import { avatarCss } from "./components/avatar.js";
import { avatarGroupCss } from "./components/avatar-group.js";
import { tooltipCss } from "./components/tooltip.js";
import { tabsCss } from "./components/tabs.js";
import { breadcrumbCss } from "./components/breadcrumb.js";
import { skeletonCss } from "./components/skeleton.js";
import { dialogCss } from "./components/dialog.js";
import { toastCss } from "./components/toast.js";
import { tableCss } from "./components/table.js";
import { timelineCss } from "./components/timeline.js";
import { stepsCss } from "./components/steps.js";
import { ratingCss } from "./components/rating.js";
import { meterCss } from "./components/meter.js";
import { dockZoneCss } from "./components/dock-zone.js";
import { progressCss } from "./components/progress.js";
import { sliderCss } from "./components/slider.js";
import { colorPickerCss } from "./components/color-picker.js";
import { numberInputCss } from "./components/number-input.js";
import { segmentedCss } from "./components/segmented.js";
import { accordionCss } from "./components/accordion.js";
import { treeCss } from "./components/tree.js";
import { splitterCss } from "./components/splitter.js";
import { statCss } from "./components/stat.js";
import { sectionCss } from "./components/section.js";
import { eyebrowCss } from "./components/eyebrow.js";
import { cardLinkCss } from "./components/card-link.js";
import { tocCss } from "./components/toc.js";
import { kbdCss } from "./components/kbd.js";
import { iconCss } from "./components/icon.js";
import { imageCss } from "./components/image.js";
import { carouselCss } from "./components/carousel.js";
import { parallaxCss } from "./components/parallax.js";
import { heroCss } from "./components/hero.js";
import { barCss } from "./components/bar.js";
import { sparklineCss } from "./components/sparkline.js";
import { heatmapCss } from "./components/heatmap.js";
import { pieCss } from "./components/pie.js";
import { swatchCss } from "./components/swatch.js";
import { menuCss } from "./components/menu.js";
import { codeCss } from "./components/code.js";
import { paginationCss } from "./components/pagination.js";

/** Host-layout rules for elements that render to light DOM (host slot `style: "inherit"`).
 * Their `:host { display: … }` rule can't apply with no shadow, so it lives here as an
 * element selector instead. One line per migrated component; grows as elements move off the
 * shadow path, and the per-element `*HostCss` (still used by the shadow build) retires with the
 * last `isolated` consumer. */
const hostDisplayCss = [
	"xtyle-badge { display: inline-flex; }",
	"xtyle-form-group { display: block; }",
	"xtyle-cluster { display: block; } xtyle-cluster[inline] { display: inline-block; }",
	"xtyle-stack { display: block; } xtyle-stack[inline] { display: inline-block; }",
	"xtyle-grid { display: block; } xtyle-grid[inline] { display: inline-block; }",
	"xtyle-card { display: block; }",
	"xtyle-heading { display: block; }",
	"xtyle-eyebrow { display: block; } xtyle-eyebrow[as=\"span\"] { display: inline; }",
	"xtyle-stat { display: block; }",
	'xtyle-separator { display: block; } xtyle-separator[orientation="vertical"] { display: inline-flex; height: 100%; }',
	"xtyle-panel { display: block; }",
	"xtyle-section { display: block; }",
	"xtyle-kbd { display: inline-block; }",
	"xtyle-icon { display: inline-flex; }",
	"xtyle-image { display: block; }",
	"xtyle-bar { display: block; }",
	"xtyle-sparkline { display: inline-block; }",
	"xtyle-heatmap { display: block; }",
	"xtyle-pie { display: block; }",
	"xtyle-spinner { display: inline-flex; }",
	"xtyle-skeleton { display: block; }",
	"xtyle-link { display: inline; }",
	"xtyle-card-link { display: block; }",
	"xtyle-avatar { display: inline-flex; }",
	"xtyle-avatar-group { display: inline-flex; }",
	"xtyle-button { display: inline-flex; } xtyle-button[block] { display: flex; }",
	"xtyle-alert { display: block; }",
	'xtyle-text { display: block; } xtyle-text[as="span"] { display: inline; }',
	'xtyle-progress { display: inline-flex; vertical-align: middle; } xtyle-progress[variant="linear"] { display: flex; width: 100%; } xtyle-progress threshold { display: none; }',
	"xtyle-toast { display: block; }",
	"xtyle-breadcrumb { display: block; }",
	"xtyle-code { display: block; position: relative; }",
	"xtyle-switch { display: inline-flex; }",
	"xtyle-pagination { display: block; }",
	"xtyle-segmented { display: inline-block; }",
	"xtyle-swatch { display: inline-flex; }",
	"xtyle-toc { display: block; }",
	"xtyle-statusbar { display: block; }",
	"xtyle-checkbox { display: inline-block; }",
	"xtyle-radio { display: inline-flex; } xtyle-radio[hidden] { display: none; }",
	"xtyle-textarea { display: block; }",
	"xtyle-number-input { display: inline-block; }",
	"xtyle-slider { display: block; }",
	"xtyle-menu { display: inline-block; }",
	"xtyle-tree { display: block; }",
	"xtyle-tooltip { display: inline-flex; }",
	// `> option`/`> optgroup` are the consumer's config children, kept in light DOM (hidden) for the
	// element to read on a rebuild; the visible options live inside the chrome's `<select>`.
	"xtyle-select { display: block; } xtyle-select > option, xtyle-select > optgroup { display: none; }",
	"xtyle-dialog { display: contents; }",
	'xtyle-dock { display: block; min-height: 0; height: 100%; width: 18rem; } xtyle-dock[size="sm"] { width: 14rem; } xtyle-dock[size="lg"] { width: 22rem; }',
	"xtyle-field { display: block; }",
	"xtyle-splitter { display: block; flex: none; } xtyle-splitter[line] { position: relative; z-index: 1; }",
	"xtyle-color-picker { display: inline-block; }",
	"xtyle-tabs { display: block; }",
	"xtyle-accordion { display: block; }",
	'xtyle-toolbar { display: block; } xtyle-toolbar[sticky] { position: sticky; top: 0; z-index: var(--elevation-3); }',
	"xtyle-app-shell { display: contents; }",
	// Layout-transparent region wrapper for a slot that sits inline among chrome (e.g. panel
	// actions), so light DOM has a clean `[data-slot]` to relocate into without it becoming a
	// box of its own.
	".xtyle-slot { display: contents; }",
].join("\n");

/** The full component class layer, concatenated. */
export const componentsCss: string = [
	hostDisplayCss,
	baseCss,
	buttonCss,
	cardCss,
	fieldCss,
	badgeCss,
	switchCss,
	alertCss,
	linkCss,
	appShellCss,
	toolbarCss,
	dockCss,
	panelCss,
	statusbarCss,
	checkboxCss,
	radioCss,
	selectCss,
	textareaCss,
	formGroupCss,
	headingCss,
	textCss,
	separatorCss,
	stackCss,
	clusterCss,
	gridCss,
	spinnerCss,
	avatarCss,
	avatarGroupCss,
	tooltipCss,
	tabsCss,
	breadcrumbCss,
	skeletonCss,
	dialogCss,
	toastCss,
	tableCss,
	timelineCss,
	stepsCss,
	ratingCss,
	meterCss,
	dockZoneCss,
	progressCss,
	sliderCss,
	colorPickerCss,
	numberInputCss,
	segmentedCss,
	accordionCss,
	treeCss,
	splitterCss,
	statCss,
	sectionCss,
	eyebrowCss,
	cardLinkCss,
	tocCss,
	kbdCss,
	iconCss,
	imageCss,
	carouselCss,
	parallaxCss,
	heroCss,
	barCss,
	sparklineCss,
	heatmapCss,
	pieCss,
	swatchCss,
	menuCss,
	codeCss,
	paginationCss,
].join("\n");
