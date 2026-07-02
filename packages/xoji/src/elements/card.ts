import { XojiElement, define, type StyleMode } from "./base.js";
import { cardHostCss } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/card/source.generated.js";

export class XojiCard extends XojiElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "card", {
		applyIntent: () => {},
	});

	private wiredCard: HTMLElement | null = null;
	private spaceHeld = false;

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["overlay", "interactive", "action", "compact", "tone"];
	}

	get tone(): string | null {
		return this.getAttribute("tone");
	}
	set tone(value: string | null | undefined) {
		this.reflectString("tone", value);
	}

	get overlay(): boolean {
		return this.hasAttribute("overlay");
	}
	set overlay(value: boolean) {
		this.reflectBoolean("overlay", value);
	}

	get interactive(): boolean {
		return this.hasAttribute("interactive");
	}
	set interactive(value: boolean) {
		this.reflectBoolean("interactive", value);
	}

	get action(): boolean {
		return this.hasAttribute("action");
	}
	set action(value: boolean) {
		this.reflectBoolean("action", value);
	}

	get compact(): boolean {
		return this.hasAttribute("compact");
	}
	set compact(value: boolean) {
		this.reflectBoolean("compact", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			overlay: this.overlay,
			interactive: this.interactive,
			action: this.action,
			compact: this.compact,
			tone: this.tone,
		};
	}

	private get cardEl(): HTMLElement | null {
		return this.root.querySelector('[part="card"]');
	}

	/** An `action` card is itself the button: it carries no inner control, so it takes `role="button"`,
	 * a tab stop, and keyboard activation. Keep it off the shadow part otherwise, so an `interactive`
	 * card that wraps its own `<a>`/`<button>` stays a plain container and the inner control is the
	 * one tab stop. */
	private syncButtonRole(): void {
		const card = this.cardEl;
		if (!card) return;
		if (this.action) {
			card.setAttribute("role", "button");
			if (!card.hasAttribute("tabindex")) card.setAttribute("tabindex", "0");
			if (card !== this.wiredCard) {
				this.wiredCard = card;
				card.addEventListener("keydown", this.onKeydown);
				card.addEventListener("keyup", this.onKeyup);
			}
		} else {
			card.removeAttribute("role");
			card.removeAttribute("tabindex");
		}
	}

	/** Translate Enter/Space into the same click path a pointer takes, so a consumer's `onclick` on the
	 * host fires from the keyboard. Enter activates on press; Space activates on release (and suppresses
	 * its default page scroll on press), mirroring a native `<button>`. */
	private onKeydown = (event: KeyboardEvent): void => {
		if (event.target !== this.cardEl) return;
		if (event.key === "Enter") {
			event.preventDefault();
			this.cardEl?.click();
		} else if (event.key === " ") {
			event.preventDefault();
			this.spaceHeld = true;
		}
	};

	private onKeyup = (event: KeyboardEvent): void => {
		if (event.key !== " " || !this.spaceHeld) return;
		this.spaceHeld = false;
		if (event.target === this.cardEl) this.cardEl?.click();
	};

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(cardHostCss);
		this.fragment.update(this.bindings);
		this.syncButtonRole();
	}
}

define("xoji-card", XojiCard);
