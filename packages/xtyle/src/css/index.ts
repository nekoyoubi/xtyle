export { utilitiesCss } from "./utilities.js";
export type { UtilityOptions } from "./utilities.js";
export { componentsCss } from "./components.js";
export { listCss } from "./components/list.js";
export { cardCss } from "./components/card.js";
export { badgeCss } from "./components/badge.js";
export { dotCss } from "./components/dot.js";
export { ribbonCss } from "./components/ribbon.js";
export { eyebrowCss } from "./components/eyebrow.js";
export { kbdCss } from "./components/kbd.js";
export { iconCss } from "./components/icon.js";
export { imageCss } from "./components/image.js";
export { carouselCss } from "./components/carousel.js";
export { timelineCss } from "./components/timeline.js";
export { stepsCss } from "./components/steps.js";
export { ratingCss } from "./components/rating.js";export { emptyCss } from "./components/empty.js";
export { parallaxCss } from "./components/parallax.js";
export { heroCss } from "./components/hero.js";
export { barCss } from "./components/bar.js";
export { chartCss } from "./components/chart.js";
export { sparklineCss } from "./components/sparkline.js";
export { heatmapCss } from "./components/heatmap.js";
export { pieCss } from "./components/pie.js";
export { statCss } from "./components/stat.js";
export { textCss } from "./components/text.js";
export { headingCss } from "./components/heading.js";
export { linkCss } from "./components/link.js";
export { separatorCss } from "./components/separator.js";
export { spinnerCss } from "./components/spinner.js";
export { skeletonCss } from "./components/skeleton.js";
export { avatarCss } from "./components/avatar.js";
export { avatarGroupCss } from "./components/avatar-group.js";
export { panelCss } from "./components/panel.js";
export { stackCss } from "./components/stack.js";
export { clusterCss } from "./components/cluster.js";
export { gridCss } from "./components/grid.js";
export { sectionCss } from "./components/section.js";
export { progressCss } from "./components/progress.js";
export { alertCss } from "./components/alert.js";
export { buttonCss } from "./components/button.js";
export { appShellCss } from "./components/app-shell.js";
export { cardLinkCss } from "./components/card-link.js";
export { checkboxCss } from "./components/checkbox.js";
export { dockCss } from "./components/dock.js";
export { fieldCss } from "./components/field.js";
export { formGroupCss } from "./components/form-group.js";
export { selectCss } from "./components/select.js";
export { switchCss } from "./components/switch.js";
export { textareaCss } from "./components/textarea.js";
export { toolbarCss } from "./components/toolbar.js";
export { tooltipCss } from "./components/tooltip.js";
export { swatchCss } from "./components/swatch.js";
export { radioCss } from "./components/radio.js";
export { toastCss } from "./components/toast.js";
export { tabsCss } from "./components/tabs.js";
export { accordionCss } from "./components/accordion.js";
export { breadcrumbCss } from "./components/breadcrumb.js";
export { colorPickerCss } from "./components/color-picker.js";
export { dialogCss } from "./components/dialog.js";
export { sheetCss } from "./components/sheet.js";
export { splitButtonCss } from "./components/split-button.js";
export { spotlightCss } from "./components/spotlight.js";
export { redactCss } from "./components/redact.js";
export { tourCss } from "./components/tour.js";
export { markdownCss } from "./components/markdown.js";
export { menuCss } from "./components/menu.js";
export { comboboxCss } from "./components/combobox.js";
export { numberInputCss } from "./components/number-input.js";
export { segmentedCss } from "./components/segmented.js";
export { sliderCss } from "./components/slider.js";
export { statusbarCss } from "./components/statusbar.js";
export { tocCss } from "./components/toc.js";
export { treeCss } from "./components/tree.js";
export { splitterCss } from "./components/splitter.js";
export { codeCss } from "./components/code.js";
export { paginationCss } from "./components/pagination.js";
export { calendarCss } from "./components/calendar.js";

import { componentsCss } from "./components.js";
import { utilitiesCss, type UtilityOptions } from "./utilities.js";
import type { TokenCategories } from "../types.js";

/**
 * The full base stylesheet: utilities generated from the given token register
 * keys, followed by the component class layer. Hand this to any consumer that
 * wants the whole vocabulary as one sheet.
 */
export function baseCss(
	tokens: string[],
	categories: TokenCategories,
	options?: UtilityOptions,
): string {
	return `${utilitiesCss(tokens, categories, options)}\n${componentsCss}`;
}

let sheet: CSSStyleSheet | null = null;

/**
 * A shared constructable stylesheet of the component layer, for adoption into
 * shadow roots (`@xtyle/core/elements`). Returns the same instance across calls so every
 * element shares one sheet; returns null outside a DOM (SSR / Node).
 */
export function componentStyleSheet(): CSSStyleSheet | null {
	if (typeof CSSStyleSheet === "undefined") return null;
	if (!sheet) {
		sheet = new CSSStyleSheet();
		sheet.replaceSync(componentsCss);
	}
	return sheet;
}
