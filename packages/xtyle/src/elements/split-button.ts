import { XtyleElement, define, type StyleMode } from "./base.js";
import type { ButtonVariant, FullTone } from "../index.js";
import { splitButtonHostCss, type SplitButtonSize, type MenuItem } from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/split-button/source.generated.js";
// the dropdown is a real <xtyle-menu> the fill declares, so the tag has to be defined
import "./menu.js";
import type { XtyleMenu } from "./menu.js";

/**
 * A primary action with its variations parked behind a caret: the button you press, and the menu of the
 * things you *nearly* pressed. Save / Save and close; Deploy / Deploy to staging; Export / Export as CSV.
 *
 * It is a composition, not a re-implementation. The two halves are `Button`'s own classes, so every
 * variant, tone, and size the button set speaks is the split button's too; the dropdown is a real
 * `<xtyle-menu>`, so the roving focus, the typeahead, the `select` event, the separators and headings and
 * danger rows all come from the menu rather than from a second copy of them living here. What this element
 * adds is the group: the shared shape, the divider, the caret, and the menu keys answering from either half.
 *
 * Fragment-backed: the group, the two buttons, the divider and the caret render through
 * `component.split-button`, and the menu renders through its own `component.menu`, so both halves stay
 * reachable to a mod.
 */
export class XtyleSplitButton extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private itemsProp: MenuItem[] | null = null;
	private watchedMenu: XtyleMenu | null = null;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "split-button", {
		applyIntent: (intent, event) => this.applyIntent(intent, event),
		afterApply: () => this.watchMenu(),
	});

	static get observedAttributes(): string[] {
		return ["variant", "tone", "size", "type", "disabled", "loading", "block", "open", "menu-label", "items"];
	}

	get variant(): ButtonVariant {
		return (this.getAttribute("variant") as ButtonVariant) ?? "solid";
	}
	set variant(value: ButtonVariant) {
		this.setAttribute("variant", value);
	}

	get tone(): FullTone {
		return (this.getAttribute("tone") as FullTone) ?? "accent";
	}
	set tone(value: FullTone) {
		this.setAttribute("tone", value);
	}

	get size(): SplitButtonSize {
		return (this.getAttribute("size") as SplitButtonSize) ?? "md";
	}
	set size(value: SplitButtonSize) {
		this.setAttribute("size", value);
	}

	get disabled(): boolean {
		return this.hasAttribute("disabled");
	}
	set disabled(value: boolean) {
		this.reflectBoolean("disabled", value);
	}

	get loading(): boolean {
		return this.hasAttribute("loading");
	}
	set loading(value: boolean) {
		this.reflectBoolean("loading", value);
	}

	/** Whether the menu half is showing. Set it to open or close the dropdown. */
	get open(): boolean {
		return this.hasAttribute("open");
	}
	set open(value: boolean) {
		this.reflectBoolean("open", value);
	}

	/** The dropdown's rows: the same `MenuItem` contract Menu speaks — actions, separators, headings. */
	get items(): MenuItem[] {
		if (this.itemsProp) return this.itemsProp;
		const raw = this.getAttribute("items");
		if (!raw) return [];
		try {
			return JSON.parse(raw) as MenuItem[];
		} catch {
			return [];
		}
	}
	set items(value: MenuItem[] | string) {
		if (typeof value === "string") {
			this.itemsProp = null;
			this.setAttribute("items", value);
			return;
		}
		this.itemsProp = value;
		this.render();
	}

	private get menuEl(): XtyleMenu | null {
		return this.root.querySelector("[data-dropdown]");
	}

	private get toggleEl(): HTMLButtonElement | null {
		return this.root.querySelector("[data-toggle]");
	}

	attributeChangedCallback(name: string): void {
		if (!this.root.firstChild) return;
		if (name === "items") this.itemsProp = null;
		if (name === "open") {
			this.syncMenu();
			this.fragment.update(this.bindings);
			return;
		}
		this.render();
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.watchedMenu?.removeEventListener("open", this.onMenuState);
		this.watchedMenu?.removeEventListener("close", this.onMenuState);
		this.watchedMenu?.removeEventListener("click", this.onMenuClick);
		this.watchedMenu = null;
	}

	private get bindings(): Record<string, unknown> {
		return {
			variant: this.variant,
			tone: this.tone,
			size: this.size,
			type: this.getAttribute("type"),
			disabled: this.disabled,
			loading: this.loading,
			block: this.hasAttribute("block"),
			open: this.open,
			menuLabel: this.getAttribute("menu-label"),
			itemsJson: JSON.stringify(this.items),
		};
	}

	/** Open the dropdown against the caret. */
	showMenu(focus: "first" | "last" = "first"): void {
		const menu = this.menuEl;
		const toggle = this.toggleEl;
		if (!menu || !toggle || this.disabled) return;
		menu.openFrom(toggle, { focus });
		this.open = true;
	}

	closeMenu(): void {
		const menu = this.menuEl;
		if (menu) menu.open = false;
		this.open = false;
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.preventDefault) event.preventDefault();
		if (intent.stopPropagation) event.stopPropagation();
		if (intent.toggleOpen) {
			if (this.open) this.closeMenu();
			else this.showMenu("first");
			return;
		}
		if (intent.openMenu) {
			this.showMenu(intent.openMenu);
			return;
		}
		if (intent.closeMenu && this.open) this.closeMenu();
	}

	/** Push the element's `open` onto the composed menu — the property path (`el.open = true`), which never
	 * went through the caret. */
	private syncMenu(): void {
		const menu = this.menuEl;
		const toggle = this.toggleEl;
		if (!menu || !toggle) return;
		if (this.open && !menu.open) menu.openFrom(toggle, { focus: "first" });
		else if (!this.open && menu.open) menu.open = false;
	}

	/** The menu closes on paths this element never sees — a light dismiss, an Escape inside the popup, a
	 * selected row — so the group follows the menu's own `open` / `close` rather than assuming it stayed
	 * put; without this the caret keeps saying `aria-expanded="true"` over a menu that is long gone. */
	private watchMenu(): void {
		const menu = this.menuEl;
		if (!menu || menu === this.watchedMenu) return;
		this.watchedMenu = menu;
		menu.addEventListener("open", this.onMenuState);
		menu.addEventListener("close", this.onMenuState);
		menu.addEventListener("click", this.onMenuClick);
	}

	/**
	 * A row's click bubbles, and the dropdown is a child of this element — so without this, choosing "Discard
	 * changes" from the menu reaches a `click` listener on the split button as though the primary had been
	 * pressed, and the app runs Save. The menu speaks through `select`; the primary speaks through `click`;
	 * nothing inside the dropdown gets to impersonate the default action.
	 */
	private onMenuClick = (event: Event): void => {
		event.stopPropagation();
	};

	private onMenuState = (): void => {
		const menuOpen = this.watchedMenu?.open ?? false;
		if (menuOpen !== this.open) this.open = menuOpen;
	};

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(splitButtonHostCss);
		this.fragment.update(this.bindings);
		this.watchMenu();
	}
}

define("xtyle-split-button", XtyleSplitButton);
