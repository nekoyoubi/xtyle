import { XtyleElement, define, readAttrOrProp, readBoolAttrOrProp, type StyleMode } from "./base.js";
import type { Size } from "../index.js";
import { accordionHostCss, type AccordionSection } from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/accordion/source.generated.js";

let accordionSeq = 0;

export class XtyleAccordion extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private uid = `xtyle-accordion-${accordionSeq++}`;
	private openKeys: Set<string> | null = null;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "accordion", {
		context: (handler) =>
			handler === "toggleSection" ? this.toggleContext() : handler === "navKeydown" ? this.navContext() : undefined,
		applyIntent: (intent, event) => this.applyIntent(intent, event),
	});

	static get observedAttributes(): string[] {
		return ["multiple", "size", "heading-level", "items"];
	}

	get multiple(): boolean {
		return this.hasAttribute("multiple");
	}
	set multiple(value: boolean) {
		this.reflectBoolean("multiple", value);
	}

	get size(): Size {
		return (this.getAttribute("size") as Size) ?? "md";
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

	private lightPairs(): { header: HTMLElement; panel: HTMLElement | null }[] {
		let headers = Array.from(this.querySelectorAll<HTMLElement>(':scope > [slot="header"]'));
		let panels = Array.from(this.querySelectorAll<HTMLElement>(':scope > [slot="panel"], :scope > [slot^="panel-"]'));
		if (headers.length === 0) {
			const direct = Array.from(this.children) as HTMLElement[];
			const half = Math.ceil(direct.length / 2);
			headers = direct.slice(0, half);
			panels = direct.slice(half);
		}
		return headers.map((header, i) => ({ header, panel: panels[i] ?? null }));
	}

	/**
	 * Project each light-DOM panel through its own named slot so live framework
	 * content stays mounted and reactive — the snapshot path would freeze it to
	 * static HTML and strip handlers and effects.
	 */
	private assignPanelSlots(): void {
		if (this.items.length > 0) return;
		this.lightPairs().forEach((pair, i) => pair.panel?.setAttribute("slot", `panel-${i}`));
	}

	private get sections(): AccordionSection[] {
		const fromAttr = this.items;
		if (fromAttr.length > 0) return fromAttr;
		return this.lightPairs().map(({ header }, i) => ({
			header: header.innerHTML,
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
				panel: section.panel,
				panelSlot: section.panelSlot,
				value: section.value ?? String(i),
				disabled: section.disabled,
			})),
			openKeys: [...this.ensureOpen()],
			size: this.size,
			headingLevel: this.headingLevel,
			uid: this.uid,
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
			this.openKeys = new Set(intent.open);
			this.render();
			this.dispatchEvent(
				new CustomEvent("toggle", {
					bubbles: true,
					composed: true,
					detail: { open: intent.isOpen, key: intent.toggledKey },
				}),
			);
		}
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.assignPanelSlots();
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(accordionHostCss);
		this.fragment.update(this.bindings);
	}
}

define("xtyle-accordion", XtyleAccordion);
