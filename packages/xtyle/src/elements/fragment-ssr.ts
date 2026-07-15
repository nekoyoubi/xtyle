import type { FragmentOp } from "@xriptjs/runtime";
import { loadFill, fillSource, type FillManifest } from "./fragment-host.js";
import { manifest as tabsManifest, fragmentSources as tabsSources } from "./fragments/tabs/source.generated.js";
import {
	manifest as accordionManifest,
	fragmentSources as accordionSources,
} from "./fragments/accordion/source.generated.js";
import { manifest as buttonManifest, fragmentSources as buttonSources } from "./fragments/button/source.generated.js";
import { manifest as switchManifest, fragmentSources as switchSources } from "./fragments/switch/source.generated.js";
import { manifest as alertManifest, fragmentSources as alertSources } from "./fragments/alert/source.generated.js";
import { manifest as appShellManifest, fragmentSources as appShellSources } from "./fragments/app-shell/source.generated.js";
import { manifest as mobileShellManifest, fragmentSources as mobileShellSources } from "./fragments/mobile-shell/source.generated.js";
import { manifest as bottomNavManifest, fragmentSources as bottomNavSources } from "./fragments/bottom-nav/source.generated.js";
import { manifest as avatarManifest, fragmentSources as avatarSources } from "./fragments/avatar/source.generated.js";
import { manifest as avatarGroupManifest, fragmentSources as avatarGroupSources } from "./fragments/avatar-group/source.generated.js";
import { manifest as badgeManifest, fragmentSources as badgeSources } from "./fragments/badge/source.generated.js";
import { manifest as dotManifest, fragmentSources as dotSources } from "./fragments/dot/source.generated.js";
import { manifest as ribbonManifest, fragmentSources as ribbonSources } from "./fragments/ribbon/source.generated.js";
import { manifest as breadcrumbManifest, fragmentSources as breadcrumbSources } from "./fragments/breadcrumb/source.generated.js";
import { manifest as cardManifest, fragmentSources as cardSources } from "./fragments/card/source.generated.js";
import { manifest as cardLinkManifest, fragmentSources as cardLinkSources } from "./fragments/card-link/source.generated.js";
import { manifest as checkboxManifest, fragmentSources as checkboxSources } from "./fragments/checkbox/source.generated.js";
import { manifest as clusterManifest, fragmentSources as clusterSources } from "./fragments/cluster/source.generated.js";
import { manifest as colorPickerManifest, fragmentSources as colorPickerSources } from "./fragments/color-picker/source.generated.js";
import { manifest as dialogManifest, fragmentSources as dialogSources } from "./fragments/dialog/source.generated.js";
import { manifest as dockManifest, fragmentSources as dockSources } from "./fragments/dock/source.generated.js";
import { manifest as eyebrowManifest, fragmentSources as eyebrowSources } from "./fragments/eyebrow/source.generated.js";
import { manifest as fieldManifest, fragmentSources as fieldSources } from "./fragments/field/source.generated.js";
import { manifest as formGroupManifest, fragmentSources as formGroupSources } from "./fragments/form-group/source.generated.js";
import { manifest as gridManifest, fragmentSources as gridSources } from "./fragments/grid/source.generated.js";
import { manifest as headingManifest, fragmentSources as headingSources } from "./fragments/heading/source.generated.js";
import { manifest as kbdManifest, fragmentSources as kbdSources } from "./fragments/kbd/source.generated.js";
import { manifest as iconManifest, fragmentSources as iconSources } from "./fragments/icon/source.generated.js";
import { manifest as imageManifest, fragmentSources as imageSources } from "./fragments/image/source.generated.js";
import { manifest as barManifest, fragmentSources as barSources } from "./fragments/bar/source.generated.js";
import { manifest as chartManifest, fragmentSources as chartSources } from "./fragments/chart/source.generated.js";
import { manifest as sparklineManifest, fragmentSources as sparklineSources } from "./fragments/sparkline/source.generated.js";
import { manifest as heatmapManifest, fragmentSources as heatmapSources } from "./fragments/heatmap/source.generated.js";
import { manifest as pieManifest, fragmentSources as pieSources } from "./fragments/pie/source.generated.js";
import { manifest as qrManifest, fragmentSources as qrSources } from "./fragments/qr/source.generated.js";
import { manifest as linkManifest, fragmentSources as linkSources } from "./fragments/link/source.generated.js";
import { manifest as menuManifest, fragmentSources as menuSources } from "./fragments/menu/source.generated.js";
import { manifest as popoverManifest, fragmentSources as popoverSources } from "./fragments/popover/source.generated.js";
import {
	manifest as commandPaletteManifest,
	fragmentSources as commandPaletteSources,
} from "./fragments/command-palette/source.generated.js";
import { manifest as numberInputManifest, fragmentSources as numberInputSources } from "./fragments/number-input/source.generated.js";
import { manifest as datePickerManifest, fragmentSources as datePickerSources } from "./fragments/date-picker/source.generated.js";
import { manifest as panelManifest, fragmentSources as panelSources } from "./fragments/panel/source.generated.js";
import { manifest as progressManifest, fragmentSources as progressSources } from "./fragments/progress/source.generated.js";
import { manifest as radioManifest, fragmentSources as radioSources } from "./fragments/radio/source.generated.js";
import { manifest as sectionManifest, fragmentSources as sectionSources } from "./fragments/section/source.generated.js";
import { manifest as segmentedManifest, fragmentSources as segmentedSources } from "./fragments/segmented/source.generated.js";
import { manifest as selectManifest, fragmentSources as selectSources } from "./fragments/select/source.generated.js";
import { manifest as separatorManifest, fragmentSources as separatorSources } from "./fragments/separator/source.generated.js";
import { manifest as skeletonManifest, fragmentSources as skeletonSources } from "./fragments/skeleton/source.generated.js";
import { manifest as sliderManifest, fragmentSources as sliderSources } from "./fragments/slider/source.generated.js";
import { manifest as spinnerManifest, fragmentSources as spinnerSources } from "./fragments/spinner/source.generated.js";
import { manifest as splitterManifest, fragmentSources as splitterSources } from "./fragments/splitter/source.generated.js";
import { manifest as stackManifest, fragmentSources as stackSources } from "./fragments/stack/source.generated.js";
import { manifest as statManifest, fragmentSources as statSources } from "./fragments/stat/source.generated.js";
import { manifest as statusbarManifest, fragmentSources as statusbarSources } from "./fragments/statusbar/source.generated.js";
import { manifest as swatchManifest, fragmentSources as swatchSources } from "./fragments/swatch/source.generated.js";
import { manifest as textManifest, fragmentSources as textSources } from "./fragments/text/source.generated.js";
import { manifest as textareaManifest, fragmentSources as textareaSources } from "./fragments/textarea/source.generated.js";
import { manifest as toastManifest, fragmentSources as toastSources } from "./fragments/toast/source.generated.js";
import { manifest as tocManifest, fragmentSources as tocSources } from "./fragments/toc/source.generated.js";
import { manifest as toolbarManifest, fragmentSources as toolbarSources } from "./fragments/toolbar/source.generated.js";
import { manifest as tooltipManifest, fragmentSources as tooltipSources } from "./fragments/tooltip/source.generated.js";
import { manifest as treeManifest, fragmentSources as treeSources } from "./fragments/tree/source.generated.js";
import { manifest as codeManifest, fragmentSources as codeSources } from "./fragments/code/source.generated.js";
import { manifest as paginationManifest, fragmentSources as paginationSources } from "./fragments/pagination/source.generated.js";
import { manifest as calendarManifest, fragmentSources as calendarSources } from "./fragments/calendar/source.generated.js";
import { manifest as carouselManifest, fragmentSources as carouselSources } from "./fragments/carousel/source.generated.js";
import { manifest as dockZoneManifest, fragmentSources as dockZoneSources } from "./fragments/dock-zone/source.generated.js";
import { manifest as stepsManifest, fragmentSources as stepsSources } from "./fragments/steps/source.generated.js";
import { manifest as timelineManifest, fragmentSources as timelineSources } from "./fragments/timeline/source.generated.js";
import { manifest as ratingManifest, fragmentSources as ratingSources } from "./fragments/rating/source.generated.js";
import { manifest as dropzoneManifest, fragmentSources as dropzoneSources } from "./fragments/dropzone/source.generated.js";
import { manifest as comboboxManifest, fragmentSources as comboboxSources } from "./fragments/combobox/source.generated.js";
import { manifest as sheetManifest, fragmentSources as sheetSources } from "./fragments/sheet/source.generated.js";
import {
	manifest as splitButtonManifest,
	fragmentSources as splitButtonSources,
} from "./fragments/split-button/source.generated.js";
import {
	manifest as spotlightManifest,
	fragmentSources as spotlightSources,
} from "./fragments/spotlight/source.generated.js";
import { manifest as redactManifest, fragmentSources as redactSources } from "./fragments/redact/source.generated.js";
import { manifest as tourManifest, fragmentSources as tourSources } from "./fragments/tour/source.generated.js";

interface FragmentEntry {
	manifest: FillManifest;
	fragmentSources: Record<string, string>;
}

/**
 * The built-in fills, keyed by component, so a binding's SSR import is one stable
 * subpath (`@xtyle/core/elements/ssr`) rather than a per-component deep path — which a
 * dev dep-optimizer would not know about until a restart.
 */
const fragments: Record<string, FragmentEntry> = {
	tabs: { manifest: tabsManifest, fragmentSources: tabsSources },
	accordion: { manifest: accordionManifest, fragmentSources: accordionSources },
	button: { manifest: buttonManifest, fragmentSources: buttonSources },
	switch: { manifest: switchManifest, fragmentSources: switchSources },
	alert: { manifest: alertManifest, fragmentSources: alertSources },
	"app-shell": { manifest: appShellManifest, fragmentSources: appShellSources },
	"mobile-shell": { manifest: mobileShellManifest, fragmentSources: mobileShellSources },
	"bottom-nav": { manifest: bottomNavManifest, fragmentSources: bottomNavSources },
	avatar: { manifest: avatarManifest, fragmentSources: avatarSources },
	"avatar-group": { manifest: avatarGroupManifest, fragmentSources: avatarGroupSources },
	badge: { manifest: badgeManifest, fragmentSources: badgeSources },
	dot: { manifest: dotManifest, fragmentSources: dotSources },
	ribbon: { manifest: ribbonManifest, fragmentSources: ribbonSources },
	breadcrumb: { manifest: breadcrumbManifest, fragmentSources: breadcrumbSources },
	card: { manifest: cardManifest, fragmentSources: cardSources },
	"card-link": { manifest: cardLinkManifest, fragmentSources: cardLinkSources },
	checkbox: { manifest: checkboxManifest, fragmentSources: checkboxSources },
	cluster: { manifest: clusterManifest, fragmentSources: clusterSources },
	"color-picker": { manifest: colorPickerManifest, fragmentSources: colorPickerSources },
	dialog: { manifest: dialogManifest, fragmentSources: dialogSources },
	dock: { manifest: dockManifest, fragmentSources: dockSources },
	eyebrow: { manifest: eyebrowManifest, fragmentSources: eyebrowSources },
	field: { manifest: fieldManifest, fragmentSources: fieldSources },
	"form-group": { manifest: formGroupManifest, fragmentSources: formGroupSources },
	grid: { manifest: gridManifest, fragmentSources: gridSources },
	heading: { manifest: headingManifest, fragmentSources: headingSources },
	kbd: { manifest: kbdManifest, fragmentSources: kbdSources },
	icon: { manifest: iconManifest, fragmentSources: iconSources },
	image: { manifest: imageManifest, fragmentSources: imageSources },
	bar: { manifest: barManifest, fragmentSources: barSources },
	chart: { manifest: chartManifest, fragmentSources: chartSources },
	sparkline: { manifest: sparklineManifest, fragmentSources: sparklineSources },
	heatmap: { manifest: heatmapManifest, fragmentSources: heatmapSources },
	pie: { manifest: pieManifest, fragmentSources: pieSources },
	qr: { manifest: qrManifest, fragmentSources: qrSources },
	link: { manifest: linkManifest, fragmentSources: linkSources },
	menu: { manifest: menuManifest, fragmentSources: menuSources },
	popover: { manifest: popoverManifest, fragmentSources: popoverSources },
	"command-palette": { manifest: commandPaletteManifest, fragmentSources: commandPaletteSources },
	"number-input": { manifest: numberInputManifest, fragmentSources: numberInputSources },
	"date-picker": { manifest: datePickerManifest, fragmentSources: datePickerSources },
	panel: { manifest: panelManifest, fragmentSources: panelSources },
	progress: { manifest: progressManifest, fragmentSources: progressSources },
	radio: { manifest: radioManifest, fragmentSources: radioSources },
	section: { manifest: sectionManifest, fragmentSources: sectionSources },
	segmented: { manifest: segmentedManifest, fragmentSources: segmentedSources },
	select: { manifest: selectManifest, fragmentSources: selectSources },
	separator: { manifest: separatorManifest, fragmentSources: separatorSources },
	skeleton: { manifest: skeletonManifest, fragmentSources: skeletonSources },
	slider: { manifest: sliderManifest, fragmentSources: sliderSources },
	spinner: { manifest: spinnerManifest, fragmentSources: spinnerSources },
	splitter: { manifest: splitterManifest, fragmentSources: splitterSources },
	stack: { manifest: stackManifest, fragmentSources: stackSources },
	stat: { manifest: statManifest, fragmentSources: statSources },
	statusbar: { manifest: statusbarManifest, fragmentSources: statusbarSources },
	swatch: { manifest: swatchManifest, fragmentSources: swatchSources },
	text: { manifest: textManifest, fragmentSources: textSources },
	textarea: { manifest: textareaManifest, fragmentSources: textareaSources },
	toast: { manifest: toastManifest, fragmentSources: toastSources },
	toc: { manifest: tocManifest, fragmentSources: tocSources },
	toolbar: { manifest: toolbarManifest, fragmentSources: toolbarSources },
	tooltip: { manifest: tooltipManifest, fragmentSources: tooltipSources },
	tree: { manifest: treeManifest, fragmentSources: treeSources },
	code: { manifest: codeManifest, fragmentSources: codeSources },
	pagination: { manifest: paginationManifest, fragmentSources: paginationSources },
	calendar: { manifest: calendarManifest, fragmentSources: calendarSources },
	carousel: { manifest: carouselManifest, fragmentSources: carouselSources },
	"dock-zone": { manifest: dockZoneManifest, fragmentSources: dockZoneSources },
	steps: { manifest: stepsManifest, fragmentSources: stepsSources },
	timeline: { manifest: timelineManifest, fragmentSources: timelineSources },
	rating: { manifest: ratingManifest, fragmentSources: ratingSources },
	dropzone: { manifest: dropzoneManifest, fragmentSources: dropzoneSources },
	combobox: { manifest: comboboxManifest, fragmentSources: comboboxSources },
	sheet: { manifest: sheetManifest, fragmentSources: sheetSources },
	"split-button": { manifest: splitButtonManifest, fragmentSources: splitButtonSources },
	spotlight: { manifest: spotlightManifest, fragmentSources: spotlightSources },
	redact: { manifest: redactManifest, fragmentSources: redactSources },
	tour: { manifest: tourManifest, fragmentSources: tourSources },
};

/** The component ids that have a built-in SSR fill registered, so a parity test can guard the set. */
export function ssrFragments(): string[] {
	return Object.keys(fragments);
}

function escapeAttr(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * The open tag this selector resolves against, as a regex. Two shapes are understood, and the pair is the
 * whole reason a fill can be both server-rendered and overridable:
 *
 * - `[data-x]` — an attribute marker. The handler contract: the hooks a mod keeps in order to inherit the
 *   built-in's behavior.
 * - `.xtyle-foo` — a class. The built-in fill's *own* name for a node. A fill paints its bindings onto its
 *   chrome through these, so a mod that renamed the node matches none of them and is left alone; keyed to
 *   the shared `data-*` hook instead, the built-in's classes get stamped onto the mod's markup on the way
 *   to the screen and the reskin is dead on arrival.
 */
function nodeMatcher(selector: string): RegExp | null {
	const attr = selector.match(/^\[([a-z-]+)\]$/i)?.[1];
	if (attr) return new RegExp(`<(\\w+)([^>]*\\b${attr}\\b[^>]*)>`);
	const className = selector.match(/^\.([\w-]+)$/)?.[1];
	if (className) return new RegExp(`<(\\w+)([^>]*\\sclass="[^"]*\\b${className}\\b[^"]*"[^>]*)>`);
	return null;
}

function setAttrInTag(openTag: string, attr: string, value: string): string {
	const existing = new RegExp(`\\s${attr}="[^"]*"`);
	if (value === "") return openTag.replace(existing, "");
	const attrStr = ` ${attr}="${escapeAttr(value)}"`;
	if (existing.test(openTag)) return openTag.replace(existing, () => attrStr);
	return openTag.replace(/\s*\/?>$/, (close) => `${attrStr}${close}`);
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Applies a fill's `FragmentOp` command buffer to its scaffold HTML in Node, where
 * there is no live DOM — the build-time counterpart of the browser op-applier. It
 * targets attribute-marker (`[data-x]`) and class (`.xtyle-foo`) selectors against the
 * inert scaffolds xtyle authors for its built-in fills; arbitrary app-fill structures
 * are a runtime concern, served by the live-DOM path.
 */
export function applyOpsToHtml(html: string, ops: FragmentOp[]): string {
	let out = html;
	for (const op of ops) {
		const openRe = nodeMatcher(op.selector);
		if (!openRe) continue;
		const match = out.match(openRe);
		const openTag = match?.[0];
		const tag = match?.[1];
		if (!openTag || !tag) continue;
		const empty = new RegExp(`(${escapeRegExp(openTag)})(</${tag}>)`);
		switch (op.op) {
			case "setAttr":
				if (op.attr) {
					const next = setAttrInTag(openTag, op.attr, String(op.value ?? ""));
					out = out.replace(openTag, () => next);
				}
				break;
			case "replaceChildren": {
				const value = String(op.value ?? "");
				out = out.replace(empty, (_m, open, close) => `${open}${value}${close}`);
				break;
			}
			case "setText": {
				const value = escapeAttr(String(op.value ?? ""));
				out = out.replace(empty, (_m, open, close) => `${open}${value}${close}`);
				break;
			}
			case "addClass":
			case "removeClass":
			case "toggle":
				break;
		}
	}
	return out;
}

/**
 * Renders a component fill to a declarative-shadow-root string at build time: drives the
 * runtime in Node, fires the `update` hook, and applies the returned ops to the scaffold.
 * The output is byte-identical to the browser's first render, so hydration re-applies onto
 * it without a wipe.
 */
export async function renderFragment(
	component: string,
	bindings: Record<string, unknown>,
	styles: string,
): Promise<string> {
	const entry = fragments[component];
	if (!entry) throw new Error(`xtyle: no SSR fragment registered for "${component}"`);
	const { runtime } = await loadFill(entry.manifest, entry.fragmentSources);
	const scaffold = entry.fragmentSources[fillSource(entry.manifest, component)] ?? "";
	const ops = runtime.fireFragmentHook(component, "mount", bindings);
	return `<style>${styles}</style>${applyOpsToHtml(scaffold, ops)}`;
}

/**
 * Compose a fallback-bearing slot region in a light-DOM SSR string. A fill marks such a region with
 * a native `<slot name="…">…</slot>` whose children are the fallback (alert's severity glyph,
 * progress's computed readout) — the same markup shadow projection uses directly. When the consumer
 * filled the slot (`rendered` is a string), the whole slot element is replaced by the consumer's
 * render; when they didn't (`rendered` is `null`), the slot tags are stripped and the fallback
 * (already populated by the mount hook's ops) stands. Empty-fallback regions keep using a bare
 * `<slot name="…"></slot>` `.replace`.
 */
export function composeFallbackSlot(html: string, name: string, rendered: string | null): string {
	const slot = new RegExp(`<slot name="${name}">([\\s\\S]*?)</slot>`);
	if (rendered === null) return html.replace(slot, (_match, fallback) => fallback);
	return html.replace(slot, () => rendered);
}

/**
 * Light-DOM SSR: emit the resolved scaffold with the mount hook's ops applied, but no
 * `<style>` — an element rendering into light DOM leans on the already-global component
 * sheet instead of an inlined-per-instance copy. The result still carries any native
 * `<slot>` the fill places where consumer content belongs; the binding replaces that slot
 * with the slot's rendered HTML so the static (zero-JS) render is correct without the
 * runtime ever loading. The same `<slot>` markup drives shadow projection in the framework
 * path, so structure stays single-sourced across both modes.
 */
export async function renderFragmentLight(
	component: string,
	bindings: Record<string, unknown>,
): Promise<string> {
	const entry = fragments[component];
	if (!entry) throw new Error(`xtyle: no SSR fragment registered for "${component}"`);
	const { runtime } = await loadFill(entry.manifest, entry.fragmentSources);
	const scaffold = entry.fragmentSources[fillSource(entry.manifest, component)] ?? "";
	const ops = runtime.fireFragmentHook(component, "mount", bindings);
	return applyOpsToHtml(scaffold, ops);
}
