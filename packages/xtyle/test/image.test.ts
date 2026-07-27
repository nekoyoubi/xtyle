import { describe, expect, it } from "vitest";
import { getComponent, coverComponent, derive } from "../src/index.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { imageCss, imageLightboxCss } from "../src/css/components/image.js";
import { hasIcon, ICONS } from "../src/icons.js";
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

	it("sizes the lightbox dialog with a definite frame so an intrinsic-less image can't collapse it", () => {
		const dialog = imageCss.slice(imageCss.indexOf(":host(.xtyle-lightbox) .xtyle-dialog {"));
		const block = dialog.slice(0, dialog.indexOf("}"));
		expect(block).toContain("width: 92vw");
		expect(block).toContain("height: 92vh");
		const full = imageCss.slice(imageCss.indexOf("::slotted(.xtyle-image__full) {"));
		const fullBlock = full.slice(0, full.indexOf("}"));
		expect(fullBlock).toContain("object-fit: contain");
		expect(fullBlock).toContain("pointer-events: none");
	});

	it("re-skins the shared xtyle-dialog through the .xtyle-lightbox host class, not a hand-rolled dialog", () => {
		expect(imageLightboxCss).toContain(":host(.xtyle-lightbox) .xtyle-dialog");
		expect(imageLightboxCss).toContain("::slotted(.xtyle-image__full)");
		expect(imageLightboxCss).not.toContain(".xtyle-image__close");
		expect(imageLightboxCss).not.toContain("::backdrop");
		expect(imageCss).toContain(imageLightboxCss);
	});

	it("lets clicks on the letterbox area fall through to the dialog's own close", () => {
		expect(imageLightboxCss).toContain(":host(.xtyle-lightbox) .xtyle-dialog__body");
		const body = imageLightboxCss.slice(imageLightboxCss.indexOf(":host(.xtyle-lightbox) .xtyle-dialog__body {"));
		expect(body.slice(0, body.indexOf("}"))).toContain("pointer-events: none");
	});

	it("offers a trigger prop with frame and button modes", () => {
		const prop = getComponent("image").props.find((p) => p.name === "trigger");
		expect(prop, "trigger prop should be declared").toBeDefined();
		expect(prop?.default).toBe("frame");
		expect(prop?.options).toEqual(["frame", "button"]);
	});

	it("styles the zoom button so it reveals on frame hover and on focus", () => {
		expect(imageCss).toContain(".xtyle-image__zoom {");
		expect(imageCss).toContain(".xtyle-image__frame:hover .xtyle-image__zoom");
		expect(imageCss).toContain(".xtyle-image__zoom:focus-visible");
		const reduced = imageCss.slice(imageCss.indexOf("@media (prefers-reduced-motion"));
		expect(reduced).toContain(".xtyle-image__zoom { transition: none; }");
	});

	it("ships the maximize glyph the zoom button renders", () => {
		expect(hasIcon("maximize")).toBe(true);
		expect(ICONS.maximize).toContain("path");
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
