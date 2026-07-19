import { POPOVER_PLACEMENTS, POPOVER_ALIGNS, POPOVER_FOCUS, POPOVER_PANEL_ROLES } from "../vocab.js";
/** The side of the anchor the panel prefers; it flips to the opposite side when there is no room. */
export type PopoverPlacement = (typeof POPOVER_PLACEMENTS)[number];

/** Cross-axis alignment against the anchor. `start` ↔ `end` flip near a viewport edge; `center` clamps. */
export type PopoverAlign = (typeof POPOVER_ALIGNS)[number];

/**
 * Where focus goes when `show()` / `openAt()` / `openFrom()` open the panel.
 * `first` takes the first focusable node inside it, `panel` takes the panel itself
 * (for a body of static content), `none` leaves focus exactly where it was — what a
 * type-ahead surface needs, since its input must keep the caret while the list floats.
 */
export type PopoverFocus = (typeof POPOVER_FOCUS)[number];

/**
 * The ARIA role the panel carries. `dialog` is the generic anchored-surface default and wants an
 * accessible name; a surface whose content brings its own semantics (a listbox, a menu) names the
 * role it actually is, or `none` to make the panel a transparent box around the author's own widget.
 */
export type PopoverPanelRole = (typeof POPOVER_PANEL_ROLES)[number];

/** How the panel closes — carried on the `close` event's detail. */
export type PopoverCloseReason = "escape" | "dismiss" | "select" | "api";

/** The host-layout rules for a popover — the `:host` rules, shared by the element's `styles()` and the SSR
 * declarative shadow root. The host collapses to `display: contents`: the trigger wrapper is the only box
 * the component puts in flow, and a triggerless (point-anchored) popover takes no layout at all. It also
 * keeps the panel out of a `display: none` subtree, which a popover cannot be shown from. */
export const popoverHostCss = ":host { display: contents; }";
