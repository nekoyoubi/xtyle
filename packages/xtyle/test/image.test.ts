import { describe, expect, it } from "vitest";
import { getComponent, coverComponent, derive } from "../src/index.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { imageCss } from "../src/css/components/image.js";
import { xtyleDefault } from "../src/batteries.js";

const register = derive(xtyleDefault, {
	constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef", "--accent": "#6ea8fe" },
});

describe("image", () => {
	it("registers the image component in the media category", () => {
		const manifest = getComponent("image");
		expect(manifest.category).toBe("media");
		expect(manifest.name).toBe("Image");
	});

	it("covers every consumed token against xtyle-default", () => {
		const result = coverComponent(getComponent("image"), register);
		expect(result.missing, `missing: ${result.missing.join(", ")}`).toEqual([]);
		expect(result.covered).toBe(true);
	});

	it("renders a figure with a framed image and a shimmer placeholder", async () => {
		const html = await renderFragmentLight("image", { src: "/a.jpg", alt: "A", ratio: "16/9" });
		expect(html).toContain("<figure");
		expect(html).toContain("xtyle-image__frame");
		expect(html).toContain("xtyle-image__placeholder");
		expect(html).toContain('<img class="xtyle-image__img"');
		expect(html).toContain('src="/a.jpg"');
		expect(html).toContain('alt="A"');
		expect(html).toContain("aspect-ratio: 16/9");
		expect(html).toContain('loading="lazy"');
	});

	it("stays a plain frame with no interactive button, so it degrades with no JS", async () => {
		const html = await renderFragmentLight("image", { src: "/a.jpg", alt: "A", lightbox: true });
		expect(html).not.toContain("<button");
		expect(html).not.toContain('role="button"');
	});

	it("reflects fit and radius as classes, defaulting to cover and md", async () => {
		const contain = await renderFragmentLight("image", { src: "/a.jpg", alt: "A", fit: "contain", radius: "lg" });
		expect(contain).toContain("xtyle-image--contain");
		expect(contain).toContain("xtyle-image--radius-lg");

		const base = await renderFragmentLight("image", { src: "/a.jpg", alt: "A" });
		expect(base).not.toContain("xtyle-image--contain");
		expect(base).not.toContain("xtyle-image--radius-md");
	});

	it("renders a figcaption only when a caption is given", async () => {
		const withCaption = await renderFragmentLight("image", { src: "/a.jpg", alt: "A", caption: "Hi" });
		expect(withCaption).toContain("<figcaption");
		expect(withCaption).toContain(">Hi<");

		const without = await renderFragmentLight("image", { src: "/a.jpg", alt: "A" });
		expect(without).not.toContain("<figcaption");
	});

	it("omits the image when there is no src", async () => {
		const html = await renderFragmentLight("image", { alt: "A" });
		expect(html).not.toContain("<img");
		expect(html).toContain("xtyle-image__frame");
	});

	it("sizes the lightbox with a definite frame so an intrinsic-less image can't collapse it", () => {
		// A shrink-to-fit modal collapses to 0 around an SVG that has a viewBox but no width/height,
		// so the lightbox frame must be a definite viewport size (not just a max) and the image fills
		// it with object-fit: contain. Guards the regression that rendered the lightbox at 0x0.
		const lightbox = imageCss.slice(imageCss.indexOf(".xtyle-image__lightbox {"));
		const block = lightbox.slice(0, lightbox.indexOf("}"));
		expect(block).toContain("width: 92vw");
		expect(block).toContain("height: 92vh");
		const full = imageCss.slice(imageCss.indexOf(".xtyle-image__full {"));
		const fullBlock = full.slice(0, full.indexOf("}"));
		expect(fullBlock).toContain("width: 100%");
		expect(fullBlock).toContain("height: 100%");
		expect(fullBlock).toContain("object-fit: contain");
		expect(fullBlock).toContain("pointer-events: none");
	});

	it("escapes a hostile src, alt, and caption so they can't break out", async () => {
		const html = await renderFragmentLight("image", {
			src: '/x.jpg" onerror="alert(1)',
			alt: 'a"><script>',
			caption: "<b>no</b>",
		});
		expect(html).not.toContain('onerror="alert(1)"');
		expect(html).not.toContain("<script>");
		expect(html).not.toContain("<b>no</b>");
		expect(html).toContain("&quot;");
		expect(html).toContain("&lt;");
	});
});
