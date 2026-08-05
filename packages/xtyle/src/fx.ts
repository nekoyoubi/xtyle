/**
 * The effect layer's optional runtime: the small piece that writes a spec's parameters onto an element,
 * fires a transient, and arms `reveal`.
 *
 * The layer itself is a static stylesheet and needs none of this — `[data-fx~="glow@hover"]:hover` is a
 * plain attribute selector. But a *parameter* cannot live in a selector, because an attribute selector
 * can match a token and never parse one, so `glow?spread:18` matches the same rule `glow` does and its
 * `18` has to arrive as a custom property. Writing `data-fx` alone therefore gets the effect and the
 * defaults, silently, which reads as the parameter grammar being broken when it is only undelivered.
 *
 * {@link applyEffect} is the pairing done correctly, and {@link applyEffects} does it for markup that
 * already carries the attribute — an SSR page, a template, anything the binding's build-time
 * `fxStyleAttr` did not pass through. Neither is required: a page that writes the properties itself, or
 * that only uses unparameterised specs, never needs to load this module at all.
 */

import { fxStyle, getCondition, getEffect, parseEffectSpec, unknownSpecs } from "./effects.js";

const conditionAttribute = (name: string, fallback: string): string => getCondition(name)?.attribute ?? fallback;

const written = new WeakMap<Element, string[]>();
const warned = new Set<string>();

function warnUnknown(spec: string): void {
	if (warned.has(spec) || typeof console === "undefined") return;
	const unknown = unknownSpecs(spec);
	if (!unknown.length) return;
	warned.add(spec);
	for (const entry of unknown) {
		const parts = entry.missing.map((half) =>
			half === "effect"
				? `effect "${entry.effect}"`
				: half === "condition"
					? `condition "${entry.condition}"`
					: `parameter${entry.unknownParams.length > 1 ? "s" : ""} ${entry.unknownParams.map((key) => `"${key}"`).join(", ")}`,
		);
		console.warn(`xtyle: data-fx "${spec}" names an unregistered ${parts.join(" and ")}; it will do nothing.`);
	}
}

function matchesFx(node: ParentNode): node is Element {
	const element = node as Element;
	return typeof element.matches === "function" && element.matches("[data-fx]");
}

function collect(root: ParentNode): HTMLElement[] {
	const found = [...root.querySelectorAll<HTMLElement>("[data-fx]")];
	if (matchesFx(root)) found.unshift(root as HTMLElement);
	return found;
}

/**
 * Sets `element`'s effect spec and writes the custom properties its parameters resolve to, which is the
 * half that `element.dataset.fx = spec` alone leaves undone.
 *
 * Only the properties this function wrote are cleared on the next call, so swapping specs cannot leave a
 * stale parameter retuning the new effect, and a deliberate `--fx-color` the page set on the same
 * element survives untouched. Passing `null` removes the attribute and its properties together.
 */
export function applyEffect(element: HTMLElement, spec: string | null): void {
	for (const property of written.get(element) ?? []) element.style.removeProperty(property);
	written.delete(element);
	if (spec === null) {
		element.removeAttribute("data-fx");
		return;
	}
	element.setAttribute("data-fx", spec);
	warnUnknown(spec);
	const properties = fxStyle(spec);
	const keys = Object.keys(properties);
	for (const key of keys) element.style.setProperty(key, properties[key] as string);
	if (keys.length) written.set(element, keys);
}

/**
 * Writes the parameters of every `[data-fx]` under `root` (and `root` itself when it carries one),
 * leaving the specs as authored. The one call that makes hand-written or server-rendered markup behave
 * the way the grammar reads. Returns how many elements it touched.
 */
export function applyEffects(root: ParentNode = document): number {
	const targets = collect(root);
	for (const element of targets) applyEffect(element, element.getAttribute("data-fx"));
	return targets.length;
}

function nextFrame(): Promise<void> {
	return new Promise((resolve) => {
		if (typeof requestAnimationFrame !== "function") {
			resolve();
			return;
		}
		requestAnimationFrame(() => resolve());
	});
}

const reflow = (element: HTMLElement): number => element.offsetWidth;

function endless(animation: Animation): boolean {
	const timing = animation.effect?.getComputedTiming();
	return !timing || !Number.isFinite(Number(timing.endTime));
}

function ownAnimations(element: HTMLElement): Animation[] {
	return (element.getAnimations?.({ subtree: true }) ?? []).filter((animation) => {
		const target = (animation.effect as KeyframeEffect | null)?.target;
		return target === element && !endless(animation);
	});
}

/**
 * Fires a transient — `flash`, `float`, `pop`, `wobble`, `shake` — by setting the `fired` condition and
 * clearing it once the animation has finished. Resolves when the element is back at rest.
 *
 * A transient is a verb about an *event*, so it needs a trigger rather than a state; the attribute is
 * removed again precisely so the next call re-fires it, and a call that lands mid-flight restarts the
 * animation from the top rather than being swallowed. Give `spec` to set the effect at the same time,
 * or leave it off to fire whatever the element already carries.
 *
 * Under `prefers-reduced-motion`, or on a theme whose `--fx-intensity` is zero, no animation runs; the
 * attribute is set and cleared and the promise resolves immediately, which is the correct nothing.
 */
export async function fireEffect(element: HTMLElement, spec?: string): Promise<void> {
	if (spec !== undefined) applyEffect(element, spec);
	const fired = conditionAttribute("fired", "data-fx-fired");
	if (element.hasAttribute(fired)) {
		element.removeAttribute(fired);
		reflow(element);
	}
	element.setAttribute(fired, "");
	await nextFrame();
	await nextFrame();
	await Promise.all(ownAnimations(element).map((animation) => animation.finished.then(() => undefined, () => undefined)));
	element.removeAttribute(fired);
}

export interface ArmInViewOptions {
	/** The viewport-relative margin the observer uses, so an element can arrive slightly before its top
	 * edge does. */
	rootMargin?: string;
	/** How much of the element must be showing before it counts as arrived. */
	threshold?: number;
}

/**
 * Arms every `reveal` under `root` and disarms each one as it scrolls into view. Returns a disposer.
 *
 * `reveal` is the only effect that needs to know something the cascade cannot tell it, and it is built
 * so the absence of this function can never hide content: the hidden state is reachable only through
 * `data-fx-armed`, which nothing but an observer sets. So a page with no runtime — or a browser with no
 * `IntersectionObserver` — arms nothing and the reader sees the content, rather than an empty page
 * waiting for a script that will not arrive.
 */
export function armInView(root: ParentNode = document, options: ArmInViewOptions = {}): () => void {
	if (typeof IntersectionObserver !== "function") return () => undefined;
	const armed = conditionAttribute("armed", "data-fx-armed");
	const targets = collect(root).filter((element) =>
		parseEffectSpec(element.getAttribute("data-fx") ?? "").some((entry) => getEffect(entry.effect)?.arms === true),
	);
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				entry.target.removeAttribute(armed);
				observer.unobserve(entry.target);
			}
		},
		{ rootMargin: options.rootMargin ?? "0px 0px -10% 0px", threshold: options.threshold ?? 0 },
	);
	for (const element of targets) {
		element.setAttribute(armed, "");
		observer.observe(element);
	}
	return () => observer.disconnect();
}
