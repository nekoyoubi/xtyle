export const ninePatchCss = `
.xtyle-nine-patch__frame {
	position: absolute;
	inset: 0;
	pointer-events: none;
	border-style: solid;
	border-color: transparent;
	border-width: 0;
}
.xtyle-nine-patch__content {
	position: relative;
	padding: var(--xtyle-nine-patch-inset, 0);
}
.xtyle-nine-patch__pieces {
	position: absolute;
	inset: 0;
	display: grid;
	pointer-events: none;
}
.xtyle-nine-patch__piece {
	display: block;
	min-width: 0;
	min-height: 0;
}
`;
