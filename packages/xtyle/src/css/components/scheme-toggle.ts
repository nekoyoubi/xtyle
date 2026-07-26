export const schemeToggleCss = `
.xtyle-scheme-toggle { display: inline-flex; }
.xtyle-scheme-toggle__glyph { display: block; }
.xtyle-scheme-toggle__light,
.xtyle-scheme-toggle__dark {
	display: none;
	align-items: center;
	justify-content: center;
}
/* Default: show the mode you'd switch *to* — a sun while dark, a moon while light. */
.xtyle-scheme-toggle--dark .xtyle-scheme-toggle__light { display: inline-flex; }
.xtyle-scheme-toggle--light .xtyle-scheme-toggle__dark { display: inline-flex; }
/* Reversed: show the mode you're *in* — for the contrarians. */
.xtyle-scheme-toggle--reverse.xtyle-scheme-toggle--dark .xtyle-scheme-toggle__light { display: none; }
.xtyle-scheme-toggle--reverse.xtyle-scheme-toggle--dark .xtyle-scheme-toggle__dark { display: inline-flex; }
.xtyle-scheme-toggle--reverse.xtyle-scheme-toggle--light .xtyle-scheme-toggle__dark { display: none; }
.xtyle-scheme-toggle--reverse.xtyle-scheme-toggle--light .xtyle-scheme-toggle__light { display: inline-flex; }
/* Unresolved: no scheme was pinned and no scope owns this toggle, so the glyph follows what the
   document is actually rendering. Keyed off data-effective-scheme rather than data-scheme, because
   an applied theme carries its own scheme — a light theme under a "dark" preference would otherwise
   sit there offering to switch to light. Pure CSS, so a pre-paint script that stamps the attribute
   gets the right glyph before the element ever upgrades. */
.xtyle-scheme-toggle--auto .xtyle-scheme-toggle__light { display: inline-flex; }
[data-effective-scheme="light"] .xtyle-scheme-toggle--auto .xtyle-scheme-toggle__light { display: none; }
[data-effective-scheme="light"] .xtyle-scheme-toggle--auto .xtyle-scheme-toggle__dark { display: inline-flex; }
.xtyle-scheme-toggle--reverse.xtyle-scheme-toggle--auto .xtyle-scheme-toggle__light { display: none; }
.xtyle-scheme-toggle--reverse.xtyle-scheme-toggle--auto .xtyle-scheme-toggle__dark { display: inline-flex; }
[data-effective-scheme="light"] .xtyle-scheme-toggle--reverse.xtyle-scheme-toggle--auto .xtyle-scheme-toggle__dark { display: none; }
[data-effective-scheme="light"] .xtyle-scheme-toggle--reverse.xtyle-scheme-toggle--auto .xtyle-scheme-toggle__light { display: inline-flex; }
`;
