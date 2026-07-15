export const spotlightCss = `
.xtyle-spotlight {
	/* the tempo of the ring pulse and the arrow bounce: a full-second loop, never a UI-transition token.
	   pulse=fast drops it to 0.9s; neither is a flashing hazard, and both stop under reduced motion. A 320ms
	   transition token here would pulse ~3x a second, right at the seizure threshold. */
	--spotlight-motion: 1.8s;
	position: fixed;
	inset: 0;
	z-index: 90;
	/* the host paints nothing itself: the veil takes the pointer, the hole lets it through */
	pointer-events: none;
}
.xtyle-spotlight--pulse-fast {
	--spotlight-motion: 0.9s;
}
.xtyle-spotlight[hidden] {
	display: none;
}

/* One clipped layer, not four boxes around the target: the hole gets real corner radii, and the element
   under it stays live — the veil is the only thing taking the pointer, and the hole is outside it. */
.xtyle-spotlight__veil {
	/* the defaults are declared on the veil itself, and the dim/blur knobs override them *inline on this same
	   element* — an inline value beats the declaration here, so the knob wins without a root-level default
	   sitting between the host and the veil and shadowing it */
	--spotlight-dim: 0.72;
	--spotlight-blur: 0px;
	position: fixed;
	inset: 0;
	pointer-events: auto;
	/* the blur is on the veil element, which stays fully opaque — an element with opacity < 1 flattens into
	   its own group and the browser drops backdrop-filter entirely, which is why the dim can't ride as the
	   veil's opacity. It rides as a wash pseudo instead, painted over the blurred backdrop. */
	backdrop-filter: blur(var(--spotlight-blur));
}
.xtyle-spotlight__veil::before {
	content: "";
	position: absolute;
	inset: 0;
	background: var(--scrim);
	opacity: var(--spotlight-dim);
	transition: opacity var(--duration-base) var(--ease-emphasized);
}

.xtyle-spotlight__ring {
	position: fixed;
	pointer-events: none;
	border: var(--border-thick) solid var(--accent);
	box-shadow: 0 0 0 1px var(--surface-overlay-border);
	transition:
		top var(--duration-base) var(--ease-emphasized),
		left var(--duration-base) var(--ease-emphasized),
		width var(--duration-base) var(--ease-emphasized),
		height var(--duration-base) var(--ease-emphasized);
}
.xtyle-spotlight--pulse-slow .xtyle-spotlight__ring,
.xtyle-spotlight--pulse-fast .xtyle-spotlight__ring {
	animation: xtyle-spotlight-pulse var(--spotlight-motion) var(--ease-standard) infinite;
}
@keyframes xtyle-spotlight-pulse {
	0%, 100% { box-shadow: 0 0 0 1px var(--surface-overlay-border); }
	50% { box-shadow: 0 0 0 6px var(--state-hover); }
}

/* The whole fixed layer is pointer-events:none so the page shows through the hole; the veil re-enables
   itself to catch dismissal, and the callout's content box re-enables itself so its buttons can be pressed.
   The callout *host* stays none — it is a box in the fixed layer, and giving it the pointer would hand it
   the viewport, the hole included. Re-enabling has to land on the spotlight's own panel: the popover's inner
   panel lives in the popover's shadow root, which this sheet cannot reach across, so a descendant selector
   for it silently matches nothing and every button computes to none. */
.xtyle-spotlight__callout {
	pointer-events: none;
}
.xtyle-spotlight__panel {
	pointer-events: auto;
	display: grid;
	gap: var(--space-2);
	max-width: 22rem;
	font-family: var(--font-sans);
	font-size: var(--text-body);
	line-height: var(--leading-normal);
	color: var(--fg-1);
}
.xtyle-spotlight__heading {
	margin: 0;
	font-size: var(--text-lg);
	line-height: var(--leading-tight);
	font-weight: var(--weight-semibold);
	color: var(--fg-0);
}
.xtyle-spotlight__heading[hidden] {
	display: none;
}
.xtyle-spotlight__actions {
	display: flex;
	justify-content: flex-end;
	gap: var(--space-2);
	margin-top: var(--space-2);
}
.xtyle-spotlight__close {
	padding: var(--space-2) var(--space-3);
	border: var(--border-thin) solid transparent;
	border-radius: var(--radius-sm);
	background: var(--accent);
	color: var(--accent-fg);
	font: inherit;
	font-weight: var(--weight-semibold);
	cursor: pointer;
	transition: background var(--duration-fast) var(--ease-standard);
}
.xtyle-spotlight__close[hidden] {
	display: none;
}
.xtyle-spotlight__close:hover {
	background: var(--accent);
	box-shadow: inset 0 0 0 999px var(--state-hover);
}
.xtyle-spotlight__close:active {
	box-shadow: inset 0 0 0 999px var(--state-press);
}
.xtyle-spotlight__close:focus-visible {
	outline: var(--border-thick) solid transparent;
	box-shadow: var(--ring);
}

/* The pointer sits at the target, not at the panel: it says "there", which is the whole job. */
.xtyle-spotlight__pointer {
	position: fixed;
	pointer-events: none;
	color: var(--accent);
	transform: translate(-50%, -100%);
}
.xtyle-spotlight__pointer[hidden] {
	display: none;
}
.xtyle-spotlight--arrow-bounce .xtyle-spotlight__pointer {
	animation: xtyle-spotlight-bounce var(--spotlight-motion) var(--ease-standard) infinite;
}
@keyframes xtyle-spotlight-bounce {
	0%, 100% { transform: translate(-50%, -100%); }
	50% { transform: translate(-50%, calc(-100% - 8px)); }
}

@media (prefers-reduced-motion: reduce) {
	.xtyle-spotlight__veil::before,
	.xtyle-spotlight__ring {
		transition: none;
	}
	.xtyle-spotlight--pulse-slow .xtyle-spotlight__ring,
	.xtyle-spotlight--pulse-fast .xtyle-spotlight__ring,
	.xtyle-spotlight--arrow-bounce .xtyle-spotlight__pointer {
		animation: none;
	}
}
`;
