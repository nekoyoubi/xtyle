export const qrCss = `
[data-root][data-qr] { display: inline-block; }
.xtyle-qr {
	--qr-size: 200px;
	--qr-module: var(--fg-0);
	--qr-bg: var(--bg-0);
	display: inline-flex;
	flex-direction: column;
	align-items: stretch;
	gap: var(--space-2);
	margin: 0;
}
.xtyle-qr__code {
	position: relative;
	width: var(--qr-size);
	height: var(--qr-size);
	max-width: 100%;
	border-radius: var(--radius-md);
}
.xtyle-qr__svg {
	display: block;
	width: 100%;
	height: 100%;
	border-radius: inherit;
}
.xtyle-qr__bg {
	fill: var(--qr-bg);
}
.xtyle-qr__modules {
	fill: var(--qr-module);
}
.xtyle-qr__logo {
	position: absolute;
	display: grid;
	place-items: center;
	pointer-events: none;
	color: var(--qr-module);
	container-type: inline-size;
}
.xtyle-qr__logo-inner {
	display: grid;
	place-items: center;
	width: 100%;
	height: 100%;
}
/* Knockout: the modules under the logo are cut from the path, so a background-colored pad fills the
   hole and the mark sits inside it with a small margin. */
.xtyle-qr__logo--knockout .xtyle-qr__logo-inner {
	background: var(--qr-bg);
	border-radius: var(--radius-md);
}
/* The icon glyph is 1em and renders inside the icon element's shadow root, so it can only be sized by
   an inherited property (font-size crosses the boundary), not by width. Container-query units scale it
   to the logo box regardless of the icon's own size system. */
.xtyle-qr__icon {
	font-size: 92cqi;
	line-height: 1;
}
.xtyle-qr__logo--overlay .xtyle-qr__icon {
	font-size: 100cqi;
}
.xtyle-qr__img {
	width: 92%;
	height: 92%;
	object-fit: contain;
	border-radius: var(--radius-md);
}
/* Overlay: the mark lays over the modules (error correction recovers the covered ones), filling the
   whole logo box. */
.xtyle-qr__logo--overlay .xtyle-qr__img {
	width: 100%;
	height: 100%;
}
/* Outline: a background-colored halo so the mark reads against the modules, most useful in overlay. */
.xtyle-qr__logo--outline .xtyle-qr__icon,
.xtyle-qr__logo--outline .xtyle-qr__img {
	filter: drop-shadow(0 0 1.5px var(--qr-bg)) drop-shadow(0 0 1.5px var(--qr-bg)) drop-shadow(0 0 1px var(--qr-bg));
}
.xtyle-qr--framed {
	gap: var(--space-3);
	padding: var(--space-3);
	background: var(--bg-1);
	border-radius: var(--radius-lg);
}
.xtyle-qr--framed .xtyle-qr__code {
	width: 100%;
	aspect-ratio: 1 / 1;
	height: auto;
}
.xtyle-qr__footer {
	display: flex;
	align-items: center;
	gap: var(--space-2);
}
.xtyle-qr__caption {
	flex: 1 1 auto;
	margin: 0;
	min-width: 0;
	font-family: var(--font-mono);
	font-size: var(--text-sm);
	text-align: center;
	overflow-wrap: anywhere;
}
figcaption.xtyle-qr__caption {
	color: var(--fg-1);
}
/* The themed/bitonal swap button on the frame. */
.xtyle-qr__toggle {
	flex: none;
	display: inline-grid;
	place-items: center;
	width: 1.75rem;
	height: 1.75rem;
	padding: 0;
	border: 0;
	cursor: pointer;
	color: var(--fg-1);
	background: transparent;
	border-radius: var(--radius-md);
}
.xtyle-qr__toggle:hover {
	color: var(--fg-0);
	background: var(--bg-0);
}
.xtyle-qr__toggle:focus-visible {
	outline: 2px solid var(--ring);
	outline-offset: 2px;
}
.xtyle-qr__toggle-icon {
	width: 1rem;
	height: 1rem;
}
`;
