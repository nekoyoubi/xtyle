interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
}

interface NumberFormatBindings {
	formatted?: string;
	value?: string;
	tone?: string;
	tabular?: boolean;
}

declare const hooks: {
	fragment: {
		[k: string]: (id: string, handler: (bindings: NumberFormatBindings, ops: OpsBuilder) => void) => void;
	};
};

function numberClass(b: NumberFormatBindings): string {
	return [
		"xtyle-number-format",
		b.tone && `xtyle-number-format--${b.tone}`,
		b.tabular === false && "xtyle-number-format--proportional",
	]
		.filter(Boolean)
		.join(" ");
}

function paint(b: NumberFormatBindings, ops: OpsBuilder): void {
	ops.setAttr(".xtyle-number-format", "value", b.value ?? "");
	ops.setText(".xtyle-number-format", b.formatted ?? "");
	ops.setAttr(".xtyle-number-format", "class", numberClass(b));
}

hooks.fragment.mount("number-format", (bindings, ops) => {
	ops.replaceChildren("[data-number-format]", `<data part="number" class="xtyle-number-format"></data>`);
	paint(bindings, ops);
});

hooks.fragment.update("number-format", (bindings, ops) => {
	paint(bindings, ops);
});
