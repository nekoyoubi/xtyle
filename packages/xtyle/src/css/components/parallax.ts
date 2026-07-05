export const parallaxCss = `
xtyle-parallax {
	--xtyle-parallax-min-height: 22rem;
	display: grid;
	place-items: center;
	position: relative;
	overflow: hidden;
	isolation: isolate;
	min-height: var(--xtyle-parallax-min-height);
	border-radius: var(--radius-lg);
	background: var(--bg-1);
}
xtyle-parallax > * { grid-area: 1 / 1; }
xtyle-parallax > [data-speed] {
	place-self: stretch;
	width: 100%;
	height: 100%;
	object-fit: cover;
}
xtyle-parallax[data-enhanced] > [data-speed] {
	scale: 1.35;
	will-change: translate;
}
xtyle-parallax > :not([data-speed]) {
	position: relative;
	z-index: 1;
	padding: var(--space-6);
	max-width: 100%;
}
@media (prefers-reduced-motion: reduce) {
	xtyle-parallax > [data-speed] { translate: none; scale: 1; }
}
`.trim();
