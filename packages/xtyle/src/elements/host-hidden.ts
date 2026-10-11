export const HOST_HIDDEN_CSS = ":host([hidden]) { display: none !important; }";

export function withHostHidden(hostCss: string): string {
	return `${HOST_HIDDEN_CSS}${hostCss}`;
}
