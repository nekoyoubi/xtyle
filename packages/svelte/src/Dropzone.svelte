<script lang="ts">
	import "@xtyle/core/elements/dropzone.js";
	import type { DropFile, DropFileStatus, DropItem, DropRejection, DropResult, DropSource } from "@xtyle/core/elements";

	type FileDropEvent = CustomEvent<{
		accepted: DropFile[];
		rejected: DropRejection[];
		files: DropFile[];
		source: DropSource;
	}>;
	type FileRejectEvent = CustomEvent<{ rejected: DropRejection[] }>;
	type FileRemoveEvent = CustomEvent<{ file: DropFile }>;

	interface Props {
		/** Comma-separated extensions (`.png`) and mime patterns (`image/*`). */
		accept?: string;
		/** Hold more than one file. Without it a new accepted file replaces the current one. */
		multiple?: boolean;
		/** Per-file byte ceiling: `5mb`, `500kb`, or a raw byte count. */
		maxSize?: string | number;
		/** How many files the zone will hold (needs `multiple`). */
		maxFiles?: number;
		/** Ctrl/Cmd+V of a file or screenshot adds it. */
		paste?: boolean;
		/** Form field name; the accepted files post through the hidden file input. */
		name?: string;
		required?: boolean;
		disabled?: boolean;
		/** Accessible name of the file input. */
		label?: string;
		/** Headline on the surface. */
		prompt?: string;
		/** Constraint line; derived from `accept` / `maxSize` / `maxFiles` when unset. */
		hint?: string;
		/** Text on the faux browse chip. */
		browseLabel?: string;
		/** The hover skin. A native host drives this itself (an OS drag never fires `dragover`). */
		dragging?: boolean;
		/** Every batch, whatever ingress it came in through (`detail: { accepted, rejected, files, source }`). */
		onfiledrop?: (event: FileDropEvent) => void;
		/** Fires when a batch lost files to validation (`detail: { rejected }`). */
		onfilereject?: (event: FileRejectEvent) => void;
		/** Fires when a file is dropped from the list (`detail: { file }`). */
		onfileremove?: (event: FileRemoveEvent) => void;
		/** Fires whenever the accepted list moved (`detail: { files }`) — an add, a removal, a clear. */
		onchange?: (event: Event) => void;
		/** The live element, for the programmatic drop path: `element.addFiles(paths)`. */
		element?: XtyleDropzoneElement;
		children?: import("svelte").Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	type XtyleDropzoneElement = HTMLElement & {
		readonly files: DropFile[];
		addFiles(items: Iterable<DropItem> | FileList | null | undefined, source?: DropSource): DropResult;
		setDragging(dragging: boolean, rejecting?: boolean): void;
		setProgress(id: string, progress: number): void;
		setStatus(id: string, status: DropFileStatus, error?: string): void;
		removeFile(id: string): void;
		clear(): void;
	};

	let {
		accept,
		multiple = false,
		maxSize,
		maxFiles,
		paste = false,
		name,
		required = false,
		disabled = false,
		label,
		prompt,
		hint,
		browseLabel,
		dragging = false,
		onfiledrop,
		onfilereject,
		onfileremove,
		onchange,
		element = $bindable(),
		children,
		...rest
	}: Props = $props();

	let el: XtyleDropzoneElement | undefined = $state();

	$effect(() => {
		element = el;
	});

	// `file-drop` / `file-reject` / `file-remove` are hyphenated custom events, so they can't ride a
	// Svelte `on…` prop; attach them directly and re-dispatch to the current handlers, kept live across
	// handler swaps.
	$effect(() => {
		const node = el;
		if (!node) return;
		const drop = (event: Event): void => onfiledrop?.(event as FileDropEvent);
		const reject = (event: Event): void => onfilereject?.(event as FileRejectEvent);
		const remove = (event: Event): void => onfileremove?.(event as FileRemoveEvent);
		node.addEventListener("file-drop", drop);
		node.addEventListener("file-reject", reject);
		node.addEventListener("file-remove", remove);
		return () => {
			node.removeEventListener("file-drop", drop);
			node.removeEventListener("file-reject", reject);
			node.removeEventListener("file-remove", remove);
		};
	});

	/** Hand the zone files from anywhere — a native OS drop's paths, a resumed upload, a test. */
	export function addFiles(items: Iterable<DropItem> | FileList, source: DropSource = "host"): DropResult | undefined {
		return el?.addFiles(items, source);
	}

	/** Drive the hover / reject skins from a host that owns the drag. */
	export function setDragging(active: boolean, rejecting = false): void {
		el?.setDragging(active, rejecting);
	}

	export function setProgress(id: string, progress: number): void {
		el?.setProgress(id, progress);
	}

	export function setStatus(id: string, status: DropFileStatus, error?: string): void {
		el?.setStatus(id, status, error);
	}

	/** Drop one file from the list. Named `removeFile` — `remove()` belongs to the DOM. */
	export function removeFile(id: string): void {
		el?.removeFile(id);
	}

	export function clear(): void {
		el?.clear();
	}
</script>

<xtyle-dropzone
	bind:this={el}
	{...rest}
	{accept}
	{name}
	{label}
	{prompt}
	{hint}
	{onchange}
	max-size={maxSize === undefined ? undefined : String(maxSize)}
	max-files={maxFiles === undefined ? undefined : String(maxFiles)}
	browse-label={browseLabel}
	multiple={multiple || undefined}
	paste={paste || undefined}
	required={required || undefined}
	disabled={disabled || undefined}
	dragging={dragging || undefined}>{@render children?.()}</xtyle-dropzone>
