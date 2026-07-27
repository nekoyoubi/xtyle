import { escapeAttr } from "../escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
}

interface Chip {
	token: string;
	label: string;
	color: string;
}

interface ThemeSwatchBindings {
	chips?: Chip[];
	size?: string;
	labels?: boolean;
	details?: boolean;
	error?: string | null;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: ThemeSwatchBindings, ops: OpsBuilder) => void) => void };
};

function chipMarkup(chip: Chip, b: ThemeSwatchBindings): string {
	const size = b.size && b.size !== "md" ? ` size="${escapeAttr(b.size)}"` : "";
	const label = b.labels === false ? "" : ` label="${escapeAttr(chip.label)}"`;
	const details = b.details ? " details" : "";
	return (
		`<xtyle-swatch part="chip" color="${escapeAttr(chip.color)}"${label}` +
		` value="${escapeAttr(chip.color)}"${size}${details}></xtyle-swatch>`
	);
}

function inner(b: ThemeSwatchBindings): string {
	if (b.error) {
		return `<span class="xtyle-theme-swatch__error" part="error">${escapeAttr(b.error)}</span>`;
	}
	const chips = (b.chips ?? []).map((chip) => chipMarkup(chip, b)).join("");
	return `<span class="xtyle-theme-swatch__row" part="row">${chips}</span>`;
}

hooks.fragment.mount("theme-swatch", (bindings, ops) => {
	ops.replaceChildren("[data-theme-swatch]", inner(bindings));
});

hooks.fragment.update("theme-swatch", (bindings, ops) => {
	ops.replaceChildren("[data-theme-swatch]", inner(bindings));
});
