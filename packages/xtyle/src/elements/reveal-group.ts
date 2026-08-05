import { XtyleElement, define, type StyleMode } from "./base.js";
import type { XtyleReveal } from "./reveal.js";

export class XtyleRevealGroup extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "inherit";
	}

	static get observedAttributes(): string[] {
		return ["label", "labelledby"];
	}

	get reveals(): XtyleReveal[] {
		return Array.from(this.querySelectorAll<XtyleReveal>("xtyle-reveal")).filter(
			(reveal) => reveal.closest("xtyle-reveal-group") === this,
		);
	}

	get openReveals(): XtyleReveal[] {
		return this.reveals.filter((reveal) => reveal.open !== null);
	}

	concealAll(): void {
		for (const reveal of this.openReveals) reveal.conceal();
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.setAttribute("role", "group");
		const label = this.getAttribute("label");
		const labelledby = this.getAttribute("labelledby");
		if (labelledby) {
			this.setAttribute("aria-labelledby", labelledby);
			this.removeAttribute("aria-label");
		} else if (label) {
			this.setAttribute("aria-label", label);
			this.removeAttribute("aria-labelledby");
		}
	}

	attributeChangedCallback(): void {
		this.render();
	}
}

define("xtyle-reveal-group", XtyleRevealGroup);
