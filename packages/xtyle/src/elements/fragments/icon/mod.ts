import { renderIcon } from "../../../icons";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface IconBindings {
	name?: string;
	size?: string;
	tone?: string;
	label?: string;
	spin?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: IconBindings, ops: OpsBuilder) => void) => void };
};

function iconHtml(b: IconBindings): string {
	return renderIcon(b.name ?? "", {
		size: (b.size as "sm" | "md" | "lg" | "xl") ?? "md",
		tone: b.tone,
		label: b.label,
		spin: !!b.spin,
		part: "icon",
	});
}

// The whole SVG swaps on any change (a new `name` is a different glyph), so mount and update run the same full render.
function render(bindings: IconBindings, ops: OpsBuilder): void {
	ops.replaceChildren("[data-icon]", iconHtml(bindings));
}

hooks.fragment.mount("icon", render);
hooks.fragment.update("icon", render);
