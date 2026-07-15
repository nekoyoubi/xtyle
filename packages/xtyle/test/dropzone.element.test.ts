// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
// side effect: defines the <xtyle-dropzone> custom element on the happy-dom registry
import { routeNativeDrop, formatBytes, parseByteSize, type DropFile, type XtyleDropzone } from "../src/elements/dropzone.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { dropzoneBindings, dropzoneHint, type DropzoneBindingProps } from "../src/markup/dropzone.js";
import { manifest, fragmentSources } from "../src/elements/fragments/dropzone/source.generated.js";

/** Warm the shared fill so every element render below applies the chrome's ops synchronously. */
beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

function make(attrs: Record<string, string> = {}): XtyleDropzone {
	const el = document.createElement("xtyle-dropzone") as XtyleDropzone;
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	return el;
}

function file(name: string, type = "", bytes = 8): File {
	return new File(["x".repeat(bytes)], name, { type });
}

function surface(el: HTMLElement): HTMLElement {
	return el.querySelector(".xtyle-dropzone__surface") as HTMLElement;
}

function rows(el: HTMLElement): HTMLElement[] {
	return [...el.querySelectorAll<HTMLElement>("[data-file]")];
}

function errors(el: HTMLElement): string[] {
	return [...el.querySelectorAll("[data-reason]")].map((node) => node.textContent ?? "");
}

/** happy-dom has no DragEvent, so hand-build the shape the element actually reads. */
function fireDrop(el: HTMLElement, files: File[]): void {
	const event = new Event("drop", { bubbles: true, cancelable: true }) as Event & { dataTransfer: unknown };
	event.dataTransfer = { files, items: files.map((f) => ({ kind: "file", type: f.type })) };
	el.dispatchEvent(event);
}

function fireDragOver(el: HTMLElement, types: string[]): Event & { dataTransfer: { dropEffect: string } } {
	const event = new Event("dragover", { bubbles: true, cancelable: true }) as Event & {
		dataTransfer: { dropEffect: string; items: unknown[]; files: File[] };
	};
	event.dataTransfer = { dropEffect: "", items: types.map((type) => ({ kind: "file", type })), files: [] };
	el.dispatchEvent(event);
	return event;
}

function firePaste(files: File[]): void {
	const event = new Event("paste", { bubbles: true, cancelable: true }) as Event & { clipboardData: unknown };
	event.clipboardData = { files };
	document.dispatchEvent(event);
}

afterEach(() => {
	document.body.innerHTML = "";
});

describe("byte helpers", () => {
	it("parses human sizes and raw counts, and fails open on nonsense", () => {
		expect(parseByteSize("5mb")).toBe(5 * 1024 ** 2);
		expect(parseByteSize("500kb")).toBe(500 * 1024);
		expect(parseByteSize("1.5 GB")).toBe(Math.round(1.5 * 1024 ** 3));
		expect(parseByteSize("2048")).toBe(2048);
		expect(parseByteSize("banana")).toBeUndefined();
		expect(parseByteSize(null)).toBeUndefined();
	});

	it("formats bytes, and says so when the size is unknown", () => {
		expect(formatBytes(512)).toBe("512 B");
		expect(formatBytes(1536)).toBe("1.5 KB");
		expect(formatBytes(-1)).toBe("—");
	});
});

describe("<xtyle-dropzone> chrome", () => {
	it("renders the fill's surface and points it at the element's hidden file input", () => {
		const el = make({ label: "Upload attachments", name: "docs", accept: "image/*" });
		const input = el.querySelector<HTMLInputElement>("input[type=file]");
		expect(input).not.toBeNull();
		expect(input?.classList.contains("xtyle-dropzone__input")).toBe(true);
		expect(input?.getAttribute("name")).toBe("docs");
		expect(input?.getAttribute("accept")).toBe("image/*");
		expect(input?.getAttribute("aria-label")).toBe("Upload attachments");
		// the keyboard path is a real focusable input the visible surface labels
		expect(surface(el).tagName).toBe("LABEL");
		expect(surface(el).getAttribute("for")).toBe(input?.id);
		expect(input?.getAttribute("aria-describedby")).toBe(el.querySelector("[data-hint]")?.id);
	});

	it("derives the hint from the constraints actually set", () => {
		const el = make({ accept: ".png,.jpg", "max-size": "200kb", "max-files": "3", multiple: "" });
		expect(el.querySelector("[data-hint]")?.textContent).toBe(".png, .jpg · up to 200 KB · 3 files max");
	});

	it("keeps a consumer's own class alongside its own", () => {
		expect(make({ class: "promo" }).classList.contains("promo")).toBe(true);
		expect(make({ class: "promo" }).classList.contains("xtyle-dropzone")).toBe(true);
	});

	it("hides the list, the errors, and the foot until there is something to show", () => {
		const el = make();
		expect((el.querySelector("[data-list]") as HTMLElement).hidden).toBe(true);
		expect((el.querySelector("[data-errors]") as HTMLElement).hidden).toBe(true);
		expect((el.querySelector("[data-foot]") as HTMLElement).hidden).toBe(true);
	});
});

describe("the programmatic drop path (what a native host drives)", () => {
	it("accepts bare filesystem paths — the only thing a native OS drop actually gives you", () => {
		const el = make({ multiple: "" });
		const result = el.addFiles(["C:/shots/hero.png", "/home/me/brief.pdf"]);
		expect(result.accepted.map((f) => f.name)).toEqual(["hero.png", "brief.pdf"]);
		// no File behind a path: the size is unknown, and the type is inferred from the extension
		expect(result.accepted[0]?.size).toBe(-1);
		expect(result.accepted[0]?.type).toBe("image/png");
		expect(result.accepted[0]?.path).toBe("C:/shots/hero.png");
		expect(rows(el)).toHaveLength(2);
		expect(rows(el)[0]?.textContent).toContain("hero.png");
		expect(rows(el)[0]?.textContent).toContain("—");
	});

	it("validates a path-only drop against `accept` by inferring its type from the extension", () => {
		const el = make({ accept: "image/*", multiple: "" });
		const result = el.addFiles(["C:/shots/hero.png", "C:/build/installer.exe"]);
		expect(result.accepted.map((f) => f.name)).toEqual(["hero.png"]);
		expect(result.rejected.map((r) => r.reason)).toEqual(["type"]);
		expect(errors(el)[0]).toContain("installer.exe");
	});

	it("takes File objects, descriptors, and paths through the same gate", () => {
		const el = make({ multiple: "" });
		el.addFiles([file("a.txt", "text/plain"), { name: "b.png", size: 2048 }, "C:/c.pdf"]);
		expect(el.files.map((f) => f.name)).toEqual(["a.txt", "b.png", "c.pdf"]);
		expect(el.files[1]?.size).toBe(2048);
	});

	it("emits file-drop with the source, and change when the list moved", () => {
		const el = make({ multiple: "" });
		const drops: unknown[] = [];
		const changes: unknown[] = [];
		el.addEventListener("file-drop", (e) => drops.push((e as CustomEvent).detail));
		el.addEventListener("change", (e) => changes.push((e as CustomEvent).detail));
		el.addFiles(["C:/a.png"], "host");
		expect(drops).toHaveLength(1);
		expect((drops[0] as { source: string }).source).toBe("host");
		expect(changes).toHaveLength(1);
	});

	it("never lets the hidden input's own change escape as a second, detail-less one", () => {
		const el = make({ multiple: "" });
		const details: unknown[] = [];
		el.addEventListener("change", (e) => details.push((e as CustomEvent).detail));

		const input = el.querySelector<HTMLInputElement>("input[type=file]") as HTMLInputElement;
		input.dispatchEvent(new Event("change", { bubbles: true }));
		expect(details).toEqual([]);

		el.addFiles(["C:/a.png"]);
		expect(details).toHaveLength(1);
		expect((details[0] as { files: DropFile[] }).files.map((f) => f.name)).toEqual(["a.png"]);
	});

	it("refuses every ingress while disabled", () => {
		const el = make({ disabled: "", multiple: "" });
		expect(el.addFiles(["C:/a.png"]).accepted).toEqual([]);
		expect(el.files).toEqual([]);
		fireDrop(el, [file("b.png", "image/png")]);
		expect(el.files).toEqual([]);
	});

	it("setDragging drives the same skin a DOM drag does — the state a native host needs", () => {
		const el = make();
		el.setDragging(true);
		expect(surface(el).classList.contains("xtyle-dropzone__surface--dragging")).toBe(true);
		el.setDragging(true, true);
		expect(surface(el).classList.contains("xtyle-dropzone__surface--rejecting")).toBe(true);
		el.setDragging(false);
		expect(surface(el).classList.contains("xtyle-dropzone__surface--dragging")).toBe(false);
	});

	it("rejects() previews a batch without committing it", () => {
		const el = make({ accept: "image/*" });
		expect(el.rejects(["C:/a.exe"])).toBe(true);
		expect(el.rejects(["C:/a.png"])).toBe(false);
		expect(el.files).toEqual([]);
	});
});

describe("routeNativeDrop", () => {
	function box(el: HTMLElement, left: number, top: number): void {
		el.getBoundingClientRect = () =>
			({ left, top, right: left + 100, bottom: top + 50, width: 100, height: 50, x: left, y: top, toJSON() {} }) as DOMRect;
	}

	it("routes a positioned native drop to the zone under the pointer, and leaves the others alone", () => {
		const first = make({ multiple: "" });
		const second = make({ multiple: "" });
		box(first, 0, 0);
		box(second, 0, 200);

		routeNativeDrop("over", { x: 10, y: 210 });
		expect(second.hasAttribute("dragging")).toBe(true);
		expect(first.hasAttribute("dragging")).toBe(false);

		routeNativeDrop("drop", { x: 10, y: 210, items: ["C:/deck.pdf"] });
		expect(second.files.map((f) => f.name)).toEqual(["deck.pdf"]);
		expect(first.files).toEqual([]);
		expect(second.hasAttribute("dragging")).toBe(false);
	});

	it("previews a refusal mid-drag when the zone under the pointer would reject the payload", () => {
		const el = make({ accept: "image/*" });
		box(el, 0, 0);
		routeNativeDrop("over", { x: 10, y: 10, items: ["C:/setup.exe"] });
		expect(el.hasAttribute("rejecting")).toBe(true);
	});

	it("claims an unpositioned drop only when there is exactly one zone to claim it", () => {
		const only = make({ multiple: "" });
		expect(routeNativeDrop("drop", { items: ["C:/a.png"] })).toBe(only);
		expect(only.files).toHaveLength(1);

		const second = make({ multiple: "" });
		expect(routeNativeDrop("drop", { items: ["C:/b.png"] })).toBeNull();
		expect(second.files).toEqual([]);
		expect(only.files).toHaveLength(1);
	});

	it("clears every zone on leave", () => {
		const el = make();
		el.setDragging(true);
		routeNativeDrop("leave", {});
		expect(el.hasAttribute("dragging")).toBe(false);
	});
});

describe("DOM drops, the picker, and paste", () => {
	it("accepts a DOM drop through the same gate", () => {
		const el = make({ accept: "image/*", multiple: "" });
		fireDrop(el, [file("shot.png", "image/png"), file("notes.txt", "text/plain")]);
		expect(el.files.map((f) => f.name)).toEqual(["shot.png"]);
		expect(errors(el)[0]).toContain("notes.txt");
	});

	it("says no before the drop lands when the drag carries only refused types", () => {
		const el = make({ accept: "image/*" });
		const event = fireDragOver(el, ["application/pdf"]);
		expect(event.dataTransfer.dropEffect).toBe("none");
		expect(surface(el).classList.contains("xtyle-dropzone__surface--rejecting")).toBe(true);
	});

	it("stays neutral mid-drag when accept is by extension — a browser hides the name until the drop", () => {
		const el = make({ accept: ".png" });
		const event = fireDragOver(el, ["image/png"]);
		expect(event.dataTransfer.dropEffect).toBe("copy");
		expect(surface(el).classList.contains("xtyle-dropzone__surface--rejecting")).toBe(false);
	});

	it("takes a pasted file when it is the only paste zone, and never one aimed at a text field", () => {
		const el = make({ paste: "", accept: "image/*", multiple: "" });
		firePaste([file("clip.png", "image/png")]);
		expect(el.files.map((f) => f.name)).toEqual(["clip.png"]);

		const text = document.createElement("input");
		document.body.appendChild(text);
		text.focus();
		firePaste([file("other.png", "image/png")]);
		expect(el.files).toHaveLength(1);
	});

	it("ignores paste entirely without the opt-in", () => {
		const el = make({ multiple: "" });
		firePaste([file("clip.png", "image/png")]);
		expect(el.files).toEqual([]);
	});
});

describe("validation and the rejection surface", () => {
	it("rejects an oversized file with a human message", () => {
		const el = make({ "max-size": "10", multiple: "" });
		const rejected = el.addFiles([file("big.txt", "text/plain", 64)]).rejected;
		expect(rejected[0]?.reason).toBe("size");
		expect(errors(el)[0]).toContain("big.txt");
		expect((el.querySelector("[data-errors]") as HTMLElement).hidden).toBe(false);
		expect(el.querySelector("[data-errors]")?.getAttribute("role")).toBe("alert");
	});

	it("passes a file whose size is unknown rather than guessing at it", () => {
		const el = make({ "max-size": "10", multiple: "" });
		expect(el.addFiles(["C:/mystery.pdf"]).accepted).toHaveLength(1);
	});

	it("rejects duplicates and overflow past maxfiles", () => {
		const el = make({ multiple: "", "max-files": "2" });
		el.addFiles(["C:/a.png", "C:/a.png", "C:/b.png", "C:/c.png"]);
		expect(el.files.map((f) => f.name)).toEqual(["a.png", "b.png"]);
		const reasons = el.rejections.map((r) => r.reason);
		expect(reasons).toContain("duplicate");
		expect(reasons).toContain("count");
	});

	it("replaces rather than piles up without `multiple`, and never wipes a good file for a bad drop", () => {
		const el = make({ accept: "image/*" });
		el.addFiles(["C:/first.png"]);
		el.addFiles(["C:/second.png"]);
		expect(el.files.map((f) => f.name)).toEqual(["second.png"]);
		el.addFiles(["C:/bad.exe"]);
		expect(el.files.map((f) => f.name)).toEqual(["second.png"]);
		expect(el.rejections[0]?.reason).toBe("type");
	});

	it("emits file-reject with every refusal", () => {
		const el = make({ accept: "image/*" });
		const seen: string[] = [];
		el.addEventListener("file-reject", (e) => {
			for (const r of (e as CustomEvent).detail.rejected) seen.push(r.reason);
		});
		el.addFiles(["C:/a.exe"]);
		expect(seen).toEqual(["type"]);
	});

	it("clears the rejection surface on the next clean batch", () => {
		const el = make({ accept: "image/*", multiple: "" });
		el.addFiles(["C:/a.exe"]);
		expect(errors(el)).toHaveLength(1);
		el.addFiles(["C:/a.png"]);
		expect(errors(el)).toHaveLength(0);
	});
});

describe("the upload list", () => {
	it("moves a file's bar and its progressbar ARIA without rebuilding the row", () => {
		const el = make({ multiple: "" });
		el.addFiles(["C:/a.png"]);
		const id = el.files[0]!.id;
		const row = rows(el)[0];
		el.setProgress(id, 40);

		expect(rows(el)[0]).toBe(row); // the same node — focus inside it survives an upload
		const bar = el.querySelector(`[data-bar="${id}"]`) as HTMLElement;
		const track = el.querySelector(`[data-track="${id}"]`) as HTMLElement;
		expect(bar.getAttribute("style")).toContain("40%");
		expect(track.getAttribute("role")).toBe("progressbar");
		expect(track.getAttribute("aria-valuenow")).toBe("40");
		expect(row?.textContent).toContain("Uploading 40%");
		expect(row?.className).toContain("xtyle-dropzone__file--uploading");
	});

	it("lands on done at 100, and reports a failure with its message", () => {
		const el = make({ multiple: "" });
		el.addFiles(["C:/a.png", "C:/b.png"]);
		const [a, b] = el.files;
		el.setProgress(a!.id, 100);
		el.setStatus(b!.id, "error", "The server said no.");
		expect(el.files[0]?.status).toBe("done");
		expect(rows(el)[0]?.className).toContain("xtyle-dropzone__file--done");
		expect(rows(el)[1]?.className).toContain("xtyle-dropzone__file--error");
		expect(el.querySelector(`[data-error="${b!.id}"]`)?.textContent).toBe("The server said no.");
	});

	it("announces the list politely and labels each remove button by its file", () => {
		const el = make({ multiple: "" });
		el.addFiles(["C:/report.pdf"]);
		expect(el.querySelector("[data-list]")?.getAttribute("aria-live")).toBe("polite");
		expect(el.querySelector("[data-remove]")?.getAttribute("aria-label")).toBe("Remove report.pdf");
	});

	it("removes through the fill's own button and moves focus to the next row", () => {
		const el = make({ multiple: "" });
		el.addFiles(["C:/a.png", "C:/b.png", "C:/c.png"]);
		const removed: string[] = [];
		el.addEventListener("file-remove", (e) => removed.push((e as CustomEvent).detail.file.name));

		(el.querySelectorAll<HTMLButtonElement>("[data-remove]")[1] as HTMLButtonElement).click();

		expect(removed).toEqual(["b.png"]);
		expect(el.files.map((f) => f.name)).toEqual(["a.png", "c.png"]);
		expect(document.activeElement).toBe(el.querySelectorAll("[data-remove]")[1]);
	});

	it("clears through the fill's clear button once the list is worth clearing", () => {
		const el = make({ multiple: "" });
		el.addFiles(["C:/a.png", "C:/b.png"]);
		expect((el.querySelector("[data-foot]") as HTMLElement).hidden).toBe(false);
		(el.querySelector("[data-clear]") as HTMLButtonElement).click();
		expect(el.files).toEqual([]);
		expect(rows(el)).toEqual([]);
	});

	it("escapes a hostile file name instead of rendering it", () => {
		const el = make({ multiple: "" });
		el.addFiles([{ name: '<img src=x onerror="boom()">.png', size: 10 }]);
		expect(el.querySelector("[data-file] img")).toBeNull();
		expect(rows(el)[0]?.textContent).toContain("<img src=x");
	});
});

describe("the server render (what the Astro binding emits, and what the element upgrades over)", () => {
	/** The `@xtyle/astro` binding's own composition, in miniature: paint the fill, hand the slot to the
	 * consumer when they filled it (and to the fill's fallback prompt when they didn't), then append the
	 * file input the element owns — the plumbing no fill can draw. */
	async function ssr(props: Partial<DropzoneBindingProps>, promptHtml: string | null = null): Promise<string> {
		const light = await renderFragmentLight(
			"dropzone",
			dropzoneBindings({ inputId: "zone-1", ...props, slotted: promptHtml !== null }),
		);
		const composed = light.replace(/<slot>([\s\S]*?)<\/slot>/, (_match, fallback: string) =>
			promptHtml === null ? fallback : promptHtml,
		);
		return `${composed}<input type="file" class="xtyle-dropzone__input" id="zone-1" aria-label="Upload files" aria-describedby="zone-1-hint">`;
	}

	/** Hydration as a browser actually performs it: the server markup is parsed in full *before* the
	 * element upgrades (the definition ships in a deferred module script), so the element wakes up over a
	 * complete tree — its fill scaffold and its input already in place — rather than mid-parse. */
	function hydrate(html: string, attrs: Record<string, string> = {}): XtyleDropzone {
		const holder = document.createElement("div");
		const attrText = Object.entries(attrs)
			.map(([name, value]) => ` ${name}="${value}"`)
			.join("");
		holder.innerHTML = `<xtyle-dropzone${attrText}>${html}</xtyle-dropzone>`;
		document.body.appendChild(holder);
		return holder.querySelector("xtyle-dropzone") as XtyleDropzone;
	}

	it("derives the hint from the constraints without a DOM in sight", () => {
		expect(dropzoneHint({ accept: ".png,.jpg", maxSize: "200kb", multiple: true, maxFiles: 3 })).toBe(
			".png, .jpg · up to 200 KB · 3 files max",
		);
		expect(dropzoneHint({})).toBe("");
	});

	it("paints the surface, the prompt, the hint, and the browse chip with no runtime running", async () => {
		const html = await ssr({ accept: ".png", maxSize: "200kb", multiple: true, maxFiles: 3 });
		expect(html).toContain('class="xtyle-dropzone__surface"');
		expect(html).toContain('for="zone-1"');
		expect(html).toContain("Drop files here");
		expect(html).toContain(".png · up to 200 KB · 3 files max");
		expect(html).toContain("or browse");
		expect(html).toContain('type="file"');
		// the slot is resolved at build: a zero-JS page never runs the code that would project it
		expect(html).not.toContain("<slot>");
	});

	it("gives the prompt region to the consumer's own content when they filled the slot", async () => {
		const html = await ssr({}, "<strong>Drop a release archive</strong>");
		expect(html).toContain("<strong>Drop a release archive</strong>");
		expect(html).not.toContain("Drop files here");
	});

	it("upgrades over its own server markup: adopts the input and its id, and mints no second one", async () => {
		const el = hydrate(await ssr({ multiple: true }), { multiple: "" });
		const inputs = el.querySelectorAll<HTMLInputElement>("input[type=file]");
		expect(inputs).toHaveLength(1);
		expect(inputs[0]?.id).toBe("zone-1");
		expect(surface(el).getAttribute("for")).toBe("zone-1");

		el.addFiles(["C:/a.png"]);
		expect(rows(el)).toHaveLength(1);
		expect(el.querySelector("[data-remove]")).not.toBeNull();
	});

	it("keeps a server-rendered slotted prompt as the consumer's, not chrome to overwrite", async () => {
		const el = hydrate(await ssr({}, "<strong>Drop a release archive</strong>"));
		el.addFiles(["C:/a.png"]);
		expect(el.querySelector("[data-prompt]")?.innerHTML).toContain("<strong>Drop a release archive</strong>");
		expect(el.querySelector("[data-prompt]")?.textContent).not.toContain("Drop files here");
	});
});

describe("form participation", () => {
	it("opens the picker for a click on chrome that is not a label, and stays out of the way of one that is", () => {
		const el = make();
		const input = el.querySelector<HTMLInputElement>("input[type=file]") as HTMLInputElement;
		const clicked = vi.spyOn(input, "click");

		// the surface IS a <label for>, so the browser already opens the picker — no double-fire from us
		surface(el).click();
		expect(clicked).not.toHaveBeenCalled();

		// a mod could draw the surface as anything; a click on the zone's own chrome still opens it
		(el.querySelector("[data-root]") as HTMLElement).click();
		expect(clicked).toHaveBeenCalledTimes(1);
	});

	it("marks the input required only while the zone is empty", () => {
		const el = make({ required: "", multiple: "" });
		const input = el.querySelector<HTMLInputElement>("input[type=file]") as HTMLInputElement;
		expect(input.required).toBe(true);
		el.addFiles(["C:/a.png"]);
		expect(input.required).toBe(false);
	});

	it("disables the input with the zone, so the keyboard path is refused too", () => {
		const el = make({ disabled: "" });
		expect(el.querySelector<HTMLInputElement>("input[type=file]")?.disabled).toBe(true);
	});
});
