const imageFrameCss = `
[data-image] { display: contents; }
.xtyle-image {
	display: block;
	margin: 0;
}
.xtyle-image__frame {
	position: relative;
	display: block;
	width: 100%;
	overflow: hidden;
	border-radius: var(--radius-md);
	background: var(--bg-2);
}
.xtyle-image--radius-none .xtyle-image__frame { border-radius: 0; }
.xtyle-image--radius-sm .xtyle-image__frame { border-radius: var(--radius-sm); }
.xtyle-image--radius-lg .xtyle-image__frame { border-radius: var(--radius-lg); }
.xtyle-image__img {
	display: block;
	width: 100%;
	height: auto;
	object-fit: cover;
	opacity: 1;
	transition: opacity var(--duration-slow) var(--ease-standard);
}
.xtyle-image__frame[style*="aspect-ratio"] .xtyle-image__img {
	position: absolute;
	inset: 0;
	height: 100%;
}
.xtyle-image--contain .xtyle-image__img { object-fit: contain; }
.xtyle-image__placeholder {
	display: none;
	position: absolute;
	inset: 0;
	background-color: var(--bg-2);
	background-image: linear-gradient(90deg, var(--bg-2) 0%, var(--bg-3) 50%, var(--bg-2) 100%);
	background-size: 200% 100%;
	background-repeat: no-repeat;
	animation: xtyle-image-shimmer var(--duration-slow) var(--ease-standard) infinite;
}
.xtyle-image__frame[data-loading] .xtyle-image__placeholder { display: block; }
.xtyle-image__frame[data-loading] .xtyle-image__img { opacity: 0; }
.xtyle-image__frame[data-error] .xtyle-image__placeholder { display: block; animation: none; background-image: none; }
.xtyle-image__frame[data-error] .xtyle-image__img { opacity: 0; }
.xtyle-image__error {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--fg-2);
}
.xtyle-image__frame[role="button"] { cursor: zoom-in; }
.xtyle-image__frame[role="button"]:focus-visible {
	outline: var(--border-thick) solid var(--ring);
	outline-offset: 2px;
}
.xtyle-image__caption {
	margin-top: var(--space-2);
	color: var(--fg-2);
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
}
@keyframes xtyle-image-shimmer {
	from { background-position: 100% 0; }
	to { background-position: -100% 0; }
}
@media (prefers-reduced-motion: reduce) {
	.xtyle-image__placeholder { animation: none; }
	.xtyle-image__img { transition: none; }
}
`.trim();

/**
 * The lightbox subtree, kept separate so the element can carry it as a self-contained `<style>`
 * inside the portalled `<dialog>`. The dialog mounts on `document.body` (to escape an ancestor
 * containing block), which puts it outside the element's shadow root and its adopted sheet — so
 * these rules travel with it. Composed back into `imageCss` below, so the shared component sheet
 * and the coverage lint still see every lightbox token.
 */
export const imageLightboxCss = `
.xtyle-image__lightbox {
	padding: 0;
	border: 0;
	background: transparent;
	/* A definite viewport-relative size, not a max: a shrink-to-fit modal collapses to 0 around an
	   image with only an intrinsic ratio and no intrinsic size (an SVG with a viewBox but no
	   width/height), so the frame fills the capped area and the image is contained within it. */
	width: 92vw;
	height: 92vh;
	overflow: visible;
	display: flex;
	align-items: center;
	justify-content: center;
}
.xtyle-image__lightbox::backdrop { background: var(--scrim); }
.xtyle-image__full {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: contain;
	/* The image is letterboxed inside the full-size frame, so a click on the empty area falls
	   through to the dialog (which closes on a self-click), keeping click-outside-to-dismiss. */
	pointer-events: none;
}
.xtyle-image__close {
	position: absolute;
	top: var(--space-2);
	right: var(--space-2);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: var(--space-6);
	height: var(--space-6);
	padding: 0;
	border: 0;
	border-radius: var(--radius-full);
	background: var(--bg-1);
	color: var(--fg-1);
	cursor: pointer;
}
.xtyle-image__close:focus-visible {
	outline: var(--border-thick) solid var(--ring);
	outline-offset: 2px;
}
`.trim();

export const imageCss = `${imageFrameCss}\n${imageLightboxCss}`.trim();
