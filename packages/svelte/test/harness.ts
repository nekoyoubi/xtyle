import { flushSync, mount, unmount, type Component } from "svelte";

export interface Rendered {
	container: HTMLElement;
	/** The first `<xtyle-*>` element the wrapper produced, which is what the seam is asserted against. */
	element: Element | null;
	destroy: () => void;
}

const XTYLE_TAG = /^xtyle-/i;

const findXtyleElement = (root: Element, tag?: string): Element | null => {
	const walk = (node: Element): Element | null => {
		if (XTYLE_TAG.test(node.tagName) && (!tag || node.tagName.toLowerCase() === tag)) return node;
		for (const child of Array.from(node.children)) {
			const hit = walk(child);
			if (hit) return hit;
		}
		return null;
	};
	// A preferred tag is a hint, not a requirement: some wrappers render a different element than
	// their id suggests (`CardLink` renders `<xtyle-card>`), so fall back to the first xtyle element.
	return (tag ? walk(root) : null) ?? walk(root);
};

export const render = <P extends Record<string, unknown>>(
	component: Component<any>,
	props: P = {} as P,
	options: { tag?: string } = {},
): Rendered => {
	const container = document.createElement("div");
	document.body.appendChild(container);
	const instance = mount(component as Component<Record<string, unknown>>, { target: container, props });
	flushSync();
	return {
		container,
		element: findXtyleElement(container, options.tag),
		destroy: () => {
			unmount(instance);
			container.remove();
		},
	};
};

/** camelCase prop → kebab-case attribute, the wrappers' near-universal convention. */
export const kebab = (name: string): string => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
