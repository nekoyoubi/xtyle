interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface Segment {
	value: string;
	label: string;
	disabled?: boolean;
	badge?: string;
}

interface SegmentedBindings {
	segments?: Segment[];
	value?: string | null;
	disabled?: boolean;
	size?: string;
	tone?: string;
	label?: string | null;
	labelledby?: string | null;
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
		"xoji-segmented",
		`xoji-segmented--${tone}`,
		size !== "md" && `xoji-segmented--${size}`,
		bindings.disabled && "xoji-segmented--disabled",
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
			const badge = seg.badge ? `<span class="xoji-segmented__badge" part="badge">${escapeHtml(seg.badge)}</span>` : "";
			return (
				`<button class="xoji-segmented__option" part="option" type="button" role="radio" ` +
				`aria-checked="${String(isOn)}" tabindex="${tabindex}" data-value="${escapeAttr(seg.value)}"${disabledAttr}>${escapeHtml(seg.label)}${badge}</button>`
			);
		})
		.join("");
}

function fieldInner(bindings: SegmentedBindings, selected: string): string {
	const labelText = bindings.label ?? null;
	const labelledby = bindings.labelledby ?? null;
	const labelId = `${bindings.elementId ?? "xoji-segmented"}-label`;
	const groupName = labelledby
		? ` aria-labelledby="${labelledby}"`
		: labelText
			? ` aria-labelledby="${labelId}"`
			: "";
	const label = labelText
		? `<span class="xoji-segmented__label" part="label" id="${labelId}">${labelText}</span>`
		: "";
	return `${label}<div class="${rootClass(bindings)}" part="segmented" role="radiogroup"${groupName}>${options(bindings, selected)}</div>`;
}

/** Build the whole structure once: the expensive `replaceChildren` rebuild. */
hooks.fragment.mount("segmented", (bindings, ops) => {
	const selected = selectedValue(bindings);
	ops.replaceChildren("[data-field]", fieldInner(bindings, selected));
});

/** A selection change: patch state on the existing nodes, never rebuild them. */
hooks.fragment.update("segmented", (bindings, ops) => {
	const selected = selectedValue(bindings);
	const groupDisabled = bindings.disabled ?? false;
	ops.setAttr('[role="radiogroup"]', "class", rootClass(bindings));
	for (const seg of bindings.segments ?? []) {
		const segDisabled = groupDisabled || !!seg.disabled;
		const isOn = seg.value === selected;
		ops.setAttr(`[role="radio"][data-value="${seg.value}"]`, "aria-checked", String(isOn));
		ops.setAttr(`[role="radio"][data-value="${seg.value}"]`, "tabindex", segDisabled ? "-1" : isOn ? "0" : "-1");
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
