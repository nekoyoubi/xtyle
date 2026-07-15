import { XtyleElement, define, type StyleMode } from "./base.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/dropzone/source.generated.js";
import {
	baseName,
	dropzoneBindings,
	dropzoneMaxFiles,
	formatBytes,
	inferType,
	matchesPattern,
	parseByteSize,
	type DropFile,
	type DropFileDescriptor,
	type DropFileStatus,
	type DropItem,
	type DropRejectReason,
	type DropRejection,
	type DropResult,
	type DropSource,
	type DropzoneFileBinding,
} from "../markup/dropzone.js";

export { formatBytes, parseByteSize } from "../markup/dropzone.js";
export type {
	DropFile,
	DropFileDescriptor,
	DropFileStatus,
	DropItem,
	DropRejectReason,
	DropRejection,
	DropResult,
	DropSource,
} from "../markup/dropzone.js";

function isTextEntry(node: Element | null): boolean {
	if (!(node instanceof HTMLElement)) return false;
	if (node.isContentEditable) return true;
	const tag = node.tagName;
	if (tag === "TEXTAREA") return true;
	return tag === "INPUT" && (node as HTMLInputElement).type !== "file";
}

/**
 * Route a native (OS-level) drag/drop into whatever dropzone sits under the pointer. This is the
 * companion to `addFiles()` for a shell — Tauri, Electron, a WebView2 host — whose OS drop events
 * never reach the DOM as `dragover` / `drop`. Feed it the shell's own event and it drives the same
 * state the DOM listeners do: the hover skin, the reject preview, and the accepted batch.
 *
 * Give `x` / `y` in **CSS pixels** (divide a physical position by `devicePixelRatio`) and the deepest
 * zone containing that point claims the event; with no point, a lone zone on the page claims it and an
 * ambiguous page claims nothing.
 *
 * ```ts
 * import { routeNativeDrop } from "@xtyle/core/elements/dropzone.js";
 * import { getCurrentWebview } from "@tauri-apps/api/webview";
 *
 * await getCurrentWebview().onDragDropEvent(({ payload }) => {
 *   const at = payload.position && {
 *     x: payload.position.x / devicePixelRatio,
 *     y: payload.position.y / devicePixelRatio,
 *   };
 *   if (payload.type === "over") routeNativeDrop("over", { ...at });
 *   else if (payload.type === "drop") routeNativeDrop("drop", { ...at, items: payload.paths });
 *   else routeNativeDrop("leave", {});
 * });
 * ```
 */
export function routeNativeDrop(
	state: "over" | "drop" | "leave",
	options: { x?: number; y?: number; items?: Iterable<DropItem> } = {},
): XtyleDropzone | null {
	if (typeof document === "undefined") return null;
	const zones: XtyleDropzone[] = [];
	for (const node of document.querySelectorAll("xtyle-dropzone")) {
		if (node instanceof XtyleDropzone) zones.push(node);
	}
	if (state === "leave") {
		for (const zone of zones) zone.setDragging(false);
		return null;
	}
	const live = zones.filter((zone) => !zone.disabled);
	const { x, y } = options;
	// Reverse document order so the innermost / latest zone under the point wins, matching how a DOM
	// drop resolves against the topmost target.
	const hit: XtyleDropzone | null =
		x !== undefined && y !== undefined
			? ([...live].reverse().find((zone) => zone.containsPoint(x, y)) ?? null)
			: live.length === 1
				? (live[0] as XtyleDropzone)
				: null;
	for (const zone of zones) {
		if (zone !== hit) zone.setDragging(false);
	}
	if (!hit) return null;
	if (state === "over") {
		hit.setDragging(true, hit.rejects(options.items));
		return hit;
	}
	hit.setDragging(false);
	hit.addFiles(options.items ?? [], "host");
	return hit;
}

/**
 * A file drop target.
 *
 * **The DOM drop is one input, not the input.** Inside a native shell (Tauri, Electron) the OS hands
 * the drop to the *webview*, not to the document, so `dragover` / `drop` never fire and a DOM-only
 * dropzone is inert in exactly the apps this library exists to serve. So every ingress lands on the
 * same public seam: `addFiles()` takes `File`s, filesystem paths, or descriptors from anywhere, runs
 * the same validation, and emits the same events; `setDragging()` drives the hover and reject skins
 * from a host that owns the drag; `routeNativeDrop()` wires a shell's OS drag/drop straight through.
 * The DOM listeners are simply one caller of `addFiles()` among several.
 *
 * The chrome — the drop surface, its idle / hover / reject / disabled states, the hint, the rejection
 * list, and the upload rows with their bars — is the fill's (`component.dropzone`), so a mod reshapes
 * all of it. The element keeps behavior (drag tracking, validation, paste, focus) and the plumbing
 * that never renders: a real `<input type="file">`, which is both the keyboard/screen-reader path and
 * the `<form>` value.
 */
export class XtyleDropzone extends XtyleElement {
	/** The element is the drop target and the box a native pointer position is hit-tested against, so it
	 * renders into its own light DOM and the fill's chrome lays out as its own children. */
	protected override get styleMode(): StyleMode {
		return "scoped";
	}

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "dropzone", {
		applyIntent: (intent, event) => this.applyIntent(intent, event),
	});

	static get observedAttributes(): string[] {
		return [
			"accept",
			"multiple",
			"max-size",
			"max-files",
			"disabled",
			"paste",
			"name",
			"required",
			"label",
			"prompt",
			"hint",
			"browse-label",
			"dragging",
			"rejecting",
		];
	}

	private state: DropFile[] = [];
	private rejected: DropRejection[] = [];
	private fileInput: HTMLInputElement | null = null;
	private elementId = `xtyle-dropzone-${Math.random().toString(36).slice(2, 8)}`;
	private seq = 0;
	private dragDepth = 0;
	private listSignature = "";
	private bound = false;

	protected template(): string {
		return "";
	}

	get accept(): string {
		return this.getAttribute("accept") ?? "";
	}
	set accept(value: string) {
		this.reflectString("accept", value);
	}

	get multiple(): boolean {
		return this.hasAttribute("multiple");
	}
	set multiple(value: boolean) {
		this.reflectBoolean("multiple", value);
	}

	get disabled(): boolean {
		return this.hasAttribute("disabled");
	}
	set disabled(value: boolean) {
		this.reflectBoolean("disabled", value);
	}

	/** Per-file byte ceiling. Accepts `5mb` / `500kb` / a raw byte count; unset means no limit. */
	get maxSize(): number | undefined {
		return parseByteSize(this.getAttribute("max-size"));
	}
	set maxSize(value: string | number | null | undefined) {
		this.reflectString("max-size", value == null ? null : String(value));
	}

	/** How many files the zone will hold. Defaults to unlimited when `multiple`, and is always 1 without it. */
	get maxFiles(): number {
		const raw = Number.parseInt(this.getAttribute("max-files") ?? "", 10);
		return dropzoneMaxFiles(this.multiple, Number.isFinite(raw) ? raw : null);
	}
	set maxFiles(value: number | null | undefined) {
		this.reflectString("max-files", value == null ? null : String(value));
	}

	/** Text on the faux browse chip. */
	get browseLabel(): string {
		return this.getAttribute("browse-label") ?? "or browse";
	}
	set browseLabel(value: string) {
		this.reflectString("browse-label", value);
	}

	/** Whether Ctrl/Cmd+V of a file or screenshot adds it to the zone. */
	get pasteEnabled(): boolean {
		return this.hasAttribute("paste");
	}

	/** The accepted files, newest addition last. A copy — mutate through `addFiles` / `remove` / `clear`. */
	get files(): DropFile[] {
		return this.state.map((file) => ({ ...file }));
	}

	/** Why the most recent batch lost files, if it did. Cleared by the next batch and by `clear()`. */
	get rejections(): DropRejection[] {
		return this.rejected.map((rejection) => ({ ...rejection }));
	}

	connectedCallback(): void {
		this.adoptServerInput();
		super.connectedCallback();
		this.bind();
	}

	/**
	 * A server-rendered zone ships its own `<input type="file">` — the zero-JS keyboard path and form
	 * value, which no fill can draw because it is plumbing, not chrome. Adopt it, and take its id as this
	 * element's: the server-rendered surface `<label for>` and hint already point at it, so minting a
	 * fresh id here would leave the label addressing an input that no longer exists.
	 */
	private adoptServerInput(): void {
		if (this.fileInput) return;
		const existing = this.querySelector<HTMLInputElement>("input.xtyle-dropzone__input");
		if (!existing) return;
		this.fileInput = existing;
		if (existing.id) this.elementId = existing.id;
		existing.addEventListener("change", this.onPick);
	}

	disconnectedCallback(): void {
		this.unbind();
		super.disconnectedCallback();
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	/**
	 * The programmatic drop path — the one a native host drives. Takes `File`s (a DOM drop, a picker,
	 * a paste), filesystem paths (a native OS drop, which has no `File` behind it), or descriptors that
	 * carry whatever the host knows. Everything is validated against `accept` / `max-size` / `max-files`
	 * exactly as a DOM drop is, so the rejection story is identical no matter where the files came from.
	 *
	 * Emits `file-drop` (always), `file-reject` (when something failed), and `change` (when the list moved).
	 */
	addFiles(items: Iterable<DropItem> | FileList | null | undefined, source: DropSource = "host"): DropResult {
		const candidates = this.describeAll(items);
		if (this.disabled || candidates.length === 0) return { accepted: [], rejected: [] };

		// A single-file zone *replaces* rather than piles up (the native `<input type="file">` contract),
		// so the batch is validated against an empty list — but the swap is only committed if something
		// in the batch actually survived, or a bad drop would silently wipe a good file.
		const next = this.multiple ? [...this.state] : [];
		const accepted: DropFile[] = [];
		const rejected: DropRejection[] = [];

		for (const candidate of candidates) {
			const reason = this.validate(candidate, next);
			if (reason) {
				rejected.push(this.reject(candidate, reason));
				continue;
			}
			next.push(candidate);
			accepted.push(candidate);
		}

		if (accepted.length > 0) this.state = next;
		this.rejected = rejected;
		this.render();

		const detail = { accepted: accepted.map((f) => ({ ...f })), rejected: [...rejected], files: this.files, source };
		this.dispatchEvent(new CustomEvent("file-drop", { detail, bubbles: true, composed: true }));
		if (rejected.length > 0) {
			this.dispatchEvent(
				new CustomEvent("file-reject", { detail: { rejected: [...rejected] }, bubbles: true, composed: true }),
			);
		}
		if (accepted.length > 0) this.emitChange();
		return { accepted, rejected };
	}

	/** Drive the hover skin from a host that owns the drag (a native OS drag never fires `dragover`). */
	setDragging(dragging: boolean, rejecting = false): void {
		const active = dragging && !this.disabled;
		const bad = active && rejecting;
		if (active === this.hasAttribute("dragging") && bad === this.hasAttribute("rejecting")) return;
		this.reflectBoolean("dragging", active);
		this.reflectBoolean("rejecting", bad);
	}

	/** Whether a prospective batch would be entirely rejected — the reject preview a host shows mid-drag. */
	rejects(items: Iterable<DropItem> | FileList | null | undefined): boolean {
		const candidates = this.describeAll(items);
		if (candidates.length === 0) return false;
		return candidates.every((candidate) => this.validate(candidate, []) !== null);
	}

	/** Hit-test a point in **CSS pixels** against this zone — how a native host picks which zone a drop landed on. */
	containsPoint(x: number, y: number): boolean {
		const rect = this.getBoundingClientRect();
		return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
	}

	/** Drop one file from the list, moving focus to the next row's remove button (or the field).
	 * Named `removeFile`, not `remove`: `remove()` is `ChildNode`'s, and taking it would break
	 * `dropzone.remove()` for every consumer who expects the DOM's. */
	removeFile(id: string): void {
		const index = this.state.findIndex((file) => file.id === id);
		if (index === -1) return;
		const [removed] = this.state.splice(index, 1);
		this.render();
		this.dispatchEvent(new CustomEvent("file-remove", { detail: { file: removed }, bubbles: true, composed: true }));
		this.emitChange();
		this.focusAfterRemove(index);
	}

	/** Empty the list and the rejection surface. */
	clear(): void {
		if (this.state.length === 0 && this.rejected.length === 0) return;
		this.state = [];
		this.rejected = [];
		this.render();
		this.emitChange();
		this.fileInput?.focus();
	}

	/** Move one file's bar. Drives it into `uploading` on the way, and `done` at 100. */
	setProgress(id: string, progress: number): void {
		const file = this.state.find((entry) => entry.id === id);
		if (!file) return;
		file.progress = Math.max(0, Math.min(100, progress));
		if (file.status === "pending" || file.status === "uploading") {
			file.status = file.progress >= 100 ? "done" : "uploading";
		}
		this.render();
	}

	/** Set one file's status outright — `error` with a message is what a failed upload reports. */
	setStatus(id: string, status: DropFileStatus, error?: string): void {
		const file = this.state.find((entry) => entry.id === id);
		if (!file) return;
		file.status = status;
		if (status === "done") file.progress = 100;
		if (status === "pending") file.progress = 0;
		file.error = status === "error" ? (error ?? "Upload failed") : undefined;
		this.render();
	}

	private describeAll(items: Iterable<DropItem> | FileList | null | undefined): DropFile[] {
		if (!items) return [];
		return Array.from(items as Iterable<DropItem>).map((item) => this.describe(item));
	}

	private describe(item: DropItem): DropFile {
		this.seq += 1;
		const id = `${this.elementId}-f${this.seq}`;
		if (typeof item === "string") {
			const name = baseName(item);
			return { id, name, size: -1, type: inferType(name), path: item, status: "pending", progress: 0 };
		}
		if (typeof File !== "undefined" && item instanceof File) {
			return {
				id,
				name: item.name,
				size: item.size,
				type: item.type || inferType(item.name),
				file: item,
				status: "pending",
				progress: 0,
			};
		}
		const source = item as DropFileDescriptor;
		const name = source.name ?? (source.path ? baseName(source.path) : (source.file?.name ?? "file"));
		return {
			id,
			name,
			size: source.size ?? source.file?.size ?? -1,
			type: source.type ?? source.file?.type ?? inferType(name),
			path: source.path,
			file: source.file,
			status: "pending",
			progress: 0,
		};
	}

	/** The one validation gate every ingress runs through — DOM, picker, paste, or host. */
	private validate(candidate: DropFile, current: DropFile[]): DropRejectReason | null {
		if (this.accept.trim() !== "" && !this.matchesAccept(candidate)) return "type";
		const max = this.maxSize;
		if (max !== undefined && candidate.size >= 0 && candidate.size > max) return "size";
		if (
			current.some(
				(file) => file.name === candidate.name && file.size === candidate.size && file.path === candidate.path,
			)
		) {
			return "duplicate";
		}
		if (current.length >= this.maxFiles) return "count";
		return null;
	}

	private matchesAccept(candidate: DropFile): boolean {
		return this.accept
			.split(",")
			.some((pattern) => matchesPattern(pattern, candidate.name, candidate.type));
	}

	private reject(candidate: DropFile, reason: DropRejectReason): DropRejection {
		return {
			name: candidate.name,
			size: candidate.size,
			type: candidate.type,
			path: candidate.path,
			reason,
			message: this.rejectionMessage(candidate, reason),
		};
	}

	private rejectionMessage(candidate: DropFile, reason: DropRejectReason): string {
		switch (reason) {
			case "type":
				return `${candidate.name} is not an accepted file type (${this.accept}).`;
			case "size": {
				const max = this.maxSize;
				return `${candidate.name} is ${formatBytes(candidate.size)}, over the ${formatBytes(max ?? 0)} limit.`;
			}
			case "duplicate":
				return `${candidate.name} has already been added.`;
			case "count":
				return this.multiple
					? `${candidate.name} was not added — at most ${this.maxFiles} files.`
					: `${candidate.name} was not added — only one file is allowed.`;
			default:
				return `${candidate.name} was not accepted.`;
		}
	}

	private statusLabel(file: DropFile): string {
		switch (file.status) {
			case "uploading":
				return `Uploading ${Math.round(file.progress)}%`;
			case "done":
				return "Uploaded";
			case "error":
				return "Failed";
			default:
				return "Ready";
		}
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.preventDefault) event.preventDefault();
		if (intent.stopPropagation) event.stopPropagation();
		if (intent.activate === "remove" && intent.value) this.removeFile(intent.value);
		else if (intent.activate === "clear") this.clear();
	}

	private get bindings(): Record<string, unknown> {
		const files: DropzoneFileBinding[] = this.state.map((file) => ({
			id: file.id,
			name: file.name,
			size: file.size,
			sizeLabel: formatBytes(file.size),
			type: file.type,
			status: file.status,
			statusLabel: this.statusLabel(file),
			progress: Math.round(file.progress),
			error: file.error,
		}));
		// Only a *structural* change rebuilds the rows: a file added or dropped, or an error line
		// appearing. A status flip and a progress tick are patched in place (class, bar, ARIA, label), so
		// a focused remove button survives an upload running at 60fps.
		const signature = this.state.map((f) => `${f.id}:${f.error ? 1 : 0}`).join(",");
		const rebuildList = signature !== this.listSignature;
		this.listSignature = signature;
		const maxFiles = Number.parseInt(this.getAttribute("max-files") ?? "", 10);
		return dropzoneBindings({
			inputId: this.elementId,
			accept: this.accept,
			multiple: this.multiple,
			disabled: this.disabled,
			maxSize: this.getAttribute("max-size"),
			maxFiles: Number.isFinite(maxFiles) ? maxFiles : null,
			prompt: this.getAttribute("prompt"),
			hint: this.getAttribute("hint"),
			browseLabel: this.getAttribute("browse-label"),
			dragging: this.hasAttribute("dragging"),
			rejecting: this.hasAttribute("rejecting"),
			slotted: this.fragment.hasSlotted(),
			files,
			rejections: this.rejected.map((r) => ({ name: r.name, reason: r.reason, message: r.message })),
			rebuildList,
		});
	}

	protected override render(): void {
		this.classList.add("xtyle-dropzone");
		this.classList.toggle("xtyle-dropzone--disabled", this.disabled);
		this.classList.toggle("xtyle-dropzone--dragging", this.hasAttribute("dragging"));
		this.classList.toggle("xtyle-dropzone--invalid", this.rejected.length > 0);
		this.adoptComponentSheet();
		this.fragment.ensureScaffold("");
		this.fragment.update(this.bindings);
		this.syncInput();
	}

	/**
	 * The `<input type="file">` is plumbing, not chrome: it never renders (it is the visually-hidden
	 * keyboard and screen-reader path the surface `<label>` points at), so it stays out of the fill and
	 * is appended to the host itself, where a `<form>` collects it. Its `.files` is rebuilt from the
	 * accepted list on every mutation, so a programmatic drop, a paste, and a rejected pick all leave
	 * the form value telling the truth.
	 */
	private syncInput(): void {
		if (!this.fileInput) {
			this.fileInput = document.createElement("input");
			this.fileInput.type = "file";
			this.fileInput.className = "xtyle-dropzone__input";
			this.fileInput.id = this.elementId;
			this.fileInput.addEventListener("change", this.onPick);
		}
		const input = this.fileInput;
		input.multiple = this.multiple;
		input.disabled = this.disabled;
		input.required = this.hasAttribute("required") && this.state.length === 0;
		if (this.accept) input.setAttribute("accept", this.accept);
		else input.removeAttribute("accept");
		const name = this.getAttribute("name");
		if (name) input.setAttribute("name", name);
		else input.removeAttribute("name");
		input.setAttribute("aria-label", this.getAttribute("label") || "Upload files");
		input.setAttribute("aria-describedby", `${this.elementId}-hint`);
		if (input.parentNode !== (this as ParentNode)) this.appendChild(input);
		this.syncInputFiles(input);
	}

	private syncInputFiles(input: HTMLInputElement): void {
		if (typeof DataTransfer === "undefined") return;
		const backing = this.state.filter((file) => file.file).map((file) => file.file as File);
		if (backing.length === input.files?.length && backing.every((file, i) => input.files?.[i] === file)) return;
		try {
			const transfer = new DataTransfer();
			for (const file of backing) transfer.items.add(file);
			input.files = transfer.files;
		} catch {
			// A host without a constructible DataTransfer (older WebViews) keeps whatever the picker set;
			// the accepted list and the events are still authoritative, only the raw form value goes stale.
		}
	}

	private focusAfterRemove(index: number): void {
		const buttons = [...this.querySelectorAll<HTMLButtonElement>("[data-remove]")];
		const next = buttons[Math.min(index, buttons.length - 1)];
		if (next) next.focus();
		else this.fileInput?.focus();
	}

	private emitChange(): void {
		this.dispatchEvent(new CustomEvent("change", { detail: { files: this.files }, bubbles: true, composed: true }));
	}

	/** Whether the drag hovering the zone carries only files this zone would refuse, so the surface can say
	 * so before the drop lands. Mid-drag the browser exposes each item's *type* but never its name, so the
	 * preview is only honest when every `accept` pattern is a mime pattern; an extension pattern could
	 * still match a name we can't see yet, so the zone stays neutral rather than lying. */
	private rejectsTransfer(transfer: DataTransfer | null): boolean {
		const patterns = this.accept
			.split(",")
			.map((pattern) => pattern.trim())
			.filter(Boolean);
		if (!transfer || patterns.length === 0 || patterns.some((pattern) => pattern.startsWith("."))) return false;
		const types = [...transfer.items]
			.filter((item) => item.kind === "file")
			.map((item) => item.type)
			.filter((type) => type !== "");
		if (types.length === 0) return false;
		return types.every((type) => !patterns.some((pattern) => matchesPattern(pattern, "", type)));
	}

	private onDragEnter = (event: DragEvent): void => {
		if (this.disabled) return;
		event.preventDefault();
		this.dragDepth += 1;
		this.setDragging(true, this.rejectsTransfer(event.dataTransfer));
	};

	private onDragOver = (event: DragEvent): void => {
		if (this.disabled) return;
		event.preventDefault();
		const bad = this.rejectsTransfer(event.dataTransfer);
		if (event.dataTransfer) event.dataTransfer.dropEffect = bad ? "none" : "copy";
		this.setDragging(true, bad);
	};

	private onDragLeave = (): void => {
		this.dragDepth = Math.max(0, this.dragDepth - 1);
		if (this.dragDepth === 0) this.setDragging(false);
	};

	private onDrop = (event: DragEvent): void => {
		if (this.disabled) return;
		event.preventDefault();
		this.dragDepth = 0;
		this.setDragging(false);
		const files = event.dataTransfer?.files;
		if (files && files.length > 0) this.addFiles(files, "dom");
	};

	private onPick = (event: Event): void => {
		// The input's own `change` bubbles, and it would surface on the host as a second, detail-less
		// `change` alongside the one `addFiles` emits. Stop it here: the zone speaks with one voice.
		event.stopPropagation();
		const picked = this.fileInput?.files;
		if (!picked || picked.length === 0) return;
		// The picker's own list is the raw ask; ingest it through the same gate as every other source and
		// let `syncInputFiles` write the *accepted* subset back, so a rejected pick can't post through the form.
		this.addFiles(Array.from(picked), "picker");
	};

	/**
	 * Paste-to-upload. The `paste` event only fires at the focused node, so the zone listens on the
	 * document and decides whether the paste is *its* to claim: it is when focus is inside the zone;
	 * it is not when the user is pasting into a text field; and with several paste-enabled zones on a
	 * page and focus in none of them, nobody claims it rather than every zone taking the same file.
	 */
	private onPaste = (event: ClipboardEvent): void => {
		if (this.disabled || !this.pasteEnabled) return;
		const files = event.clipboardData?.files;
		if (!files || files.length === 0) return;
		const active = this.ownerDocument.activeElement;
		if (!(active && this.contains(active))) {
			if (isTextEntry(active)) return;
			const zones = this.ownerDocument.querySelectorAll("xtyle-dropzone[paste]:not([disabled])");
			if (zones.length !== 1) return;
		}
		event.preventDefault();
		this.addFiles(Array.from(files), "paste");
	};

	/**
	 * Open the picker for a click anywhere on the zone's chrome. A `<label>` surface already does this
	 * natively (and works with no JavaScript at all), so a click that passed through one is left alone;
	 * a mod that draws its surface as something else still gets the picker from here. Clicks on the
	 * element's own controls (the file input, a remove or clear button) are theirs.
	 */
	private onClick = (event: MouseEvent): void => {
		if (this.disabled) return;
		const owned = event.composedPath().some(
			(node) =>
				node instanceof HTMLElement &&
				(node === this.fileInput ||
					node.tagName === "LABEL" ||
					node.hasAttribute("data-remove") ||
					node.hasAttribute("data-clear")),
		);
		if (owned) return;
		this.fileInput?.click();
	};

	private bind(): void {
		if (this.bound) return;
		this.bound = true;
		this.addEventListener("dragenter", this.onDragEnter);
		this.addEventListener("dragover", this.onDragOver);
		this.addEventListener("dragleave", this.onDragLeave);
		this.addEventListener("drop", this.onDrop);
		this.addEventListener("click", this.onClick);
		this.ownerDocument.addEventListener("paste", this.onPaste);
	}

	private unbind(): void {
		if (!this.bound) return;
		this.bound = false;
		this.removeEventListener("dragenter", this.onDragEnter);
		this.removeEventListener("dragover", this.onDragOver);
		this.removeEventListener("dragleave", this.onDragLeave);
		this.removeEventListener("drop", this.onDrop);
		this.removeEventListener("click", this.onClick);
		this.ownerDocument.removeEventListener("paste", this.onPaste);
	}
}

define("xtyle-dropzone", XtyleDropzone);
