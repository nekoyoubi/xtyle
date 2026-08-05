import { escapeAttr } from "../escape.js";
import { renderIcon } from "../../../icons";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	toggle(selector: string, condition: boolean): void;
}

interface RevealBindings {
	open?: string | null;
	disabled?: boolean;
	grouped?: boolean;
	directions?: string[];
	hasStart?: boolean;
	hasEnd?: boolean;
	hasTop?: boolean;
	hasBottom?: boolean;
	shaped?: boolean;
	contained?: boolean;
	bleed?: boolean;
	tones?: { [direction: string]: string | null };
	grips?: { [direction: string]: string };
	gripStyles?: { [direction: string]: string };
	gripBodies?: { [direction: string]: string | null };
	label?: string | null;
}

interface EventPayload {
	key?: string;
	dataset?: { [name: string]: string | undefined };
}

interface RevealContext {
	directions?: string[];
	open?: string | null;
}

interface Intent {
	reveal?: string;
	conceal?: boolean;
	preventDefault?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: RevealBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

const DIRECTIONS = ["start", "end", "top", "bottom"];

const liveDirections = (b: RevealBindings): string[] => {
	if (b.directions && b.directions.length > 0) return b.directions;
	const live: string[] = [];
	if (b.hasStart) live.push("start");
	if (b.hasEnd) live.push("end");
	if (b.hasTop) live.push("top");
	if (b.hasBottom) live.push("bottom");
	return live;
};

function revealClass(b: RevealBindings): string {
	const classes = ["xtyle-reveal"];
	if (b.disabled) classes.push("xtyle-reveal--disabled");
	if (b.grouped) classes.push("xtyle-reveal--grouped");
	if (b.bleed) classes.push("xtyle-reveal--bleed");
	if (b.open) classes.push("xtyle-reveal--open", `xtyle-reveal--open-${b.open}`);
	if (b.shaped) {
		classes.push("xtyle-reveal--shaped");
		if (b.contained) classes.push("xtyle-reveal--contained");
	}
	for (const direction of liveDirections(b)) classes.push(`xtyle-reveal--has-${direction}`);
	return classes.join(" ");
}

function bellyHtml(direction: string, b: RevealBindings): string {
	const live = liveDirections(b).indexOf(direction) !== -1;
	const hidden = live ? "" : " hidden";
	const inert = b.open === direction ? "" : " inert";
	const tone = b.tones ? b.tones[direction] : null;
	const toned = tone ? ` xtyle-reveal__belly--toned xtyle-reveal__belly--${tone}` : "";
	return (
		`<div class="xtyle-reveal__belly xtyle-reveal__belly--${direction}${toned}" part="belly belly-${direction}"` +
		` data-belly="${direction}" data-slot="${direction}"${hidden}${inert}>` +
		`<slot name="${direction}"></slot>` +
		`</div>`
	);
}

function gripMark(direction: string, b: RevealBindings): string {
	const style = (b.gripStyles && b.gripStyles[direction]) || "glyph";
	if (style === "bar") return '<span class="xtyle-reveal__grip-bar"></span>';
	if (style === "dots") {
		return '<span class="xtyle-reveal__grip-dots"><span></span><span></span><span></span></span>';
	}
	const name = (b.grips && b.grips[direction]) || "chevron-right";
	const body = b.gripBodies ? b.gripBodies[direction] : null;
	return (
		`<xtyle-icon class="xtyle-reveal__grip-icon" name="${escapeAttr(name)}" aria-hidden="true">` +
		renderIcon(name, { body }) +
		"</xtyle-icon>"
	);
}

function gripHtml(direction: string, b: RevealBindings): string {
	if (b.gripStyles && b.gripStyles[direction] === "none") return "";
	const tone = b.tones ? b.tones[direction] : null;
	const toned = tone ? ` xtyle-reveal__grip--${tone}` : "";
	const style = (b.gripStyles && b.gripStyles[direction]) || "glyph";
	return (
		`<button type="button" class="xtyle-reveal__grip xtyle-reveal__grip--${direction} xtyle-reveal__grip--${style}${toned}"` +
		` part="grip grip-${direction}" data-grip="${direction}" tabindex="-1" aria-hidden="true">` +
		gripMark(direction, b) +
		"</button>"
	);
}

function lidHtml(b: RevealBindings): string {
	const label = b.label ? ` aria-label="${escapeAttr(b.label)}"` : "";
	const tabindex = b.disabled ? "-1" : "0";
	const grips = liveDirections(b)
		.map((direction) => gripHtml(direction, b))
		.join("");
	return (
		`<div class="xtyle-reveal__lid" part="lid" tabindex="${tabindex}" role="group"${label}` +
		` aria-expanded="${escapeAttr(b.open ? "true" : "false")}">` +
		'<div class="xtyle-reveal__content" part="content" data-slot><slot></slot></div>' +
		grips +
		"</div>"
	);
}

function revealHtml(b: RevealBindings): string {
	const bellies = DIRECTIONS.map((direction) => bellyHtml(direction, b)).join("");
	return `<div part="reveal" class="${revealClass(b)}" data-open="${escapeAttr(b.open ?? "")}">${bellies}${lidHtml(b)}</div>`;
}

hooks.fragment.mount("reveal", (bindings, ops) => {
	ops.replaceChildren("[data-reveal]", revealHtml(bindings));
});

hooks.fragment.update("reveal", (bindings, ops) => {
	ops.setAttr(".xtyle-reveal", "class", revealClass(bindings));
	ops.setAttr(".xtyle-reveal", "data-open", bindings.open ?? "");
	ops.setAttr(".xtyle-reveal__lid", "aria-expanded", bindings.open ? "true" : "false");
	ops.setAttr(".xtyle-reveal__lid", "tabindex", bindings.disabled ? "-1" : "0");
	for (const direction of DIRECTIONS) {
		const live = liveDirections(bindings).indexOf(direction) !== -1;
		ops.toggle(`.xtyle-reveal__belly--${direction}`, live);
		const tone = bindings.tones ? bindings.tones[direction] : null;
		ops.setAttr(
			`.xtyle-reveal__belly--${direction}`,
			"class",
			`xtyle-reveal__belly xtyle-reveal__belly--${direction}${tone ? ` xtyle-reveal__belly--toned xtyle-reveal__belly--${tone}` : ""}`,
		);
	}
});

const ARROW_DIRECTION: { [key: string]: string } = {
	ArrowRight: "start",
	ArrowLeft: "end",
	ArrowDown: "top",
	ArrowUp: "bottom",
};

xript.exports.register("keydown", (...args: unknown[]): Intent => {
	const payload = (args[0] ?? {}) as EventPayload;
	const context = (args[1] ?? {}) as RevealContext;
	const live = context.directions ?? [];

	if (payload.key === "Escape" && context.open) return { conceal: true, preventDefault: true };

	const wanted = payload.key ? ARROW_DIRECTION[payload.key] : undefined;
	if (wanted && live.indexOf(wanted) !== -1) return { reveal: wanted, preventDefault: true };
	return {};
});

xript.exports.register("grip", (...args: unknown[]): Intent => {
	const payload = (args[0] ?? {}) as EventPayload;
	const direction = payload.dataset ? payload.dataset.grip : undefined;
	return direction ? { reveal: direction, preventDefault: true } : {};
});
