import { XtyleElement, define, type StyleMode } from "./base.js";
import type { FullTone, Tone } from "../index.js";
import { avatarHostCss, avatarInitials } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/avatar/source.generated.js";
import { resolveTone, resolveOptionalTone, resolveVocab, AVATAR_SIZES, AVATAR_SHAPES } from "../vocab.js";

import type { AvatarSize, AvatarShape } from "../markup/avatar.js";
export type { AvatarSize, AvatarShape };

export class XtyleAvatar extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "avatar", {
		applyIntent: () => {},
	});

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["src", "alt", "user-name", "tone", "size", "shape", "status", "status-label", "pulse"];
	}

	get src(): string | null {
		return this.getAttribute("src");
	}
	set src(value: string | null | undefined) {
		this.reflectString("src", value);
	}

	get alt(): string | null {
		return this.getAttribute("alt");
	}
	set alt(value: string | null | undefined) {
		this.reflectString("alt", value);
	}

	/** The person the avatar stands for: supplies the fallback initials and names the avatar when no
	 * `alt` is set. Deliberately not `name` — that attribute carries form-participation meaning on an
	 * element, and an avatar is not a form control. */
	get userName(): string | null {
		return this.getAttribute("user-name");
	}
	set userName(value: string | null | undefined) {
		this.reflectString("user-name", value);
	}

	get tone(): FullTone {
		return resolveTone(this.getAttribute("tone"), "neutral");
	}
	set tone(value: FullTone) {
		this.setAttribute("tone", value);
	}

	get size(): AvatarSize {
		return resolveVocab(this.getAttribute("size"), AVATAR_SIZES, "md", "avatar size");
	}
	set size(value: AvatarSize) {
		this.setAttribute("size", value);
	}

	get shape(): AvatarShape {
		return resolveVocab(this.getAttribute("shape"), AVATAR_SHAPES, "circle", "avatar shape");
	}
	set shape(value: AvatarShape) {
		this.setAttribute("shape", value);
	}

	get status(): Tone | null {
		return resolveOptionalTone(this.getAttribute("status"));
	}
	set status(value: Tone | null | undefined) {
		this.reflectString("status", value);
	}

	get statusLabel(): string | null {
		return this.getAttribute("status-label");
	}
	set statusLabel(value: string | null | undefined) {
		this.reflectString("status-label", value);
	}

	get pulse(): "" | "slow" | "fast" | null {
		return this.getAttribute("pulse") as "" | "slow" | "fast" | null;
	}
	set pulse(value: boolean | "slow" | "fast" | null | undefined) {
		if (value === true) this.setAttribute("pulse", "");
		else if (!value) this.removeAttribute("pulse");
		else this.setAttribute("pulse", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	/**
	 * Whether the consumer put anything real in the default slot. A whitespace-only text node is not
	 * content — but every framework binding emits one between the element's tags, and shadow DOM
	 * assigns it to the default slot all the same, which suppresses a slot's fallback. So the
	 * initials cannot *be* slot fallback; this decides, and the fragment paints them as real content.
	 */
	private hasDefaultContent(): boolean {
		return this.fragment
			.slottedNodes("")
			.some((node) =>
				node.nodeType === Node.TEXT_NODE
					? (node.textContent ?? "").trim() !== ""
					: node.nodeType === Node.ELEMENT_NODE,
			);
	}

	private get bindings(): Record<string, unknown> {
		return {
			src: this.src,
			alt: this.alt,
			userName: this.userName,
			initials: this.hasDefaultContent() ? "" : avatarInitials(this.userName),
			tone: this.tone,
			size: this.size,
			shape: this.shape,
			status: this.status,
			statusLabel: this.statusLabel,
			pulse: this.pulse,
		};
	}

	/** A signature of the state ops can't express incrementally — the `<img>` source
	 * (`src`), the status-dot (`status`), and the initials (`user-name`). The `src` value (not just
	 * its presence) is folded in so a URL change forces a full rebuild: this both updates the
	 * rendered image and resurrects an `<img>` that removed itself via `onerror`. `user-name` rides
	 * along because the initials are an element the mount emits, not an attribute an update op can
	 * reach, so a renamed avatar has to rebuild to redraw them. */
	private shapeSignature(): string {
		return `${this.src ?? ""}|${this.status != null}|${this.userName ?? ""}`;
	}

	private warnIfUnnamed(): void {
		if (this.src !== null && !this.alt) {
			console.warn("xtyle-avatar: an avatar with `src` has no `alt`. Provide one so the image is announced.");
		}
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(avatarHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.warnIfUnnamed();
	}
}

define("xtyle-avatar", XtyleAvatar);
