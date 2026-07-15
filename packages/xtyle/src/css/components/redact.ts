export const redactCss = `
.xtyle-redact {
	/* the internal knobs live on the host and are overridden inline by the fill: --redact-blur takes a
	   px value from the amount prop, --redact-cover lets a theme repaint the block. Declared here so they
	   are the component's own props, not tokens it consumes. */
	--redact-blur: 0.35em;
	--redact-cover: var(--fg-1);
	position: relative;
	display: inline-block;
	border-radius: var(--radius-sm);
	vertical-align: bottom;
}

/* The content sits under the cover. While concealed it can't be selected, so the obscured value
   can't be dragged out of a blurred field with a mouse. */
.xtyle-redact__content {
	display: inline-block;
	transition: filter var(--duration-base) var(--ease-standard);
}
.xtyle-redact:not(.xtyle-redact--revealed) .xtyle-redact__content {
	user-select: none;
	-webkit-user-select: none;
}
.xtyle-redact--blur:not(.xtyle-redact--revealed) .xtyle-redact__content {
	/* the default rides on the text size, so a redaction blurs proportionally whatever it wraps; a
	   px override through --redact-blur is set inline on this element by the fill. */
	filter: blur(var(--redact-blur));
}

.xtyle-redact__cover {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0;
	padding: 0;
	border: none;
	border-radius: inherit;
	background: transparent;
	color: inherit;
	font: inherit;
	cursor: pointer;
	transition: opacity var(--duration-base) var(--ease-standard);
}
.xtyle-redact--block:not(.xtyle-redact--revealed) .xtyle-redact__cover {
	background: var(--redact-cover);
}
.xtyle-redact--mask:not(.xtyle-redact--revealed) .xtyle-redact__cover {
	background-color: var(--bg-2);
	background-image: radial-gradient(var(--fg-3) 40%, transparent 42%);
	background-size: 0.55em 0.55em;
}
/* Revealed: the cover fades out. It keeps catching the pointer for the interactive modes — hover
   needs the leave, hold needs the release, click needs the re-press — so it is invisible, not gone.
   The never mode has no interaction to keep, so it drops out of the pointer entirely. */
.xtyle-redact--revealed .xtyle-redact__cover {
	opacity: 0;
}
.xtyle-redact--reveal-never .xtyle-redact__cover {
	cursor: default;
	pointer-events: none;
}
.xtyle-redact__cover:focus-visible {
	outline: none;
	box-shadow: var(--ring);
}

/* The reveal hint — an eye by default, or whatever text the cue names. A chip so it reads over a
   blur, a block, or a dotted mask alike. */
.xtyle-redact__cue {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
	padding: 0 var(--space-2);
	min-height: 1.4em;
	border-radius: var(--radius-full);
	background: var(--surface-overlay);
	color: var(--fg-1);
	border: var(--border-thin) solid var(--surface-overlay-border);
	box-shadow: var(--elevation-1);
	font-size: var(--text-xs);
	line-height: var(--leading-tight);
	white-space: nowrap;
}
.xtyle-redact__cue[hidden] {
	display: none;
}
.xtyle-redact__cue svg {
	width: 1em;
	height: 1em;
}

@media (prefers-reduced-motion: reduce) {
	.xtyle-redact__content,
	.xtyle-redact__cover {
		transition: none;
	}
}
`;
