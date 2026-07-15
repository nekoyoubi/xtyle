import { XtyleElement, define, type StyleMode } from "./base.js";
import {
	commandPaletteHostCss,
	highlightRuns,
	subsequenceScorer,
	type CommandCloseReason,
	type CommandItem,
	type CommandMatch,
	type CommandScorer,
} from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/command-palette/source.generated.js";

export type { CommandItem, CommandMatch, CommandScorer, CommandCloseReason } from "../markup/index.js";

/** What one rendered command carries into the fill — the item, plus everything the surface needs to draw it. */
interface OptionView {
	id: string;
	optionId: string;
	runs: { text: string; match: boolean }[];
	hint?: string;
	shortcut?: string;
	disabled?: boolean;
	active?: boolean;
}

interface GroupView {
	id: string;
	heading?: string;
	options: OptionView[];
}

/** How far PageUp / PageDown move the active command. */
const PAGE = 5;

/** How many ids the recents list remembers, regardless of how many `recentLimit` renders. */
const RECENT_CAP = 25;

interface Hotkey {
	key: string;
	mod: boolean;
	ctrl: boolean;
	meta: boolean;
	alt: boolean;
	shift: boolean;
}

let paletteSeq = 0;

function isMac(): boolean {
	if (typeof navigator === "undefined") return false;
	return /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent || "");
}

/** `"mod+k"` / `"ctrl+shift+p"` → the chord to compare a keydown against. `mod` is ⌘ on Apple, Ctrl elsewhere. */
function parseHotkey(spec: string): Hotkey | null {
	const parts = spec
		.split("+")
		.map((part) => part.trim().toLowerCase())
		.filter((part) => part !== "");
	const key = parts.pop();
	if (!key) return null;
	return {
		key,
		mod: parts.includes("mod"),
		ctrl: parts.includes("ctrl") || parts.includes("control"),
		meta: parts.includes("meta") || parts.includes("cmd") || parts.includes("command"),
		alt: parts.includes("alt") || parts.includes("option"),
		shift: parts.includes("shift"),
	};
}

/**
 * The command surface: a modal search over everything an app can do. It is a `<dialog>` (so the scrim,
 * the focus trap, and Escape are the platform's), a filter input, a grouped result list under virtual
 * focus, and each command's own shortcut spelled out in keycaps.
 *
 * It takes the *whole* command list and filters it itself: a palette handed a pre-filtered list is a
 * list, not a palette. The default ranking is a subsequence match — `of` finds "Open File" — and any
 * consumer who wants their own can hand over a `scorer` function; the palette renders whatever it
 * returns, in whatever order it scores it.
 *
 * Keyboard: type to filter, ↑/↓ (and PageUp/PageDown) to move, Enter to run, Escape to dismiss, and
 * focus goes back to wherever it came from. Home/End are deliberately left to the caret. Bind `hotkey`
 * (`mod+k`) and the palette opens itself from anywhere on the page.
 */
export class XtyleCommandPalette extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private uid = `xtyle-command-palette-${paletteSeq++}`;
	private itemsProp: CommandItem[] | null = null;
	private scorerProp: CommandScorer | null = null;
	private queryValue = "";
	private activeValue = "";
	private recentIds: string[] = [];
	private groupsView: GroupView[] = [];
	/** The runnable commands in render order — what ↑/↓ walk and what `select` reports an index into. */
	private navigable: CommandItem[] = [];
	private rendered = 0;
	private returnFocusTo: HTMLElement | null = null;
	private closeReason: CommandCloseReason = "api";
	private portalMarker: Comment | null = null;
	private wiredDialog: HTMLDialogElement | null = null;
	private rootWired = false;
	private docWired = false;
	private recentLoaded = false;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "command-palette", {
		applyIntent: (intent, event) => this.applyIntent(intent, event),
		afterApply: () => this.afterApply(),
	});

	static get observedAttributes(): string[] {
		return [
			"open",
			"items",
			"label",
			"placeholder",
			"empty-text",
			"recent-label",
			"recent-limit",
			"no-recent",
			"no-footer",
			"no-close-on-select",
			"hotkey",
			"storage-key",
		];
	}

	/** Reflects (and controls) whether the palette is open. `show()` / `close()` are the focus-managing doors. */
	get open(): boolean {
		return this.hasAttribute("open");
	}
	set open(value: boolean) {
		this.reflectBoolean("open", value);
	}

	/** Every command the palette can run — the full list, unfiltered. The palette does the filtering. */
	get items(): CommandItem[] {
		if (this.itemsProp) return this.itemsProp;
		const raw = this.getAttribute("items");
		if (!raw) return [];
		try {
			const parsed = JSON.parse(raw) as CommandItem[];
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
	set items(value: CommandItem[]) {
		this.itemsProp = value;
		if (this.root.firstChild) this.render();
	}

	/** The ranking hook. Assign your own to replace the built-in subsequence matcher wholesale. */
	get scorer(): CommandScorer {
		return this.scorerProp ?? subsequenceScorer;
	}
	set scorer(value: CommandScorer | null) {
		this.scorerProp = value;
		if (this.root.firstChild) this.render();
	}

	/** The live filter text. Setting it re-filters and re-ranks, exactly as typing does. */
	get query(): string {
		return this.queryValue;
	}
	set query(value: string) {
		this.setQuery(value ?? "");
	}

	/** The id of the command under virtual focus — what Enter runs. */
	get active(): string {
		return this.activeValue;
	}
	set active(value: string) {
		if (!this.navigable.some((item) => item.id === value)) return;
		this.activeValue = value;
		this.paint();
	}

	/** The ids of recently run commands, most recent first. Assign to seed them from your own store. */
	get recent(): string[] {
		return [...this.recentIds];
	}
	set recent(value: string[]) {
		this.recentIds = [...(value ?? [])].slice(0, RECENT_CAP);
		if (this.root.firstChild) this.render();
	}

	/** The palette's accessible name — on the dialog, the input, and the listbox. */
	get label(): string {
		return this.getAttribute("label") ?? "Command palette";
	}
	set label(value: string) {
		this.reflectString("label", value);
	}

	get placeholder(): string {
		return this.getAttribute("placeholder") ?? "Type a command or search…";
	}
	set placeholder(value: string) {
		this.reflectString("placeholder", value);
	}

	/** What stands in for the list when nothing matches. */
	get emptyText(): string {
		return this.getAttribute("empty-text") ?? "No matching commands";
	}
	set emptyText(value: string) {
		this.reflectString("empty-text", value);
	}

	/** The heading over the recents group. */
	get recentLabel(): string {
		return this.getAttribute("recent-label") ?? "Recent";
	}
	set recentLabel(value: string) {
		this.reflectString("recent-label", value);
	}

	/** How many recents lead the unfiltered list. Defaults to `5`. */
	get recentLimit(): number {
		const raw = Number(this.getAttribute("recent-limit"));
		return Number.isFinite(raw) && this.hasAttribute("recent-limit") ? Math.max(0, raw) : 5;
	}
	set recentLimit(value: number) {
		this.reflectString("recent-limit", String(value));
	}

	/** Don't track or surface recently-run commands at all. */
	get noRecent(): boolean {
		return this.hasAttribute("no-recent");
	}
	set noRecent(value: boolean) {
		this.reflectBoolean("no-recent", value);
	}

	/** Drop the keyboard legend along the bottom edge. */
	get noFooter(): boolean {
		return this.hasAttribute("no-footer");
	}
	set noFooter(value: boolean) {
		this.reflectBoolean("no-footer", value);
	}

	/** Keep the palette open after a command runs — for a surface that toggles rather than navigates. */
	get noCloseOnSelect(): boolean {
		return this.hasAttribute("no-close-on-select");
	}
	set noCloseOnSelect(value: boolean) {
		this.reflectBoolean("no-close-on-select", value);
	}

	/** A document-wide chord that opens the palette: `mod+k`, `ctrl+shift+p`. `mod` is ⌘ on Apple, Ctrl elsewhere. */
	get hotkey(): string | null {
		return this.getAttribute("hotkey");
	}
	set hotkey(value: string | null | undefined) {
		this.reflectString("hotkey", value);
	}

	/** A `localStorage` key to persist recents under. Omit and recents live only as long as the page does. */
	get storageKey(): string | null {
		return this.getAttribute("storage-key");
	}
	set storageKey(value: string | null | undefined) {
		this.reflectString("storage-key", value);
	}

	attributeChangedCallback(name: string): void {
		if (!this.root.firstChild) return;
		if (name === "open") {
			this.syncOpen();
			return;
		}
		this.render();
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.unwireDocument();
	}

	/** Open the palette: a fresh query, focus in the input, and a note of where focus came from. */
	show(): void {
		if (this.open) return;
		this.captureReturnFocus();
		this.open = true;
	}

	/** Close the palette and hand focus back to whatever had it when the palette opened. */
	close(reason: CommandCloseReason = "api"): void {
		if (!this.open) return;
		this.closeReason = reason;
		this.open = false;
	}

	/** Open if closed, close if open — what the hotkey does. */
	toggle(): void {
		if (this.open) this.close("api");
		else this.show();
	}

	/** Run a command by id, exactly as selecting it would: the `select` event, the recents bump, the close. */
	run(id: string): void {
		const item = this.navigable.find((entry) => entry.id === id);
		if (item) this.select(item);
	}

	private get dialogEl(): HTMLDialogElement | null {
		return this.root.querySelector("dialog");
	}

	private get inputEl(): HTMLInputElement | null {
		return this.root.querySelector(".xtyle-command-palette__input");
	}

	private optionEls(): HTMLElement[] {
		return [...this.root.querySelectorAll<HTMLElement>(".xtyle-command-palette__option")];
	}

	private optionEl(id: string): HTMLElement | undefined {
		return this.optionEls().find((el) => el.dataset.id === id);
	}

	private get bindings(): Record<string, unknown> {
		const active = this.groupsView.flatMap((group) => group.options).find((option) => option.active);
		return {
			label: this.label,
			placeholder: this.placeholder,
			emptyText: this.emptyText,
			listId: `${this.uid}-list`,
			inputId: `${this.uid}-input`,
			groups: this.groupsView,
			count: this.rendered,
			activeId: active?.optionId ?? "",
			footer: !this.noFooter,
		};
	}

	private setQuery(value: string): void {
		if (this.queryValue === value) return;
		this.queryValue = value;
		this.activeValue = "";
		this.paint();
	}

	/** Re-rank and repaint the surface. Everything the palette does in response to a keystroke goes through
	 * here rather than `render()`, which also (re)scaffolds and syncs the dialog. */
	private paint(): void {
		if (!this.root.firstChild) return;
		this.compute();
		this.fragment.update(this.bindings);
	}

	/** Rank, group, and lay out the commands the current query keeps. Recents lead the unfiltered list and are
	 * lifted out of their own groups, so a command never appears twice. */
	private compute(): void {
		const query = this.queryValue.trim();
		const scorer = this.scorer;
		const ranked: { item: CommandItem; match: CommandMatch; order: number }[] = [];
		this.items.forEach((item, order) => {
			if (!item || typeof item.id !== "string") return;
			const match = scorer(query, item);
			if (match) ranked.push({ item, match, order });
		});
		if (query !== "") ranked.sort((a, b) => b.match.score - a.match.score || a.order - b.order);

		const groups: GroupView[] = [];
		const byHeading = new Map<string, GroupView>();
		const navigable: CommandItem[] = [];
		let index = 0;
		const push = (target: GroupView, item: CommandItem, match: CommandMatch): void => {
			target.options.push({
				id: item.id,
				optionId: `${this.uid}-option-${index++}`,
				runs: highlightRuns(item.label, match.indices),
				hint: item.hint,
				shortcut: item.shortcut,
				disabled: item.disabled,
			});
			if (!item.disabled) navigable.push(item);
		};

		const recents = this.recentEntries(query, ranked);
		if (recents.length > 0) {
			const group: GroupView = { id: `${this.uid}-group-recent`, heading: this.recentLabel, options: [] };
			groups.push(group);
			for (const entry of recents) push(group, entry.item, entry.match);
		}
		const lifted = new Set(recents.map((entry) => entry.item.id));

		for (const entry of ranked) {
			if (lifted.has(entry.item.id)) continue;
			const heading = entry.item.group ?? "";
			let group = byHeading.get(heading);
			if (!group) {
				group = { id: `${this.uid}-group-${byHeading.size}`, heading: heading || undefined, options: [] };
				byHeading.set(heading, group);
				groups.push(group);
			}
			push(group, entry.item, entry.match);
		}

		this.groupsView = groups;
		this.navigable = navigable;
		this.rendered = index;
		if (!navigable.some((item) => item.id === this.activeValue)) this.activeValue = navigable[0]?.id ?? "";
		for (const group of groups) {
			for (const option of group.options) option.active = option.id === this.activeValue && this.activeValue !== "";
		}
	}

	/** The recents that lead an unfiltered list: ids we remember, still present, still runnable, newest first. */
	private recentEntries(
		query: string,
		ranked: { item: CommandItem; match: CommandMatch; order: number }[],
	): { item: CommandItem; match: CommandMatch }[] {
		if (query !== "" || this.noRecent || this.recentLimit === 0) return [];
		const out: { item: CommandItem; match: CommandMatch }[] = [];
		for (const id of this.recentIds) {
			const entry = ranked.find((candidate) => candidate.item.id === id && !candidate.item.disabled);
			if (entry) out.push({ item: entry.item, match: entry.match });
			if (out.length >= this.recentLimit) break;
		}
		return out;
	}

	/** Single steps wrap (the last command's ↓ lands on the first); a page jump clamps at the ends. */
	private moveActive(delta: number, wrap: boolean): void {
		const ids = this.navigable.map((item) => item.id);
		if (ids.length === 0) return;
		const here = Math.max(ids.indexOf(this.activeValue), 0);
		const raw = here + delta;
		const next = wrap ? ((raw % ids.length) + ids.length) % ids.length : Math.min(Math.max(raw, 0), ids.length - 1);
		this.activeValue = ids[next] ?? "";
		this.paint();
	}

	private focusItem(id: string): void {
		if (this.activeValue === id || !this.navigable.some((item) => item.id === id)) return;
		this.activeValue = id;
		this.paint();
	}

	private select(item: CommandItem): void {
		if (item.disabled) return;
		const index = this.navigable.findIndex((entry) => entry.id === item.id);
		this.remember(item.id);
		this.dispatchEvent(
			new CustomEvent("select", {
				bubbles: true,
				composed: true,
				detail: { id: item.id, label: item.label, item, index, query: this.queryValue },
			}),
		);
		if (this.noCloseOnSelect) this.paint();
		else this.close("select");
	}

	private remember(id: string): void {
		if (this.noRecent) return;
		this.recentIds = [id, ...this.recentIds.filter((entry) => entry !== id)].slice(0, RECENT_CAP);
		this.persistRecent();
	}

	private loadRecent(): void {
		const key = this.storageKey;
		if (this.recentLoaded || !key || typeof localStorage === "undefined") return;
		this.recentLoaded = true;
		try {
			const parsed = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown;
			if (Array.isArray(parsed)) this.recentIds = parsed.filter((id): id is string => typeof id === "string");
		} catch {
			/* a corrupt or unreadable store is not worth a broken palette */
		}
	}

	private persistRecent(): void {
		const key = this.storageKey;
		if (!key || typeof localStorage === "undefined") return;
		try {
			localStorage.setItem(key, JSON.stringify(this.recentIds));
		} catch {
			/* a full or blocked store is not worth a broken palette */
		}
	}

	private captureReturnFocus(): void {
		if (typeof document === "undefined") return;
		const active = document.activeElement as HTMLElement | null;
		if (!active || active === document.body || active === document.documentElement) return;
		if (active === this || this.contains(active)) return;
		this.returnFocusTo = typeof active.focus === "function" ? active : null;
	}

	private syncOpen(): void {
		const dialog = this.dialogEl;
		if (!dialog) return;
		if (this.open && !dialog.open) this.openDialog(dialog);
		else if (!this.open && dialog.open) dialog.close();
	}

	/** Every open starts clean: an empty query, the first command active, the caret in the input. */
	private openDialog(dialog: HTMLDialogElement): void {
		if (!this.returnFocusTo) this.captureReturnFocus();
		this.portalToBody();
		this.queryValue = "";
		this.activeValue = "";
		this.paint();
		const input = this.inputEl;
		if (input) input.value = "";
		dialog.showModal();
		input?.focus();
		this.scrollActiveIntoView();
		this.dispatchEvent(new Event("open", { bubbles: true, composed: true }));
	}

	/** Relocate the host to `document.body` while open, for the same reason Dialog does: a modal `<dialog>`
	 * anchors to the nearest ancestor that establishes a containing block (`transform`, `filter`, `contain`),
	 * so a palette declared inside a frosted or transformed panel would center on that panel, not the viewport.
	 * A marker holds its home for the restore on close. */
	private portalToBody(): void {
		if (typeof document === "undefined" || this.parentElement === document.body || !this.isConnected) return;
		if (!this.portalMarker) {
			this.portalMarker = document.createComment("xtyle-command-palette");
			this.before(this.portalMarker);
		}
		document.body.appendChild(this);
	}

	private restoreFromPortal(): void {
		const marker = this.portalMarker;
		this.portalMarker = null;
		if (marker?.parentNode) {
			marker.parentNode.insertBefore(this, marker);
			marker.remove();
		}
	}

	private onDialogClose = (): void => {
		const reason = this.closeReason;
		const target = this.returnFocusTo;
		this.closeReason = "api";
		this.returnFocusTo = null;
		if (this.open) this.open = false;
		this.restoreFromPortal();
		target?.focus();
		this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true, detail: { reason } }));
	};

	private onDialogCancel = (): void => {
		this.closeReason = "escape";
	};

	private onDocumentKeydown = (event: KeyboardEvent): void => {
		const spec = this.hotkey ? parseHotkey(this.hotkey) : null;
		if (!spec || !this.matchesHotkey(spec, event)) return;
		event.preventDefault();
		this.toggle();
	};

	private matchesHotkey(spec: Hotkey, event: KeyboardEvent): boolean {
		const mac = isMac();
		const wantCtrl = spec.ctrl || (spec.mod && !mac);
		const wantMeta = spec.meta || (spec.mod && mac);
		return (
			event.ctrlKey === wantCtrl &&
			event.metaKey === wantMeta &&
			event.altKey === spec.alt &&
			event.shiftKey === spec.shift &&
			(event.key ?? "").toLowerCase() === spec.key
		);
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.preventDefault) event.preventDefault();
		if (intent.stopPropagation) event.stopPropagation();
		if (intent.inputValue !== undefined) {
			this.setQuery(intent.inputValue);
			return;
		}
		if (intent.nudge !== undefined) {
			this.moveActive(intent.nudge, true);
			return;
		}
		if (intent.jump !== undefined) {
			this.moveActive(intent.jump === "page-up" ? -PAGE : PAGE, false);
			return;
		}
		if (intent.commitValue) {
			const item = this.navigable.find((entry) => entry.id === this.activeValue);
			if (item) this.select(item);
			return;
		}
		if (intent.activateValue !== undefined) {
			const item = this.navigable.find((entry) => entry.id === intent.activateValue);
			if (item) this.select(item);
			return;
		}
		if (intent.focusValue !== undefined) {
			this.focusItem(intent.focusValue);
			return;
		}
		if (intent.requestClose) this.close("escape");
	}

	/** Wire what the fill cannot declare: the native `<dialog>`'s non-bubbling `close` / `cancel`, the
	 * backdrop click (which lands on the dialog element itself), and the document-level hotkey. */
	private wire(): void {
		if (!this.rootWired) {
			this.rootWired = true;
			this.root.addEventListener("click", (event) => {
				if (event.target === this.dialogEl) this.close("dismiss");
			});
		}
		const dialog = this.dialogEl;
		if (dialog && dialog !== this.wiredDialog) {
			this.wiredDialog?.removeEventListener("close", this.onDialogClose);
			this.wiredDialog?.removeEventListener("cancel", this.onDialogCancel);
			this.wiredDialog = dialog;
			dialog.addEventListener("close", this.onDialogClose);
			dialog.addEventListener("cancel", this.onDialogCancel);
		}
		this.wireDocument();
	}

	private wireDocument(): void {
		if (this.docWired || typeof document === "undefined") return;
		this.docWired = true;
		document.addEventListener("keydown", this.onDocumentKeydown);
	}

	private unwireDocument(): void {
		if (!this.docWired || typeof document === "undefined") return;
		this.docWired = false;
		document.removeEventListener("keydown", this.onDocumentKeydown);
	}

	private afterApply(): void {
		this.wire();
		this.scrollActiveIntoView();
	}

	/** Virtual focus never scrolls on its own — the caret stays in the input — so the active row is walked
	 * into view by hand as ↑/↓ move it. */
	private scrollActiveIntoView(): void {
		if (!this.open || this.activeValue === "") return;
		const option = this.optionEl(this.activeValue);
		if (option && typeof option.scrollIntoView === "function") option.scrollIntoView({ block: "nearest" });
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(commandPaletteHostCss);
		this.loadRecent();
		this.compute();
		this.fragment.update(this.bindings);
		this.wire();
		this.syncOpen();
	}
}

define("xtyle-command-palette", XtyleCommandPalette);
