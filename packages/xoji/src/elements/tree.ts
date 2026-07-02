import { XojiElement, define, type StyleMode } from "./base.js";
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

export class XojiTree extends XojiElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private itemsProp: TreeNode[] | null = null;
	private selectedValue: string | null = null;
	private expandedKeys: Set<string> | null = null;
	private rovingValue: string | null = null;
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
		this.expandedKeys = null;
		this.selectedValue = null;
		if (this.root.firstChild) this.render();
	}

	get size(): Size {
		return (this.getAttribute("size") as Size) ?? "md";
	}
	set size(value: Size) {
		this.setAttribute("size", value);
	}

	attributeChangedCallback(name: string): void {
		if (name === "items") {
			this.expandedKeys = null;
			this.selectedValue = null;
		}
		if (this.root.firstChild) this.render();
	}

	private nodeKey(node: TreeNode): string {
		return node.value ?? node.label;
	}

	private hasChildren(node: TreeNode): boolean {
		return !!(node.children && node.children.length);
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
		return expanded;
	}

	private ensureSelected(): string | null {
		if (this.selectedValue !== null) return this.selectedValue;
		this.selectedValue = firstSelectedValue(this.items);
		return this.selectedValue;
	}

	private get bindings(): Record<string, unknown> {
		return {
			items: this.items,
			size: this.size,
			label: this.getAttribute("label"),
			labelledby: this.getAttribute("labelledby"),
			selectedValue: this.ensureSelected(),
			expandedKeys: [...this.ensureExpanded()],
			rovingValue: this.rovingValue,
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
				`[role="treeitem"][data-value="${CSS.escape(intent.activate)}"] > a.xoji-tree__row`,
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
			console.warn("xoji-tree: no accessible name. Provide a `label` or `labelledby` so the tree is announced.");
		}
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(treeHostCss);
		this.fragment.update(this.bindings);
		this.warnIfUnnamed();
	}
}

define("xoji-tree", XojiTree);
