/**
 * Version pinning for the MCP surface — answering for the version a consumer is *on*, rather than
 * for HEAD.
 *
 * The failure this exists to prevent: an agent building an app against xtyle 0.8 asks what
 * components exist, is told about one introduced in 0.10, writes code against it, and gets a runtime
 * error from a version that never had it. The tool was not wrong about the catalog; it was answering
 * a question the agent did not ask. Every catalog answer is version-dependent, and until now the
 * only version on offer was whatever the server happened to be built from.
 *
 * ## The convention
 *
 * A tool whose answer depends on the version takes an optional `version`, and **always** returns an
 * envelope naming what it answered for:
 *
 * - `asOf` — the version the answer is for. The caller's `version` when pinned, otherwise `speaks`.
 * - `speaks` — the version this server was built from. The honest ceiling: nothing here knows about
 *   anything newer, so a caller pinning *above* it gets `speaks` back and a note saying so.
 * - `pinned` — whether the caller asked for a version rather than taking the default.
 * - `omitted` — how many records exist but postdate `asOf`. **Reporting the count is the point.** A
 *   silently filtered list is indistinguishable from a short one, and a consumer that cannot tell
 *   "there is nothing else" from "there is newer" will never think to upgrade.
 *
 * A tool whose behavior *cannot* be rewound says so instead of pretending. Deriving a theme, running
 * the gauntlet, auditing contrast — those execute this build's engine, and there is no honest way to
 * answer them as an older version. Advertising a `version` argument there would be worse than not
 * having one, because it would look like it worked.
 */

export { compareVersions, existedAt } from "../provenance.js";
import { compareVersions } from "../provenance.js";

export interface AsOf {
	asOf: string;
	speaks: string;
	pinned: boolean;
	/** Set only when the caller pinned above what this build knows about. */
	note?: string;
}

/**
 * Resolve what version an answer should be for.
 *
 * A request above `speaks` is clamped rather than refused: the server genuinely cannot describe a
 * future version, and failing the call would be less useful than answering with everything it has
 * and saying which version that was.
 */
export function resolveAsOf(requested: string | undefined, speaks: string): AsOf {
	if (!requested) return { asOf: speaks, speaks, pinned: false };
	if (compareVersions(requested, speaks) > 0) {
		return {
			asOf: speaks,
			speaks,
			pinned: true,
			note: `requested ${requested}, but this server was built from ${speaks} and knows nothing newer — answered as of ${speaks}`,
		};
	}
	return { asOf: requested, speaks, pinned: true };
}

/** The shared `version` input. One description, so every tool that accepts it says the same thing. */
export const VERSION_INPUT_DESCRIPTION =
	"Answer as of this xtyle version rather than the one this server was built from — e.g. \"0.9.0\" to see the catalog as it stood then. Pass the version your project actually depends on, so you are not told about a component that does not exist for you yet. A version above this build's is clamped to it, and the response's `omitted` count tells you how much was filtered out.";
