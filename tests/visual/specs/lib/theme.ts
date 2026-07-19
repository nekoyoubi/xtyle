export const ALGORITHMS = [
	"xtyle-default",
	"xtyle-hc",
	"xtyle-quiet",
	"xtyle-loud",
	"nxi-nite",
] as const;

export type Algorithm = (typeof ALGORITHMS)[number];

const SITE_ANCHORS = { bg: "#0b0d12", fg: "#e6e9ef", accent: "#6ea8fe" };

export function themeEnvelope(algorithm: Algorithm): string {
	const knobs: Record<string, unknown> =
		algorithm === "nxi-nite" ? { hour: 22 } : {};
	return JSON.stringify({
		schemaVersion: 1,
		docs: [
			{
				schemaVersion: 1,
				id: "pw",
				meta: { name: "PW" },
				recipe: { algorithm, anchors: SITE_ANCHORS, knobs, overrides: {} },
				createdAt: 0,
				updatedAt: 0,
			},
		],
		activeId: "pw",
		selectedId: "pw",
	});
}
