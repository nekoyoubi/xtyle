import { XtyleElement, define, type StyleMode } from "./base.js";
import { qrHostCss, qrLogoModules, qrLinkHref, QR_ICON_SCALES, type QrMode, type QrIconSize, type QrBindings } from "../markup/index.js";
import { encodeQr, qrPath, type QrEcLevel, type QrModuleShape, type QrMatrix } from "../qr.js";
import { qrScannability } from "../audit.js";
import { FragmentHost } from "./fragment-host.js";
import { readLiveRegister } from "./live-register.js";
import { manifest, fragmentSources } from "./fragments/qr/source.generated.js";

const BITONAL_MODULE = "#000000";
const BITONAL_BG = "#ffffff";
const CONTRAST_TOKENS = ["--fg-0", "--bg-0"] as const;

export class XtyleQrCode extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	protected override get resolvesThemeAtRuntime(): boolean {
		return true;
	}

	private cachedMatrix: QrMatrix | null = null;
	private cacheKey = "";
	/** The mode the `mode-toggle` button returns to when it swaps back out of bitonal. */
	private baseMode: QrMode = "theme";
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "qr", {
		applyIntent: () => {},
		afterApply: () => this.wireToggle(),
	});

	static get observedAttributes(): string[] {
		return ["data", "ec-level", "mode", "module-shape", "quiet-zone", "size", "icon", "logo", "icon-size", "icon-scale", "icon-overlay", "icon-outline", "frame", "caption", "mode-toggle", "label"];
	}

	get data(): string {
		return this.getAttribute("data") ?? "";
	}
	set data(value: string) {
		this.setAttribute("data", value);
	}

	get ecLevel(): QrEcLevel {
		const raw = this.getAttribute("ec-level");
		return raw === "L" || raw === "M" || raw === "Q" || raw === "H" ? raw : "M";
	}
	set ecLevel(value: QrEcLevel) {
		this.setAttribute("ec-level", value);
	}

	get mode(): QrMode {
		const raw = this.getAttribute("mode");
		return raw === "bitonal" || raw === "auto" ? raw : "theme";
	}
	set mode(value: QrMode) {
		this.setAttribute("mode", value);
	}

	get moduleShape(): QrModuleShape {
		const raw = this.getAttribute("module-shape");
		return raw === "dot" || raw === "rounded" ? raw : "square";
	}
	set moduleShape(value: QrModuleShape) {
		this.setAttribute("module-shape", value);
	}

	get icon(): string | null {
		return this.getAttribute("icon");
	}
	set icon(value: string | null) {
		this.reflectString("icon", value);
	}

	get logo(): string | null {
		return this.getAttribute("logo");
	}
	set logo(value: string | null) {
		this.reflectString("logo", value);
	}

	get iconSize(): QrIconSize {
		const raw = this.getAttribute("icon-size");
		return raw === "sm" || raw === "lg" || raw === "xl" ? raw : "md";
	}
	set iconSize(value: QrIconSize) {
		this.setAttribute("icon-size", value);
	}

	/** The effective logo width fraction: an explicit numeric `icon-scale` wins as the escape hatch,
	 * otherwise the named `icon-size` preset maps to a scale. */
	get iconScale(): number {
		const raw = this.getAttribute("icon-scale");
		const n = raw !== null ? Number(raw) : NaN;
		if (Number.isFinite(n) && n > 0) return Math.max(0.1, Math.min(0.4, n));
		return QR_ICON_SCALES[this.iconSize];
	}
	set iconScale(value: number) {
		this.setAttribute("icon-scale", String(value));
	}

	get iconOverlay(): boolean {
		return this.hasAttribute("icon-overlay");
	}
	set iconOverlay(value: boolean) {
		this.reflectBoolean("icon-overlay", value);
	}

	get iconOutline(): boolean {
		return this.hasAttribute("icon-outline");
	}
	set iconOutline(value: boolean) {
		this.reflectBoolean("icon-outline", value);
	}

	get frame(): boolean {
		return this.hasAttribute("frame");
	}
	set frame(value: boolean) {
		this.reflectBoolean("frame", value);
	}

	get caption(): string | null {
		return this.getAttribute("caption");
	}
	set caption(value: string | null) {
		this.reflectString("caption", value);
	}

	get modeToggle(): boolean {
		return this.hasAttribute("mode-toggle");
	}
	set modeToggle(value: boolean) {
		this.reflectBoolean("mode-toggle", value);
	}

	get label(): string | null {
		return this.getAttribute("label");
	}
	set label(value: string | null) {
		this.reflectString("label", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get hasLogo(): boolean {
		return !!(this.icon || this.logo);
	}

	/** A logo occludes the center, so bump to the highest error correction (H, ~30% tolerance) whenever
	 * one is injected; otherwise honor the requested level. */
	private effectiveEcLevel(): QrEcLevel {
		return this.hasLogo ? "H" : this.ecLevel;
	}

	private matrix(): QrMatrix {
		const ec = this.effectiveEcLevel();
		const key = `${this.data}\u0000${ec}`;
		if (!this.cachedMatrix || this.cacheKey !== key) {
			this.cachedMatrix = encodeQr(this.data || " ", { ecLevel: ec });
			this.cacheKey = key;
		}
		return this.cachedMatrix;
	}

	/** Resolve the module/background pair for the current mode. `theme` inks from the tokens (null
	 * colors, CSS handles it) but still flags low contrast; `bitonal` pins black-on-white; `auto`
	 * measures the live theme and falls back to bitonal when it can't be scanned. */
	private colors(): { moduleColor: string | null; bgColor: string | null; lowContrast: boolean; bitonal: boolean } {
		const mode = this.mode;
		if (mode === "bitonal") return { moduleColor: BITONAL_MODULE, bgColor: BITONAL_BG, lowContrast: false, bitonal: true };
		const register = readLiveRegister(this, CONTRAST_TOKENS, () => {
			if (this.root.firstChild) this.render();
		});
		const scannable = Object.keys(register).length === 0 ? true : qrScannability(register).scannable;
		if (mode === "auto" && !scannable) return { moduleColor: BITONAL_MODULE, bgColor: BITONAL_BG, lowContrast: true, bitonal: true };
		return { moduleColor: null, bgColor: null, lowContrast: !scannable, bitonal: false };
	}

	/** Wire the frame's themed/bitonal swap button after each render (the fragment rebuilds the DOM, so
	 * the listener is re-attached to the fresh button). */
	private wireToggle(): void {
		const button = this.root.querySelector<HTMLButtonElement>("[data-qr-toggle]");
		if (!button) return;
		button.addEventListener("click", () => {
			if (this.mode === "bitonal") this.mode = this.baseMode;
			else {
				this.baseMode = this.mode;
				this.mode = "bitonal";
			}
		});
	}

	private get bindings(): QrBindings {
		const matrix = this.matrix();
		const quiet = this.quietZone();
		const overlay = this.iconOverlay;
		const scale = this.iconScale;
		// INFO: the logo patch spans a whole number of modules; knockout clears exactly that patch so the
		// glyph reads full-size, while overlay cuts nothing and sizes the mark by scale over the live modules.
		const patchModules = this.hasLogo ? qrLogoModules(matrix.size, scale) : 0;
		const clearModules = this.hasLogo && !overlay ? patchModules : 0;
		const path = qrPath(matrix, {
			quietZone: quiet,
			shape: this.moduleShape,
			clear: clearModules > 0 ? { size: clearModules } : undefined,
		});
		const boxModules = overlay ? scale * matrix.size : patchModules;
		const logoBox = this.hasLogo ? this.centeredBox(matrix.size, boxModules, quiet) : null;
		const { moduleColor, bgColor, lowContrast, bitonal } = this.colors();
		const caption = this.caption ?? (this.frame ? this.data : null);
		return {
			path: path.d,
			viewBox: path.viewBox,
			extent: path.extent,
			moduleColor,
			bgColor,
			shape: this.moduleShape,
			size: this.size(),
			logoBox,
			iconName: this.icon,
			logoSrc: this.logo,
			iconOverlay: overlay,
			iconOutline: this.iconOutline,
			frame: this.frame,
			caption,
			linkHref: this.frame && caption ? qrLinkHref(this.data) : null,
			modeToggle: this.modeToggle,
			isBitonal: bitonal,
			label: this.label ?? (this.data ? `QR code: ${this.data}` : "QR code"),
			lowContrast,
			version: matrix.version,
			ecLevel: matrix.ecLevel,
		};
	}

	/** The centered box (viewBox units) a logo of `boxSize` modules occupies within a `size`-module
	 * symbol padded by `quiet` on each edge. `boxSize` may be fractional for a smooth size ramp. */
	private centeredBox(size: number, boxSize: number, quiet: number): { x: number; y: number; size: number } {
		const lo = (size - boxSize) / 2;
		return { x: quiet + lo, y: quiet + lo, size: boxSize };
	}

	private quietZone(): number {
		const raw = this.getAttribute("quiet-zone");
		const n = raw !== null ? Number(raw) : NaN;
		return Number.isFinite(n) && n >= 0 ? n : 4;
	}

	private size(): number {
		const raw = this.getAttribute("size");
		const n = raw !== null ? Number(raw) : NaN;
		return Number.isFinite(n) && n > 0 ? n : 200;
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(qrHostCss);
		this.fragment.update(this.bindings as unknown as Record<string, unknown>);
	}
}

define("xtyle-qr", XtyleQrCode);
