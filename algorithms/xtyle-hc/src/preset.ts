/** The high-contrast xtyle taste — pure data, no imports (see xtyle-default's preset). */
export const spec = {
	id: "xtyle-hc",
	contrast: { floor: 7, textOnFill: 7, focusRing: 4.5 },
	vibrancy: 1,
	chroma: { accent: 1.8, status: 1.7, palette: 1.7, neutral: 0.005, accentTint: 0.6 },
	elevation: { alphaBoost: 0.05 },
	extreme: true,
	anchorsByScheme: { light: { bg: "#ffffff", fg: "#000000" } },
};
