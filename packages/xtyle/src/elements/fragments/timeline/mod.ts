import { escapeAttr } from "../escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface TimelineEvent {
	index: number;
	last?: boolean;
	attrs?: Record<string, string>;
}

interface TimelineBindings {
	events?: TimelineEvent[];
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: TimelineBindings, ops: OpsBuilder) => void) => void };
};

const NAME_PATTERN = /^[a-zA-Z_:][-a-zA-Z0-9_:.]*$/;
const OWNED = ["class", "part", "slot", "data-event", "data-dot", "data-rail"];

function eventClass(event: TimelineEvent): string {
	const authored = event.attrs?.class ?? "";
	return authored ? `xtyle-timeline__item ${authored}` : "xtyle-timeline__item";
}

/** The attributes the author put on their own `<li>`, carried onto the rendered event — minus the
 * ones the fill owns, which it would otherwise fight over. */
function authoredAttrs(event: TimelineEvent): string {
	const attrs = event.attrs ?? {};
	let out = "";
	for (const name of Object.keys(attrs)) {
		if (OWNED.includes(name) || !NAME_PATTERN.test(name)) continue;
		out += ` ${name}="${escapeAttr(String(attrs[name]))}"`;
	}
	return out;
}

/** The rail runs from one event's dot to the next, so the last event has none — the feed ends at its
 * dot rather than trailing a line into nothing. */
function eventHtml(event: TimelineEvent): string {
	const rail = event.last
		? ""
		: `<span class="xtyle-timeline__rail" part="rail" data-rail="${event.index}" aria-hidden="true"></span>`;
	return (
		`<li class="${eventClass(event)}" part="item" data-event="${event.index}"${authoredAttrs(event)}>` +
		`<span class="xtyle-timeline__dot" part="dot" data-dot="${event.index}" aria-hidden="true"></span>` +
		rail +
		`<div class="xtyle-timeline__content" part="content" data-slot="event-${event.index}"></div>` +
		`</li>`
	);
}

hooks.fragment.mount("timeline", (bindings, ops) => {
	const events = bindings.events ?? [];
	ops.replaceChildren("[data-events]", events.map(eventHtml).join(""));
});

// A non-destructive patch: it repaints the item classes only, never the content regions, so a
// re-render can't discard the author's event content. A changed event count is a structural change,
// so the element remounts instead of patching.
hooks.fragment.update("timeline", (bindings, ops) => {
	for (const event of bindings.events ?? []) {
		ops.setAttr(`[data-event="${event.index}"]`, "class", eventClass(event));
	}
});
