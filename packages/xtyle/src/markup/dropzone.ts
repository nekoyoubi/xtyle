/** Where a batch of files came in from. `host` covers every programmatic path — a native OS drop
 * forwarded by a Tauri/Electron shell, a resumed upload, a test. */
export type DropSource = "dom" | "picker" | "paste" | "host";

export type DropFileStatus = "pending" | "uploading" | "done" | "error";

/** What a host may hand `addFiles()`. A `File` is the browser's own object; a bare string is a
 * filesystem path (what a native OS drop gives you, where no `File` exists); the object form carries
 * whatever the host knows — a path plus a name, a size it stat'd, a mime type it sniffed. */
export type DropItem = File | string | DropFileDescriptor;

export interface DropFileDescriptor {
	name?: string;
	/** Filesystem path, for a native drop that has no `File` behind it. */
	path?: string;
	/** Bytes. Omit (or `-1`) when unknown; the size check then passes rather than guessing. */
	size?: number;
	/** Mime type. Omitted, it is inferred from the extension. */
	type?: string;
	file?: File;
}

export interface DropFile {
	/** Stable key for this entry — what `removeFile`, `setProgress`, and `setStatus` address it by. */
	id: string;
	name: string;
	/** Bytes, or `-1` when the source never told us (a native path the host hasn't stat'd). */
	size: number;
	type: string;
	path?: string;
	/** The real `File`, when the source had one. A native path drop has none. */
	file?: File;
	status: DropFileStatus;
	/** `0..100`. */
	progress: number;
	error?: string;
}

export type DropRejectReason = "type" | "size" | "count" | "duplicate" | "disabled";

export interface DropRejection {
	name: string;
	size: number;
	type: string;
	path?: string;
	reason: DropRejectReason;
	message: string;
}

export interface DropResult {
	accepted: DropFile[];
	rejected: DropRejection[];
}

/** One upload row as the fill sees it: already named, sized, and labelled, so the chrome needs no math. */
export interface DropzoneFileBinding {
	id: string;
	name: string;
	size: number;
	sizeLabel: string;
	type: string;
	status: DropFileStatus;
	statusLabel: string;
	progress: number;
	error?: string;
}

/** One refusal as the fill sees it: the human message, plus the machine reason for a mod that wants to style by it. */
export interface DropzoneRejectionBinding {
	name: string;
	reason: DropRejectReason;
	message: string;
}

/** Everything the dropzone fill draws from. The element fills it from live state; the Astro binding
 * fills it at build with an empty list, so the server-rendered surface matches the element's first paint. */
export interface DropzoneBindingProps {
	/** The hidden file input's id — what the fill's surface `<label for>` points at. */
	inputId: string;
	accept?: string;
	multiple?: boolean;
	disabled?: boolean;
	/** Raw `max-size`: `5mb`, `500kb`, or a byte count. */
	maxSize?: string | number | null;
	/** Raw `max-files`; `null` (or absent) means unlimited under `multiple`. */
	maxFiles?: number | null;
	prompt?: string | null;
	hint?: string | null;
	browseLabel?: string | null;
	dragging?: boolean;
	rejecting?: boolean;
	/** The consumer filled the default slot, so the prompt region is theirs and the fill leaves it alone. */
	slotted?: boolean;
	files?: DropzoneFileBinding[];
	rejections?: DropzoneRejectionBinding[];
	/** Rebuild the rows rather than patching them: the *set* of files changed. */
	rebuildList?: boolean;
}

/** Extension → mime, so a native drop that hands over nothing but `C:\pics\cat.png` still answers an
 * `accept="image/*"` honestly. A miss leaves the type empty, and an empty type only matches an
 * extension pattern. */
const EXT_TYPES: Record<string, string> = {
	apng: "image/apng",
	avif: "image/avif",
	bmp: "image/bmp",
	gif: "image/gif",
	heic: "image/heic",
	ico: "image/x-icon",
	jpeg: "image/jpeg",
	jpg: "image/jpeg",
	png: "image/png",
	svg: "image/svg+xml",
	tif: "image/tiff",
	tiff: "image/tiff",
	webp: "image/webp",
	aac: "audio/aac",
	flac: "audio/flac",
	m4a: "audio/mp4",
	mp3: "audio/mpeg",
	ogg: "audio/ogg",
	opus: "audio/opus",
	wav: "audio/wav",
	avi: "video/x-msvideo",
	mkv: "video/x-matroska",
	mov: "video/quicktime",
	mp4: "video/mp4",
	webm: "video/webm",
	csv: "text/csv",
	htm: "text/html",
	html: "text/html",
	md: "text/markdown",
	txt: "text/plain",
	css: "text/css",
	js: "text/javascript",
	json: "application/json",
	pdf: "application/pdf",
	xml: "application/xml",
	yaml: "application/yaml",
	yml: "application/yaml",
	doc: "application/msword",
	docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	xls: "application/vnd.ms-excel",
	xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	ppt: "application/vnd.ms-powerpoint",
	pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"7z": "application/x-7z-compressed",
	gz: "application/gzip",
	rar: "application/vnd.rar",
	tar: "application/x-tar",
	zip: "application/zip",
};

const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

/** The trailing segment of a path or a name, either separator — a native drop hands over whole paths. */
export function baseName(pathOrName: string): string {
	const cut = Math.max(pathOrName.lastIndexOf("/"), pathOrName.lastIndexOf("\\"));
	return cut === -1 ? pathOrName : pathOrName.slice(cut + 1);
}

export function extensionOf(name: string): string {
	const dot = name.lastIndexOf(".");
	return dot <= 0 ? "" : name.slice(dot + 1).toLowerCase();
}

/** The mime type a bare name implies, so a path-only drop can still be matched against `accept`. */
export function inferType(name: string): string {
	return EXT_TYPES[extensionOf(name)] ?? "";
}

/** `5mb`, `500kb`, `1.5 GB`, or a raw byte count. Returns `undefined` for anything unparseable, so a
 * typo'd limit fails open rather than rejecting every file. */
export function parseByteSize(raw: string | number | null | undefined): number | undefined {
	if (raw === null || raw === undefined) return undefined;
	if (typeof raw === "number") return Number.isFinite(raw) ? Math.round(raw) : undefined;
	const match = /^\s*([\d.]+)\s*(b|kb|mb|gb|tb|k|m|g|t)?\s*$/i.exec(raw);
	if (!match?.[1]) return undefined;
	const value = Number.parseFloat(match[1]);
	if (!Number.isFinite(value)) return undefined;
	const unit = (match[2] ?? "b").toLowerCase();
	const power = { b: 0, k: 1, kb: 1, m: 2, mb: 2, g: 3, gb: 3, t: 4, tb: 4 }[unit] ?? 0;
	return Math.round(value * 1024 ** power);
}

export function formatBytes(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes < 0) return "—";
	let value = bytes;
	let unit = 0;
	while (value >= 1024 && unit < SIZE_UNITS.length - 1) {
		value /= 1024;
		unit += 1;
	}
	const rounded = unit === 0 ? String(value) : value.toFixed(value < 10 ? 1 : 0);
	return `${rounded} ${SIZE_UNITS[unit]}`;
}

/** One `accept` token (`.png`, `image/*`, `application/pdf`, `*`) against a candidate's name and type. */
export function matchesPattern(pattern: string, name: string, type: string): boolean {
	const token = pattern.trim().toLowerCase();
	if (token === "") return false;
	if (token === "*" || token === "*/*") return true;
	if (token.startsWith(".")) return name.toLowerCase().endsWith(token);
	if (token.endsWith("/*")) return type.toLowerCase().startsWith(token.slice(0, -1));
	return type.toLowerCase() === token;
}

/** How many files the zone will hold: unlimited under `multiple` with no ceiling set, and always 1 without it. */
export function dropzoneMaxFiles(multiple: boolean, maxFiles: number | null | undefined): number {
	if (!multiple) return 1;
	return maxFiles !== null && maxFiles !== undefined && Number.isFinite(maxFiles) && maxFiles > 0
		? maxFiles
		: Number.POSITIVE_INFINITY;
}

/** The hint under the prompt when the consumer wrote none: whatever the constraints actually are, so
 * the line cannot drift from the rules it describes. */
export function dropzoneHint(props: Pick<DropzoneBindingProps, "accept" | "multiple" | "maxSize" | "maxFiles">): string {
	const parts: string[] = [];
	const accept = (props.accept ?? "").trim();
	if (accept !== "") {
		parts.push(
			accept
				.split(",")
				.map((token) => token.trim())
				.filter(Boolean)
				.join(", "),
		);
	}
	const max = parseByteSize(props.maxSize ?? null);
	if (max !== undefined) parts.push(`up to ${formatBytes(max)}`);
	const multiple = props.multiple ?? false;
	const count = dropzoneMaxFiles(multiple, props.maxFiles);
	if (multiple && Number.isFinite(count)) parts.push(`${count} files max`);
	return parts.join(" · ");
}

/**
 * The dropzone fill's binding contract, in one place. The custom element calls it on every render with
 * its live file list; the `@xtyle/astro` binding calls it at build with an empty one, so the
 * server-rendered surface is what the element paints on its first frame and hydration patches rather
 * than rebuilds. Pure and DOM-free, so it is safe to import in any environment (SSR included).
 */
export function dropzoneBindings(props: DropzoneBindingProps): Record<string, unknown> {
	const files = props.files ?? [];
	return {
		inputId: props.inputId,
		hintId: `${props.inputId}-hint`,
		prompt: props.prompt ?? "Drop files here",
		hint: props.hint ?? dropzoneHint(props),
		browseLabel: props.browseLabel ?? "or browse",
		slotted: props.slotted ?? false,
		dragging: props.dragging ?? false,
		rejecting: props.rejecting ?? false,
		disabled: props.disabled ?? false,
		multiple: props.multiple ?? false,
		files,
		rejections: props.rejections ?? [],
		removeLabel: "Remove",
		clearLabel: "Clear all",
		countLabel: `${files.length} files`,
		rebuildList: props.rebuildList ?? false,
	};
}
