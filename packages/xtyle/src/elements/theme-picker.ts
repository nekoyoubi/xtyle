import { XtyleElement, define, type StyleMode } from "./base.js";
import "./theme-card.js";
import "./theme-swatch.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/theme-picker/source.generated.js";
import { themePickerHostCss } from "../markup/index.js";

/** One choice offered by the picker: a name to show and the invocation behind it. */
export interface PickerTheme {
	name?: string | null;
	algorithm?: string | null;
	scheme?: "light" | "dark" | null;
	knobs?: Record<string, unknown> | null;
	constraints?: Record<string, string> | null;
}

/** Fired when a theme is chosen, carrying the whole invocation so a scope can apply it directly. */
export const THEME_PICK_EVENT = "xtyle:theme-pick";

function parseThemes(raw: string | null): PickerTheme[] {
	if (!raw) return [];
	try {
		const parsed: unknown = JSON.parse(raw);
		return Array.isArray(parsed) ? (parsed as PickerTheme[]) : [];
	} catch {
		return [];
	}
}

function keyOf(theme: PickerTheme, index: number): string {
	return theme.name ?? theme.algorithm ?? String(index);
}

/**
 * A gallery of themes to choose from. Each choice is an `<xtyle-theme-card>`, so the preview, the
 * button semantics, and the selected state all come from that component; the picker owns the grid,
 * which of the cards is current, and reporting the choice.
 *
 * It adds no cursor of its own. Every card is already a real button, so focus moves through them the
 * way it moves through any group of controls — there is no bespoke roving tab stop here.
 *
 * `themes` is the list of invocations; picking one fires {@link THEME_PICK_EVENT} with the whole
 * invocation, which is what an `<xtyle-theme-scope>` needs to apply it.
 */
export class XtyleThemePicker extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["themes", "value", "label", "swatches", "min-col-width", "empty", "layout", "open"];
	}

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "theme-picker", {
		applyIntent: () => {},
	});

	private wired = false;

	get themes(): PickerTheme[] {
		return parseThemes(this.getAttribute("themes"));
	}
	/** Accepts the array it reads back, or JSON already serialized — a framework binding that sets
	 * this as a property may have stringified it on the way, and stringifying that again would store
	 * a quoted string the parser then reads as no themes at all. */
	set themes(value: PickerTheme[] | string | null | undefined) {
		if (value === null || value === undefined) {
			this.reflectString("themes", null);
			return;
		}
		this.reflectString("themes", typeof value === "string" ? value : JSON.stringify(value));
	}

	/** The chosen theme's key: its `name`, or its `algorithm` when unnamed. */
	get value(): string | null {
		return this.getAttribute("value");
	}
	set value(next: string | null | undefined) {
		this.reflectString("value", next);
	}

	get label(): string | null {
		return this.getAttribute("label");
	}
	set label(value: string | null | undefined) {
		this.reflectString("label", value);
	}

	/** `gallery` lays the choices out in place; `menu` puts the same gallery behind a trigger. */
	get layout(): "gallery" | "menu" {
		return this.getAttribute("layout") === "menu" ? "menu" : "gallery";
	}
	set layout(value: "gallery" | "menu") {
		this.setAttribute("layout", value);
	}

	/** Start the `menu` layout's panel open. Ignored by the gallery, which is always open. */
	get open(): boolean {
		return this.hasAttribute("open");
	}
	set open(value: boolean) {
		this.reflectBoolean("open", value);
	}

	get swatches(): boolean {
		return this.hasAttribute("swatches");
	}
	set swatches(value: boolean) {
		this.reflectBoolean("swatches", value);
	}

	/** The chosen theme's whole invocation, or `null` when nothing is chosen. */
	get selected(): PickerTheme | null {
		const key = this.value;
		if (key === null) return null;
		return this.themes.find((theme, i) => keyOf(theme, i) === key) ?? null;
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.paint();
	}

	private get bindings(): Record<string, unknown> {
		const current = this.value;
		return {
			themes: this.themes.map((theme, i) => ({
				key: keyOf(theme, i),
				name: theme.name ?? theme.algorithm ?? null,
				algorithm: theme.algorithm ?? null,
				scheme: theme.scheme ?? null,
				knobs: theme.knobs ?? null,
				constraints: theme.constraints ?? null,
				selected: keyOf(theme, i) === current,
			})),
			label: this.label,
			layout: this.layout,
			currentName: this.selected?.name ?? this.selected?.algorithm ?? this.value ?? "",
			open: this.open,
			swatches: this.swatches,
			minColWidth: this.getAttribute("min-col-width"),
			empty: this.getAttribute("empty"),
		};
	}

	/** Everything that changes the gallery's *structure*. `value` is deliberately absent: choosing is
	 * a patch on one attribute, and reshaping for it would detach the button that was just activated. */
	private shapeSignature(): string {
		return [
			this.getAttribute("themes") ?? "",
			this.swatches,
			this.getAttribute("min-col-width") ?? "",
			this.label ?? "",
			this.getAttribute("empty") ?? "",
			this.layout,
			String(this.open),
		].join("|");
	}

	private paint(): void {
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
	}

	/**
	 * A card's `select` is the picker's input: adopt it as the value and report the invocation.
	 *
	 * The card is read off `composedPath` rather than `event.target`, because the event crosses two
	 * shadow boundaries to get here and the target is retargeted to this host on the way — leaving
	 * nothing to match a card against.
	 */
	private onSelect = (event: Event): void => {
		const card = event
			.composedPath()
			.find((node): node is HTMLElement => node instanceof HTMLElement && node.tagName === "XTYLE-THEME-CARD");
		const key = card?.dataset.key;
		if (!key) return;
		event.stopPropagation();
		if (this.value === key) return;
		this.value = key;
		this.dispatchEvent(
			new CustomEvent(THEME_PICK_EVENT, {
				detail: { value: key, theme: this.selected },
				bubbles: true,
				composed: true,
			}),
		);
	};

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(themePickerHostCss);
		this.paint();
		if (!this.wired) {
			this.wired = true;
			this.addEventListener("select", this.onSelect);
		}
	}
}

define("xtyle-theme-picker", XtyleThemePicker);
