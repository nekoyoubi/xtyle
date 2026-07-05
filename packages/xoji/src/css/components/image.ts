export const imageCss = `
[data-image] { display: contents; }
.xoji-image {
	display: block;
	margin: 0;
}
.xoji-image__frame {
	position: relative;
	display: block;
	width: 100%;
	overflow: hidden;
	border-radius: var(--radius-md);
	background: var(--bg-2);
}
.xoji-image--radius-none .xoji-image__frame { border-radius: 0; }
.xoji-image--radius-sm .xoji-image__frame { border-radius: var(--radius-sm); }
.xoji-image--radius-lg .xoji-image__frame { border-radius: var(--radius-lg); }
.xoji-image__img {
	display: block;
	width: 100%;
	height: auto;
	object-fit: cover;
	opacity: 1;
	transition: opacity var(--duration-slow) var(--ease-standard);
}
.xoji-image__frame[style*="aspect-ratio"] .xoji-image__img {
	position: absolute;
	inset: 0;
	height: 100%;
}
.xoji-image--contain .xoji-image__img { object-fit: contain; }
.xoji-image__placeholder {
	display: none;
	position: absolute;
	inset: 0;
	background-color: var(--bg-2);
	background-image: linear-gradient(90deg, var(--bg-2) 0%, var(--bg-3) 50%, var(--bg-2) 100%);
	background-size: 200% 100%;
	background-repeat: no-repeat;
	animation: xoji-image-shimmer var(--duration-slow) var(--ease-standard) infinite;
}
.xoji-image__frame[data-loading] .xoji-image__placeholder { display: block; }
.xoji-image__frame[data-loading] .xoji-image__img { opacity: 0; }
.xoji-image__frame[data-error] .xoji-image__placeholder { display: block; animation: none; background-image: none; }
.xoji-image__frame[data-error] .xoji-image__img { opacity: 0; }
.xoji-image__error {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--fg-2);
}
.xoji-image__frame[role="button"] { cursor: zoom-in; }
.xoji-image__frame[role="button"]:focus-visible {
	outline: var(--border-thick) solid var(--ring);
	outline-offset: 2px;
}
.xoji-image__caption {
	margin-top: var(--space-2);
	color: var(--fg-2);
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
}
.xoji-image__lightbox {
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
.xoji-image__lightbox::backdrop { background: var(--scrim); }
.xoji-image__full {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: contain;
	/* The image is letterboxed inside the full-size frame, so a click on the empty area falls
	   through to the dialog (which closes on a self-click), keeping click-outside-to-dismiss. */
	pointer-events: none;
}
.xoji-image__close {
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
.xoji-image__close:focus-visible {
	outline: var(--border-thick) solid var(--ring);
	outline-offset: 2px;
}
@keyframes xoji-image-shimmer {
	from { background-position: 100% 0; }
	to { background-position: -100% 0; }
}
@media (prefers-reduced-motion: reduce) {
	.xoji-image__placeholder { animation: none; }
	.xoji-image__img { transition: none; }
}
`.trim();
