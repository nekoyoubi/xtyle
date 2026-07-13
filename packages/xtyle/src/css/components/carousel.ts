// The direction rules apply to the sliding track only; the stacked transitions ignore the axis.
const sliding = ':not(:is([transition="fade"], [transition="scale"], [transition="flip"]))';

export const carouselCss = `
xtyle-carousel { display: block; position: relative; --carousel-height: 18rem; }
/* Until the runtime upgrades it, a carousel is just its slides sitting in the page with no track to
   hold them, so they paint as a tall stack of full-width blocks and then snap into a carousel once the
   element catches up. Lay the un-enhanced host out as the same scroll-snap row the track uses: the
   first paint is already a carousel, and the no-JS render stays a usable swipeable strip instead of a
   pile. Once enhanced the host goes back to block and its built track takes over. */
xtyle-carousel:not([data-enhanced]) {
	display: flex;
	gap: var(--space-3);
	overflow-x: auto;
	scroll-snap-type: x mandatory;
	scrollbar-width: none;
}
xtyle-carousel:not([data-enhanced])::-webkit-scrollbar { display: none; }
xtyle-carousel:not([data-enhanced]) > * {
	flex: 0 0 100%;
	min-width: 0;
	scroll-snap-align: start;
}
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
/* Direction: the cardinal sets the track axis (right/left horizontal, up/down vertical) and the sense
   (left/up reverse the flex axis). Scoped to the sliding track, since the axis is moot for the stacked
   transitions. A vertical track needs a height; --carousel-height sets it (default 18rem). */
xtyle-carousel[direction="left"]${sliding} .xtyle-carousel__track {
	flex-direction: row-reverse;
}
xtyle-carousel[direction="left"]${sliding} .xtyle-carousel__dots {
	flex-direction: row-reverse;
}
xtyle-carousel:is([direction="up"], [direction="down"])${sliding} .xtyle-carousel__viewport {
	height: var(--carousel-height);
}
xtyle-carousel:is([direction="up"], [direction="down"])${sliding} .xtyle-carousel__track {
	flex-direction: column;
	overflow-x: hidden;
	overflow-y: auto;
	overscroll-behavior: contain;
	scroll-snap-type: y mandatory;
	height: 100%;
}
xtyle-carousel[direction="up"]${sliding} .xtyle-carousel__track {
	flex-direction: column-reverse;
}
xtyle-carousel:is([direction="up"], [direction="down"]) .xtyle-carousel__slide {
	min-height: 0;
}
.xtyle-carousel__live {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0 0 0 0);
	clip-path: inset(50%);
	white-space: nowrap;
	border: 0;
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

/* Overlay controls: the arrows ride the slide edges and the dots float over the bottom, instead of
   sitting in a bar beneath the track. The container is click-through; only the controls take pointer
   events, so a swipe or a link inside a slide still works. */
xtyle-carousel[data-enhanced][data-controls="overlay"] .xtyle-carousel__controls {
	position: absolute;
	inset: 0;
	z-index: 2;
	display: block;
	margin: 0;
	pointer-events: none;
}
xtyle-carousel[data-controls="overlay"] .xtyle-carousel__nav {
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	pointer-events: auto;
	border-color: var(--surface-overlay-border);
	box-shadow: var(--elevation-2);
}
xtyle-carousel[data-controls="overlay"] .xtyle-carousel__nav--prev { inset-inline-start: var(--space-2); }
xtyle-carousel[data-controls="overlay"] .xtyle-carousel__nav--next { inset-inline-end: var(--space-2); }
xtyle-carousel[data-controls="overlay"] .xtyle-carousel__nav--play {
	top: auto;
	bottom: var(--space-2);
	inset-inline-end: var(--space-2);
	transform: none;
}
xtyle-carousel[data-controls="overlay"] .xtyle-carousel__dots {
	position: absolute;
	inset-block-end: var(--space-2);
	inset-inline-start: 50%;
	transform: translateX(-50%);
	pointer-events: auto;
	padding: 0.3rem 0.55rem;
	border-radius: var(--radius-full);
	background: var(--surface-overlay);
	border: var(--border-thin) solid var(--surface-overlay-border);
}
xtyle-carousel[data-controls="overlay"] .xtyle-carousel__dot { background: var(--fg-3); }
xtyle-carousel[data-controls="overlay"] .xtyle-carousel__dot.is-active { background: var(--accent); }
@media (prefers-reduced-motion: reduce) {
	.xtyle-carousel__track { scroll-behavior: auto; }
}

/* Stacked transitions (fade / scale / flip): the slides overlay in a single grid cell and the active
   one cross-fades in, instead of a scroll-snap track paging sideways. Gated on [data-enhanced] so the
   opacity:0 stack never hides content before the runtime marks a slide active. */
xtyle-carousel[data-enhanced]:is([transition="fade"], [transition="scale"], [transition="flip"]) .xtyle-carousel__track {
	display: grid;
	gap: 0;
	overflow: hidden;
	scroll-snap-type: none;
	perspective: 1200px;
}
/* The incoming slide is placed *under* the outgoing one already fully opaque, and the outgoing fades
   out on top of it to reveal it. Cross-fading the two against each other instead (one out while the
   other comes in) never adds up to full coverage mid-transition, so whatever sits behind the carousel
   (a page background, or the still under an Image hover-preview) flashes through on every change; it
   also races, since the reveal only stays covered if the two ramps line up frame-for-frame. Fading the
   top layer out over an already-opaque one cannot gap, whatever the timing. */
xtyle-carousel[data-enhanced]:is([transition="fade"], [transition="scale"], [transition="flip"]) .xtyle-carousel__slide {
	grid-area: 1 / 1;
	opacity: 0;
	/* A slide that just lost is-active sits above the incoming one and fades out over it. */
	z-index: 2;
	pointer-events: none;
	transition:
		opacity var(--duration-slow) var(--ease-standard),
		transform var(--duration-slow) var(--ease-emphasized);
}
xtyle-carousel[data-enhanced]:is([transition="fade"], [transition="scale"], [transition="flip"]) .xtyle-carousel__slide.is-active {
	opacity: 1;
	/* Underneath, and opaque from the first frame: it is revealed, never faded in. */
	z-index: 1;
	pointer-events: auto;
	transition: transform var(--duration-slow) var(--ease-emphasized);
}
xtyle-carousel[transition="scale"] .xtyle-carousel__slide { transform: scale(0.92); }
xtyle-carousel[transition="scale"] .xtyle-carousel__slide.is-active { transform: scale(1); }
xtyle-carousel[transition="flip"] .xtyle-carousel__slide { transform: rotateY(90deg); backface-visibility: hidden; }
xtyle-carousel[transition="flip"] .xtyle-carousel__slide.is-active { transform: rotateY(0deg); }
@media (prefers-reduced-motion: reduce) {
	xtyle-carousel:is([transition="fade"], [transition="scale"], [transition="flip"]) .xtyle-carousel__slide {
		transition: none;
		transform: none;
	}
}
`.trim();
