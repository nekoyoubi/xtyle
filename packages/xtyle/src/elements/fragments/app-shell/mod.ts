interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface AppShellBindings {
	skipLink?: boolean;
	skipLinkText?: string;
	bodyStyle?: string | null;
	mainId?: string | null;
	leftResizable?: boolean;
	rightResizable?: boolean;
}

function escapeAttr(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: AppShellBindings, ops: OpsBuilder) => void) => void };
};

function skipText(b: AppShellBindings): string {
	const explicit = b.skipLinkText;
	return explicit && explicit.length > 0 ? explicit : "Skip to main content";
}

function mainId(b: AppShellBindings): string {
	const explicit = b.mainId;
	return explicit && explicit.length > 0 ? explicit : "main";
}

function rail(side: "left" | "right", resizable: boolean): string {
	const resize = resizable ? " xtyle-app__rail--resizable" : "";
	return `<div class="xtyle-app__rail xtyle-app__rail--${side}${resize}"><slot name="${side}"></slot></div>`;
}

function resizer(side: "left" | "right"): string {
	const label = side === "left" ? "Resize left panel" : "Resize right panel";
	return `<div data-handle="${side}" class="xtyle-app__resizer xtyle-app__resizer--${side}" role="separator" aria-orientation="vertical" tabindex="0" aria-label="${label}"></div>`;
}

function appInner(b: AppShellBindings): string {
	const id = mainId(b);
	const skip = b.skipLink
		? `<a part="skip-link" class="xtyle-app__skip-link" href="#${escapeAttr(id)}">${escapeAttr(skipText(b))}</a>`
		: "";
	const handles = (b.leftResizable ? resizer("left") : "") + (b.rightResizable ? resizer("right") : "");
	return (
		skip +
		'<slot name="toolbar"></slot>' +
		'<div data-body class="xtyle-app__body">' +
		rail("left", Boolean(b.leftResizable)) +
		`<main part="main" id="${escapeAttr(id)}" class="xtyle-main" tabindex="0"><slot></slot></main>` +
		rail("right", Boolean(b.rightResizable)) +
		handles +
		"</div>" +
		'<slot name="statusbar"></slot>'
	);
}

hooks.fragment.mount("app-shell", (bindings, ops) => {
	ops.replaceChildren("[data-app]", appInner(bindings));
	if (bindings.bodyStyle) ops.setAttr("[data-body]", "style", bindings.bodyStyle);
});

hooks.fragment.update("app-shell", (bindings, ops) => {
	ops.setAttr("[data-body]", "style", bindings.bodyStyle ?? "");
});
