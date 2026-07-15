export const timelineCss = `
.xtyle-timeline {
	display: block;
	font-family: var(--font-sans);
}
.xtyle-timeline__list {
	list-style: none;
	margin: 0;
	padding: 0;
}
.xtyle-timeline__item {
	position: relative;
	padding-left: var(--space-5);
	padding-bottom: var(--space-4);
}
.xtyle-timeline__item:last-child {
	padding-bottom: 0;
}
.xtyle-timeline__dot {
	position: absolute;
	left: 0;
	top: 0.2rem;
	width: 0.7rem;
	height: 0.7rem;
	border-radius: var(--radius-full);
	background: var(--accent);
	border: var(--border-thick) solid var(--bg-0);
	box-sizing: border-box;
	z-index: 1;
}
.xtyle-timeline__rail {
	position: absolute;
	left: 0.3rem;
	top: 0.6rem;
	bottom: 0;
	width: var(--border-thin);
	background: var(--line);
}
.xtyle-timeline__content {
	display: block;
}
.xtyle-timeline__content > :is(strong, .xtyle-timeline__title) {
	display: block;
	margin: 0;
	font-size: var(--text-sm);
	font-weight: var(--weight-semibold);
	color: var(--fg-0);
	line-height: var(--leading-tight);
}
.xtyle-timeline__content > :is(time, .xtyle-timeline__meta) {
	display: block;
	font-size: var(--text-xs);
	color: var(--fg-2);
}
.xtyle-timeline__content > :is(p, .xtyle-timeline__body) {
	margin: var(--space-1) 0 0;
	font-size: var(--text-sm);
	color: var(--fg-1);
	line-height: var(--leading-normal);
}
`.trim();
