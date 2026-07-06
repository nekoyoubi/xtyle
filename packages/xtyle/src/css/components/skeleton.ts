export const skeletonCss = `
[data-skeleton] { display: contents; }
.xtyle-skeleton {
	display: block;
	position: relative;
	overflow: hidden;
	background: var(--bg-2);
	border-radius: var(--radius-md);
	background-image: linear-gradient(
		90deg,
		var(--bg-2) 0%,
		var(--bg-3) 50%,
		var(--bg-2) 100%
	);
	background-size: 200% 100%;
	background-repeat: no-repeat;
	animation: xtyle-skeleton-shimmer var(--duration-slow) var(--ease-standard) infinite;
}
@keyframes xtyle-skeleton-shimmer {
	from { background-position: 100% 0; }
	to { background-position: -100% 0; }
}
.xtyle-skeleton--text {
	height: var(--text-body);
	border-radius: var(--radius-sm);
}
.xtyle-skeleton--text.xtyle-skeleton--sm { height: var(--text-sm); }
.xtyle-skeleton--text.xtyle-skeleton--lg { height: var(--text-lg); }
.xtyle-skeleton--line {
	height: var(--border-thick);
	border-radius: var(--radius-full);
}
.xtyle-skeleton--line.xtyle-skeleton--sm { height: var(--border-normal); }
.xtyle-skeleton--line.xtyle-skeleton--lg { height: var(--space-1); }
.xtyle-skeleton--block {
	height: var(--space-7);
	border-radius: var(--radius-md);
}
.xtyle-skeleton--block.xtyle-skeleton--sm { height: var(--space-6); }
.xtyle-skeleton--block.xtyle-skeleton--lg { height: var(--space-8); }
.xtyle-skeleton--circle {
	width: var(--space-7);
	height: var(--space-7);
	aspect-ratio: 1;
	border-radius: var(--radius-full);
}
.xtyle-skeleton--circle.xtyle-skeleton--sm {
	width: var(--space-6);
	height: var(--space-6);
}
.xtyle-skeleton--circle.xtyle-skeleton--lg {
	width: var(--space-8);
	height: var(--space-8);
}
@media (prefers-reduced-motion: reduce) {
	.xtyle-skeleton { animation: none; }
}
`.trim();
