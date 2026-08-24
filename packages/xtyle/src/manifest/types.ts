import type { TokenName } from "../types.js";

export type Binding = "html" | "svelte" | "astro";
export type ComponentCategory =
	| "control"
	| "form"
	| "feedback"
	| "overlay"
	| "navigation"
	| "layout"
	| "content"
	| "media"
	| "metrics"
	| "shell";

export interface AnatomyPart {
	name: string;
	description: string;
	/**
	 * The internal selector the component's own stylesheet uses. Under a shadow render this is *not*
	 * reachable from an outside sheet — check {@link ComponentManifest.exposedParts} for the handle that
	 * is. A light-DOM component has no boundary, so there the selector is the handle.
	 */
	selector: string;
	tokens?: TokenName[];
}
export interface PropDef {
	name: string;
	type: string;
	default?: string;
	description: string;
	bindings: Binding[];
	options?: string[];
	/** Names an author is likely to reach for instead of this one, so the authoring diagnostic can
	 * redirect them. Worth declaring when the near-miss is a real HTML attribute (`title` for
	 * `heading`), since those land somewhere real and fail without vanishing. */
	aliases?: string[];
	/** The HTML attribute spelling, when it is not the kebab-case of `name`. `name` is the camelCase the
	 * Svelte and Astro bindings take; in markup the attribute is usually its kebab form, but a few
	 * differ outright (`lang` is the `language` attribute). A camelCase attribute is not an error, it is
	 * simply not an attribute, so an author who guesses wrong gets the defaults and no diagnostic. */
	attr?: string;
	/** The element the attribute is authored on, when it is not this component's own host: a sibling
	 * the same manifest documents (`xtyle-radio-group`), a child the consumer writes (`item`,
	 * `threshold`), or the imperative call that takes it (`toast()`). The host neither observes nor
	 * reads it, and should not — so this is the difference between "the host ignores this" and "you
	 * wrote it in the wrong place". */
	attrOn?: string;
	/** Assigned on the element from JS and nowhere else, so no attribute backs it: a function, or a
	 * value with no attribute spelling. The writable twin of {@link readonly}; markup cannot drive
	 * either, and the reference page prints an HTML spelling for neither. */
	propertyOnly?: boolean;
	/** Why the host deliberately does not observe this attribute, for the cases where observing it would
	 * be wrong or would do nothing. `"seed"` — it is read once on connect to seed live state, and
	 * re-reading would discard what the user has since rearranged, the same split an `<input>` has
	 * between its `value` attribute and its dirty value. `"css"` — the stylesheet selects on it, so the
	 * cascade applies a change with no render to re-run. Both are claims the suite checks; an attribute
	 * that is merely forgotten is neither. */
	unobserved?: "seed" | "css";
	/** Readable from JS and not settable in markup, so no attribute backs it. */
	readonly?: boolean;
}
export interface EventDef {
	/** The DOM event name exactly as `addEventListener` takes it — the one that works in markup. */
	name: string;
	/** What `event.detail` carries. Omit for an event with no payload. */
	detail?: string;
	description: string;
	bindings: Binding[];
	/** The wrapper's handler prop, when it is not `on` + {@link name}. A hyphenated or namespaced event
	 * has no valid identifier, so `month-change` arrives as `onmonthchange` and `xtyle:reveal-commit` as
	 * `oncommit`. Same split as {@link PropDef.attr}: the name that reads right is not the name that works. */
	handler?: string;
}
/**
 * A method you call on the element itself — the imperative half of a component's surface, and the only
 * half a prop or an event cannot express. A control whose input is a gesture (`reveal`) or whose state
 * is owned by the platform (`dialog`) needs a door a script can open, and a consumer who cannot find one
 * concludes it does not exist.
 */
export interface MethodDef {
	/** The method name exactly as you call it on the element. */
	name: string;
	/** The parameters as they read in TypeScript, without the parentheses. Omit for a method taking none. */
	params?: string;
	/** What it hands back. Omit for `void`. */
	returns?: string;
	description: string;
	/**
	 * Where the method is reachable. `html` is the raw element, so every method has it. `svelte` only when
	 * the wrapper re-exports it, which is a separate piece of wiring and the one that silently goes missing.
	 * `astro` renders on the server and hands back no instance, so a method is never reachable there.
	 */
	bindings: Binding[];
}
export interface VariantDef {
	name: string;
	description: string;
	className: string;
	tokens?: TokenName[];
}
export interface SizeDef {
	name: string;
	description: string;
	className: string;
	isDefault?: boolean;
}
export interface StateDef {
	name: string;
	description: string;
	selector: string;
	tokens?: TokenName[];
}
export interface SlotDef {
	name: string;
	description: string;
	bindings: Binding[];
	/** Prop names an author is likely to pass instead of projecting content into this slot, so the
	 * authoring diagnostic can point at the slot rather than reporting an anonymous unknown prop. */
	aliases?: string[];
}
export interface ComponentExample {
	id: string;
	title: string;
	description: string;
	source: Partial<Record<Binding, string>>;
}
export interface ComponentManifest {
	id: string;
	name: string;
	category: ComponentCategory;
	/** The version this component first shipped. Drives a "new" badge in the nav and index while it sits ahead of
	 * the released stats baseline; clears itself once the next release baselines past it. Required: an absent
	 * `since` reads as "not new", so a component that forgets it lands silently and is never announced. */
	since: string;
	summary: string;
	description: string;
	/** Discovery aliases: capability words a searcher (human or agent) might reach for that aren't the
	 * component's own name, so `Progress` surfaces on "meter", "gauge", "capacity". Kept structured (not
	 * buried in prose) so `xtyle_components` and the reference site can search them and overlap is visible. */
	keywords?: string[];
	/** Related component ids to cross-reference, so an overlapping capability is one hop away instead of a rediscovery. */
	seeAlso?: string[];
	bindings: Binding[];
	anatomy: AnatomyPart[];
	/**
	 * The `part` names this component's fill actually emits, and therefore the only nodes an outside
	 * sheet can reach: `::part(<name>)`.
	 *
	 * Anatomy publishes the *internal* selector, which under a shadow render matches nothing from
	 * outside — and shadow DOM's failure mode for a selector that matches nothing is silence, so an
	 * author who copies it gets no styling and no error and cannot tell "wrong syntax" from "not
	 * exposed". This answers that question outright: a name listed here is reachable, an anatomy entry
	 * whose name is absent is genuinely internal, and a component with no entry here renders light DOM,
	 * where the selector is the handle.
	 *
	 * Generated from the fill rather than written by hand, and gated by a test, so it cannot drift from
	 * what the component emits.
	 */
	exposedParts?: string[];
	props: PropDef[];
	/**
	 * What the component emits. Absent means it emits nothing; an empty array is never correct.
	 *
	 * The manifest is the documented way to build against xtyle, and without this it answered "what can I
	 * configure" while staying silent on "what can I observe" — a reader saw ten populated sections, no
	 * empty `events` to signal an absence, and concluded there was nothing to listen for. Gated against
	 * the elements' own emit sites and the wrappers' handler props, because a hand-kept second list drifts.
	 */
	events?: EventDef[];
	methods?: MethodDef[];
	variants: VariantDef[];
	sizes: SizeDef[];
	states: StateDef[];
	slots: SlotDef[];
	consumedTokens: TokenName[];
	composition: string[];
	a11y: string[];
	examples: ComponentExample[];
}
export type ComponentRegistry = Record<string, ComponentManifest>;
