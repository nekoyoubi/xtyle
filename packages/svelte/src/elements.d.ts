import type { HTMLAttributes } from "svelte/elements";

type XtyleAttributes<T extends EventTarget = HTMLElement> = HTMLAttributes<T>;

interface XtyleButtonAttributes extends XtyleAttributes {
	variant?: "accent" | "neutral" | "danger";
	size?: "sm" | "md" | "lg";
	type?: "button" | "submit" | "reset";
	disabled?: boolean;
}

interface XtyleFieldAttributes extends XtyleAttributes {
	label?: string;
	placeholder?: string;
	value?: string;
	type?: string;
	disabled?: boolean;
	invalid?: boolean;
	required?: boolean;
	error?: string;
}

interface XtyleCardAttributes extends XtyleAttributes {
	overlay?: boolean;
}

interface XtyleBadgeAttributes extends XtyleAttributes {
	tone?: string;
}

interface XtyleSwitchAttributes extends XtyleAttributes {
	checked?: boolean;
	disabled?: boolean;
	label?: string;
	labelledby?: string;
}

interface XtyleAlertAttributes extends XtyleAttributes {
	tone?: "success" | "warn" | "danger" | "info";
}

interface XtyleLinkAttributes extends XtyleAttributes {
	href?: string;
	target?: string;
	rel?: string;
}

interface XtyleCodeAttributes extends XtyleAttributes {
	lang?: string;
	code?: string;
	preload?: boolean;
}

declare module "svelte/elements" {
	interface SvelteHTMLElements {
		"xtyle-button": XtyleButtonAttributes;
		"xtyle-field": XtyleFieldAttributes;
		"xtyle-card": XtyleCardAttributes;
		"xtyle-badge": XtyleBadgeAttributes;
		"xtyle-switch": XtyleSwitchAttributes;
		"xtyle-alert": XtyleAlertAttributes;
		"xtyle-link": XtyleLinkAttributes;
		"xtyle-code": XtyleCodeAttributes;
	}
}
