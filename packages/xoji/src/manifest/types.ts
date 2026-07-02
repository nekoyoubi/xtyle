import type { TokenName } from "../types.js";

export type Binding = "html" | "svelte" | "astro";
export type ComponentCategory =
	| "control"
	| "form"
	| "feedback"
	| "overlay"
	| "navigation"
	| "layout"
	| "data-display"
	| "metrics"
	| "shell";

export interface AnatomyPart {
	name: string;
	description: string;
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
	/** The version this component first shipped. Drives a "new" badge in the nav and index while it sits ahead of the released stats baseline; clears itself once the next release baselines past it. Omit for anything that predates the tracking. */
	since?: string;
	summary: string;
	description: string;
	bindings: Binding[];
	anatomy: AnatomyPart[];
	props: PropDef[];
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
