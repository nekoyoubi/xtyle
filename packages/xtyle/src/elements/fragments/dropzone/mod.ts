interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, value: string): void;
	toggle(selector: string, condition: boolean): void;
}

interface DropzoneFile {
	/** Stable per-file key the element mints; the row, its bar, and its remove button all key off it. */
	id: string;
	name: string;
	/** Bytes, or `-1` when the source (a native path) never told us. */
	size: number;
	/** Already formatted by the element (`1.2 MB`, `—`), so the row needs no math. */
	sizeLabel: string;
	type: string;
	status: string;
	statusLabel: string;
	/** `0..100`. */
	progress: number;
	error?: string;
}

interface DropzoneRejection {
	name: string;
	reason: string;
	message: string;
}

interface DropzoneBindings {
	inputId?: string;
	hintId?: string;
	prompt?: string;
	hint?: string;
	browseLabel?: string;
	/** The consumer filled the default slot, so the prompt region is theirs and the fill leaves it alone. */
	slotted?: boolean;
	dragging?: boolean;
	rejecting?: boolean;
	disabled?: boolean;
	files?: DropzoneFile[];
	rejections?: DropzoneRejection[];
	removeLabel?: string;
	clearLabel?: string;
	countLabel?: string;
	/** The element flips this when the *set* of files changed; a progress tick alone leaves it false so
	 * the rows are patched in place and focus survives an upload. */
	rebuildList?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: DropzoneBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

interface EventPayload {
	dataset?: { [k: string]: string | undefined };
	disabled?: boolean;
}

interface Intent {
	activate?: string;
	value?: string;
	preventDefault?: boolean;
	stopPropagation?: boolean;
}

const UPLOAD_ICON =
	'<svg viewBox="0 0 24 24" width="1.4em" height="1.4em" focusable="false">' +
	'<path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ' +
	'd="M12 15V4m0 0L8 8m4-4 4 4M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>';

const FILE_ICON =
	'<svg viewBox="0 0 24 24" width="1em" height="1em" focusable="false" aria-hidden="true">' +
	'<path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" ' +
	'd="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7l-4-4Zm0 0v4h4"/></svg>';

const REMOVE_ICON =
	'<svg viewBox="0 0 24 24" width="1em" height="1em" focusable="false" aria-hidden="true">' +
	'<path fill="currentColor" d="m12 10.6 5-5 1.4 1.4-5 5 5 5L17 18.4l-5-5-5 5L5.6 17l5-5-5-5L7 5.6l5 5Z"/></svg>';

function esc(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function surfaceClass(b: DropzoneBindings): string {
	let cls = "xtyle-dropzone__surface";
	if (b.disabled) cls += " xtyle-dropzone__surface--disabled";
	else if (b.rejecting) cls += " xtyle-dropzone__surface--rejecting";
	else if (b.dragging) cls += " xtyle-dropzone__surface--dragging";
	return cls;
}

function rowClass(file: DropzoneFile): string {
	return `xtyle-dropzone__file xtyle-dropzone__file--${file.status}`;
}

function barWidth(file: DropzoneFile): string {
	const pct = file.progress < 0 ? 0 : file.progress > 100 ? 100 : file.progress;
	return `width: ${pct}%`;
}

function rowHtml(file: DropzoneFile, b: DropzoneBindings): string {
	const removeLabel = `${b.removeLabel ?? "Remove"} ${file.name}`;
	const error = file.error
		? `<span class="xtyle-dropzone__file-error" part="file-error" data-error="${esc(file.id)}">${esc(file.error)}</span>`
		: "";
	return (
		`<li class="${rowClass(file)}" part="file" data-file="${esc(file.id)}">` +
		`<span class="xtyle-dropzone__file-icon" part="file-icon">${FILE_ICON}</span>` +
		`<span class="xtyle-dropzone__file-name" part="file-name">${esc(file.name)}</span>` +
		`<span class="xtyle-dropzone__file-meta" part="file-meta">${esc(file.sizeLabel)} · ` +
		`<span data-status="${esc(file.id)}">${esc(file.statusLabel)}</span></span>` +
		`<button type="button" class="xtyle-dropzone__remove" part="remove" data-remove="${esc(file.id)}" ` +
		`aria-label="${esc(removeLabel)}">${REMOVE_ICON}</button>` +
		`<span class="xtyle-dropzone__track" part="track" data-track="${esc(file.id)}" role="progressbar" ` +
		`aria-valuemin="0" aria-valuemax="100" aria-valuenow="${file.progress}" aria-label="${esc(file.name)}">` +
		`<span class="xtyle-dropzone__fill" part="bar" data-bar="${esc(file.id)}" style="${barWidth(file)}"></span>` +
		`</span>` +
		error +
		`</li>`
	);
}

function listHtml(b: DropzoneBindings): string {
	let out = "";
	for (const file of b.files ?? []) out += rowHtml(file, b);
	return out;
}

function errorsHtml(b: DropzoneBindings): string {
	let out = "";
	for (const rejection of b.rejections ?? []) {
		out += `<li part="error" data-reason="${esc(rejection.reason)}">${esc(rejection.message)}</li>`;
	}
	return out;
}

function footHtml(b: DropzoneBindings): string {
	return (
		`<span part="count" data-count>${esc(b.countLabel ?? "")}</span>` +
		`<button type="button" class="xtyle-dropzone__clear" part="clear" data-clear>${esc(b.clearLabel ?? "Clear all")}</button>`
	);
}

/** The surface (its label wiring, its idle / dragging / rejecting / disabled skins), the hint, the faux
 * browse chip, the rejection list, and the upload rows are all drawn here: a mod filling
 * `component.dropzone` reshapes every one of them. The element keeps the behavior — the DOM drop
 * listeners, the host-driven programmatic drop path, validation, paste, and the real `<input type="file">`
 * that carries the keyboard path and the form value. */
function paintChrome(b: DropzoneBindings, ops: OpsBuilder): void {
	const files = b.files ?? [];
	const rejections = b.rejections ?? [];

	ops.setAttr(".xtyle-dropzone__surface", "class", surfaceClass(b));
	ops.setAttr("[data-surface]", "for", b.inputId ?? "");
	ops.setAttr("[data-surface]", "aria-disabled", b.disabled ? "true" : "");
	ops.setText("[data-hint]", b.hint ?? "");
	ops.setAttr("[data-hint]", "id", b.hintId ?? "");
	ops.toggle("[data-hint]", (b.hint ?? "").length > 0);
	ops.setText("[data-browse]", b.browseLabel ?? "");
	// The prompt text lands on the slot's *fallback* node, never on the slot region itself: an op that
	// targets an empty element is the one shape the build-time (string) op-applier can place, so the
	// same op paints the prompt in the server render and in the live DOM.
	if (!b.slotted) ops.setText("[data-prompt-text]", b.prompt ?? "");

	ops.replaceChildren("[data-errors]", errorsHtml(b));
	ops.toggle("[data-errors]", rejections.length > 0);

	ops.toggle("[data-list]", files.length > 0);
	ops.replaceChildren("[data-foot]", footHtml(b));
	ops.toggle("[data-foot]", files.length > 1);
}

hooks.fragment.mount("dropzone", (bindings, ops) => {
	ops.replaceChildren("[data-glyph]", UPLOAD_ICON);
	paintChrome(bindings, ops);
	ops.replaceChildren("[data-list]", listHtml(bindings));
});

hooks.fragment.update("dropzone", (bindings, ops) => {
	paintChrome(bindings, ops);
	if (bindings.rebuildList) ops.replaceChildren("[data-list]", listHtml(bindings));
	for (const file of bindings.files ?? []) {
		const key = `"${file.id}"`;
		ops.setAttr(`[data-file=${key}]`, "class", rowClass(file));
		ops.setAttr(`[data-bar=${key}]`, "style", barWidth(file));
		ops.setAttr(`[data-track=${key}]`, "aria-valuenow", String(file.progress));
		ops.setText(`[data-status=${key}]`, file.statusLabel);
	}
});

xript.exports.register("remove", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	const id = e.dataset?.remove;
	if (!id) return {};
	return { activate: "remove", value: id, preventDefault: true, stopPropagation: true };
});

xript.exports.register("clear", (): Intent => {
	return { activate: "clear", preventDefault: true, stopPropagation: true };
});
