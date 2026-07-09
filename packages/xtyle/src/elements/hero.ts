import { XtyleDecoratorElement, define } from "./base.js";

type HeroAlign = "center" | "start";

/**
 * A top-of-page hero band. It is a thin, presentational light-DOM element: it adds
 * no behavior of its own, it just lays its slotted children out as a hero, so it
 * composes straight from the existing primitives (`Eyebrow`, `Heading`, `Text`, a
 * `Cluster` of `Button`s, an `Image`). The layout is pure CSS keyed off the `align`
 * and `split` attributes, so the band renders with no JavaScript at all.
 */
export class XtyleHero extends XtyleDecoratorElement {
	get align(): HeroAlign {
		return (this.getAttribute("align") as HeroAlign) ?? "center";
	}
	set align(value: HeroAlign) {
		this.setAttribute("align", value);
	}

	get split(): boolean {
		return this.hasAttribute("split");
	}
	set split(value: boolean) {
		this.toggleAttribute("split", value);
	}
}

define("xtyle-hero", XtyleHero);
