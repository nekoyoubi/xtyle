/**
 * The shared chrome for the two round corner controls: the frame's zoom button (in `imageFrameCss`)
 * and the dialog's close button (in `imageLightboxCss`). They live in different bundles because the
 * dialog is portalled out of the shadow root, so the common shape is shared as a declaration block
 * rather than a grouped selector.
 */
const cornerButton = `
	position: absolute;
	top: var(--space-2);
	right: var(--space-2);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: var(--space-7);
	height: var(--space-7);
	padding: 0;
	border: 0;
	border-radius: var(--radius-full);
	background: var(--bg-1);
	color: var(--fg-1);
	/* A ring plus a lift so the chip keeps its silhouette over any image: the chip fill can match a
	   dark photo (dissolving it), but the overlay-border ring stays legible on both light and dark. */
	box-shadow: 0 0 0 var(--border-thin) var(--surface-overlay-border), var(--elevation-3);
`.trim();

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
.xtyle-image__zoom {
	${cornerButton}
	cursor: zoom-in;
	opacity: 0;
	transform: scale(0.9);
	transition: opacity var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard);
}
.xtyle-image__frame:hover .xtyle-image__zoom,
.xtyle-image__zoom:focus-visible {
	opacity: 1;
	transform: none;
}
.xtyle-image__frame[role="button"]:focus-visible,
.xtyle-image__zoom:focus-visible {
	outline: var(--border-thick) solid var(--ring);
	outline-offset: 2px;
}
/* No hover to reveal on (touch): the button would never show, so keep it visible. */
@media (hover: none) {
	.xtyle-image__zoom { opacity: 1; transform: none; }
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
	.xtyle-image__zoom { transition: none; }
}
`.trim();

/**
 * The lightbox variant of `<xtyle-dialog>`. The shared lightbox controller (`elements/lightbox.ts`)
 * mounts an `<xtyle-dialog class="xtyle-lightbox">` on `document.body` and slots the image into the
 * body and the caption into the footer; the dialog supplies the close button, scrim, focus trap,
 * Escape, backdrop-click-to-close, and its own body-portal. These rules re-skin that dialog into an
 * immersive viewer through the `.xtyle-lightbox` host class and `::part`-adjacent slot styling — the
 * same override surface any app can use — so the lightbox is no longer a closed, hand-rolled box.
 * They live in the shared component sheet the dialog's shadow adopts, so `:host()` and `::slotted()`
 * resolve inside it; composed into `imageCss` below so the coverage lint still sees every token.
 */
export const imageLightboxCss = `
:host(.xtyle-lightbox) .xtyle-dialog {
	/* A definite viewport-relative size, not a max: a shrink-to-fit modal collapses to 0 around an
	   image with only an intrinsic ratio and no intrinsic size (an SVG with a viewBox but no
	   width/height), so the frame fills the capped area and the image is contained within it. */
	width: 92vw;
	height: 92vh;
	max-width: none;
	max-height: none;
	background: transparent;
	border: 0;
	box-shadow: none;
	overflow: visible;
}
:host(.xtyle-lightbox) .xtyle-dialog__header {
	position: absolute;
	top: var(--space-2);
	right: var(--space-2);
	z-index: 1;
	padding: 0;
	border: 0;
}
:host(.xtyle-lightbox) .xtyle-dialog__close {
	${cornerButton}
	position: static;
	cursor: pointer;
}
:host(.xtyle-lightbox) .xtyle-dialog__body {
	padding: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	/* The image is letterboxed inside the full-size frame, so a click on the empty area falls through
	   to the dialog (which closes on a self-click), keeping click-outside-to-dismiss. */
	pointer-events: none;
}
:host(.xtyle-lightbox) .xtyle-dialog__footer {
	justify-content: center;
	padding: var(--space-3) 0 0;
	border: 0;
	pointer-events: none;
}
:host(.xtyle-lightbox) ::slotted(.xtyle-image__full) {
	display: block;
	max-width: 100%;
	max-height: 100%;
	object-fit: contain;
	pointer-events: none;
}
:host(.xtyle-lightbox) ::slotted(.xtyle-image__lightbox-caption) {
	max-width: 72ch;
	margin: 0;
	color: var(--fg-1);
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	text-align: center;
	/* Re-enable selection on the caption; the footer around it stays click-through. */
	pointer-events: auto;
}
`.trim();

export const imageCss = `${imageFrameCss}\n${imageLightboxCss}`.trim();
