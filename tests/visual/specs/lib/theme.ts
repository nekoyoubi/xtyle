export const ALGORITHMS = [
	"xtyle-default",
	"xtyle-hc",
	"xtyle-quiet",
	"xtyle-loud",
	"nxi-nite",
] as const;

export type Algorithm = (typeof ALGORITHMS)[number];

const SITE_ANCHORS = { bg: "#0b0d12", fg: "#e6e9ef", accent: "#6ea8fe" };

/**
 * A brand that lands on `--danger`'s own hue, which the derivation holds the status role clear of.
 * Every blessed algorithm anchors on a blue, so nothing else in the suite renders that guard at all.
 */
export const CRIMSON_ANCHORS = { bg: "#0b0d12", fg: "#e6e9ef", accent: "#d1495b" };

/**
 * The theme a project renders under. Every other envelope seeds `SITE_ANCHORS`, so a caller's surface
 * always wins and an algorithm's *own* anchors are never what gets drawn. `stated` is the opposite:
 * no seed at all, so the algorithm answers from the pair it declares for the scheme asked for.
 */
export interface EnvelopeOptions {
	anchors?: typeof SITE_ANCHORS | Record<string, never>;
	scheme?: "dark" | "light";
	/** Drop the seed entirely, so the algorithm's own declared anchors are what renders. */
	stated?: boolean;
}

export function themeEnvelope(algorithm: Algorithm, options: EnvelopeOptions | typeof SITE_ANCHORS = {}): string {
	const opts: EnvelopeOptions =
		"bg" in options ? { anchors: options as typeof SITE_ANCHORS } : (options as EnvelopeOptions);
	const anchors = opts.stated ? {} : (opts.anchors ?? SITE_ANCHORS);
	const knobs: Record<string, unknown> = {
		...(algorithm === "nxi-nite" ? { hour: 22 } : {}),
		...(opts.scheme ? { scheme: opts.scheme } : {}),
	};
	return JSON.stringify({
		schemaVersion: 1,
		docs: [
			{
				schemaVersion: 1,
				id: "pw",
				meta: { name: "PW" },
				recipe: { algorithm, anchors, knobs, overrides: {} },
				createdAt: 0,
				updatedAt: 0,
			},
		],
		activeId: "pw",
		selectedId: "pw",
	});
}
