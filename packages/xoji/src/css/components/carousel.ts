export const carouselCss = `
xoji-carousel { display: block; position: relative; }
.xoji-carousel__viewport { overflow: hidden; }
.xoji-carousel__track {
	position: relative;
	display: flex;
	gap: var(--space-3);
	overflow-x: auto;
	scroll-snap-type: x mandatory;
	scroll-behavior: smooth;
	scrollbar-width: none;
}
.xoji-carousel__track::-webkit-scrollbar { display: none; }
.xoji-carousel__track:focus-visible {
	outline: var(--border-thick) solid var(--ring);
	outline-offset: 2px;
}
.xoji-carousel__slide {
	flex: 0 0 100%;
	min-width: 0;
	scroll-snap-align: start;
}
.xoji-carousel__controls {
	display: none;
	align-items: center;
	justify-content: center;
	gap: var(--space-3);
	margin-top: var(--space-3);
}
xoji-carousel[data-enhanced] .xoji-carousel__controls { display: flex; }
.xoji-carousel__nav {
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
.xoji-carousel__nav:hover:not(:disabled) { background: var(--bg-2); }
.xoji-carousel__nav:disabled { opacity: 0.4; cursor: default; }
.xoji-carousel__nav:focus-visible {
	outline: var(--border-thick) solid var(--ring);
	outline-offset: 2px;
}
.xoji-carousel__dots {
	display: inline-flex;
	align-items: center;
	gap: var(--space-2);
}
.xoji-carousel__dot {
	width: 0.6rem;
	height: 0.6rem;
	padding: 0;
	border: 0;
	border-radius: var(--radius-full);
	background: var(--bg-3);
	cursor: pointer;
	transition: background var(--duration-fast) var(--ease-standard);
}
.xoji-carousel__dot:hover { background: var(--fg-2); }
.xoji-carousel__dot.is-active { background: var(--accent); }
.xoji-carousel__dot:focus-visible {
	outline: var(--border-thin) solid var(--ring);
	outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
	.xoji-carousel__track { scroll-behavior: auto; }
}
`.trim();
