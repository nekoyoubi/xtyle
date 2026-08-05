/** The host-layout rule for a reveal — a stacking context whose bellies sit beneath a sliding lid. */
export const revealHostCss =
	":host { display: block; position: relative; } [data-reveal] { display: contents; }";
