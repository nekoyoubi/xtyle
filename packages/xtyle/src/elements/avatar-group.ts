import { XtyleElement, define, type StyleMode } from "./base.js";
import { avatarGroupHostCss, type AvatarGroupSize, type AvatarGroupSpacing } from "../markup/index.js";
import type { AvatarGroupLayout, AvatarGroupStack } from "../markup/avatar-group.js";
import { AVATAR_GROUP_SIZES, AVATAR_GROUP_SPACINGS, AVATAR_GROUP_LAYOUTS, AVATAR_GROUP_STACKS, resolveVocab } from "../vocab.js";
import { FragmentHost } from "./fragment-host.js";
import { NAME_ATTRIBUTES } from "./accessible-name.js";
import { manifest, fragmentSources } from "./fragments/avatar-group/source.generated.js";

export type { AvatarGroupSize, AvatarGroupSpacing, AvatarGroupLayout, AvatarGroupStack };

export class XtyleAvatarGroup extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "avatar-group", {
		nameTarget: '[part="group"]',
		applyIntent: () => {},
	});

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["size", "spacing", "layout", "stack", "overflow", "label", ...NAME_ATTRIBUTES];
	}

	get layout(): AvatarGroupLayout {
		return resolveVocab(this.getAttribute("layout"), AVATAR_GROUP_LAYOUTS, "overlap", "avatar group layout");
	}
	set layout(value: AvatarGroupLayout) {
		this.setAttribute("layout", value);
	}

	get stack(): AvatarGroupStack {
		return resolveVocab(this.getAttribute("stack"), AVATAR_GROUP_STACKS, "end", "avatar group stack");
	}
	set stack(value: AvatarGroupStack) {
		this.setAttribute("stack", value);
	}

	get size(): AvatarGroupSize {
		return resolveVocab(this.getAttribute("size"), AVATAR_GROUP_SIZES, "md", "avatar group size");
	}
	set size(value: AvatarGroupSize) {
		this.setAttribute("size", value);
	}

	get spacing(): AvatarGroupSpacing {
		return resolveVocab(this.getAttribute("spacing"), AVATAR_GROUP_SPACINGS, "normal", "avatar group spacing");
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
			size: this.size,
			spacing: this.spacing,
			layout: this.layout,
			stack: this.stack,
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

define("xtyle-avatar-group", XtyleAvatarGroup);
