/**
 * The collection substrate: the shared, DOM-free interaction core behind xtyle's list-like
 * components (menu, tree, table, combobox, command-palette, tabs, segmented, pagination) and the
 * `<xtyle-list>` reference skin. See `docs/collection-substrate.md`.
 */
export { firstKey, lastKey, stepKey, resolveRoving, type NavItem } from "./roving.js";
export { linearNav, type NavIntent, type NavOptions, type NavOrientation } from "./nav-reducer.js";
export { SelectionModel, type SelectionMode } from "./selection-model.js";
