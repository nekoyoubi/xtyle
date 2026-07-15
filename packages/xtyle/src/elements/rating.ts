import { XtyleElement, define, type StyleMode } from "./base.js";
import { composeIcon, composeIconThemed, resolveIconMark, resolvePrimitiveName, type IconComposition } from "../icon-builder.js";
import { readLiveRegister } from "./live-register.js";
import { PALETTE_TOKENS, type Palette } from "../series.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/rating/source.generated.js";

/** The neutral track/surface color (the `e` "empty" nibble, shared with the Progress groove); also every
 * register token the icon marks read, so a browser-only consumer can reconstruct the minimal register the
 * silhouette + palette colors need. */
const RATING_TOKENS: readonly string[] = ["--neutral-bg", ...PALETTE_TOKENS];

/** Resolve an icon name to a composition: a `--` spec composes through the mark grammar (so a colorful
 * taco works), a bare name is a single-layer primitive (`star` → `symbol-star`, any functional glyph by
 * its own name). An unknown name falls through to the primitive library's placeholder. */
function ratingComposition(name: string): IconComposition {
	if (name.includes("--")) {
		const parsed = resolveIconMark(name);
		if (parsed) return parsed.composition;
	}
	return { layers: [{ primitive: resolvePrimitiveName(name) }] };
}

function clamp(min: number, max: number, v: number): number {
	return v < min ? min : v > max ? max : v;
}

/**
 * A rating control. The row of glyphs is the fill's: it draws `max` icons and overlays a colored copy
 * clipped to `value / max`, so a fractional value shows an exact partial icon — a mod filling
 * `component.rating` can swap the glyph, restructure the row, or clip the fill some other way. The
 * element keeps the behavior: pointer and keyboard input, the hover preview, the committed value, the
 * ARIA it carries as the host, and the hidden input that posts the value in a `<form>`. Read-only by
 * opt-in (`readonly`) it is a display; interactive (the default) it is a real slider — focusable,
 * arrow-key and pointer driven, emitting `input` / `change`. Client-rendered: the element's text is the
 * no-JS fallback and the accessible label.
 */
export class XtyleRating extends XtyleElement {
	/** Rating is the host: the element itself carries `role="slider"`, sizes the glyphs, and is the box a
	 * pointer position is measured against, so it always renders into its own light DOM (never a shadow
	 * scaffold) and the fill's rows lay out as its own children. */
	protected override get styleMode(): StyleMode {
		return "scoped";
	}

	/** Bakes palette colors from the live cascade, so it re-resolves on a live theme swap. */
	protected override get resolvesThemeAtRuntime(): boolean {
		return true;
	}

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "rating", {
		applyIntent: () => {},
		afterApply: () => this.adoptFill(),
	});

	static get observedAttributes(): string[] {
		return ["value", "max", "size", "icon", "colors", "tone", "readonly", "allowhalf", "name", "label"];
	}

	protected template(): string {
		return "";
	}

	private captured = false;
	private fallbackLabel = "";
	private filledRow: HTMLElement | null = null;
	private hiddenInput: HTMLInputElement | null = null;
	private dragging = false;
	private bound = false;

	get value(): number {
		const parsed = Number.parseFloat(this.getAttribute("value") ?? "0");
		return Number.isFinite(parsed) ? parsed : 0;
	}
	set value(value: number) {
		this.setAttribute("value", String(value));
	}

	get max(): number {
		const parsed = Number.parseInt(this.getAttribute("max") ?? "5", 10);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
	}
	set max(value: number) {
		this.setAttribute("max", String(value));
	}

	get readonly(): boolean {
		return this.hasAttribute("readonly");
	}
	get allowHalf(): boolean {
		return this.hasAttribute("allowhalf");
	}
	private get icon(): string {
		return this.getAttribute("icon") || "star";
	}
	private get palette(): Palette {
		return (this.getAttribute("colors") as Palette) ?? "accents";
	}
	private get step(): number {
		return this.allowHalf ? 0.5 : 1;
	}

	connectedCallback(): void {
		// Capture the fallback label before the base's first render replaces the light-DOM children.
		const first = !this.captured;
		if (first) {
			this.fallbackLabel = (this.textContent ?? "").trim();
			this.captured = true;
		}
		super.connectedCallback();
		// The base renders (and so binds) only on first connect; re-render on a reconnect to rebind.
		if (!first) this.render();
	}

	disconnectedCallback(): void {
		this.unbind();
		super.disconnectedCallback();
	}

	attributeChangedCallback(): void {
		if (this.captured) this.render();
	}

	private register(): Record<string, string> {
		return readLiveRegister(this, RATING_TOKENS, () => {
			if (this.captured) this.render();
		});
	}

	private label(value: number): string {
		return this.getAttribute("label") || this.fallbackLabel || `${value} out of ${this.max} stars`;
	}

	/** The two glyphs the fill repeats across the row. A colorful mark silhouettes to the neutral track
	 * surface (`--neutral-bg`, the same tone the Progress groove uses, the `e` "empty" chrome nibble);
	 * a monochrome glyph keeps `currentColor` and takes that same track color from the row's CSS. */
	private glyphs(): { empty: string; filled: string } {
		const register = this.register();
		const comp = ratingComposition(this.icon);
		const emptyComp: IconComposition = { ...comp, palette: { "*": "--neutral-bg" } };
		return {
			empty: composeIcon(emptyComp, { register, scheme: this.palette }),
			filled: composeIconThemed(comp, { register, scheme: this.palette }),
		};
	}

	/** Re-resolve the overlay row after every fill apply: a mount rebuilds the row (and the first one
	 * lands asynchronously, once the sandbox is warm), so the node the hover preview writes to is only
	 * knowable here. A fill that restructures the row keeps the preview by keeping the `fill` part. */
	private adoptFill(): void {
		this.filledRow = this.querySelector('[part="fill"]');
	}

	protected override render(): void {
		const max = this.max;
		const value = clamp(0, max, this.value);

		this.classList.add("xtyle-rating");
		this.classList.toggle("xtyle-rating--sm", this.getAttribute("size") === "sm");
		this.classList.toggle("xtyle-rating--lg", this.getAttribute("size") === "lg");
		this.classList.toggle("xtyle-rating--interactive", !this.readonly);
		const tone = this.getAttribute("tone");
		this.style.setProperty("--rating-fill", tone ? `var(--${tone})` : "");

		const { empty, filled } = this.glyphs();
		this.adoptComponentSheet();
		this.fragment.ensureScaffold("");
		// The glyph count and the glyphs themselves (a new icon, a new palette, a theme swap) are a
		// structural change the fill's patch ops can't express, so they rebuild the row; a value change
		// only moves the clip, so it stays a patch.
		this.fragment.reshapeIfChanged(`${max}|${empty}|${filled}`);
		this.fragment.update({
			max,
			value,
			icon: this.icon,
			emptyIcon: empty,
			filledIcon: filled,
			readonly: this.readonly,
			allowHalf: this.allowHalf,
			size: this.getAttribute("size") ?? "md",
		});

		this.applyA11y(value);
		this.syncHidden(value);
		if (this.readonly) this.unbind();
		else this.bind();
	}

	private applyA11y(value: number): void {
		if (this.readonly) {
			this.removeAttribute("tabindex");
			this.removeAttribute("aria-valuemin");
			this.removeAttribute("aria-valuemax");
			this.removeAttribute("aria-valuenow");
			this.removeAttribute("aria-valuetext");
			this.setAttribute("role", "img");
			this.setAttribute("aria-label", this.label(value));
		} else {
			this.setAttribute("role", "slider");
			this.setAttribute("tabindex", "0");
			this.setAttribute("aria-valuemin", "0");
			this.setAttribute("aria-valuemax", String(this.max));
			this.setAttribute("aria-valuenow", String(value));
			this.setAttribute("aria-valuetext", `${value} out of ${this.max}`);
			this.setAttribute("aria-label", this.label(value));
		}
	}

	/** The hidden input is plumbing, not chrome: it never renders, so it stays out of the fill and is
	 * appended to the host itself, where a `<form>` collects it. */
	private syncHidden(value: number): void {
		const name = this.getAttribute("name");
		if (!name || this.readonly) {
			this.hiddenInput?.remove();
			this.hiddenInput = null;
			return;
		}
		if (!this.hiddenInput) {
			this.hiddenInput = document.createElement("input");
			this.hiddenInput.type = "hidden";
		}
		this.hiddenInput.name = name;
		this.hiddenInput.value = String(value);
		this.appendChild(this.hiddenInput);
	}

	/** Set the filled overlay to a preview fraction without committing the value. */
	private preview(value: number | null): void {
		if (!this.filledRow) return;
		const shown = value ?? clamp(0, this.max, this.value);
		this.filledRow.style.width = `${this.max > 0 ? (shown / this.max) * 100 : 0}%`;
	}

	/** Snap a raw position up to the unit it lands in: anywhere on the Nth icon rates N (a half step
	 * rates the near half). `ceil`, not `round`, so the left edge of an icon still counts that whole icon. */
	private snap(raw: number): number {
		return clamp(0, this.max, Math.ceil(raw / this.step) * this.step);
	}

	/** Commit a value: snap to step, reflect it, and fire `input` (always) and `change` (on commit). */
	private commit(raw: number, changed: boolean): void {
		const value = this.snap(raw);
		this.value = value; // reflects to the attribute → re-render
		this.dispatchEvent(new CustomEvent("input", { detail: { value }, bubbles: true }));
		if (changed) this.dispatchEvent(new CustomEvent("change", { detail: { value }, bubbles: true }));
	}

	/** The value a pointer x maps to, off the icon row's box. */
	private valueAt(clientX: number): number {
		const rect = this.getBoundingClientRect();
		if (rect.width === 0) return 0;
		const ratio = clamp(0, 1, (clientX - rect.left) / rect.width);
		return ratio * this.max;
	}

	private onPointerDown = (e: PointerEvent): void => {
		if (this.readonly) return;
		this.dragging = true;
		this.setPointerCapture(e.pointerId);
		this.commit(this.valueAt(e.clientX), true);
	};
	private onPointerMove = (e: PointerEvent): void => {
		if (this.readonly) return;
		if (this.dragging) this.commit(this.valueAt(e.clientX), false);
		else this.preview(this.snap(this.valueAt(e.clientX)));
	};
	private onPointerUp = (e: PointerEvent): void => {
		if (!this.dragging) return;
		this.dragging = false;
		this.releasePointerCapture(e.pointerId);
		this.dispatchEvent(new CustomEvent("change", { detail: { value: this.value }, bubbles: true }));
	};
	private onPointerLeave = (): void => {
		if (!this.dragging) this.preview(null);
	};
	private onKeyDown = (e: KeyboardEvent): void => {
		if (this.readonly) return;
		const v = clamp(0, this.max, this.value);
		let next: number | null = null;
		if (e.key === "ArrowRight" || e.key === "ArrowUp") next = v + this.step;
		else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = v - this.step;
		else if (e.key === "Home") next = 0;
		else if (e.key === "End") next = this.max;
		if (next === null) return;
		e.preventDefault();
		this.commit(next, true);
	};

	private bind(): void {
		if (this.bound) return;
		this.bound = true;
		this.addEventListener("pointerdown", this.onPointerDown);
		this.addEventListener("pointermove", this.onPointerMove);
		this.addEventListener("pointerup", this.onPointerUp);
		this.addEventListener("pointerleave", this.onPointerLeave);
		this.addEventListener("keydown", this.onKeyDown);
	}
	private unbind(): void {
		if (!this.bound) return;
		this.bound = false;
		this.removeEventListener("pointerdown", this.onPointerDown);
		this.removeEventListener("pointermove", this.onPointerMove);
		this.removeEventListener("pointerup", this.onPointerUp);
		this.removeEventListener("pointerleave", this.onPointerLeave);
		this.removeEventListener("keydown", this.onKeyDown);
	}
}

define("xtyle-rating", XtyleRating);
