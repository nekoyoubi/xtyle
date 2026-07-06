/**
 * The component manifest registry: the single source of truth that `coverage()`,
 * the reference site, and the theme studio all read.
 *
 * ## Registering a component
 *
 * Each component ships a `ComponentManifest` from its own module under
 * `./<id>.manifest.ts` (exporting `const <camelId>Manifest: ComponentManifest`).
 * To register it, add an import next to the others and a keyed entry in the
 * `components` object, where the key is the manifest's `id` (kebab-case) and the
 * value is the imported manifest.
 *
 * The key MUST equal `manifest.id`. `getComponent`/`listComponents` and the lint
 * test both rely on that identity.
 */

import type { ComponentManifest, ComponentRegistry } from "./types.js";
import { buttonManifest } from "./button.manifest.js";
import { cardManifest } from "./card.manifest.js";
import { fieldManifest } from "./field.manifest.js";
import { badgeManifest } from "./badge.manifest.js";
import { switchManifest } from "./switch.manifest.js";
import { alertManifest } from "./alert.manifest.js";
import { linkManifest } from "./link.manifest.js";
import { appShellManifest } from "./app-shell.manifest.js";
import { toolbarManifest } from "./toolbar.manifest.js";
import { dockManifest } from "./dock.manifest.js";
import { panelManifest } from "./panel.manifest.js";
import { statusbarManifest } from "./statusbar.manifest.js";
import { checkboxManifest } from "./checkbox.manifest.js";
import { radioManifest } from "./radio.manifest.js";
import { selectManifest } from "./select.manifest.js";
import { textareaManifest } from "./textarea.manifest.js";
import { formGroupManifest } from "./form-group.manifest.js";
import { headingManifest } from "./heading.manifest.js";
import { textManifest } from "./text.manifest.js";
import { separatorManifest } from "./separator.manifest.js";
import { stackManifest } from "./stack.manifest.js";
import { clusterManifest } from "./cluster.manifest.js";
import { gridManifest } from "./grid.manifest.js";
import { spinnerManifest } from "./spinner.manifest.js";
import { avatarManifest } from "./avatar.manifest.js";
import { avatarGroupManifest } from "./avatar-group.manifest.js";
import { tooltipManifest } from "./tooltip.manifest.js";
import { tabsManifest } from "./tabs.manifest.js";
import { breadcrumbManifest } from "./breadcrumb.manifest.js";
import { skeletonManifest } from "./skeleton.manifest.js";
import { dialogManifest } from "./dialog.manifest.js";
import { toastManifest } from "./toast.manifest.js";
import { tableManifest } from "./table.manifest.js";
import { timelineManifest } from "./timeline.manifest.js";
import { stepsManifest } from "./steps.manifest.js";
import { dockZoneManifest } from "./dock-zone.manifest.js";
import { progressManifest } from "./progress.manifest.js";
import { sliderManifest } from "./slider.manifest.js";
import { colorPickerManifest } from "./color-picker.manifest.js";
import { numberInputManifest } from "./number-input.manifest.js";
import { segmentedManifest } from "./segmented.manifest.js";
import { accordionManifest } from "./accordion.manifest.js";
import { treeManifest } from "./tree.manifest.js";
import { statManifest } from "./stat.manifest.js";
import { sectionManifest } from "./section.manifest.js";
import { eyebrowManifest } from "./eyebrow.manifest.js";
import { cardLinkManifest } from "./card-link.manifest.js";
import { tocManifest } from "./toc.manifest.js";
import { kbdManifest } from "./kbd.manifest.js";
import { iconManifest } from "./icon.manifest.js";
import { imageManifest } from "./image.manifest.js";
import { carouselManifest } from "./carousel.manifest.js";
import { parallaxManifest } from "./parallax.manifest.js";
import { heroManifest } from "./hero.manifest.js";
import { barManifest } from "./bar.manifest.js";
import { sparklineManifest } from "./sparkline.manifest.js";
import { heatmapManifest } from "./heatmap.manifest.js";
import { pieManifest } from "./pie.manifest.js";
import { swatchManifest } from "./swatch.manifest.js";
import { menuManifest } from "./menu.manifest.js";
import { splitterManifest } from "./splitter.manifest.js";
import { codeManifest } from "./code.manifest.js";
import { paginationManifest } from "./pagination.manifest.js";

export const components: ComponentRegistry = {
	button: buttonManifest,
	card: cardManifest,
	field: fieldManifest,
	badge: badgeManifest,
	switch: switchManifest,
	alert: alertManifest,
	link: linkManifest,
	"app-shell": appShellManifest,
	toolbar: toolbarManifest,
	dock: dockManifest,
	panel: panelManifest,
	statusbar: statusbarManifest,
	checkbox: checkboxManifest,
	radio: radioManifest,
	select: selectManifest,
	textarea: textareaManifest,
	"form-group": formGroupManifest,
	heading: headingManifest,
	text: textManifest,
	separator: separatorManifest,
	stack: stackManifest,
	cluster: clusterManifest,
	grid: gridManifest,
	spinner: spinnerManifest,
	avatar: avatarManifest,
	"avatar-group": avatarGroupManifest,
	tooltip: tooltipManifest,
	tabs: tabsManifest,
	breadcrumb: breadcrumbManifest,
	skeleton: skeletonManifest,
	dialog: dialogManifest,
	toast: toastManifest,
	table: tableManifest,
	timeline: timelineManifest,
	steps: stepsManifest,
	"dock-zone": dockZoneManifest,
	progress: progressManifest,
	slider: sliderManifest,
	"color-picker": colorPickerManifest,
	"number-input": numberInputManifest,
	segmented: segmentedManifest,
	accordion: accordionManifest,
	tree: treeManifest,
	stat: statManifest,
	section: sectionManifest,
	eyebrow: eyebrowManifest,
	"card-link": cardLinkManifest,
	toc: tocManifest,
	kbd: kbdManifest,
	icon: iconManifest,
	image: imageManifest,
	carousel: carouselManifest,
	parallax: parallaxManifest,
	hero: heroManifest,
	bar: barManifest,
	sparkline: sparklineManifest,
	heatmap: heatmapManifest,
	pie: pieManifest,
	swatch: swatchManifest,
	menu: menuManifest,
	splitter: splitterManifest,
	code: codeManifest,
	pagination: paginationManifest,
};

export function getComponent(id: string): ComponentManifest | undefined {
	return components[id];
}

export function listComponents(): ComponentManifest[] {
	return Object.values(components);
}
