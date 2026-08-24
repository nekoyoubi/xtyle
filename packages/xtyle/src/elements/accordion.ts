import { XtyleElement, define, readAttrOrProp, readBoolAttrOrProp, type StyleMode } from "./base.js";
import type { Size } from "../index.js";
import { accordionHostCss, type AccordionSection } from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/accordion/source.generated.js";
import { resolveVocab, SIZES } from "../vocab.js";
import { iconBody } from "../icon-registry.js";

let accordionSeq = 0;

export class XtyleAccordion extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private uid = `xtyle-accordion-${accordionSeq++}`;
	private openKeys: Set<string> | null = null;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "accordion", {
		context: (handler) =>
			handler === "syncToggle" ? this.toggleContext() : handler === "navKeydown" ? this.navContext() : undefined,
		applyIntent: (intent, event) => this.applyIntent(intent, event),
	});

	static get observedAttributes(): string[] {
		return ["multiple", "size", "heading-level", "items", "chevron-icon"];
	}

	/** The roster glyph drawn as the disclosure marker. Any name the icon roster can draw, built-in
	 * or mod-contributed. */
	get chevronIcon(): string {
		return this.getAttribute("chevron-icon") || "chevron-down";
	}
	set chevronIcon(value: string) {
		this.setAttribute("chevron-icon", value);
	}

	get multiple(): boolean {
		return this.hasAttribute("multiple");
	}
	set multiple(value: boolean) {
		this.reflectBoolean("multiple", value);
	}

	get size(): Size {
		return resolveVocab(this.getAttribute("size"), SIZES, "md", "accordion size");
	}
	set size(value: Size) {
		this.setAttribute("size", value);
	}

	get headingLevel(): number {
		const level = Number(this.getAttribute("heading-level"));
		return level >= 1 && level <= 6 ? Math.floor(level) : 3;
	}

	get items(): AccordionSection[] {
		const raw = this.getAttribute("items");
		if (!raw) return [];
		try {
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			console.warn("xtyle-accordion: `items` is not valid JSON; reading the light-DOM sections instead.");
			return [];
		}
	}

	attributeChangedCallback(name: string): void {
		if (name === "items" || name === "multiple") this.openKeys = null;
		if (this.root.firstChild) this.render();
	}

	/**
	 * `data-xtyle-header` / `data-xtyle-panel` are the markers that survive every host. Astro consumes a
	 * child's `slot` attribute to route it through its own `<slot name>`, so `slot="header"` never reaches
	 * the element there; it stays supported for plain HTML and Svelte, which pass it through untouched.
	 *
	 * The unmarked fallback splits the children in half rather than pairing them two-by-two, because the
	 * markup that reaches it is grouped: a legacy `slot="header"` author under Astro has those attributes
	 * consumed, and Astro's own `<slot name>` receivers emit every header before every panel. Halving is
	 * still a guess — it cannot tell that shape apart from an author who alternated and marked nothing —
	 * so an unmarked element warns instead of pairing silently.
	 */
	private lightPairs(): { header: HTMLElement; panel: HTMLElement | null }[] {
		const direct = (Array.from(this.children) as HTMLElement[]).filter((el) => !el.hasAttribute("data-root"));
		const isPanelSlot = (slot: string | null) => slot === "panel" || (slot?.startsWith("panel-") ?? false);
		const isHeaderSlot = (slot: string | null) => slot === "header" || (slot?.startsWith("header-") ?? false);
		let headers = direct.filter((el) => el.hasAttribute("data-xtyle-header") || isHeaderSlot(el.getAttribute("slot")));
		let panels = direct.filter((el) => el.hasAttribute("data-xtyle-panel") || isPanelSlot(el.getAttribute("slot")));
		if (headers.length === 0) {
			const half = Math.ceil(direct.length / 2);
			headers = direct.slice(0, half);
			panels = direct.slice(half);
		}
		return headers.map((header, i) => ({ header, panel: panels[i] ?? null }));
	}

	private warnedUnmapped = false;

	/**
	 * Slotted mode maps children by marker, so a framework that claims `slot` before the element sees it
	 * (Astro's `<slot name>` consumes the attribute) leaves nothing to match and the sections fall to the
	 * positional fallback, which pairs plausibly but wrongly. Name the cause rather than let it drift.
	 */
	private warnIfUnmapped(): void {
		if (this.warnedUnmapped || this.items.length > 0) return;
		const authored = Array.from(this.children).filter((el) => !el.hasAttribute("data-root"));
		if (authored.length === 0) return;
		const marked = authored.some((el) => {
			if (el.hasAttribute("data-xtyle-header") || el.hasAttribute("data-xtyle-panel")) return true;
			const slot = el.getAttribute("slot") ?? "";
			return /^(header|panel)(-\d+)?$/.test(slot);
		});
		if (marked) return;
		this.warnedUnmapped = true;
		console.warn(
			"xtyle-accordion: has children but none are marked, so they were paired in order. Mark each header with `slot=\"header\"` or `data-xtyle-header`, and each panel with `slot=\"panel\"` or `data-xtyle-panel`. Under Astro use the `data-` markers: its own named-slot handling consumes `slot`.",
		);
	}

	/**
	 * Project each light-DOM panel through its own named slot so live framework
	 * content stays mounted and reactive — the snapshot path would freeze it to
	 * static HTML and strip handlers and effects.
	 */
	private assignPanelSlots(): void {
		if (this.items.length > 0) return;
		this.lightPairs().forEach((pair, i) => {
			pair.header.setAttribute("slot", `header-${i}`);
			pair.panel?.setAttribute("slot", `panel-${i}`);
		});
	}

	/**
	 * The sections a composed (Astro SSR) scaffold already holds. Slotted authoring that went through
	 * the server binding has no pairable children left — the authored header and panel sit inside the
	 * fill's own regions — so identity and open state are read back off the rendered items instead.
	 * Safe because the `update` hook only ever toggles attributes; it never rebuilds the structure, so
	 * the authored content (nested components included) is never re-rendered or lost.
	 */
	private composedSections(): AccordionSection[] | null {
		const scaffold = Array.from(this.children).find((el) => el.hasAttribute("data-root"));
		if (!scaffold) return null;
		return Array.from(scaffold.children).map((item, i) => {
			const trigger = item.querySelector(".xtyle-accordion__trigger");
			return {
				header: "",
				headerSlot: `header-${i}`,
				panel: "",
				panelSlot: `panel-${i}`,
				open: item.hasAttribute("open"),
				disabled: trigger?.getAttribute("aria-disabled") === "true",
				value: item.getAttribute("data-key") ?? String(i),
			};
		});
	}

	private get sections(): AccordionSection[] {
		const fromAttr = this.items;
		if (fromAttr.length > 0) return fromAttr;
		const composed = this.composedSections();
		if (composed) return composed;
		return this.lightPairs().map(({ header }, i) => ({
			header: "",
			headerSlot: `header-${i}`,
			panel: "",
			panelSlot: `panel-${i}`,
			open: readBoolAttrOrProp(header, "open") || header.getAttribute("aria-expanded") === "true",
			disabled: readBoolAttrOrProp(header, "disabled") || header.getAttribute("aria-disabled") === "true",
			value: readAttrOrProp(header, "value") ?? String(i),
		}));
	}

	/** The open-section keys, seeded from the sections' `open` flags (honoring single vs multiple). */
	private ensureOpen(): Set<string> {
		if (this.openKeys) return this.openKeys;
		const open = new Set<string>();
		this.sections.forEach((section, i) => {
			if (!section.open) return;
			const key = section.value ?? String(i);
			if (this.multiple) open.add(key);
			else if (open.size === 0) open.add(key);
		});
		this.openKeys = open;
		return open;
	}

	private get bindings(): Record<string, unknown> {
		return {
			sections: this.sections.map((section, i) => ({
				header: section.header,
				headerSlot: section.headerSlot,
				panel: section.panel,
				panelSlot: section.panelSlot,
				value: section.value ?? String(i),
				disabled: section.disabled,
			})),
			openKeys: [...this.ensureOpen()],
			size: this.size,
			headingLevel: this.headingLevel,
			uid: this.uid,
			multiple: this.multiple,
			chevronIcon: this.chevronIcon,
			chevronBody: iconBody(this.chevronIcon) ?? null,
		};
	}

	private toggleContext(): { multiple: boolean; openKeys: string[] } {
		return { multiple: this.multiple, openKeys: [...this.ensureOpen()] };
	}

	private navContext(): { enabledKeys: string[] } {
		const enabledKeys = this.sections
			.map((section, i) => ({ key: section.value ?? String(i), disabled: section.disabled }))
			.filter((entry) => !entry.disabled)
			.map((entry) => entry.key);
		return { enabledKeys };
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.preventDefault) event.preventDefault();
		if (intent.focus !== undefined) {
			const trigger = this.root.querySelector<HTMLElement>(
				`.xtyle-accordion__trigger[data-key="${CSS.escape(intent.focus)}"]`,
			);
			trigger?.focus();
		}
		if (intent.open !== undefined) {
			// INFO: `<details>` toggles itself before `toggle` fires, and single-open mode fires two
			// toggles per click, so re-rendering here would race the browser. Record state only.
			this.openKeys = new Set(intent.open);
			this.dispatchEvent(
				new CustomEvent("toggle", {
					bubbles: true,
					composed: true,
					detail: { open: intent.isOpen, key: intent.toggledKey },
				}),
			);
		}
	}

	override connectedCallback(): void {
		super.connectedCallback();
		this.observeChildren();
	}

	protected template(): string {
		return "";
	}

	private shapeSignature(): string {
		return JSON.stringify(
			this.sections.map((section, i) => [section.value ?? String(i), section.headerSlot, section.panelSlot]),
		);
	}

	protected override render(): void {
		this.warnIfUnmapped();
		this.assignPanelSlots();
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(accordionHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
	}
}

define("xtyle-accordion", XtyleAccordion);
