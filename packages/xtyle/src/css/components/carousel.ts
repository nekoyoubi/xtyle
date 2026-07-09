export const carouselCss = `
xtyle-carousel { display: block; position: relative; }
.xtyle-carousel__viewport { overflow: hidden; }
.xtyle-carousel__track {
	position: relative;
	display: flex;
	gap: var(--space-3);
	overflow-x: auto;
	scroll-snap-type: x mandatory;
	scroll-behavior: smooth;
	scrollbar-width: none;
}
.xtyle-carousel__track::-webkit-scrollbar { display: none; }
.xtyle-carousel__track:focus-visible {
	outline: var(--border-thick) solid var(--ring);
	outline-offset: 2px;
}
.xtyle-carousel__slide {
	flex: 0 0 100%;
	min-width: 0;
	scroll-snap-align: start;
}
.xtyle-carousel__controls {
	display: none;
	align-items: center;
	justify-content: center;
	gap: var(--space-3);
	margin-top: var(--space-3);
}
xtyle-carousel[data-enhanced] .xtyle-carousel__controls { display: flex; }
.xtyle-carousel__nav {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: var(--space-6);
	height: var(--space-6);
	padding: 0;
	border: var(--border-thin) solid var(--line-2);
	border-radius: var(--radius-full);
	background: var(--bg-1);
	color: var(--fg-1);
	cursor: pointer;
}
.xtyle-carousel__nav:hover:not(:disabled) { background: var(--bg-2); }
.xtyle-carousel__nav:disabled { opacity: 0.4; cursor: default; }
.xtyle-carousel__nav:focus-visible {
	outline: var(--border-thick) solid var(--ring);
	outline-offset: 2px;
}
.xtyle-carousel__dots {
	display: inline-flex;
	align-items: center;
	gap: var(--space-2);
}
.xtyle-carousel__dot {
	width: 0.6rem;
	height: 0.6rem;
	padding: 0;
	border: 0;
	border-radius: var(--radius-full);
	background: var(--bg-3);
	cursor: pointer;
	transition:
		background var(--duration-fast) var(--ease-standard),
		width var(--duration-fast) var(--ease-standard);
}
.xtyle-carousel__dot:hover { background: var(--fg-2); }
.xtyle-carousel__dot.is-active { background: var(--accent); }
.xtyle-carousel__dot:focus-visible {
	outline: var(--border-thin) solid var(--ring);
	outline-offset: 2px;
}
@container style(--selection-cue: marker) {
	.xtyle-carousel__dot.is-active { width: 1.4rem; }
}
@media (prefers-reduced-motion: reduce) {
	.xtyle-carousel__track { scroll-behavior: auto; }
}
`.trim();
