import { DOCK_SIDES } from "../vocab.js";
export type DockSide = (typeof DOCK_SIDES)[number];

/** The host-layout rule for a dock — the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const dockHostCss =
	":host { display: block; min-height: 0; height: 100%; width: 18rem; } :host([size=\"sm\"]) { width: 14rem; } :host([size=\"lg\"]) { width: 22rem; }";
