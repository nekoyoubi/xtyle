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
		// A shrink-to-fit modal collapses to 0 around an SVG that has a viewBox but no width/height,
		// so the lightbox re-skins its <xtyle-dialog> to a definite viewport size (not just a max) and
		// the slotted image fills it with object-fit: contain. Guards the 0x0 lightbox regression.
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
		// The lightbox composes <xtyle-dialog>, so its styling rides the shared component sheet the dialog
		// adopts (via :host()/::slotted()) rather than a standalone <style>. That's the override contract:
		// it inherits the dialog's scrim, close button, focus trap, and body-portal instead of re-building them.
		expect(imageLightboxCss).toContain(":host(.xtyle-lightbox) .xtyle-dialog");
		expect(imageLightboxCss).toContain("::slotted(.xtyle-image__full)");
		// no more hand-rolled chrome: the close button and backdrop are the dialog's now
		expect(imageLightboxCss).not.toContain(".xtyle-image__close");
		expect(imageLightboxCss).not.toContain("::backdrop");
		expect(imageCss).toContain(imageLightboxCss);
	});

	it("lets clicks on the letterbox area fall through to the dialog's own close", () => {
		// The dialog body is click-through and the image has pointer-events: none, so a click outside the
		// image hits the <dialog> element and xtyle-dialog's backdrop-close fires. The close button and the
		// caption re-enable pointer events so they stay clickable/selectable.
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
		// The reveal transition must back off under reduced-motion, like the shimmer and fade.
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
