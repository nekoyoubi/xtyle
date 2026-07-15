interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, value: string): void;
}

interface Step {
	index: number;
	state: string;
	attrs?: Record<string, string>;
}

interface StepsBindings {
	steps?: Step[];
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: StepsBindings, ops: OpsBuilder) => void) => void };
};

const CHECK = "✓";
const NAME_PATTERN = /^[a-zA-Z_:][-a-zA-Z0-9_:.]*$/;
const OWNED = ["class", "part", "slot", "aria-current", "data-step", "data-marker", "data-connector"];

function esc(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function stepClass(step: Step): string {
	const base = `xtyle-steps__step xtyle-steps__step--${step.state}`;
	const authored = step.attrs?.class ?? "";
	return authored ? `${base} ${authored}` : base;
}

/** The marker's glyph: a check once the step is behind the user, its ordinal otherwise. Override it
 * to render an icon, a roman numeral, or the step's own name. */
function markerText(step: Step): string {
	return step.state === "done" ? CHECK : String(step.index + 1);
}

/** The attributes the author put on their own `<li>`, carried onto the rendered step — minus the
 * ones the fill owns, which it would otherwise fight over. */
function authoredAttrs(step: Step): string {
	const attrs = step.attrs ?? {};
	let out = "";
	for (const name of Object.keys(attrs)) {
		if (OWNED.includes(name) || !NAME_PATTERN.test(name)) continue;
		out += ` ${name}="${esc(String(attrs[name]))}"`;
	}
	return out;
}

function stepHtml(step: Step): string {
	const current = step.state === "current" ? ' aria-current="step"' : "";
	const connector =
		step.index === 0
			? ""
			: `<span class="xtyle-steps__connector" part="connector" data-connector="${step.index}" aria-hidden="true"></span>`;
	return (
		`<li class="${stepClass(step)}" part="step" data-step="${step.index}"${current}${authoredAttrs(step)}>` +
		connector +
		`<span class="xtyle-steps__marker" part="marker" data-marker="${step.index}" aria-hidden="true">${esc(markerText(step))}</span>` +
		`<span class="xtyle-steps__label" part="label" data-slot="step-${step.index}"></span>` +
		`</li>`
	);
}

hooks.fragment.mount("steps", (bindings, ops) => {
	const steps = bindings.steps ?? [];
	ops.replaceChildren("[data-steps]", steps.map(stepHtml).join(""));
});

// A non-destructive patch: it repaints the state classes and the marker glyphs, never the label
// regions, so advancing `current` can't discard the author's step content.
hooks.fragment.update("steps", (bindings, ops) => {
	for (const step of bindings.steps ?? []) {
		const selector = `[data-step="${step.index}"]`;
		ops.setAttr(selector, "class", stepClass(step));
		ops.setAttr(selector, "aria-current", step.state === "current" ? "step" : "");
		ops.setText(`[data-marker="${step.index}"]`, markerText(step));
	}
});
