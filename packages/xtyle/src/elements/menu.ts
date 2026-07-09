import { XtyleElement, define, type StyleMode } from "./base.js";
import { placeOverlay } from "./overlay-position.js";
import { menuHostCss, type MenuItem } from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/menu/source.generated.js";

export type { MenuItem, MenuAction } from "../markup/index.js";

let menuSeq = 0;

export class XtyleMenu extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private uid = `xtyle-menu-${menuSeq++}`;
	private itemsProp: MenuItem[] | null = null;
	private needsWire = false;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "menu", {
		context: (handler) => (handler === "itemClick" || handler === "itemKeydown" ? this.navContext() : undefined),
		applyIntent: (intent, event) => this.applyIntent(intent, event),
		afterApply: () => this.afterApply(),
	});

	static get observedAttributes(): string[] {
		return ["items", "label", "open"];
	}

	get items(): MenuItem[] {
		if (this.itemsProp) return this.itemsProp;
		const raw = this.getAttribute("items");
		if (raw) {
			try {
				return JSON.parse(raw) as MenuItem[];
			} catch {
				return [];
			}
		}
		return [];
	}
	set items(value: MenuItem[]) {
		this.itemsProp = value;
		if (this.root.firstChild) this.render();
	}

	get label(): string | null {
		return this.getAttribute("label");
	}
	set label(value: string | null | undefined) {
		this.reflectString("label", value);
	}

	get open(): boolean {
		return this.hasAttribute("open");
	}
	set open(value: boolean) {
		this.reflectBoolean("open", value);
	}

	attributeChangedCallback(name: string): void {
		if (!this.root.firstChild) return;
		if (name === "open") {
			this.fragment.update(this.bindings);
			this.syncOpen();
			return;
		}
		this.render();
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.teardown();
	}

	private get trigger(): HTMLButtonElement | null {
		return this.root.querySelector(".xtyle-menu__trigger");
	}

	private get popup(): HTMLElement | null {
		return this.root.querySelector(".xtyle-menu__popup");
	}

	private menuItems(): HTMLElement[] {
		return Array.from(this.root.querySelectorAll<HTMLElement>('[role="menuitem"]'));
	}

	private enabledItems(): HTMLElement[] {
		return this.menuItems().filter((el) => el.getAttribute("aria-disabled") !== "true");
	}

	private navContext(): { enabledValues: string[] } {
		return { enabledValues: this.enabledItems().map((el) => el.dataset.value ?? "") };
	}

	private get bindings(): Record<string, unknown> {
		return {
			items: this.items,
			label: this.label,
			open: this.open,
			popupId: `${this.uid}-popup`,
		};
	}

	private syncOpen(): void {
		const popup = this.popup;
		if (!popup || !popup.isConnected) return;
		const isShown = popup.matches(":popover-open");
		// `showPopover()` throws if the element isn't in a stable state — which happens when a host
		// framework sets `open` synchronously during its own mount (e.g. a Svelte `client:only`
		// island). Swallow it; the next open/close, or the connect-time `afterApply`, settles it.
		try {
			if (this.open && !isShown) popup.showPopover();
			else if (!this.open && isShown) popup.hidePopover();
		} catch {
			/* transient mid-mount state */
		}
	}

	private openMenu(focus: "first" | "last"): void {
		this.open = true;
		const enabled = this.enabledItems();
		const target = focus === "first" ? enabled[0] : enabled[enabled.length - 1];
		if (target) this.focusItem(target);
	}

	private closeMenu(returnFocus: boolean): void {
		this.open = false;
		if (returnFocus) this.trigger?.focus();
	}

	private focusItem(item: HTMLElement): void {
		for (const el of this.menuItems()) el.tabIndex = el === item ? 0 : -1;
		item.focus();
	}

	private focusValue(value: string): void {
		const item = this.menuItems().find((el) => el.dataset.value === value);
		if (item) this.focusItem(item);
	}

	private positionPopup = (event: Event): void => {
		const trigger = this.trigger;
		const popup = this.popup;
		if (!trigger || !popup) return;
		const state = (event as { newState?: string }).newState;
		if (state === "closed") {
			if (this.open) this.open = false;
			return;
		}
		if (state !== "open") return;
		if (!this.open) this.open = true;
		const rect = trigger.getBoundingClientRect();
		const { top, left } = placeOverlay({
			anchor: rect,
			content: { width: popup.offsetWidth || 192, height: popup.offsetHeight || 0 },
			viewport: { width: window.innerWidth, height: window.innerHeight },
			preferred: "bottom",
			align: "start",
		});
		popup.style.left = `${left}px`;
		popup.style.top = `${top}px`;
	};

	private afterApply(): void {
		if (this.needsWire) {
			this.popup?.addEventListener("toggle", this.positionPopup);
			this.needsWire = false;
		}
		this.warnIfUnlabeled();
		this.syncOpen();
	}

	private teardown(): void {
		this.popup?.removeEventListener("toggle", this.positionPopup);
	}

	private warnIfUnlabeled(): void {
		if (!this.getAttribute("label")) {
			console.warn("xtyle-menu: no trigger label. Provide a `label` so the menu button is named.");
		}
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.preventDefault) event.preventDefault();
		if (intent.stopPropagation) event.stopPropagation();
		if (intent.openMenu) {
			this.openMenu(intent.openMenu);
			return;
		}
		if (intent.focusValue !== undefined) {
			this.focusValue(intent.focusValue);
			return;
		}
		if (intent.activateValue !== undefined) {
			this.dispatchEvent(
				new CustomEvent("select", {
					bubbles: true,
					composed: true,
					detail: { value: intent.activateValue, label: intent.activateLabel, index: intent.activateIndex },
				}),
			);
			this.closeMenu(true);
			return;
		}
		if (intent.closeMenu) {
			this.closeMenu(intent.returnFocus ?? false);
		}
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.teardown();
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(menuHostCss);
		this.needsWire = true;
		this.fragment.remount();
		this.fragment.update(this.bindings);
	}
}

define("xtyle-menu", XtyleMenu);
