import { XtyleElement, define, readAttrOrProp, readBoolAttrOrProp, type StyleMode } from "./base.js";
import type { Size } from "../index.js";
import { tabsHostCss, type TabItemData, type TabsVariant, type TabsActivation } from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/tabs/source.generated.js";

let tabsSeq = 0;

interface TabPair {
	tab: HTMLElement;
	panel: HTMLElement | null;
	disabled: boolean;
}

interface NavContext {
	keys: string[];
	enabledKeys: string[];
	activation: TabsActivation;
}

export class XtyleTabs extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private uid = `xtyle-tabs-${tabsSeq++}`;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "tabs", {
		context: (handler) => (handler === "navKeydown" ? this.navContext() : undefined),
		applyIntent: (intent, event) => this.applyIntent(intent, event),
	});

	static get observedAttributes(): string[] {
		return ["variant", "size", "activation", "value", "label", "labelledby", "items", "sticky", "tablist"];
	}

	get variant(): TabsVariant {
		return (this.getAttribute("variant") as TabsVariant) ?? "underline";
	}
	set variant(value: TabsVariant) {
		this.setAttribute("variant", value);
	}

	get size(): Size {
		return (this.getAttribute("size") as Size) ?? "md";
	}
	set size(value: Size) {
		this.setAttribute("size", value);
	}

	get activation(): TabsActivation {
		return this.getAttribute("activation") === "manual" ? "manual" : "automatic";
	}
	set activation(value: TabsActivation) {
		this.setAttribute("activation", value);
	}

	get value(): string | null {
		return this.getAttribute("value");
	}
	set value(value: string | null | undefined) {
		this.reflectString("value", value);
	}

	get sticky(): boolean {
		return this.hasAttribute("sticky");
	}
	set sticky(value: boolean) {
		this.reflectBoolean("sticky", value);
	}

	get tablist(): boolean {
		return this.hasAttribute("tablist");
	}
	set tablist(value: boolean) {
		this.reflectBoolean("tablist", value);
	}

	get items(): TabItemData[] {
		const raw = this.getAttribute("items");
		if (!raw) return [];
		try {
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			console.warn("xtyle-tabs: `items` is not valid JSON; reading the light-DOM tabs instead.");
			return [];
		}
	}

	private settleHandle = 0;

	override connectedCallback(): void {
		super.connectedCallback();
		this.scheduleSettle();
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		if (this.settleHandle && typeof cancelAnimationFrame !== "undefined") {
			cancelAnimationFrame(this.settleHandle);
		}
		this.settleHandle = 0;
	}

	/**
	 * Re-assert the panel↔slot mapping once the DOM settles after connect. A view-transition
	 * swap (Astro's ClientRouter) or a framework re-render can connect this element while a
	 * stale panel from the outgoing tree is still present, inflating the panel query and
	 * shifting the index-based slot assignment by one — which leaves the last panel unslotted,
	 * and an unslotted node inherits nothing, so its themed content renders unstyled until the
	 * next render. A second pass on the next frame runs against the settled child set.
	 */
	private scheduleSettle(): void {
		if (typeof requestAnimationFrame === "undefined") return;
		if (this.settleHandle) cancelAnimationFrame(this.settleHandle);
		this.settleHandle = requestAnimationFrame(() => {
			this.settleHandle = 0;
			if (this.isConnected && this.root.firstChild) this.render();
		});
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get pairs(): TabPair[] {
		let tabs = Array.from(this.querySelectorAll<HTMLElement>(':scope > [slot="tab"]'));
		let panels = Array.from(this.querySelectorAll<HTMLElement>(':scope > [slot="panel"], :scope > [slot^="panel-"]'));
		if (tabs.length === 0) {
			const direct = Array.from(this.children) as HTMLElement[];
			tabs = direct.filter((el) => el.tagName === "BUTTON");
			panels = direct.filter((el) => el.tagName !== "BUTTON");
		}
		return tabs.map((tab, i) => ({
			tab,
			panel: panels[i] ?? null,
			disabled: readBoolAttrOrProp(tab, "disabled") || tab.getAttribute("aria-disabled") === "true",
		}));
	}

	/**
	 * Project each light-DOM panel through its own named slot so live framework
	 * content stays mounted and reactive — the snapshot path would freeze it to
	 * static HTML and strip handlers and effects.
	 */
	private assignPanelSlots(): void {
		if (this.tablist || this.items.length > 0) return;
		this.pairs.forEach((pair, i) => pair.panel?.setAttribute("slot", `panel-${i}`));
	}

	private get markupItems(): TabItemData[] {
		const fromAttr = this.items;
		if (fromAttr.length > 0) return fromAttr;
		return this.pairs.map((pair, i) => ({
			label: pair.tab.innerHTML,
			panel: "",
			panelSlot: `panel-${i}`,
			value: readAttrOrProp(pair.tab, "value") ?? String(i),
			disabled: pair.disabled,
		}));
	}

	private get bindings(): Record<string, unknown> {
		return {
			tabs: this.markupItems.map((item, i) => ({
				key: item.value ?? String(i),
				label: item.label,
				panelSlot: item.panelSlot,
				panel: item.panel ?? "",
				disabled: item.disabled,
			})),
			activeId: this.value,
			variant: this.variant,
			size: this.size,
			sticky: this.sticky,
			tablist: this.tablist,
			label: this.getAttribute("label"),
			labelledby: this.getAttribute("labelledby"),
			uid: this.uid,
		};
	}

	private navContext(): NavContext {
		const items = this.markupItems;
		const keys = items.map((item, i) => item.value ?? String(i));
		const enabledKeys = items
			.map((item, i) => ({ key: item.value ?? String(i), disabled: item.disabled }))
			.filter((entry) => !entry.disabled)
			.map((entry) => entry.key);
		return { keys, enabledKeys, activation: this.activation };
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.preventDefault) event.preventDefault();
		if (intent.select !== undefined) {
			this.setAttribute("value", intent.select);
			this.dispatchEvent(new CustomEvent("change", { bubbles: true, composed: true, detail: { value: intent.select } }));
		}
		if (intent.focus !== undefined) {
			const tab = this.root.querySelector<HTMLElement>(`[role="tab"][data-key="${CSS.escape(intent.focus)}"]`);
			tab?.focus();
		}
	}

	private warnIfUnnamed(): void {
		if (!this.getAttribute("label") && !this.getAttribute("labelledby")) {
			console.warn(
				"xtyle-tabs: no accessible name. Provide a `label` or `labelledby` so the tablist is announced.",
			);
		}
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.assignPanelSlots();
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(tabsHostCss);
		this.fragment.update(this.bindings);
		this.warnIfUnnamed();
	}
}

define("xtyle-tabs", XtyleTabs);
