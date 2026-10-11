const FOCUSABLE =
	'a[href], area[href], button, input, select, textarea, iframe, summary, [contenteditable=""], [contenteditable="true"], [tabindex]';

type Visible = Element & { checkVisibility?: () => boolean };

function isFocusable(el: Element): el is HTMLElement {
	if (!el.matches(FOCUSABLE)) return false;
	if (el.matches(":disabled")) return false;
	if (el.getAttribute("tabindex") === "-1") return false;
	if (el instanceof HTMLInputElement && el.type === "hidden") return false;
	if (el.closest("[inert]")) return false;
	const visible = el as Visible;
	return typeof visible.checkVisibility === "function" ? visible.checkVisibility() : true;
}

function renderedChildren(el: Element): Element[] {
	if (el.shadowRoot) return [...el.shadowRoot.children];
	if (el instanceof HTMLSlotElement) {
		const assigned = el.assignedElements({ flatten: true });
		return assigned.length > 0 ? assigned : [...el.children];
	}
	return [...el.children];
}

/**
 * Every element under `root` that sequential focus navigation can land on, in the order a user tabs
 * through them. The walk follows the rendered tree: it enters open shadow roots and follows slots to
 * what they project, so the native control inside an xtyle element is found where a light-DOM
 * `querySelectorAll` would only ever reach its host. Disabled, `tabindex="-1"`, inert, hidden and
 * unrendered elements are left out.
 */
export function focusableIn(root: Element | ShadowRoot | Document): HTMLElement[] {
	const found: HTMLElement[] = [];
	const visit = (el: Element): void => {
		if (isFocusable(el)) found.push(el);
		for (const child of renderedChildren(el)) visit(child);
	};
	const start = root instanceof Element ? renderedChildren(root) : [...root.children];
	for (const child of start) visit(child);
	return found;
}

/**
 * The element that actually holds focus, descending through every open shadow root on the way.
 * `document.activeElement` stops at the outermost host, so comparing it against the controls
 * `focusableIn` returns never matches; this returns the control itself.
 */
export function activeLeaf(root: Document | ShadowRoot = document): Element | null {
	let active = root.activeElement;
	while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
	return active;
}

function holds(owner: Element, node: Node): boolean {
	for (let at: Node | null = node; at; at = at instanceof ShadowRoot ? at.host : at.parentNode) {
		if (at === owner) return true;
	}
	return false;
}

export function returnFocusTarget(owner: Element): HTMLElement | null {
	if (typeof document === "undefined") return null;
	const active = activeLeaf();
	if (!active || active === document.body || active === document.documentElement) return null;
	if (holds(owner, active)) return null;
	return active instanceof HTMLElement ? active : null;
}
