// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import componentHost from "../src/elements/fragments/component-host.json" with { type: "json" };
import { allowUriSchemes, allowedUriSchemes } from "../src/elements/uri-schemes.js";
import { renderMarkdown } from "../src/markup/markdown.js";

/**
 * `allowUriSchemes` exists because there are **two** allowlists between a URL and the DOM — the
 * markup renderers', and the one the fragment format declares in `component-host.json` — and the
 * second runs last, in host code, dropping a refused URL with no error. A per-render option could
 * widen one and not the other, which is exactly how `tel:` came to be documented, tested at the
 * renderer, and still stripped in the paint. So the test that matters is not "did the scheme work"
 * but "did *both* lists move".
 *
 * These run in one file on purpose: the widening is process-global and irreversible by design, so
 * spreading it across files would leak a widened allowlist into suites asserting the default.
 */
const formats = (componentHost as { formats: Record<string, { schemes?: string[] }> }).formats;

describe("allowUriSchemes", () => {
	it("refuses a scheme that is an XSS sink in every context", () => {
		expect(() => allowUriSchemes("javascript")).toThrow(/cannot be allow-listed/);
		expect(() => allowUriSchemes("vbscript:")).toThrow(/cannot be allow-listed/);
	});

	it("refuses a name that is not a scheme", () => {
		expect(() => allowUriSchemes("not a scheme")).toThrow(/is not a scheme name/);
		expect(() => allowUriSchemes("https://example.com")).toThrow(/is not a scheme name/);
	});

	it("leaves both lists alone when it refuses", () => {
		expect(allowedUriSchemes()).toEqual([]);
		expect(renderMarkdown(`[x](asset://h/f)`)).not.toContain("href");
	});

	it("widens the renderer and the fragment format together", () => {
		allowUriSchemes("asset", "Tauri:");

		expect(allowedUriSchemes()).toEqual(["asset", "tauri"]);
		expect(renderMarkdown(`[x](asset://h/f)`)).toContain(`href="asset://h/f"`);
		for (const format of Object.values(formats)) {
			expect(format.schemes).toContain("asset");
			expect(format.schemes).toContain("tauri");
		}
	});

	it("keeps the built-ins rather than replacing them", () => {
		expect(renderMarkdown(`[x](https://ok.example)`)).toContain(`href="https://ok.example"`);
		expect(renderMarkdown(`[x](tel:+15551234)`)).toContain(`href="tel:+15551234"`);
		for (const format of Object.values(formats)) {
			expect(format.schemes).toContain("https");
			expect(format.schemes).toContain("tel");
		}
	});

	it("still refuses what nobody named", () => {
		expect(renderMarkdown(`[x](file:///etc/hosts)`)).not.toContain("href");
		expect(renderMarkdown(`[x](javascript:alert(1))`)).not.toContain("href");
	});

	/** A cached renderer closed over the old set would keep refusing what was just allowed, which is
	 * the quiet failure this guards: the call succeeds, reports success, and changes nothing. */
	it("applies to renderers built before the call", () => {
		renderMarkdown(`[warm](https://ok.example)`);
		allowUriSchemes("dat");
		expect(renderMarkdown(`[x](dat://h/f)`)).toContain(`href="dat://h/f"`);
	});

	it("does nothing, loudly or otherwise, when given nothing", () => {
		const before = allowedUriSchemes();
		allowUriSchemes();
		allowUriSchemes("");
		expect(allowedUriSchemes()).toEqual(before);
	});
});
