import { XtyleElement, define, type StyleMode } from "./base.js";
import type { FullTone, Size } from "../index.js";
import { badgeHostCss } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/badge/source.generated.js";
import { resolveTone, BADGE_VARIANTS, resolveVocab, SIZES } from "../vocab.js";

type BadgeVariant = (typeof BADGE_VARIANTS)[number];
type BadgePulse = "slow" | "fast" | null;

const STATUS_WORD: Record<string, string> = {
	success: "Success",
	warn: "Warning",
	danger: "Danger",
	info: "Info",
};

export class XtyleBadge extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "badge", {
		applyIntent: () => {},
	});

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["variant", "tone", "size", "dot", "pulse", "count", "removable", "remove-label"];
	}

	get variant(): BadgeVariant {
		return resolveVocab(this.getAttribute("variant"), BADGE_VARIANTS, "soft", "badge variant");
	}
	set variant(value: BadgeVariant) {
		this.setAttribute("variant", value);
	}

	get tone(): FullTone {
		return resolveTone(this.getAttribute("tone"), "neutral");
	}
	set tone(value: FullTone) {
		this.setAttribute("tone", value);
	}

	get size(): Size {
		return resolveVocab(this.getAttribute("size"), SIZES, "md", "badge size");
	}
	set size(value: Size) {
		this.setAttribute("size", value);
	}

	get dot(): boolean {
		return this.hasAttribute("dot");
	}
	set dot(value: boolean) {
		this.reflectBoolean("dot", value);
	}

	/** Mirrors Progress's pulse: a bare `pulse` (or `slow`) breathes on the 1.8s cadence, `fast` on 0.9s. */
	get pulse(): BadgePulse {
		const raw = this.getAttribute("pulse");
		if (raw === null) return null;
		return raw === "fast" ? "fast" : "slow";
	}
	set pulse(value: BadgePulse | boolean) {
		if (value === true) this.setAttribute("pulse", "slow");
		else if (!value) this.removeAttribute("pulse");
		else this.setAttribute("pulse", value);
	}

	get count(): string | null {
		return this.getAttribute("count");
	}
	set count(value: string | number | null | undefined) {
		if (value === null || value === undefined) this.removeAttribute("count");
		else this.setAttribute("count", String(value));
	}

	get removable(): boolean {
		return this.hasAttribute("removable");
	}
	set removable(value: boolean) {
		this.reflectBoolean("removable", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	/** The dismiss button's name. An explicit `remove-label` wins; otherwise it's composed from
	 * the badge's own text ("Remove design") so a row of removable badges doesn't read as
	 * "Remove, Remove, Remove". */
	private get removeLabel(): string {
		const explicit = this.getAttribute("remove-label");
		if (explicit) return explicit;
		const text = this.fragment.slottedText();
		return text ? `Remove ${text}` : "Remove";
	}

	private get bindings(): Record<string, unknown> {
		return {
			variant: this.variant,
			tone: this.tone,
			size: this.size,
			dot: this.dot,
			pulse: this.pulse,
			count: this.count,
			removable: this.removable,
			removeLabel: this.removeLabel,
		};
	}

	/** A signature of the state ops can't express incrementally — the presence of the dot, count,
	 * remove button, and the tone's screen-reader word all add or drop child nodes a class `setAttr`
	 * can't reach. The status word is folded in by resolved text, not mere presence, so switching
	 * between status-bearing tones (success/warn/danger/info) rebuilds the stale SR span. When the
	 * signature changes, the structure is rebuilt rather than patched. */
	private shapeSignature(): string {
		const count = this.count;
		const hasCount = count !== null && count !== "" && count !== "undefined";
		const statusWord = STATUS_WORD[this.tone] ?? "";
		return `${this.dot}|${hasCount}|${count}|${this.removable}|${this.removeLabel}|${statusWord}`;
	}

	private warnIfRemoveUnnamed(): void {
		if (this.removable && !this.getAttribute("remove-label") && !this.fragment.slottedText()) {
			console.warn(
				"xtyle-badge: a removable badge has no `remove-label` and no text to compose one from. The dismiss button defaults to \"Remove\"; set `remove-label` for a specific name.",
			);
		}
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(badgeHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.warnIfRemoveUnnamed();
	}
}

define("xtyle-badge", XtyleBadge);
