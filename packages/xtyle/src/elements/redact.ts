import { XtyleElement, define, type StyleMode } from "./base.js";
import { redactHostCss, type RedactMode, type RedactReveal } from "../markup/redact.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/redact/source.generated.js";

export type { RedactMode, RedactReveal } from "../markup/redact.js";

let redactSeq = 0;

/** Every mounted redaction, so a page-level reveal reaches all of them without each one polling. */
const instances = new Set<XtyleRedact>();
let revealedAll = false;

/**
 * Reveal (or re-conceal) every `<xtyle-redact>` on the page at once — the "show sensitive fields"
 * switch an app puts in a toolbar. While a page-level reveal is on, an individual redaction shows
 * regardless of its own trigger; lifting it returns each one to whatever its trigger last decided.
 */
export function revealAllRedactions(revealed = true): void {
	revealedAll = revealed;
	for (const el of instances) el.syncRevealed();
}

/** Whether the page-level reveal is currently on. */
export function redactionsRevealed(): boolean {
	return revealedAll;
}

/**
 * Obscure a piece of content until it is revealed. It wraps whatever you give it — an account
 * number, an API key, a spoiler — and blurs it, lays a solid block over it, or covers it with a
 * dotted mask, bringing it back on hover/focus, on a click, while a key is held, or only when the
 * page-level {@link revealAllRedactions} switch is thrown.
 *
 * Fragment-backed: the cover and its reveal hint render through `component.redact`, so a mod can
 * reshape either. The reveal *behavior* — which trigger brings the content back — lives here in the
 * element, because it is logic a value can't express.
 */
export class XtyleRedact extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private uid = `xtyle-redact-${redactSeq++}`;
	private hovering = false;
	private holding = false;
	private toggled = false;
	private wasRevealed = false;
	private wiredCover: HTMLElement | null = null;
	private wiredReveal: RedactReveal | null = null;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "redact", {
		applyIntent: () => {},
		afterApply: () => this.wireCover(),
	});

	static get observedAttributes(): string[] {
		return ["mode", "reveal", "amount", "label", "cue", "revealed"];
	}

	get mode(): RedactMode {
		const value = this.getAttribute("mode");
		return value === "block" || value === "mask" ? value : "blur";
	}
	set mode(value: RedactMode) {
		this.setAttribute("mode", value);
	}

	get reveal(): RedactReveal {
		const value = this.getAttribute("reveal");
		return value === "click" || value === "hold" || value === "never" ? value : "hover";
	}
	set reveal(value: RedactReveal) {
		this.setAttribute("reveal", value);
	}

	/** Whether the content is showing right now, by any means — the trigger, the `revealed`
	 * attribute, or the page-level switch. Setting it is the explicit, sticky programmatic door. */
	get revealed(): boolean {
		return this.effectiveRevealed();
	}
	set revealed(value: boolean) {
		this.reflectBoolean("revealed", value);
	}

	/** The blur radius in px, overriding the size-relative default. Only used by `blur` mode. */
	get amount(): number {
		return this.numberAttr("amount", 0);
	}
	set amount(value: number) {
		this.setAttribute("amount", String(value));
	}

	/** What the redaction is, for the cover's accessible name (`Reveal SSN`) and the optional cue. */
	get label(): string | null {
		return this.getAttribute("label");
	}
	set label(value: string | null | undefined) {
		this.reflectString("label", value);
	}

	private numberAttr(name: string, fallback: number): number {
		const raw = this.getAttribute(name);
		if (raw === null) return fallback;
		const value = Number(raw);
		return Number.isFinite(value) ? value : fallback;
	}

	private get interactive(): boolean {
		return this.reveal !== "never";
	}

	private effectiveRevealed(): boolean {
		if (revealedAll) return true;
		if (this.hasAttribute("revealed")) return true;
		return this.toggled || this.hovering || this.holding;
	}

	/** Recompute the revealed state, repaint, and announce a crossing so an app can react to the
	 * moment content came into or left view. */
	syncRevealed(): void {
		this.repaint();
		const now = this.effectiveRevealed();
		if (now === this.wasRevealed) return;
		this.wasRevealed = now;
		this.dispatchEvent(new Event(now ? "reveal" : "conceal", { bubbles: true, composed: true }));
	}

	private repaint(): void {
		if (this.root.firstChild) this.fragment.update(this.bindings);
	}

	private get bindings(): Record<string, unknown> {
		const revealed = this.effectiveRevealed();
		const label = this.label ?? "";
		const amount = this.getAttribute("amount");
		const cue = this.getAttribute("cue");
		const coverLabel = revealed ? (label ? `Hide ${label}` : "Hide") : label ? `Reveal ${label}` : "Reveal";
		return {
			mode: this.mode,
			reveal: this.reveal,
			revealed,
			interactive: this.interactive,
			blur: amount === null ? null : `${Number(amount) || 0}px`,
			cue,
			// a blur says "I'm interactive" on its own; a block or a mask is an opaque wall, so it earns a hint
			showCue: cue != null || (this.interactive && this.mode !== "blur"),
			coverLabel,
			contentHidden: !revealed,
		};
	}

	override connectedCallback(): void {
		super.connectedCallback();
		instances.add(this);
		this.wasRevealed = this.effectiveRevealed();
		if (revealedAll || this.hasAttribute("revealed")) this.repaint();
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		instances.delete(this);
		this.teardownCover();
		this.endHold();
	}

	attributeChangedCallback(name: string): void {
		if (!this.root.firstChild) return;
		if (name === "revealed") {
			this.syncRevealed();
			return;
		}
		if (name === "reveal") {
			// the trigger changed under us: drop whatever the old trigger had latched, then re-wire
			this.hovering = this.holding = this.toggled = false;
			this.teardownCover();
		}
		this.syncRevealed();
	}

	private wireCover(): void {
		const cover = this.root.querySelector<HTMLElement>("[data-rd-cover]");
		if (!cover) return;
		if (cover === this.wiredCover && this.wiredReveal === this.reveal) return;
		this.teardownCover();
		this.wiredCover = cover;
		this.wiredReveal = this.reveal;
		const mode = this.reveal;
		if (mode === "hover") {
			cover.addEventListener("pointerenter", this.onEnter);
			cover.addEventListener("pointerleave", this.onLeave);
			cover.addEventListener("focusin", this.onEnter);
			cover.addEventListener("focusout", this.onLeave);
		} else if (mode === "hold") {
			cover.addEventListener("pointerdown", this.onHoldStart);
			cover.addEventListener("keydown", this.onHoldKey);
			cover.addEventListener("keyup", this.onHoldKeyUp);
		} else if (mode === "click") {
			cover.addEventListener("click", this.onToggle);
		}
	}

	private teardownCover(): void {
		const cover = this.wiredCover;
		if (!cover) return;
		cover.removeEventListener("pointerenter", this.onEnter);
		cover.removeEventListener("pointerleave", this.onLeave);
		cover.removeEventListener("focusin", this.onEnter);
		cover.removeEventListener("focusout", this.onLeave);
		cover.removeEventListener("pointerdown", this.onHoldStart);
		cover.removeEventListener("keydown", this.onHoldKey);
		cover.removeEventListener("keyup", this.onHoldKeyUp);
		cover.removeEventListener("click", this.onToggle);
		this.wiredCover = null;
		this.wiredReveal = null;
	}

	private onEnter = (): void => {
		this.hovering = true;
		this.syncRevealed();
	};

	private onLeave = (): void => {
		this.hovering = false;
		this.syncRevealed();
	};

	private onToggle = (): void => {
		this.toggled = !this.toggled;
		this.syncRevealed();
	};

	private onHoldStart = (event: PointerEvent): void => {
		event.preventDefault();
		this.holding = true;
		// the release can land anywhere once the pointer is down, so catch it on the document
		window.addEventListener("pointerup", this.onHoldEnd);
		window.addEventListener("pointercancel", this.onHoldEnd);
		this.syncRevealed();
	};

	private onHoldKey = (event: KeyboardEvent): void => {
		if (event.key !== " " && event.key !== "Enter") return;
		event.preventDefault();
		if (this.holding) return;
		this.holding = true;
		this.syncRevealed();
	};

	private onHoldKeyUp = (event: KeyboardEvent): void => {
		if (event.key !== " " && event.key !== "Enter") return;
		this.endHold();
	};

	private onHoldEnd = (): void => {
		this.endHold();
	};

	private endHold(): void {
		window.removeEventListener("pointerup", this.onHoldEnd);
		window.removeEventListener("pointercancel", this.onHoldEnd);
		if (!this.holding) return;
		this.holding = false;
		this.syncRevealed();
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(redactHostCss);
		this.fragment.update(this.bindings);
		this.wasRevealed = this.effectiveRevealed();
	}
}

define("xtyle-redact", XtyleRedact);
