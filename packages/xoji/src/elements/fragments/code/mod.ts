interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface CodeBindings {
	html?: string;
	language?: string | null;
	caption?: string | null;
}

function escapeCaption(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: CodeBindings, ops: OpsBuilder) => void) => void };
};

function codeClass(b: CodeBindings): string {
	const lang = b.language ?? "none";
	return `language-${lang}`;
}

function preClass(b: CodeBindings): string {
	return `xoji-code ${codeClass(b)}`;
}

function preLabel(b: CodeBindings): string {
	const lang = b.language ?? "none";
	return lang !== "none" ? `${lang} code` : "Code";
}

hooks.fragment.mount("code", (bindings, ops) => {
	ops.setAttr("[data-root]", "class", preClass(bindings));
	ops.setAttr("[data-root]", "tabindex", "0");
	ops.setAttr("[data-root]", "aria-label", preLabel(bindings));
	ops.setAttr("[data-code]", "class", codeClass(bindings));
	ops.replaceChildren("[data-code]", bindings.html ?? "");
	ops.replaceChildren("[data-caption]", bindings.caption ? escapeCaption(bindings.caption) : "");
});

hooks.fragment.update("code", (bindings, ops) => {
	ops.setAttr("[data-root]", "class", preClass(bindings));
	ops.setAttr("[data-root]", "aria-label", preLabel(bindings));
	ops.setAttr("[data-code]", "class", codeClass(bindings));
	ops.replaceChildren("[data-code]", bindings.html ?? "");
	ops.replaceChildren("[data-caption]", bindings.caption ? escapeCaption(bindings.caption) : "");
});
