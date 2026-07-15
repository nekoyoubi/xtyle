import { escapeSelectorValue } from "../selector-escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface Segment {
	value: string;
	label: string;
	disabled?: boolean;
	badge?: string;
	slot?: string;
	title?: string;
}

interface SegmentedBindings {
	segments?: Segment[];
	value?: string | null;
	disabled?: boolean;
	size?: string;
	tone?: string;
	label?: string | null;
	labelledby?: string | null;
	ariaLabel?: string | null;
	elementId?: string;
}

interface EventPayload {
	dataset?: Record<string, string>;
	key?: string;
	disabled?: boolean;
	ariaDisabled?: string;
}

interface NavContext {
	enabledKeys: string[];
}

interface SelectIntent {
	select?: string;
	focus?: string;
	preventDefault?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: SegmentedBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

function selectedValue(bindings: SegmentedBindings): string {
	const segments = bindings.segments ?? [];
	const requested = bindings.value ?? null;
	if (requested != null && segments.some((s) => s.value === requested && !s.disabled)) return requested;
	const firstEnabled = segments.find((s) => !s.disabled) ?? segments[0];
	return firstEnabled?.value ?? "";
}

function rootClass(bindings: SegmentedBindings): string {
	const size = bindings.size ?? "md";
	const tone = bindings.tone ?? "accent";
	return [
		"xtyle-segmented",
		`xtyle-segmented--${tone}`,
		size !== "md" && `xtyle-segmented--${size}`,
		bindings.disabled && "xtyle-segmented--disabled",
	]
		.filter(Boolean)
		.join(" ");
}

function escapeHtml(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
	return escapeHtml(value).replace(/"/g, "&quot;");
}

function options(bindings: SegmentedBindings, selected: string): string {
	const segments = bindings.segments ?? [];
	const groupDisabled = bindings.disabled ?? false;
	return segments
		.map((seg) => {
			const segDisabled = groupDisabled || !!seg.disabled;
			const isOn = seg.value === selected;
			const tabindex = segDisabled ? "-1" : isOn ? "0" : "-1";
			const disabledAttr = segDisabled ? " disabled" : "";
			const badge = seg.badge ? `<span class="xtyle-segmented__badge" part="badge">${escapeHtml(seg.badge)}</span>` : "";
			// A slotted segment carries framework-owned content (an icon), so the radio itself owns the
			// option's accessible name (`aria-label` from `label`) while its body is the live `<slot>`.
			// The tooltip is an explicit per-segment `title` when given, else the label for a slotted
			// segment (whose visible body isn't text) — a text segment needs no tooltip unless it asks.
			const ariaLabel = seg.slot ? ` aria-label="${escapeAttr(seg.label)}"` : "";
			const tooltip = seg.title ?? (seg.slot ? seg.label : undefined);
			const titleAttr = tooltip ? ` title="${escapeAttr(tooltip)}"` : "";
			const named = `${ariaLabel}${titleAttr}`;
			const body = seg.slot ? `<slot name="${escapeAttr(seg.slot)}"></slot>` : escapeHtml(seg.label);
			const optionClass = seg.slot ? "xtyle-segmented__option xtyle-segmented__option--icon" : "xtyle-segmented__option";
			return (
				`<button class="${optionClass}" part="option" type="button" role="radio" ` +
				`aria-checked="${String(isOn)}" tabindex="${tabindex}" data-value="${escapeAttr(seg.value)}"${named}${disabledAttr}>${body}${badge}</button>`
			);
		})
		.join("");
}

function fieldInner(bindings: SegmentedBindings, selected: string): string {
	const labelText = bindings.label ?? null;
	const labelledby = bindings.labelledby ?? null;
	const ariaLabel = bindings.ariaLabel ?? null;
	const labelId = `${bindings.elementId ?? "xtyle-segmented"}-label`;
	// An external id wins, then a visible label, then a bare `aria-label` that names the group with no
	// visible text (an icon bar in a toolbar where the label would just be noise).
	const groupName = labelledby
		? ` aria-labelledby="${labelledby}"`
		: labelText
			? ` aria-labelledby="${labelId}"`
			: ariaLabel
				? ` aria-label="${escapeAttr(ariaLabel)}"`
				: "";
	const label = labelText
		? `<span class="xtyle-segmented__label" part="label" id="${labelId}">${labelText}</span>`
		: "";
	return `${label}<div class="${rootClass(bindings)}" part="segmented" role="radiogroup"${groupName}>${options(bindings, selected)}</div>`;
}

/** Build the whole structure once: the expensive `replaceChildren` rebuild. */
hooks.fragment.mount("segmented", (bindings, ops) => {
	const selected = selectedValue(bindings);
	ops.replaceChildren("[data-control]", fieldInner(bindings, selected));
});

/** A selection change: patch state on the existing nodes, never rebuild them. */
hooks.fragment.update("segmented", (bindings, ops) => {
	const selected = selectedValue(bindings);
	const groupDisabled = bindings.disabled ?? false;
	ops.setAttr('[role="radiogroup"]', "class", rootClass(bindings));
	for (const seg of bindings.segments ?? []) {
		const segDisabled = groupDisabled || !!seg.disabled;
		const isOn = seg.value === selected;
		const sel = `[role="radio"][data-value="${escapeSelectorValue(seg.value)}"]`;
		ops.setAttr(sel, "aria-checked", String(isOn));
		ops.setAttr(sel, "tabindex", segDisabled ? "-1" : isOn ? "0" : "-1");
	}
});

xript.exports.register("selectOption", (payload: unknown): SelectIntent => {
	const e = payload as EventPayload;
	if (e.disabled || e.ariaDisabled === "true") return {};
	const value = e.dataset?.value;
	return value ? { select: value, focus: value } : {};
});

xript.exports.register("navKeydown", (payload: unknown, context: unknown): SelectIntent => {
	const e = payload as EventPayload;
	if (e.disabled || e.ariaDisabled === "true") return {};
	const ctx = context as NavContext;
	const key = e.key ?? "";
	const current = e.dataset?.value ?? "";
	const enabled = ctx.enabledKeys;
	const here = enabled.indexOf(current);
	let target: string | undefined;
	if (key === "ArrowRight" || key === "ArrowDown") target = enabled[(here + 1) % enabled.length];
	else if (key === "ArrowLeft" || key === "ArrowUp") target = enabled[(here - 1 + enabled.length) % enabled.length];
	else if (key === "Home") target = enabled[0];
	else if (key === "End") target = enabled[enabled.length - 1];
	else return {};
	if (target === undefined) return {};
	return { select: target, focus: target, preventDefault: true };
});
