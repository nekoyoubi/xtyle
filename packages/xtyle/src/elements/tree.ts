import { XtyleElement, define, type StyleMode } from "./base.js";
import type { Size } from "../index.js";
import { treeHostCss, firstSelectedValue, type TreeNode } from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/tree/source.generated.js";

export type { TreeNode };

interface NavRow {
	key: string;
	parent: string | null;
	level: number;
	expandable: boolean;
	expanded: boolean;
	disabled: boolean;
	isLink: boolean;
	locked: boolean;
}

export class XtyleTree extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private itemsProp: TreeNode[] | null = null;
	private selectedValue: string | null = null;
	private expandedKeys: Set<string> | null = null;
	private rovingValue: string | null = null;
	private knownKeys: Set<string> | null = null;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "tree", {
		context: (handler) => (handler === "navKeydown" ? this.navContext() : undefined),
		applyIntent: (intent, event) => this.applyIntent(intent, event),
	});

	static get observedAttributes(): string[] {
		return ["items", "size", "label", "labelledby"];
	}

	get items(): TreeNode[] {
		if (this.itemsProp) return this.itemsProp;
		const raw = this.getAttribute("items");
		if (raw) {
			try {
				return JSON.parse(raw) as TreeNode[];
			} catch {
				return [];
			}
		}
		return [];
	}
	set items(value: TreeNode[]) {
		this.itemsProp = value;
		this.reconcileItems();
		if (this.root.firstChild) this.render();
	}

	get size(): Size {
		return (this.getAttribute("size") as Size) ?? "md";
	}
	set size(value: Size) {
		this.setAttribute("size", value);
	}

	attributeChangedCallback(name: string): void {
		if (name === "items") this.reconcileItems();
		if (this.root.firstChild) this.render();
	}

	/**
	 * Drop every piece of host-owned interaction state — expansion, selection, and the roving tab
	 * stop — so the next render re-seeds it from the current `items` flags. An `items` assignment
	 * *preserves* that state (a live-data feed re-setting `items` must not re-expand a branch the
	 * user collapsed), so a consumer that genuinely wants a clean slate asks for one here.
	 */
	resetState(): void {
		this.expandedKeys = null;
		this.selectedValue = null;
		this.rovingValue = null;
		this.knownKeys = null;
		if (this.root.firstChild) this.render();
	}

	private nodeKey(node: TreeNode): string {
		return node.value ?? node.label;
	}

	private hasChildren(node: TreeNode): boolean {
		return !!(node.children && node.children.length);
	}

	private collectKeys(nodes: TreeNode[], into = new Set<string>()): Set<string> {
		for (const node of nodes) {
			into.add(this.nodeKey(node));
			if (this.hasChildren(node)) this.collectKeys(node.children as TreeNode[], into);
		}
		return into;
	}

	/**
	 * Carry host-owned state across an `items` assignment. A consumer whose node *data* changes
	 * live (a per-row word count) re-sets `items` on every edit; nulling the state there would
	 * re-expand every collapsed branch and re-seat the tab stop mid-keystroke. So expansion,
	 * selection, and roving focus survive, intersected with the new key set: a branch the user
	 * collapsed stays collapsed, a key that vanished is dropped, and only a *genuinely new* branch
	 * (one `knownKeys` has never seen) seeds from its `expanded` / `locked` flags.
	 */
	private reconcileItems(): void {
		const known = this.knownKeys;
		if (!known) return;
		const items = this.items;
		const live = this.collectKeys(items);
		const expanded = this.expandedKeys ?? new Set<string>();
		for (const key of [...expanded]) {
			if (!live.has(key)) expanded.delete(key);
		}
		const seedNew = (nodes: TreeNode[]): void => {
			for (const node of nodes) {
				if (!this.hasChildren(node)) continue;
				const key = this.nodeKey(node);
				if (!known.has(key) && ((node.locked ?? false) || node.expanded)) expanded.add(key);
				seedNew(node.children as TreeNode[]);
			}
		};
		seedNew(items);
		this.expandedKeys = expanded;
		if (this.selectedValue !== null && !live.has(this.selectedValue)) this.selectedValue = null;
		if (this.rovingValue !== null && !live.has(this.rovingValue)) this.rovingValue = null;
		this.knownKeys = live;
	}

	/** The expanded-key set, seeded once from each branch's `expanded`/`locked` flags, then host-owned. */
	private ensureExpanded(): Set<string> {
		if (this.expandedKeys) return this.expandedKeys;
		const expanded = new Set<string>();
		const seed = (nodes: TreeNode[]): void => {
			for (const node of nodes) {
				if (this.hasChildren(node)) {
					const locked = (node.locked ?? false) && this.hasChildren(node);
					if (locked || node.expanded) expanded.add(this.nodeKey(node));
					seed(node.children as TreeNode[]);
				}
			}
		};
		seed(this.items);
		this.expandedKeys = expanded;
		this.knownKeys = this.collectKeys(this.items);
		return expanded;
	}

	private ensureSelected(): string | null {
		if (this.selectedValue !== null) return this.selectedValue;
		this.selectedValue = firstSelectedValue(this.items);
		return this.selectedValue;
	}

	/**
	 * The roving tab stop, resolved against the rows that are actually on screen: the focused key
	 * while it's still a live, visible, focusable row; else the selected row; else the first visible
	 * row. Resolving here (rather than shipping a possibly-dead key to the fill) is what keeps the
	 * tree in the tab order — a stale target would leave every row at `tabindex="-1"`.
	 */
	private ensureRoving(): string | null {
		const rows = this.navContext().rows.filter((row) => !(row.locked && !row.isLink));
		const live = (key: string | null): boolean => key !== null && rows.some((row) => row.key === key);
		if (live(this.rovingValue)) return this.rovingValue;
		const selected = this.ensureSelected();
		if (live(selected)) return selected;
		return rows[0]?.key ?? null;
	}

	private get bindings(): Record<string, unknown> {
		return {
			items: this.items,
			size: this.size,
			label: this.getAttribute("label"),
			labelledby: this.getAttribute("labelledby"),
			selectedValue: this.ensureSelected(),
			expandedKeys: [...this.ensureExpanded()],
			rovingValue: this.ensureRoving(),
		};
	}

	/** A pre-order flatten of the currently-visible rows: the keyboard handler's nav surface. */
	private navContext(): { rows: NavRow[] } {
		const expanded = this.ensureExpanded();
		const rows: NavRow[] = [];
		const walk = (nodes: TreeNode[], level: number, parent: string | null): void => {
			for (const node of nodes) {
				const key = this.nodeKey(node);
				const expandable = this.hasChildren(node);
				const locked = (node.locked ?? false) && expandable;
				const isOpen = locked || expanded.has(key);
				rows.push({
					key,
					parent,
					level,
					expandable,
					expanded: isOpen,
					disabled: node.disabled ?? false,
					isLink: !!node.href,
					locked,
				});
				if (expandable && isOpen) walk(node.children as TreeNode[], level + 1, key);
			}
		};
		walk(this.items, 1, null);
		return { rows };
	}

	private setExpanded(key: string, expanded: boolean): void {
		const open = this.ensureExpanded();
		if (expanded) open.add(key);
		else open.delete(key);
		this.dispatchEvent(new CustomEvent("toggle", { bubbles: true, composed: true, detail: { value: key, expanded } }));
	}

	private toggleKey(key: string): void {
		const open = this.ensureExpanded();
		this.setExpanded(key, !open.has(key));
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.preventDefault) event.preventDefault();
		if (intent.stopPropagation) event.stopPropagation();
		if (intent.emit) {
			this.dispatchEvent(new CustomEvent(intent.emit.type, { bubbles: true, composed: true, detail: intent.emit.detail }));
		}
		if (intent.select !== undefined) {
			this.selectedValue = intent.select;
			this.dispatchEvent(new CustomEvent("select", { bubbles: true, composed: true, detail: { value: intent.select } }));
		}
		if (intent.expand !== undefined && intent.expandKey !== undefined) this.setExpanded(intent.expandKey, intent.expand);
		else if (intent.expandKey !== undefined) this.toggleKey(intent.expandKey);
		if (intent.focus !== undefined) this.rovingValue = intent.focus;
		this.render();
		if (intent.activate !== undefined) {
			const link = this.root.querySelector<HTMLAnchorElement>(
				`[role="treeitem"][data-value="${CSS.escape(intent.activate)}"] > a.xtyle-tree__row`,
			);
			link?.click();
		}
		if (intent.focus !== undefined) {
			const item = this.root.querySelector<HTMLElement>(
				`[role="treeitem"][data-value="${CSS.escape(intent.focus)}"]`,
			);
			item?.focus();
		}
	}

	private warnIfUnnamed(): void {
		if (!this.getAttribute("label") && !this.getAttribute("labelledby")) {
			console.warn("xtyle-tree: no accessible name. Provide a `label` or `labelledby` so the tree is announced.");
		}
	}

	/** The rows are built by the fill's `mount` hook; its `update` ops only patch selection and
	 * expansion state, so any change to the node data itself — a row's label, a live badge count, an
	 * added or removed node — needs a rebuild rather than a patch. */
	private shapeSignature(): string {
		return JSON.stringify(this.items);
	}

	private get activeRow(): HTMLElement | null {
		const scope = this.root as unknown as { activeElement?: Element | null };
		const active = scope.activeElement ?? (this.contains(document.activeElement) ? document.activeElement : null);
		return active instanceof HTMLElement ? active.closest<HTMLElement>('[role="treeitem"]') : null;
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(treeHostCss);
		// A rebuild replaces the focused `<li>`, so a keyboard user mid-navigation would lose focus
		// to the body every time live data lands. Re-seat it on the replacement row.
		const focusedKey = this.activeRow?.getAttribute("data-value") ?? null;
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		if (focusedKey !== null) {
			this.root
				.querySelector<HTMLElement>(`[role="treeitem"][data-value="${CSS.escape(focusedKey)}"]`)
				?.focus();
		}
		this.warnIfUnnamed();
	}
}

define("xtyle-tree", XtyleTree);
