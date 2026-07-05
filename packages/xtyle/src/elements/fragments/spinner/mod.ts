interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface SpinnerBindings {
	tone?: string;
	size?: string;
	label?: string;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: SpinnerBindings, ops: OpsBuilder) => void) => void };
};

function spinnerClass(b: SpinnerBindings): string {
	const tone = b.tone ?? "accent";
	const size = b.size ?? "md";
	return ["xtyle-spinner", `xtyle-spinner--${tone}`, size !== "md" && `xtyle-spinner--${size}`].filter(Boolean).join(" ");
}

function spinnerHtml(b: SpinnerBindings): string {
	const label = b.label ?? "Loading";
	return `<span part="spinner" class="${spinnerClass(b)}" role="status" aria-label="${label}"></span>`;
}

hooks.fragment.mount("spinner", (bindings, ops) => {
	ops.replaceChildren("[data-spinner]", spinnerHtml(bindings));
});

hooks.fragment.update("spinner", (bindings, ops) => {
	ops.setAttr('[part="spinner"]', "class", spinnerClass(bindings));
	ops.setAttr('[part="spinner"]', "aria-label", bindings.label ?? "Loading");
});
