export const parallaxCss = `
xoji-parallax {
	--xoji-parallax-min-height: 22rem;
	display: grid;
	place-items: center;
	position: relative;
	overflow: hidden;
	isolation: isolate;
	min-height: var(--xoji-parallax-min-height);
	border-radius: var(--radius-lg);
	background: var(--bg-1);
}
xoji-parallax > * { grid-area: 1 / 1; }
xoji-parallax > [data-speed] {
	place-self: stretch;
	width: 100%;
	height: 100%;
	object-fit: cover;
}
xoji-parallax[data-enhanced] > [data-speed] {
	scale: 1.35;
	will-change: translate;
}
xoji-parallax > :not([data-speed]) {
	position: relative;
	z-index: 1;
	padding: var(--space-6);
	max-width: 100%;
}
@media (prefers-reduced-motion: reduce) {
	xoji-parallax > [data-speed] { translate: none; scale: 1; }
}
`.trim();
