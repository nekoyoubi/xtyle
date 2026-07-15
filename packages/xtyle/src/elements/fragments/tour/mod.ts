interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
}

interface TourBindings {
	open?: boolean;
	backLabel?: string;
	nextLabel?: string;
	skipLabel?: string;
	showBack?: boolean;
	showSkip?: boolean;
	/** `count`, `dots`, or `none`. */
	progress?: string;
	stepIndex?: number;
	stepCount?: number;
}

interface Intent {
	tourNav?: "back" | "next" | "skip";
	preventDefault?: boolean;
	stopPropagation?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: TourBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

function dots(index: number, count: number): string {
	let html = "";
	for (let i = 0; i < count; i++) {
		html += `<span class="xtyle-tour__dot${i === index ? " xtyle-tour__dot--on" : ""}"></span>`;
	}
	return html;
}

function paint(b: TourBindings, ops: OpsBuilder): void {
	ops.setAttr("[data-root]", "hidden", b.open ? "" : "hidden");

	ops.setText("[data-tour-back]", b.backLabel ?? "Back");
	ops.setAttr("[data-tour-back]", "hidden", b.showBack ? "" : "hidden");
	ops.setText("[data-tour-next]", b.nextLabel ?? "Next");
	ops.setText("[data-tour-skip]", b.skipLabel ?? "Skip");
	ops.setAttr("[data-tour-skip]", "hidden", b.showSkip ? "" : "hidden");

	const progress = b.progress ?? "count";
	const count = b.stepCount ?? 0;
	const index = b.stepIndex ?? 0;
	if (progress === "dots" && count > 0) {
		ops.replaceChildren("[data-tour-progress]", dots(index, count));
		ops.setAttr("[data-tour-progress]", "hidden", "");
	} else if (progress === "count" && count > 0) {
		ops.setText("[data-tour-progress]", `${index + 1} of ${count}`);
		ops.setAttr("[data-tour-progress]", "hidden", "");
	} else {
		ops.setAttr("[data-tour-progress]", "hidden", "hidden");
	}
}

hooks.fragment.mount("tour", (bindings, ops) => {
	paint(bindings, ops);
});

hooks.fragment.update("tour", (bindings, ops) => {
	paint(bindings, ops);
});

// the nav is the only chrome a tour invents; the isolation is the spotlight's. Each button hands the
// element a nav intent, and the element moves the tour to the next step.
xript.exports.register("back", (): Intent => ({ tourNav: "back", stopPropagation: true }));
xript.exports.register("next", (): Intent => ({ tourNav: "next", stopPropagation: true }));
xript.exports.register("skip", (): Intent => ({ tourNav: "skip", stopPropagation: true }));
