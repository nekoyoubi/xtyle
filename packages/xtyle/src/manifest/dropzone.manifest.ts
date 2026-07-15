import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-dropzone
	label="Upload attachments"
	accept="image/*,.pdf"
	max-size="5mb"
	max-files="5"
	multiple
	paste
	name="attachments"></xtyle-dropzone>

<script type="module">
	import "@xtyle/core/elements";
	import { routeNativeDrop } from "@xtyle/core/elements/dropzone.js";

	const zone = document.querySelector("xtyle-dropzone");

	// The DOM drop is only ONE input. In a native shell (Tauri, Electron) the OS hands the drop to the
	// webview, so \`dragover\` / \`drop\` never fire — drive the same zone programmatically instead.
	// \`addFiles\` takes File objects, filesystem paths, or descriptors, and validates all of them the same way.
	zone.addFiles(["C:/shots/hero.png", "C:/docs/brief.pdf"]);

	// …or let a shell's own drag events route themselves to whichever zone is under the pointer:
	// import { getCurrentWebview } from "@tauri-apps/api/webview";
	// getCurrentWebview().onDragDropEvent(({ payload }) => {
	//   const at = payload.position && {
	//     x: payload.position.x / devicePixelRatio,
	//     y: payload.position.y / devicePixelRatio,
	//   };
	//   if (payload.type === "over") routeNativeDrop("over", { ...at });
	//   else if (payload.type === "drop") routeNativeDrop("drop", { ...at, items: payload.paths });
	//   else routeNativeDrop("leave", {});
	// });

	zone.addEventListener("file-drop", async (event) => {
		for (const file of event.detail.accepted) {
			zone.setProgress(file.id, 0);
			await upload(file, (percent) => zone.setProgress(file.id, percent));
			zone.setStatus(file.id, "done");
		}
	});

	zone.addEventListener("file-reject", (event) => {
		console.warn(event.detail.rejected.map((r) => r.message));
	});

	zone.addEventListener("file-remove", (event) => {
		cancelUpload(event.detail.file.id);
	});
</script>`;

const svelteExample = `<script lang="ts">
	import { Dropzone } from "@xtyle/svelte";
	import type { XtyleDropzone } from "@xtyle/core/elements";

	let zone = $state<XtyleDropzone>();

	// The programmatic path is the same one a native shell drives: paths in, validated files out.
	function onNativeDrop(paths: string[]) {
		zone?.addFiles(paths);
	}

	async function onDrop(event: CustomEvent) {
		for (const file of event.detail.accepted) {
			await upload(file, (percent: number) => zone?.setProgress(file.id, percent));
			zone?.setStatus(file.id, "done");
		}
	}
</script>

<Dropzone
	bind:element={zone}
	label="Upload attachments"
	accept="image/*,.pdf"
	maxSize="5mb"
	maxFiles={5}
	multiple
	paste
	name="attachments"
	onfiledrop={onDrop}
	onfilereject={(event) => console.warn(event.detail.rejected)} />`;

const astroExample = `---
import Dropzone from "@xtyle/astro/Dropzone.astro";
---

<!-- Server-rendered: the surface, the hint, the browse chip, and the real file input all ship in the
     HTML, so the zone is a working picker and form field before a byte of JavaScript arrives. -->
<Dropzone
	label="Upload attachments"
	accept="image/*,.pdf"
	maxSize="5mb"
	maxFiles={5}
	multiple
	paste
	name="attachments"
	prompt="Drop your files here"
	hint="Images and PDFs, up to 5 MB each" />

<!-- \`static\` keeps the server render and never loads the runtime: a plain file field in a plain form,
     zero JS. Drag-and-drop, paste, and the upload list are what hydration buys you. -->
<Dropzone static name="resume" label="Attach a résumé" accept=".pdf,.docx" />

<script>
	import "@xtyle/core/elements";
	import { routeNativeDrop } from "@xtyle/core/elements/dropzone.js";

	const zone = document.querySelector("xtyle-dropzone");

	// A native (OS) drop never reaches the DOM inside a shell webview; route it in by hand.
	zone?.addFiles(["/tmp/report.pdf"]);
	zone?.addEventListener("file-drop", (event) => console.log(event.detail.accepted));
</script>`;

export const dropzoneManifest: ComponentManifest = {
	id: "dropzone",
	name: "Dropzone",
	since: "0.8.0",
	category: "form",
	keywords: ["file upload", "drop target", "drag and drop", "attachment", "file picker", "uploader"],
	seeAlso: ["field", "progress", "alert"],
	summary:
		"A file drop target with a programmatic ingress a native host can drive, validation, a rejection surface, paste-to-upload, and a per-file upload list.",
	description:
		"Dropzone takes files — by drag-and-drop, by keyboard through a real `<input type=\"file\">`, by paste, or **programmatically**. That last one is the point. Inside a native shell (Tauri, Electron, WebView2) the operating system hands a file drop to the *webview*, not to the document, so DOM `dragover` / `drop` never fire and a DOM-only drop target is silently inert in exactly the desktop apps this library exists to serve. So the DOM listener here is one input, not *the* input: `addFiles(items)` is the public seam every ingress runs through, and it takes `File` objects, bare **filesystem paths** (what a native drop actually gives you — there is no `File` behind them), or descriptors carrying whatever the host knows. `setDragging(active, rejecting)` drives the hover and reject skins from a host that owns the drag, and `routeNativeDrop(state, { x, y, items })` wires a shell's own drag events straight through to whichever zone sits under the pointer. Everything is validated identically no matter where it came from: `accept` by extension or mime (a path-only file has its type inferred from its extension), `max-size` per file (`5mb`, `500kb`, or bytes), `max-files` by count, plus duplicate rejection — and every failure lands on a real error surface with a human message, not a silent drop. Every batch reports itself: `file-drop` carries what was accepted, what was refused, and which ingress it came through; `file-reject` carries the refusals alone; `file-remove` fires when a row is dropped; and `change` fires whenever the accepted list moves. Accepted files render as an upload list with a per-file bar the host drives (`setProgress`, `setStatus`) and a remove button; `removeFile(id)` moves focus to the next row. Keyboard and screen-reader access is not an afterthought: a real, focusable `<input type=\"file\">` sits under the surface as the keyboard path and as the `<form>` value, and the accepted list is written back to it so a rejected file can never post. It server-renders whole, too — the `@xtyle/astro` binding emits the resolved surface, the derived hint, and that file input, so the zone is a working picker and form field before any JavaScript loads (and stays one, with `static`, if none ever does). The surface, its idle / hover / reject / disabled states, the rejection list, and the upload rows are all the fill's markup (`component.dropzone`) — a mod reshapes every one of them while the element keeps the drop logic.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "root",
			description: "The host element: the drop target, the hit-test box a native host resolves a pointer against, and the class hook for the dragging / disabled / invalid states.",
			selector: ".xtyle-dropzone",
			tokens: ["--font-sans"],
		},
		{
			name: "surface",
			description:
				"The drop surface the fill draws, as a `<label>` pointing at the hidden file input — so a click or a tap opens the picker with no JavaScript at all. Carries the idle, dragging, rejecting, and disabled skins.",
			selector: ".xtyle-dropzone__surface",
			tokens: ["--bg-1", "--line-2", "--border-thick", "--radius-md", "--fg-2", "--state-hover", "--accent"],
		},
		{
			name: "icon",
			description: "The upload glyph the fill draws inside the surface. A real node in the fill, so a mod can swap or drop it.",
			selector: ".xtyle-dropzone__icon",
			tokens: ["--fg-3", "--text-2xl"],
		},
		{
			name: "prompt",
			description: "The headline inside the surface (`prompt`, default `Drop files here`). Also the default slot: give the element children and they become the prompt instead.",
			selector: ".xtyle-dropzone__prompt",
			tokens: ["--fg-0", "--text-body", "--weight-medium"],
		},
		{
			name: "hint",
			description: "The constraint line under the prompt. Written from `hint`, or derived from `accept` / `max-size` / `max-files` when unset. The file input's `aria-describedby` points at it.",
			selector: ".xtyle-dropzone__hint",
			tokens: ["--fg-2", "--text-xs"],
		},
		{
			name: "browse",
			description: "The faux browse chip. Presentational (`aria-hidden`) — the surface `<label>` is what actually opens the picker, so this is never a second tab stop.",
			selector: ".xtyle-dropzone__browse",
			tokens: ["--bg-0", "--line", "--border-thin", "--radius-sm", "--fg-1", "--text-sm"],
		},
		{
			name: "errors",
			description: "The rejection surface: a `role=\"alert\"` list, one human message per refused file (wrong type, over the size limit, over the count, already added).",
			selector: ".xtyle-dropzone__errors",
			tokens: ["--danger-bg", "--danger-text", "--radius-sm", "--text-sm"],
		},
		{
			name: "list",
			description: "The upload list, an `aria-live=\"polite\"` region so an added or removed file is announced.",
			selector: ".xtyle-dropzone__list",
			tokens: ["--space-2"],
		},
		{
			name: "file",
			description: "One upload row: glyph, name, size and status, remove button, and the progress bar. Rows are patched in place on a progress tick, so focus survives an upload.",
			selector: ".xtyle-dropzone__file",
			tokens: ["--bg-1", "--line", "--border-thin", "--radius-sm", "--fg-0", "--text-sm"],
		},
		{
			name: "track",
			description: "One file's progress groove, a `role=\"progressbar\"` the host drives through `setProgress()`. Its fill turns success-colored when done and danger-colored on a failed upload.",
			selector: ".xtyle-dropzone__track",
			tokens: ["--neutral-bg", "--accent", "--success", "--danger", "--radius-full"],
		},
		{
			name: "remove",
			description: "A row's remove button. Removing moves focus to the next row's button (or back to the field), so a keyboard user is never dropped to the top of the page.",
			selector: ".xtyle-dropzone__remove",
			tokens: ["--fg-2", "--state-hover", "--ring", "--radius-sm"],
		},
		{
			name: "input",
			description:
				"The real `<input type=\"file\">` — plumbing, not chrome: visually hidden but focusable, it is the keyboard and screen-reader path and the value a `<form>` submits. It stays in the element (never the fill) because a mod cannot see it, and its `.files` is rebuilt from the *accepted* list on every change, so a rejected file cannot post. The Astro binding server-renders it (a zero-JS zone still has to pick and post files), and the element adopts that input — and its id, which the rendered surface already points at — instead of minting a second one on upgrade.",
			selector: ".xtyle-dropzone__input",
			tokens: [],
		},
	],
	props: [
		{
			name: "accept",
			type: "string",
			description:
				"Comma-separated extensions (`.png`) and mime patterns (`image/*`, `application/pdf`). A file dropped as a bare path has no mime, so its type is inferred from its extension before matching.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "multiple",
			type: "boolean",
			default: "false",
			description: "Hold more than one file. Without it the zone holds exactly one, and a new accepted file replaces it (the native file-input contract).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "maxSize",
			type: "string | number",
			description: "Per-file byte ceiling: `5mb`, `500kb`, or a raw byte count. A file whose size is unknown (a native path the host hasn't stat'd) passes rather than being guessed at. Attribute is `max-size`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "maxFiles",
			type: "number",
			description: "How many files the zone will hold. Attribute is `max-files`; ignored without `multiple` (which pins it to 1).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "paste",
			type: "boolean",
			default: "false",
			description: "Ctrl/Cmd+V of a file or a screenshot adds it. The zone claims a paste when focus is inside it, and never steals one aimed at a text field.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "name",
			type: "string",
			description: "Form field name. Set it and the accepted files post through the hidden file input on a normal form submit.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "required",
			type: "boolean",
			default: "false",
			description: "Blocks form submission until at least one file is accepted.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			default: "Upload files",
			description: "The accessible name of the file input — what a screen reader announces on focus.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "prompt",
			type: "string",
			default: "Drop files here",
			description: "The headline on the surface. Slotted children override it.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "hint",
			type: "string",
			description: "The constraint line. Defaults to a line derived from `accept`, `max-size`, and `max-files`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "browseLabel",
			type: "string",
			default: "or browse",
			description: "Text on the faux browse chip. Attribute is `browse-label`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Refuses every ingress — DOM drop, picker, paste, and the programmatic path alike.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "dragging",
			type: "boolean",
			default: "false",
			description:
				"The hover state. Set by the DOM listeners *and* by `setDragging()`, which is how a native host (whose OS drag never fires `dragover`) shows the same skin. Pair with `rejecting` for the refuse-preview.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "static",
			type: "boolean",
			default: "false",
			description:
				"Astro only: keep the server-rendered surface and the real file input, but never load the runtime to hydrate them — a plain, working file field in a plain form with zero JavaScript. Drag-and-drop, paste, the rejection surface, and the upload list are what hydration adds. The Svelte and raw-element paths always upgrade, so they carry no equivalent.",
			bindings: ["astro"],
		},
		{
			name: "onfiledrop",
			type: "(event: CustomEvent) => void",
			description:
				"Svelte only: every batch, whatever ingress it came through (`detail: { accepted, rejected, files, source }`). The raw element and the Astro path listen for the `file-drop` event itself; `file-reject` (`onfilereject`), `file-remove` (`onfileremove`), and `change` (`onchange`) are the rest of the set.",
			bindings: ["svelte"],
		},
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "dragging",
			description: "A drag is over the zone and would be accepted: the surface goes solid and accent-colored. Reachable from a DOM drag or from `setDragging(true)`.",
			selector: ".xtyle-dropzone__surface--dragging",
			tokens: ["--accent", "--accent-bg", "--accent-text"],
		},
		{
			name: "rejecting",
			description: "The drag carries only files the zone would refuse, so it says so *before* the drop: a danger-colored surface and `dropEffect: none`. Only previewed when every `accept` pattern is a mime pattern — mid-drag a browser exposes types but not names, so an extension rule stays honest by staying neutral.",
			selector: ".xtyle-dropzone__surface--rejecting",
			tokens: ["--danger", "--danger-bg", "--danger-text"],
		},
		{
			name: "disabled",
			description: "Every ingress refused; the surface goes muted and un-clickable and the file input is disabled.",
			selector: ".xtyle-dropzone__surface--disabled",
			tokens: ["--fg-disabled", "--state-disabled", "--line"],
		},
		{
			name: "focus-visible",
			description: "Keyboard focus on the hidden file input draws the ring on the visible surface, so the tab stop is never invisible.",
			selector: ".xtyle-dropzone:has(.xtyle-dropzone__input:focus-visible) .xtyle-dropzone__surface",
			tokens: ["--ring", "--border-thick"],
		},
		{
			name: "file-error",
			description: "A row whose upload failed (`setStatus(id, \"error\", message)`): danger border, danger bar, and the message under the name.",
			selector: ".xtyle-dropzone__file--error",
			tokens: ["--danger", "--danger-text"],
		},
		{
			name: "file-done",
			description: "A finished upload: the bar goes success-colored at 100%.",
			selector: ".xtyle-dropzone__file--done",
			tokens: ["--success"],
		},
	],
	slots: [
		{
			name: "default",
			description: "Custom prompt content inside the surface, replacing the `prompt` text. Use it for a richer pitch (an icon row, a link, a policy note).",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--accent",
		"--accent-bg",
		"--accent-text",
		"--bg-0",
		"--bg-1",
		"--border-thick",
		"--border-thin",
		"--danger",
		"--danger-bg",
		"--danger-text",
		"--duration-fast",
		"--ease-standard",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--fg-3",
		"--fg-disabled",
		"--font-mono",
		"--font-sans",
		"--line",
		"--line-2",
		"--neutral-bg",
		"--radius-full",
		"--radius-md",
		"--radius-sm",
		"--ring",
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-4",
		"--space-7",
		"--state-disabled",
		"--state-hover",
		"--success",
		"--text-2xl",
		"--text-body",
		"--text-sm",
		"--text-xs",
		"--weight-medium",
	],
	composition: [
		"In a Tauri or Electron app, wire the shell's own drag/drop event to `routeNativeDrop()` (or call `zone.addFiles(paths)` directly) — the OS drop never reaches the DOM, so a zone that only listens for `drop` will do nothing at all there.",
		"Drive the upload yourself: listen for `file-drop`, push each accepted file, and report back with `setProgress(id, percent)` and `setStatus(id, \"done\" | \"error\", message)`. The component owns the surface and the list; the transport is yours.",
		"Pair `accept` with `max-size` and let the hint write itself — the constraint line is derived from the rules you actually set, so it can't drift from them.",
		"Set `name` and drop it in a `<form>`: the accepted files ride the hidden input on a normal submit, and a rejected file is written out of it.",
		"Add `paste` for a screenshot workflow: Ctrl+V lands the clipboard image straight in the zone.",
		"On the Astro path the zone ships rendered — surface, hint, browse chip, and the real file input — so it picks and posts files before the runtime lands. `static` makes that the whole story: a working file field with no JavaScript at all, for a form that never needed the drag-and-drop half.",
		"In Svelte, the events are props: `onfiledrop`, `onfilereject`, `onfileremove`, and `onchange`. Elsewhere they are plain DOM events (`file-drop`, `file-reject`, `file-remove`, `change`) that bubble, so a form can listen once at the top instead of per zone.",
		"The surface and the upload rows are the fill's markup: a mod filling `component.dropzone` can rebuild them as a compact inline strip, a thumbnail grid, or a table, and the drop logic, validation, keys, and form value all keep working.",
	],
	a11y: [
		"The keyboard path is a real, focusable `<input type=\"file\">` under the surface — a drop target that only answers a mouse is not accessible. It carries the accessible name (`label`) and is described by the hint line; the visible surface is its `<label>`, so pointer clicks open the picker natively and the focus ring is drawn on the surface the user can actually see.",
		"The faux browse chip is `aria-hidden` and never focusable, so the zone is exactly one tab stop, not two that do the same thing.",
		"Rejections land in a `role=\"alert\"` list with a human message per file, so a refused drop is announced rather than silently swallowed.",
		"The upload list is an `aria-live=\"polite\"` region, and each row's bar is a `role=\"progressbar\"` with `aria-valuenow` kept in sync as the host reports progress.",
		"Removing a file moves focus to the next row's remove button, or back to the field when the list empties — focus is never dropped to the document.",
		"Mid-drag the surface states are carried by text and border weight as well as color, and the refuse state also sets `dropEffect: none`, so the cursor says no even where color doesn't read.",
	],
	examples: [
		{
			id: "native-and-dom-drops",
			title: "Native drops, validation, and a driven upload list",
			description:
				"A validated, multi-file zone that accepts a DOM drop, a paste, a keyboard pick — and a programmatic drop from a native host, which is the only path that works inside a Tauri webview. Rejections surface with reasons; accepted files get a bar the host drives.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
