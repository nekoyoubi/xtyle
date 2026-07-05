import { XtyleElement, define, type StyleMode } from "./base.js";
import { breadcrumbHostCss, type BreadcrumbItem } from "../markup/index.js";
import type { Size, FullTone } from "../index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/breadcrumb/source.generated.js";

export class XtyleBreadcrumb extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "breadcrumb", {
		applyIntent: (intent) => this.applyIntent(intent),
	});

	private applyIntent(intent: FragmentIntent): void {
		if (intent.select === undefined) return;
		const index = this.items.findIndex((item) => item.value === intent.select);
		this.dispatchEvent(
			new CustomEvent("select", {
				detail: { value: intent.select, index },
				bubbles: true,
				composed: true,
			}),
		);
	}

	static get observedAttributes(): string[] {
		return ["items", "separator", "tone", "size", "label"];
	}

	get tone(): FullTone {
		return (this.getAttribute("tone") as FullTone) ?? "accent";
	}
	set tone(value: FullTone) {
		this.setAttribute("tone", value);
	}

	get size(): Size {
		return (this.getAttribute("size") as Size) ?? "md";
	}
	set size(value: Size) {
		this.setAttribute("size", value);
	}

	get separator(): string {
		return this.getAttribute("separator") ?? "/";
	}
	set separator(value: string | null | undefined) {
		this.reflectString("separator", value);
	}

	get label(): string {
		return this.getAttribute("label") ?? "Breadcrumb";
	}
	set label(value: string | null | undefined) {
		this.reflectString("label", value);
	}

	get items(): BreadcrumbItem[] {
		const raw = this.getAttribute("items");
		if (!raw) return [];
		try {
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			console.warn("xtyle-breadcrumb: `items` is not valid JSON; rendering the default slot instead.");
			return [];
		}
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			items: this.items,
			separator: this.separator,
			tone: this.tone,
			size: this.size,
			label: this.label,
		};
	}

	private shapeSignature(): string {
		return JSON.stringify({ items: this.items, separator: this.separator });
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(breadcrumbHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
	}
}

define("xtyle-breadcrumb", XtyleBreadcrumb);
