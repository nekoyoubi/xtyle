/** The host attributes that name a component. Spread into a component's `observedAttributes`. */
export const NAME_ATTRIBUTES = ["aria-label", "aria-labelledby"] as const;

/** Whether an attribute is one of {@link NAME_ATTRIBUTES}. */
export function isNameAttribute(name: string | null | undefined): boolean {
	return NAME_ATTRIBUTES.some((attribute) => attribute === name);
}

/** Whether the host carries a non-empty `aria-label` or `aria-labelledby`. */
export function hasHostName(host: Element): boolean {
	return nonEmpty(host.getAttribute("aria-label")) !== null || nonEmpty(host.getAttribute("aria-labelledby")) !== null;
}

interface ForwardedName {
	label: string | null;
	labelledby: string | null;
	ownLabel: string | null;
	ownLabelledby: string | null;
}

const forwarded = new WeakMap<Element, ForwardedName>();

function nonEmpty(value: string | null): string | null {
	const trimmed = value?.trim() ?? "";
	return trimmed ? trimmed : null;
}

function byId(root: Node, id: string): Element | null {
	const scope = root as Partial<Document> & Partial<Element>;
	if (typeof scope.getElementById === "function") return scope.getElementById.call(root, id);
	if (typeof scope.querySelector === "function") {
		return scope.querySelector.call(root, `[id="${id.replace(/["\\]/g, "\\$&")}"]`);
	}
	return null;
}

function referencedText(refs: string, find: (id: string) => Element | null): string | null {
	const parts = ids(refs)
		.map(find)
		.map((el) => nonEmpty(el?.getAttribute("aria-label") ?? null) ?? el?.textContent ?? "")
		.map((text) => text.replace(/\s+/g, " ").trim())
		.filter(Boolean);
	return parts.length ? parts.join(" ") : null;
}

type Name = Pick<ForwardedName, "label" | "labelledby">;

/** Options for {@link forwardAccessibleName}. */
export interface ForwardNameOptions {
	/** Whether the host's own `aria-label` / `aria-labelledby` names the target. `false` leaves only the
	 * repair of the target's own IDREFs. Defaults to `true`. */
	hostName?: boolean;
}

function ids(value: string): string[] {
	return value.split(/\s+/).filter(Boolean);
}

function requestedName(host: Element, target: Element): Name | null {
	const label = nonEmpty(host.getAttribute("aria-label"));
	if (label) return { label, labelledby: null };
	const refs = nonEmpty(host.getAttribute("aria-labelledby"));
	if (!refs) return null;
	if (host.getRootNode() === target.getRootNode()) return { label: null, labelledby: refs };
	const outer = host.getRootNode();
	const text = referencedText(refs, (id) => byId(outer, id));
	return text ? { label: text, labelledby: null } : null;
}

function repairedName(host: Element, target: Element, own: string | null): Name | null {
	const refs = nonEmpty(own);
	if (!refs) return null;
	const inner = target.getRootNode();
	if (ids(refs).every((id) => byId(inner, id))) return null;
	const outer = host.getRootNode();
	const text = referencedText(refs, (id) => byId(inner, id) ?? byId(outer, id));
	return text ? { label: text, labelledby: null } : null;
}

function awaitsParse(host: Element, target: Element, lists: Array<string | null>): boolean {
	if (host.ownerDocument?.readyState !== "loading") return false;
	const inner = target.getRootNode();
	const outer = host.getRootNode();
	return lists.some((list) => ids(list ?? "").some((id) => !byId(inner, id) && !byId(outer, id)));
}

const retrying = new WeakSet<Element>();

function retryAfterParse(host: Element, target: Element, options: ForwardNameOptions): void {
	if (retrying.has(target)) return;
	retrying.add(target);
	host.ownerDocument.addEventListener(
		"DOMContentLoaded",
		() => {
			retrying.delete(target);
			if (target.isConnected) forwardAccessibleName(host, target, options);
		},
		{ once: true },
	);
}

function write(target: Element, attr: string, value: string | null): void {
	if (value === null) target.removeAttribute(attr);
	else if (target.getAttribute(attr) !== value) target.setAttribute(attr, value);
}

/**
 * Carry the host's `aria-label` / `aria-labelledby` onto the inner element that holds the role. A
 * roleless custom element cannot be named, so a name written on the host reaches assistive tech only
 * once it sits on `target`. Whatever name the target carried of its own is set aside while the host's
 * applies and restored when the host's attributes are removed. Without a host name, a target whose own
 * `aria-labelledby` names an id outside its root is named by that element's text instead. An id the
 * parser has not reached yet is retried once the document finishes loading. Safe to call on every render.
 */
export function forwardAccessibleName(
	host: Element,
	target: Element | null | undefined,
	options: ForwardNameOptions = {},
): void {
	if (!target) return;
	const prior = forwarded.get(target);
	if (prior) {
		const label = target.getAttribute("aria-label");
		const labelledby = target.getAttribute("aria-labelledby");
		if (label !== prior.label) prior.ownLabel = label;
		if (labelledby !== prior.labelledby) prior.ownLabelledby = labelledby;
	}
	const ownLabelledby = prior ? prior.ownLabelledby : target.getAttribute("aria-labelledby");
	const hostRefs = options.hostName === false ? null : host.getAttribute("aria-labelledby");
	if (awaitsParse(host, target, [hostRefs, ownLabelledby])) retryAfterParse(host, target, options);
	const name =
		(options.hostName === false ? null : requestedName(host, target)) ?? repairedName(host, target, ownLabelledby);
	if (!name) {
		if (!prior) return;
		forwarded.delete(target);
		write(target, "aria-label", prior.ownLabel);
		write(target, "aria-labelledby", prior.ownLabelledby);
		return;
	}
	const state = prior ?? {
		label: null,
		labelledby: null,
		ownLabel: target.getAttribute("aria-label"),
		ownLabelledby: target.getAttribute("aria-labelledby"),
	};
	state.label = name.label;
	state.labelledby = name.labelledby;
	forwarded.set(target, state);
	write(target, "aria-label", name.label);
	write(target, "aria-labelledby", name.labelledby);
}
