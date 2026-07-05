/** The host-layout rule for a splitter — it sits as a fixed-size cell in a flex/grid track. */
export const splitterHostCss =
	":host { display: block; flex: none; } :host([line]) { position: relative; z-index: 1; } [data-splitter] { display: contents; }";
