import { XojiElement, define, type StyleMode } from "./base.js";
import { avatarGroupHostCss, type AvatarGroupSize, type AvatarGroupSpacing } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/avatar-group/source.generated.js";

export type { AvatarGroupSize, AvatarGroupSpacing };

export class XojiAvatarGroup extends XojiElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "avatar-group", {
		applyIntent: () => {},
	});

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["size", "spacing", "overflow", "label"];
	}

	get size(): AvatarGroupSize {
		const raw = this.getAttribute("size");
		return raw === "sm" || raw === "lg" || raw === "xl" ? raw : "md";
	}
	set size(value: AvatarGroupSize) {
		this.setAttribute("size", value);
	}

	get spacing(): AvatarGroupSpacing {
		const raw = this.getAttribute("spacing");
		return raw === "snug" || raw === "loose" ? raw : "normal";
	}
	set spacing(value: AvatarGroupSpacing) {
		this.setAttribute("spacing", value);
	}

	get overflow(): number {
		const n = Math.trunc(Number(this.getAttribute("overflow")));
		return Number.isFinite(n) && n > 0 ? n : 0;
	}
	set overflow(value: number) {
		this.setAttribute("overflow", String(value));
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			size: this.getAttribute("size"),
			spacing: this.getAttribute("spacing"),
			overflow: this.overflow,
			label: this.getAttribute("label"),
		};
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(avatarGroupHostCss);
		this.fragment.update(this.bindings);
	}
}

define("xoji-avatar-group", XojiAvatarGroup);
