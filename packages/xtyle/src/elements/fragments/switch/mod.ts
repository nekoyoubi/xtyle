interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
}

interface SwitchBindings {
	checked?: boolean;
	disabled?: boolean;
	size?: string;
	tone?: string;
	shape?: string;
	orientation?: string;
	reverse?: boolean;
	labelSide?: string;
	label?: string | null;
	labelledby?: string | null;
	onLabel?: string | null;
	offLabel?: string | null;
	elementId?: string;
}

interface EventPayload {
	disabled?: boolean;
	ariaDisabled?: string;
	key?: string;
}

interface Intent {
	toggleChecked?: boolean;
	preventDefault?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: SwitchBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

function switchClass(b: SwitchBindings): string {
	const size = b.size ?? "md";
	const tone = b.tone ?? "accent";
	return [
		"xtyle-switch",
		`xtyle-switch--${tone}`,
		size !== "md" && `xtyle-switch--${size}`,
		b.shape === "square" && "xtyle-switch--square",
		b.orientation === "vertical" && "xtyle-switch--vertical",
		b.reverse && "xtyle-switch--reverse",
		b.labelSide === "end" && "xtyle-switch--label-end",
		b.disabled && "xtyle-switch--disabled",
	]
		.filter(Boolean)
		.join(" ");
}

function stateLabel(b: SwitchBindings): string | null {
	const text = (b.checked ? b.onLabel : b.offLabel) ?? null;
	return text;
}

function inner(b: SwitchBindings): string {
	const checked = b.checked ?? false;
	const disabled = b.disabled ?? false;
	const uid = b.elementId ?? "xtyle-switch";
	const labelId = `${uid}-label`;
	const stateId = `${uid}-state`;
	const stateText = stateLabel(b);
	const hasState = stateText !== null;

	let nameAttr = "";
	if (b.labelledby) nameAttr = ` aria-labelledby="${b.labelledby}"`;
	else if (b.label) nameAttr = ` aria-labelledby="${labelId}"`;
	else if (hasState) nameAttr = ` aria-labelledby="${stateId}"`;

	const disabledAttr = disabled ? ' disabled aria-disabled="true"' : "";
	const leadingLabel = b.label
		? `<span class="xtyle-switch__label" part="label" id="${labelId}">${b.label}</span>`
		: "";
	const trailingState = hasState
		? `<span class="xtyle-switch__state" part="state" id="${stateId}">${stateText}</span>`
		: "";

	return (
		leadingLabel +
		`<button class="xtyle-switch__track" part="track" type="button" role="switch" ` +
		`aria-checked="${String(checked)}"${nameAttr}${disabledAttr}>` +
		`<span class="xtyle-switch__thumb" part="thumb" aria-hidden="true"></span></button>` +
		trailingState
	);
}

hooks.fragment.mount("switch", (bindings, ops) => {
	ops.setAttr(".xtyle-switch", "class", switchClass(bindings));
	ops.replaceChildren("[data-switch]", inner(bindings));
});

hooks.fragment.update("switch", (bindings, ops) => {
	ops.setAttr(".xtyle-switch", "class", switchClass(bindings));
	ops.setAttr('[role="switch"]', "aria-checked", String(bindings.checked ?? false));
	const text = stateLabel(bindings);
	if (text !== null) ops.setText('[part="state"]', text);
});

xript.exports.register("toggle", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.disabled || e.ariaDisabled === "true") return {};
	return { toggleChecked: true };
});

xript.exports.register("keyToggle", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.disabled || e.ariaDisabled === "true") return {};
	if (e.key === " " || e.key === "Spacebar" || e.key === "Enter") return { toggleChecked: true, preventDefault: true };
	return {};
});
