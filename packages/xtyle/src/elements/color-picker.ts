import { XtyleElement, define, type StyleMode } from "./base.js";
import { channelModels, channelsOf, colorFromChannels, colorFormats, colorToChannels, contrast, formatColor, harmony, harmonySchemes, hsvToRgb, nearestNamedColor, nearestWebSafe, oklchToDisplay, parseColor, rgbToHsv, type ChannelModel, type ColorFormat, type HarmonyScheme } from "../index.js";
import {
	clamp01,
	colorPickerHostCss,
	formatChannelValue,
	namedSnapLabel,
	OUT_OF_GAMUT_DESAT,
	PLANE_EDGE_SHADE,
	PLANE_H,
	PLANE_MAX_C,
	PLANE_W,
	type Hsv,
} from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/color-picker/source.generated.js";

const SNAP_TARGETS = ["web-safe", "named"] as const;
type SnapTarget = (typeof SNAP_TARGETS)[number];

/** The opaque hex of an HSV triple — used for the area/handle paint. */
function hexOpaque(hsv: Hsv): string {
	return formatColor(hsvToRgb({ ...hsv, alpha: 1 }), "hex");
}

export class XtyleColorPicker extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static formAssociated = true;

	private internals: ElementInternals | null = null;
	private hsv: Hsv = { h: 217, s: 0.64, v: 1 };
	private alpha = 1;
	private planeMaxC = PLANE_MAX_C;
	private lastShape = "";
	private needsWire = false;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "color-picker", {
		applyIntent: (intent, event) => this.applyIntent(intent, event),
		afterApply: () => {
			this.paint();
			if (this.needsWire && !this.disabled) {
				this.wireEvents();
				this.needsWire = false;
			}
		},
	});

	static get observedAttributes(): string[] {
		return ["value", "format", "modes", "channels", "snap", "plane", "trigger", "swatches", "harmony", "contrast-against", "alpha", "disabled", "label", "labelledby"];
	}

	constructor() {
		super();
		if (typeof this.attachInternals === "function") this.internals = this.attachInternals();
	}

	/** The author-configurable set of readout models the format button cycles. Defaults to all. */
	get modes(): ColorFormat[] {
		const raw = this.getAttribute("modes");
		if (!raw) return colorFormats;
		const picked = raw
			.split(",")
			.map((entry) => entry.trim())
			.filter((entry): entry is ColorFormat => (colorFormats as string[]).includes(entry));
		return picked.length ? picked : colorFormats;
	}

	get channelModel(): ChannelModel | null {
		if (!this.hasAttribute("channels")) return null;
		const raw = this.getAttribute("channels")?.trim();
		return raw && (channelModels as string[]).includes(raw) ? (raw as ChannelModel) : "rgb";
	}

	get snapTargets(): SnapTarget[] {
		if (!this.hasAttribute("snap")) return [];
		const raw = this.getAttribute("snap")?.trim() ?? "";
		if (!raw) return [...SNAP_TARGETS];
		const picked = raw
			.split(",")
			.map((entry) => entry.trim())
			.filter((entry): entry is SnapTarget => (SNAP_TARGETS as readonly string[]).includes(entry));
		return picked.length ? picked : [...SNAP_TARGETS];
	}

	/** A presence-based boolean attribute, off only when explicitly `"false"`/`"none"` (so `name="true"` from a binding still reads on). */
	private boolAttr(name: string): boolean {
		if (!this.hasAttribute(name)) return false;
		const raw = this.getAttribute(name)?.trim().toLowerCase();
		return raw !== "false" && raw !== "none";
	}

	/** Whether the OKLCH perceptual plane (lightness × chroma at the current hue) is shown. */
	get planeEnabled(): boolean {
		return this.boolAttr("plane");
	}

	/** Whether the picker collapses to a swatch button that opens the full UI in a popover. */
	get triggerEnabled(): boolean {
		return this.boolAttr("trigger");
	}

	get format(): ColorFormat {
		const raw = this.getAttribute("format") as ColorFormat | null;
		const modes = this.modes;
		return raw && modes.includes(raw) ? raw : (modes[0] ?? "hex");
	}
	set format(value: ColorFormat) {
		this.setAttribute("format", value);
	}

	get swatches(): string[] {
		const raw = this.getAttribute("swatches");
		return raw ? raw.split(",").map((entry) => entry.trim()).filter(Boolean) : [];
	}

	get contrastAgainst(): string | null {
		return this.getAttribute("contrast-against");
	}

	/** The active harmony scheme, or null when the `harmony` attribute is unset or unknown. */
	get harmonyScheme(): HarmonyScheme | null {
		const raw = this.getAttribute("harmony") as HarmonyScheme | null;
		return raw && harmonySchemes.includes(raw) ? raw : null;
	}

	/** Opt-in: the alpha track and an alpha channel in the value appear only when set. */
	get alphaEnabled(): boolean {
		return this.hasAttribute("alpha");
	}

	get value(): string {
		const alpha = this.alphaEnabled ? this.alpha : 1;
		return formatColor(hsvToRgb({ ...this.hsv, alpha }), this.format);
	}
	set value(next: string) {
		const parsed = parseColor(next);
		if (!parsed) return;
		const { h, s, v } = rgbToHsv(parsed);
		this.hsv = { h, s, v };
		this.alpha = this.alphaEnabled ? parsed.alpha : 1;
		if (this.root.firstChild) this.paint();
		this.syncForm();
	}

	get disabled(): boolean {
		return this.hasAttribute("disabled");
	}
	set disabled(value: boolean) {
		this.reflectBoolean("disabled", value);
	}

	private ingest(raw: string | null): void {
		if (!raw) return;
		const parsed = parseColor(raw);
		if (parsed) {
			const { h, s, v } = rgbToHsv(parsed);
			this.hsv = { h, s, v };
			this.alpha = this.alphaEnabled ? parsed.alpha : 1;
		}
	}

	attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
		if (!this.root.firstChild) return;
		if (name === "value") {
			this.ingest(value);
			this.paint();
			this.syncForm();
		} else if (name === "format") {
			this.syncFormatButton();
			this.paint();
			this.syncForm();
		} else {
			this.render();
		}
	}

	private syncFormatButton(): void {
		const button = this.el(".xtyle-color-picker__format");
		if (button) button.textContent = this.format.toUpperCase();
	}

	private cycleFormat(): void {
		if (this.disabled) return;
		const modes = this.modes;
		const next = modes[(modes.indexOf(this.format) + 1) % modes.length];
		if (next) this.format = next;
	}

	private async openEyeDropper(): Promise<void> {
		if (this.disabled) return;
		const Ctor = (window as unknown as { EyeDropper?: new () => { open(): Promise<{ sRGBHex: string }> } }).EyeDropper;
		if (!Ctor) return;
		try {
			const { sRGBHex } = await new Ctor().open();
			const parsed = parseColor(sRGBHex);
			if (parsed) {
				const { h, s, v } = rgbToHsv(parsed);
				this.setColor({ h, s, v }, parsed.alpha, "change");
			}
		} catch {
			// the user dismissed the picker — leave the color unchanged
		}
	}

	connectedCallback(): void {
		this.ingest(this.getAttribute("value"));
		super.connectedCallback();
	}

	private syncForm(): void {
		this.internals?.setFormValue(this.value);
	}

	private emit(kind: "input" | "change"): void {
		this.dispatchEvent(new Event(kind, { bubbles: true, composed: true }));
	}

	private setColor(hsv: Hsv, alpha: number, kind: "input" | "change"): void {
		if (this.disabled) return;
		this.hsv = hsv;
		this.alpha = this.alphaEnabled ? clamp01(alpha) : 1;
		this.paint();
		this.syncForm();
		this.emit(kind);
	}

	private patchHsv(patch: Partial<Hsv>, kind: "input" | "change"): void {
		this.setColor({ ...this.hsv, ...patch }, this.alpha, kind);
	}

	private setAlpha(alpha: number, kind: "input" | "change"): void {
		this.setColor(this.hsv, alpha, kind);
	}

	private currentAlpha(): number {
		return this.alphaEnabled ? this.alpha : 1;
	}

	private commitChannels(kind: "input" | "change"): void {
		const model = this.channelModel;
		if (!model) return;
		const inputs = Array.from(this.root.querySelectorAll<HTMLInputElement>(".xtyle-color-picker__channel-input"));
		const values = inputs.map((input) => Number(input.value));
		const rgb = colorFromChannels(model, values, this.currentAlpha());
		const { h, s, v } = rgbToHsv(rgb);
		this.setColor({ h, s, v }, rgb.alpha, kind);
	}

	private applySnap(target: string): void {
		if (this.disabled) return;
		const rgb = hsvToRgb({ ...this.hsv, alpha: this.currentAlpha() });
		const snapped = target === "named" ? nearestNamedColor(rgb).color : nearestWebSafe(rgb);
		const { h, s, v } = rgbToHsv(snapped);
		this.setColor({ h, s, v }, snapped.alpha, "change");
	}

	private oklchChannels(): [number, number, number] {
		const [l = 0, c = 0, h = 0] = colorToChannels(hsvToRgb({ ...this.hsv, alpha: 1 }), "oklch");
		return [l, c, h];
	}

	/** The widest in-gamut chroma at a hue, with headroom, so the plane's chroma axis fills the field. */
	private planeChromaAxis(hue: number): number {
		let widest = 0;
		for (let i = 1; i <= 11; i++) {
			const lightness = i / 12;
			let chroma = 0;
			for (let step = 0.02; step <= PLANE_MAX_C; step += 0.02) {
				if (!oklchToDisplay(lightness, step, hue).inGamut) break;
				chroma = step;
			}
			if (chroma > widest) widest = chroma;
		}
		return Math.min(PLANE_MAX_C, Math.max(0.1, widest * 1.12 + 0.02));
	}

	/** The canvas is its own hue cache (its `dataset.hue`), so the pixels only repaint when the hue slice moves. */
	private renderPlane(): void {
		const canvas = this.el(".xtyle-color-picker__plane") as HTMLCanvasElement | null;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;
		const hue = this.oklchChannels()[2];
		const key = hue.toFixed(2);
		if (canvas.dataset.hue === key) return;
		this.planeMaxC = this.planeChromaAxis(hue);
		const { width, height } = canvas;
		const image = ctx.createImageData(width, height);
		const data = image.data;
		for (let y = 0; y < height; y++) {
			const lightness = 1 - y / (height - 1);
			let wasInGamut = true;
			for (let x = 0; x < width; x++) {
				const chroma = (x / (width - 1)) * this.planeMaxC;
				const { color, inGamut } = oklchToDisplay(lightness, chroma, hue);
				let r = color.r * 255;
				let g = color.g * 255;
				let b = color.b * 255;
				if (!inGamut) {
					const luma = 0.3 * r + 0.59 * g + 0.11 * b;
					r += (luma - r) * OUT_OF_GAMUT_DESAT;
					g += (luma - g) * OUT_OF_GAMUT_DESAT;
					b += (luma - b) * OUT_OF_GAMUT_DESAT;
				}
				if (x > 0 && inGamut !== wasInGamut) {
					r *= PLANE_EDGE_SHADE;
					g *= PLANE_EDGE_SHADE;
					b *= PLANE_EDGE_SHADE;
				}
				wasInGamut = inGamut;
				const offset = (y * width + x) * 4;
				data[offset] = Math.round(r);
				data[offset + 1] = Math.round(g);
				data[offset + 2] = Math.round(b);
				data[offset + 3] = 255;
			}
		}
		ctx.putImageData(image, 0, 0);
		canvas.dataset.hue = key;
	}

	private setFromPlane(lightness: number, chroma: number, hue: number, kind: "input" | "change"): void {
		const rgb = colorFromChannels("oklch", [lightness, chroma, hue], this.currentAlpha());
		const { h, s, v } = rgbToHsv(rgb);
		this.setColor({ h, s, v }, rgb.alpha, kind);
	}

	private dragPlane(event: PointerEvent): void {
		const canvas = this.el(".xtyle-color-picker__plane");
		if (!canvas) return;
		this.el(".xtyle-color-picker__plane-handle")?.focus();
		(event.target as Element).setPointerCapture?.(event.pointerId);
		const hue = this.oklchChannels()[2];
		const apply = (e: PointerEvent, kind: "input" | "change") =>
			this.setFromPlane(1 - this.fractionFrom(e, canvas, "y"), this.fractionFrom(e, canvas, "x") * this.planeMaxC, hue, kind);
		apply(event, "input");
		const move = (e: PointerEvent) => apply(e, "input");
		const up = (e: PointerEvent) => {
			canvas.removeEventListener("pointermove", move);
			canvas.removeEventListener("pointerup", up);
			apply(e, "change");
		};
		canvas.addEventListener("pointermove", move);
		canvas.addEventListener("pointerup", up);
	}

	private onPlaneKeydown(event: KeyboardEvent): void {
		const [l, c, hue] = this.oklchChannels();
		const lStep = event.shiftKey ? 0.1 : 0.02;
		const cStep = event.shiftKey ? 0.05 : 0.01;
		let nextL = l;
		let nextC = c;
		if (event.key === "ArrowUp") nextL = clamp01(l + lStep);
		else if (event.key === "ArrowDown") nextL = clamp01(l - lStep);
		else if (event.key === "ArrowRight") nextC = Math.min(this.planeMaxC, c + cStep);
		else if (event.key === "ArrowLeft") nextC = Math.max(0, c - cStep);
		else return;
		event.preventDefault();
		this.setFromPlane(nextL, nextC, hue, "change");
	}

	private el(selector: string): HTMLElement | null {
		return this.root.querySelector(selector);
	}

	/** The related colors of the active scheme. A scheme's chip count is fixed, so the fill builds
	 * the chips once and the host only recolors them here — a chip a mod reshaped survives every
	 * edit, where a rebuild would have overwritten it on the next pointer move. */
	private harmonyColors(): string[] {
		const scheme = this.harmonyScheme;
		if (!scheme) return [];
		const base = parseColor(hexOpaque(this.hsv));
		return base ? harmony(base, scheme).map((related) => formatColor(related, "hex")) : [];
	}

	private paintHarmony(): void {
		const chips = this.root.querySelectorAll<HTMLElement>(".xtyle-color-picker__harmony-chip");
		if (!chips.length) return;
		const related = this.harmonyColors();
		chips.forEach((chip, index) => {
			const hex = related[index];
			if (!hex) return;
			chip.dataset.color = hex;
			chip.dataset.hex = hex;
			chip.style.setProperty("--cp-chip", hex);
			chip.setAttribute("aria-label", hex);
		});
	}

	/** In-place visual update — keeps focus on the handles (no innerHTML rebuild). */
	private paint(): void {
		const opaque = hexOpaque(this.hsv);
		const css = formatColor(hsvToRgb({ ...this.hsv, alpha: this.alpha }), "hex");
		const display = this.value;
		const set = (selector: string, fn: (el: HTMLElement) => void) => {
			const el = this.el(selector);
			if (el) fn(el);
		};
		set(".xtyle-color-picker__area", (el) => {
			el.style.backgroundColor = hexOpaque({ h: this.hsv.h, s: 1, v: 1 });
		});
		set(".xtyle-color-picker__sv-handle", (el) => {
			el.style.insetInlineStart = `${(this.hsv.s * 100).toFixed(2)}%`;
			el.style.insetBlockStart = `${((1 - this.hsv.v) * 100).toFixed(2)}%`;
			el.style.backgroundColor = opaque;
			el.setAttribute(
				"aria-valuetext",
				`saturation ${Math.round(this.hsv.s * 100)}%, brightness ${Math.round(this.hsv.v * 100)}%`,
			);
		});
		set(".xtyle-color-picker__hue-handle", (el) => {
			el.style.insetInlineStart = `${((this.hsv.h / 360) * 100).toFixed(2)}%`;
			el.setAttribute("aria-valuenow", String(Math.round(this.hsv.h)));
		});
		set(".xtyle-color-picker__alpha", (el) => el.style.setProperty("--cp-color", opaque));
		set(".xtyle-color-picker__alpha-handle", (el) => {
			el.style.insetInlineStart = `${(this.alpha * 100).toFixed(2)}%`;
			el.style.backgroundColor = css;
			el.setAttribute("aria-valuenow", String(Math.round(this.alpha * 100)));
		});
		set(".xtyle-color-picker__swatch", (el) => el.style.setProperty("--cp-color", css));
		set(".xtyle-color-picker__trigger", (el) => el.style.setProperty("--cp-color", css));
		this.paintHarmony();
		this.root.querySelectorAll<HTMLElement>(".xtyle-color-picker__preset").forEach((chip) => {
			chip.setAttribute("aria-pressed", String((chip.dataset.hex ?? "").toLowerCase() === css.toLowerCase()));
		});
		const against = this.contrastAgainst ? parseColor(this.contrastAgainst) : null;
		if (against) {
			const againstHex = formatColor(against, "hex");
			const ratio = contrast(opaque, againstHex);
			set(".xtyle-color-picker__contrast-sample", (el) => {
				el.style.color = opaque;
				el.style.backgroundColor = againstHex;
			});
			set(".xtyle-color-picker__contrast-ratio", (el) => {
				el.textContent = ratio.toFixed(2);
			});
			const grade = (level: string, threshold: number) =>
				set(`.xtyle-color-picker__contrast-badge[data-level="${level}"]`, (el) => {
					const pass = ratio >= threshold;
					el.classList.toggle("is-pass", pass);
					el.classList.toggle("is-fail", !pass);
					el.setAttribute("aria-label", `${level.toUpperCase()} ${pass ? "passes" : "fails"} at ${ratio.toFixed(2)} to 1`);
				});
			grade("aa", 4.5);
			grade("aaa", 7);
			const tier =
				ratio >= 7
					? { level: "aaa", text: "AAA", label: "AAA" }
					: ratio >= 4.5
						? { level: "aa", text: "AA", label: "AA" }
						: ratio >= 3
							? { level: "a", text: "A", label: "A (large text only)" }
							: { level: "fail", text: "✕", label: "below AA" };
			set(".xtyle-color-picker__trigger-badge", (el) => {
				el.dataset.level = tier.level;
				el.textContent = tier.text;
			});
			set(".xtyle-color-picker__trigger", (el) => {
				el.setAttribute("aria-label", `Open color picker — contrast ${ratio.toFixed(2)} to 1, ${tier.label}`);
			});
		}
		const channelModel = this.channelModel;
		if (channelModel) {
			const rgb = hsvToRgb({ ...this.hsv, alpha: this.currentAlpha() });
			const defs = channelsOf(channelModel);
			const values = colorToChannels(rgb, channelModel);
			this.root.querySelectorAll<HTMLInputElement>(".xtyle-color-picker__channel-input").forEach((input, i) => {
				const def = defs[i];
				const value = values[i];
				if (!def || value === undefined) return;
				if (input !== this.root.activeElement) input.value = String(value);
				const formatted = formatChannelValue(value, def);
				input.setAttribute("aria-valuetext", formatted);
				const readout = input.closest(".xtyle-color-picker__channel")?.querySelector(".xtyle-color-picker__channel-value");
				if (readout) readout.textContent = formatted;
			});
		}
		if (this.planeEnabled) {
			this.renderPlane();
			const [l, c] = this.oklchChannels();
			set(".xtyle-color-picker__plane-handle", (el) => {
				el.style.insetInlineStart = `${(clamp01(c / this.planeMaxC) * 100).toFixed(2)}%`;
				el.style.insetBlockStart = `${((1 - l) * 100).toFixed(2)}%`;
				el.style.backgroundColor = opaque;
				el.setAttribute("aria-valuetext", `lightness ${Math.round(l * 100)}%, chroma ${c.toFixed(3)}`);
			});
			set(".xtyle-color-picker__plane-readout", (el) => {
				el.textContent = `L ${l.toFixed(2)} · C ${c.toFixed(3)}`;
			});
		}
		const namedSnap = this.el(".xtyle-color-picker__snap--named");
		if (namedSnap) {
			const labels = namedSnapLabel(nearestNamedColor(hsvToRgb({ ...this.hsv, alpha: this.currentAlpha() })).name);
			namedSnap.textContent = labels.text;
			namedSnap.setAttribute("aria-label", labels.aria);
		}
		const valueInput = this.el(".xtyle-color-picker__value") as HTMLInputElement | null;
		if (valueInput && valueInput !== this.root.activeElement) valueInput.value = display;
	}

	private fractionFrom(event: PointerEvent, el: HTMLElement, axis: "x" | "y"): number {
		const rect = el.getBoundingClientRect();
		if (axis === "x")
			return clamp01(rect.width === 0 ? 0 : (event.clientX - rect.left) / rect.width);
		return clamp01(rect.height === 0 ? 0 : (event.clientY - rect.top) / rect.height);
	}

	private dragTrack(
		event: PointerEvent,
		trackSelector: string,
		handleSelector: string,
		apply: (fraction: number, kind: "input" | "change") => void,
	): void {
		const track = this.el(trackSelector);
		if (!track) return;
		this.el(handleSelector)?.focus();
		(event.target as Element).setPointerCapture?.(event.pointerId);
		const run = (e: PointerEvent, kind: "input" | "change") =>
			apply(this.fractionFrom(e, track, "x"), kind);
		run(event, "input");
		const move = (e: PointerEvent) => run(e, "input");
		const up = (e: PointerEvent) => {
			track.removeEventListener("pointermove", move);
			track.removeEventListener("pointerup", up);
			run(e, "change");
		};
		track.addEventListener("pointermove", move);
		track.addEventListener("pointerup", up);
	}

	private dragArea(event: PointerEvent): void {
		const area = this.el(".xtyle-color-picker__area");
		if (!area) return;
		this.el(".xtyle-color-picker__sv-handle")?.focus();
		(event.target as Element).setPointerCapture?.(event.pointerId);
		const apply = (e: PointerEvent, kind: "input" | "change") =>
			this.patchHsv({ s: this.fractionFrom(e, area, "x"), v: 1 - this.fractionFrom(e, area, "y") }, kind);
		apply(event, "input");
		const move = (e: PointerEvent) => apply(e, "input");
		const up = (e: PointerEvent) => {
			area.removeEventListener("pointermove", move);
			area.removeEventListener("pointerup", up);
			apply(e, "change");
		};
		area.addEventListener("pointermove", move);
		area.addEventListener("pointerup", up);
	}

	private onSvKeydown(event: KeyboardEvent): void {
		const step = event.shiftKey ? 0.1 : 0.02;
		let patch: Partial<Hsv> | null = null;
		if (event.key === "ArrowRight") patch = { s: clamp01(this.hsv.s + step) };
		else if (event.key === "ArrowLeft") patch = { s: clamp01(this.hsv.s - step) };
		else if (event.key === "ArrowUp") patch = { v: clamp01(this.hsv.v + step) };
		else if (event.key === "ArrowDown") patch = { v: clamp01(this.hsv.v - step) };
		if (patch) {
			event.preventDefault();
			this.patchHsv(patch, "change");
		}
	}

	private onHueKeydown(event: KeyboardEvent): void {
		const step = event.shiftKey ? 30 : 5;
		let h: number | null = null;
		if (event.key === "ArrowRight" || event.key === "ArrowUp") h = this.hsv.h + step;
		else if (event.key === "ArrowLeft" || event.key === "ArrowDown") h = this.hsv.h - step;
		else if (event.key === "Home") h = 0;
		else if (event.key === "End") h = 360;
		if (h !== null) {
			event.preventDefault();
			this.patchHsv({ h: (((h % 360) + 360) % 360) }, "change");
		}
	}

	private onAlphaKeydown(event: KeyboardEvent): void {
		const step = event.shiftKey ? 0.1 : 0.02;
		let a: number | null = null;
		if (event.key === "ArrowRight" || event.key === "ArrowUp") a = this.alpha + step;
		else if (event.key === "ArrowLeft" || event.key === "ArrowDown") a = this.alpha - step;
		else if (event.key === "Home") a = 0;
		else if (event.key === "End") a = 1;
		if (a !== null) {
			event.preventDefault();
			this.setAlpha(a, "change");
		}
	}

	private onValueCommit(input: HTMLInputElement): void {
		const parsed = parseColor(input.value);
		if (parsed) {
			const { h, s, v } = rgbToHsv(parsed);
			this.setColor({ h, s, v }, parsed.alpha, "change");
		} else {
			input.value = this.value;
		}
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(colorPickerHostCss);
		const signature = this.shapeSignature();
		const rebuilt = !this.lastShape || signature !== this.lastShape;
		if (this.lastShape && rebuilt) this.fragment.remount();
		this.lastShape = signature;
		if (rebuilt) this.needsWire = true;
		this.fragment.update(this.bindings);
		this.warnIfUnnamed();
		this.syncForm();
		this.paint();
	}

	/** Wire the live-DOM interactions the fragment scaffold can't express as delegated handlers —
	 * pointer drags (need `getBoundingClientRect` / `setPointerCapture`), keyboard nav that moves
	 * focus onto handles, the popover positioning, the eyedropper, and channel/value commits. Runs
	 * only when the scaffold is freshly built (initial mount or a shape remount), so listeners never stack. */
	private wireEvents(): void {
		this.el(".xtyle-color-picker__area")?.addEventListener("pointerdown", (e) => this.dragArea(e as PointerEvent));
		this.el(".xtyle-color-picker__sv-handle")?.addEventListener("keydown", (e) => this.onSvKeydown(e as KeyboardEvent));
		this.el(".xtyle-color-picker__hue")?.addEventListener("pointerdown", (e) =>
			this.dragTrack(e as PointerEvent, ".xtyle-color-picker__hue", ".xtyle-color-picker__hue-handle", (f, kind) => this.patchHsv({ h: f * 360 }, kind)),
		);
		this.el(".xtyle-color-picker__hue-handle")?.addEventListener("keydown", (e) => this.onHueKeydown(e as KeyboardEvent));
		this.el(".xtyle-color-picker__alpha")?.addEventListener("pointerdown", (e) =>
			this.dragTrack(e as PointerEvent, ".xtyle-color-picker__alpha", ".xtyle-color-picker__alpha-handle", (f, kind) => this.setAlpha(f, kind)),
		);
		this.el(".xtyle-color-picker__alpha-handle")?.addEventListener("keydown", (e) => this.onAlphaKeydown(e as KeyboardEvent));
		const valueInput = this.el(".xtyle-color-picker__value") as HTMLInputElement | null;
		valueInput?.addEventListener("change", () => this.onValueCommit(valueInput));
		valueInput?.addEventListener("keydown", (e) => {
			if ((e as KeyboardEvent).key === "Enter") {
				e.preventDefault();
				this.onValueCommit(valueInput);
			}
		});
		const trigger = this.el(".xtyle-color-picker__trigger");
		const popover = this.el(".xtyle-color-picker__popover");
		if (trigger && popover) {
			popover.addEventListener("toggle", (event) => {
				const open = (event as { newState?: string }).newState === "open";
				trigger.setAttribute("aria-expanded", String(open));
				if (!open) return;
				const rect = trigger.getBoundingClientRect();
				const width = popover.offsetWidth || 256;
				const height = popover.offsetHeight || 256;
				const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
				// Open below the trigger, but flip above when there isn't room (a picker near the fold),
				// then clamp into the viewport so the popover is never cut off.
				const below = rect.bottom + 6;
				const above = rect.top - height - 6;
				const top = below + height <= window.innerHeight - 8 || above < 8 ? below : above;
				popover.style.left = `${Math.round(left)}px`;
				popover.style.top = `${Math.round(Math.max(8, Math.min(top, window.innerHeight - height - 8)))}px`;
				window.addEventListener("scroll", () => popover.hidePopover(), { passive: true, capture: true, once: true });
			});
		}
		this.el(".xtyle-color-picker__plane")?.addEventListener("pointerdown", (e) => this.dragPlane(e as PointerEvent));
		this.el(".xtyle-color-picker__plane-handle")?.addEventListener("keydown", (e) => this.onPlaneKeydown(e as KeyboardEvent));
		const channels = this.el(".xtyle-color-picker__channels");
		channels?.addEventListener("input", () => this.commitChannels("input"));
		channels?.addEventListener("change", () => this.commitChannels("change"));
		this.el(".xtyle-color-picker__snaps")?.addEventListener("click", (event) => {
			const button = (event.target as HTMLElement).closest<HTMLElement>(".xtyle-color-picker__snap");
			if (button?.dataset.snap) this.applySnap(button.dataset.snap);
		});
		this.el(".xtyle-color-picker__format")?.addEventListener("click", () => this.cycleFormat());
		this.el(".xtyle-color-picker__eyedropper")?.addEventListener("click", () => void this.openEyeDropper());
		// One delegated handler per chip row (the swatch presets and the harmony chips are both
		// `__preset` rows), so a chip the fill reshapes still adopts its color, and a chip that is in
		// both sets can't be handled twice.
		this.root.querySelectorAll<HTMLElement>(".xtyle-color-picker__presets").forEach((row) => {
			row.addEventListener("click", (event) => {
				if (this.disabled) return;
				const chip = (event.target as HTMLElement).closest<HTMLElement>(".xtyle-color-picker__preset");
				const parsed = chip ? parseColor(chip.dataset.color ?? "") : null;
				if (!parsed) return;
				const { h, s, v } = rgbToHsv(parsed);
				this.setColor({ h, s, v }, parsed.alpha, "change");
			});
		});
	}

	private warnIfUnnamed(): void {
		if (!this.getAttribute("label") && !this.getAttribute("labelledby")) {
			console.warn(
				"xtyle-color-picker: no accessible name. Provide a `label` or `labelledby` so the picker is announced.",
			);
		}
	}

	protected template(): string {
		return "";
	}

	private currentHex(): string {
		return formatColor(hsvToRgb({ ...this.hsv, alpha: this.alpha }), "hex");
	}

	/** The color-math-derived inputs the fragment can't compute in its sandbox: the host resolves
	 * swatch hexes, channel slider values, and the named-snap label, and passes them as bindings. */
	private get bindings(): Record<string, unknown> {
		const currentHex = this.currentHex();
		const swatches = this.swatches
			.map((entry) => {
				const parsed = parseColor(entry);
				if (!parsed) return null;
				const hex = formatColor(parsed, "hex");
				return { entry, hex, pressed: hex.toLowerCase() === currentHex.toLowerCase() };
			})
			.filter((s): s is { entry: string; hex: string; pressed: boolean } => s !== null);
		const model = this.channelModel;
		const channels = model
			? (() => {
					const defs = channelsOf(model);
					const values = colorToChannels(hsvToRgb({ ...this.hsv, alpha: this.currentAlpha() }), model);
					return defs.map((def, i) => {
						const value = values[i] ?? def.min;
						return {
							label: def.label,
							name: `${def.label}${def.unit ? ` (${def.unit})` : ""}`,
							min: def.min,
							max: def.max,
							step: def.step,
							value,
							formatted: formatChannelValue(value, def),
						};
					});
				})()
			: [];
		const snapTargets = this.snapTargets;
		const namedSnap = snapTargets.includes("named")
			? namedSnapLabel(nearestNamedColor(hsvToRgb({ ...this.hsv, alpha: this.currentAlpha() })).name)
			: null;
		return {
			disabled: this.disabled,
			label: this.getAttribute("label"),
			labelledby: this.getAttribute("labelledby"),
			elementId: this.elementId,
			formatLabel: this.format.toUpperCase(),
			planeEnabled: this.planeEnabled,
			triggerEnabled: this.triggerEnabled,
			alphaEnabled: this.alphaEnabled,
			channelModelLabel: model ? model.toUpperCase() : null,
			harmonyScheme: this.harmonyScheme,
			hasContrast: !!(this.contrastAgainst && parseColor(this.contrastAgainst)),
			hasEyeDropper: typeof window !== "undefined" && "EyeDropper" in window,
			planeWidth: PLANE_W,
			planeHeight: PLANE_H,
			swatches,
			channels,
			snapTargets,
			namedSnap,
			harmonyChips: this.harmonyColors().map((hex) => ({ hex })),
		};
	}

	/** Structural shape ops can't patch incrementally — any change here rebuilds the scaffold via the
	 * fragment host (a remount). Live color edits (the HSV state) are painted in place by `paint()`. */
	private shapeSignature(): string {
		return [
			this.disabled,
			this.getAttribute("label") != null,
			this.getAttribute("labelledby") != null,
			this.triggerEnabled,
			this.planeEnabled,
			this.alphaEnabled,
			this.channelModel ?? "",
			this.harmonyScheme ?? "",
			!!(this.contrastAgainst && parseColor(this.contrastAgainst)),
			this.snapTargets.join(","),
			this.swatches.join(","),
		].join("|");
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.preventDefault) event.preventDefault();
	}

	private elementId = `xtyle-color-picker-${Math.random().toString(36).slice(2, 8)}`;
}

define("xtyle-color-picker", XtyleColorPicker);
