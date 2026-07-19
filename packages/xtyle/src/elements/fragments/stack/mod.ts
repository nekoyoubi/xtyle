interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface StackBindings {
	gap?: number;
	align?: string | null;
	justify?: string | null;
	inline?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: StackBindings, ops: OpsBuilder) => void) => void };
};

function stackClass(b: StackBindings): string {
	const gap = Math.min(Math.max(Math.trunc(b.gap ?? 4), 0), 8);
	return [
		"xtyle-stack",
		`xtyle-stack--gap-${gap}`,
		b.align && `xtyle-stack--align-${b.align}`,
		b.justify && `xtyle-stack--justify-${b.justify}`,
		b.inline && "xtyle-stack--inline",
	]
		.filter(Boolean)
		.join(" ");
}

function stackHtml(b: StackBindings): string {
	return `<div part="stack" class="${stackClass(b)}"><slot></slot></div>`;
}

hooks.fragment.mount("stack", (bindings, ops) => {
	ops.replaceChildren("[data-stack]", stackHtml(bindings));
});

hooks.fragment.update("stack", (bindings, ops) => {
	ops.setAttr(".xtyle-stack", "class", stackClass(bindings));
});
