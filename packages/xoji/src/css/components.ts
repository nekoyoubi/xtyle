/**
 * The component class layer — the visual half of the component contract,
 * authored once here as `:host`-free, token-consuming classes so every binding
 * shares one source: `@xoji/core/elements` adopts this sheet into its shadow roots,
 * `@xoji/astro` emits the same classes into light DOM, and an app is composed
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
import { tooltipCss } from "./components/tooltip.js";
import { tabsCss } from "./components/tabs.js";
import { breadcrumbCss } from "./components/breadcrumb.js";
import { skeletonCss } from "./components/skeleton.js";
import { dialogCss } from "./components/dialog.js";
import { toastCss } from "./components/toast.js";
import { tableCss } from "./components/table.js";
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
import { barCss } from "./components/bar.js";
import { sparklineCss } from "./components/sparkline.js";
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
	"xoji-badge { display: inline-flex; }",
	"xoji-form-group { display: block; }",
	"xoji-cluster { display: block; } xoji-cluster[inline] { display: inline-block; }",
	"xoji-stack { display: block; } xoji-stack[inline] { display: inline-block; }",
	"xoji-grid { display: block; } xoji-grid[inline] { display: inline-block; }",
	"xoji-card { display: block; }",
	"xoji-heading { display: block; }",
	"xoji-eyebrow { display: block; } xoji-eyebrow[as=\"span\"] { display: inline; }",
	"xoji-stat { display: block; }",
	'xoji-separator { display: block; } xoji-separator[orientation="vertical"] { display: inline-flex; height: 100%; }',
	"xoji-panel { display: block; }",
	"xoji-section { display: block; }",
	"xoji-kbd { display: inline-block; }",
	"xoji-bar { display: block; }",
	"xoji-sparkline { display: inline-block; }",
	"xoji-pie { display: block; }",
	"xoji-spinner { display: inline-flex; }",
	"xoji-skeleton { display: block; }",
	"xoji-link { display: inline; }",
	"xoji-card-link { display: block; }",
	"xoji-avatar { display: inline-flex; }",
	"xoji-button { display: inline-flex; } xoji-button[block] { display: flex; }",
	"xoji-alert { display: block; }",
	'xoji-text { display: block; } xoji-text[as="span"] { display: inline; }',
	'xoji-progress { display: inline-flex; vertical-align: middle; } xoji-progress[variant="linear"] { display: flex; width: 100%; } xoji-progress threshold { display: none; }',
	"xoji-toast { display: block; }",
	"xoji-breadcrumb { display: block; }",
	"xoji-code { display: block; position: relative; }",
	"xoji-switch { display: inline-flex; }",
	"xoji-pagination { display: block; }",
	"xoji-segmented { display: inline-block; }",
	"xoji-swatch { display: inline-flex; }",
	"xoji-toc { display: block; }",
	"xoji-statusbar { display: block; }",
	"xoji-checkbox { display: inline-block; }",
	"xoji-radio { display: inline-flex; } xoji-radio[hidden] { display: none; }",
	"xoji-textarea { display: block; }",
	"xoji-number-input { display: inline-block; }",
	"xoji-slider { display: block; }",
	"xoji-menu { display: inline-block; }",
	"xoji-tree { display: block; }",
	"xoji-tooltip { display: inline-flex; }",
	// `> option`/`> optgroup` are the consumer's config children, kept in light DOM (hidden) for the
	// element to read on a rebuild; the visible options live inside the chrome's `<select>`.
	"xoji-select { display: block; } xoji-select > option, xoji-select > optgroup { display: none; }",
	"xoji-dialog { display: contents; }",
	'xoji-dock { display: block; min-height: 0; height: 100%; width: 18rem; } xoji-dock[size="sm"] { width: 14rem; } xoji-dock[size="lg"] { width: 22rem; }',
	"xoji-field { display: block; }",
	"xoji-splitter { display: block; flex: none; } xoji-splitter[line] { position: relative; z-index: 1; }",
	"xoji-color-picker { display: inline-block; }",
	"xoji-tabs { display: block; }",
	"xoji-accordion { display: block; }",
	'xoji-toolbar { display: block; } xoji-toolbar[sticky] { position: sticky; top: 0; z-index: var(--elevation-3); }',
	"xoji-app-shell { display: contents; }",
	// Layout-transparent region wrapper for a slot that sits inline among chrome (e.g. panel
	// actions), so light DOM has a clean `[data-slot]` to relocate into without it becoming a
	// box of its own.
	".xoji-slot { display: contents; }",
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
	tooltipCss,
	tabsCss,
	breadcrumbCss,
	skeletonCss,
	dialogCss,
	toastCss,
	tableCss,
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
	barCss,
	sparklineCss,
	pieCss,
	swatchCss,
	menuCss,
	codeCss,
	paginationCss,
].join("\n");
