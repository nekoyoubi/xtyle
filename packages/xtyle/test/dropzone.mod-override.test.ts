// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { loadFill, loadedFillNames } from "../src/elements/fragment-host.js";
import { manifest } from "../src/elements/fragments/dropzone/source.generated.js";
import type { XtyleDropzone } from "../src/elements/dropzone.js";

/**
 * The payoff of putting the drop surface and the upload rows in a fragment: a third-party mod filling
 * `component.dropzone` can restructure both. Its ops apply after the built-in fill's, so its
 * `replaceChildren` is what the DOM ends up with; it keeps the fill's declared handler selectors on the
 * controls it draws (that is the wiring contract) and inherits their behavior. What it must NOT have to
 * reimplement is the part that makes a dropzone work in a real app: the programmatic ingress a native
 * host drives, validation, the form value, and focus. Those live in the element, and these assertions
 * hold them to it under a full reskin.
 */
const stripReskin = {
	manifest: {
		$schema: "https://xript.dev/schema/mod/v0.7.json",
		xript: "0.7",
		name: "test-dropzone-strip",
		version: "0.0.1",
		title: "test-dropzone-strip",
		description: "A test mod reskinning the dropzone as a compact inline strip with a table of files.",
		capabilities: ["xtyle.component.dropzone"],
		entry: { script: "mod.js", format: "script" },
		fills: {
			"component.dropzone": [
				{ id: "dropzone", format: "text/html+jsml", source: "dropzone.html" },
			],
		},
	},
	fragmentSources: {
		"mod.js": `"use strict";
(() => {
	function paint(b, ops) {
		ops.setAttr("[data-surface]", "class", "modded-strip" + (b.dragging ? " modded-strip--hot" : ""));
		ops.setAttr("[data-surface]", "for", b.inputId || "");
		ops.replaceChildren("[data-surface]", '<span class="modded-pitch">' + (b.prompt || "") + "</span>");
		var rows = "";
		for (var i = 0; i < (b.files || []).length; i++) {
			var f = b.files[i];
			rows +=
				'<tr class="modded-row" data-file="' + f.id + '">' +
				"<td>" + f.name + "</td>" +
				'<td data-status="' + f.id + '">' + f.statusLabel + "</td>" +
				'<td><span data-bar="' + f.id + '" style="width: ' + f.progress + '%"></span></td>' +
				'<td><button type="button" class="modded-drop xtyle-dropzone__remove" data-remove="' + f.id + '">x</button></td>' +
				"</tr>";
		}
		ops.replaceChildren("[data-list]", '<table class="modded-table"><tbody>' + rows + "</tbody></table>");
	}
	hooks.fragment.mount("dropzone", paint);
	hooks.fragment.update("dropzone", paint);
})();
`,
		"dropzone.html": '<div class="modded-body" part="root" data-root>\n\t<label part="surface" data-surface></label>\n\t<div part="list" data-list></div>\n</div>\n',
	},
};

beforeAll(async () => {
	await loadFill(stripReskin.manifest, stripReskin.fragmentSources);
	await import("../src/elements/dropzone.js");
});

afterEach(() => {
	document.body.innerHTML = "";
});

function make(attrs: Record<string, string> = {}): XtyleDropzone {
	const el = document.createElement("xtyle-dropzone") as XtyleDropzone;
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	return el;
}

describe("a mod reshapes the dropzone", () => {
	it("registers behind xtyle's own fill, which the app never had to load", () => {
		const names = loadedFillNames();
		expect(names.indexOf(manifest.name)).toBeGreaterThanOrEqual(0);
		expect(names.indexOf(manifest.name)).toBeLessThan(names.indexOf(stripReskin.manifest.name));
	});

	it("replaces the drop surface and the upload list with markup of its own", () => {
		const el = make({ multiple: "", prompt: "Toss it in" });
		el.addFiles(["C:/a.png", "C:/b.pdf"]);

		expect(el.querySelector(".modded-strip")).not.toBeNull();
		expect(el.querySelector(".modded-pitch")?.textContent).toBe("Toss it in");
		expect(el.querySelector(".modded-table")).not.toBeNull();
		expect(el.querySelectorAll(".modded-row")).toHaveLength(2);
		// the built-in surface's own furniture is gone, not merely hidden under the reskin
		expect(el.querySelector(".xtyle-dropzone__browse")).toBeNull();
		expect(el.querySelector(".xtyle-dropzone__file")).toBeNull();
	});

	it("keeps the programmatic native-drop path, the validation, and the rejections under the reskin", () => {
		const el = make({ multiple: "", accept: "image/*" });
		const result = el.addFiles(["C:/shot.png", "C:/setup.exe"]);
		expect(result.accepted.map((f) => f.name)).toEqual(["shot.png"]);
		expect(result.rejected[0]?.reason).toBe("type");
		expect(el.querySelectorAll(".modded-row")).toHaveLength(1);
	});

	it("keeps the hidden file input — the keyboard path and the form value the mod cannot see", () => {
		const el = make({ name: "docs", label: "Attach" });
		const input = el.querySelector<HTMLInputElement>("input[type=file]");
		expect(input).not.toBeNull();
		expect(input?.getAttribute("name")).toBe("docs");
		expect(el.querySelector(".modded-strip")?.getAttribute("for")).toBe(input?.id);
	});

	it("keeps the drag state and the host-driven progress on the mod's own nodes", () => {
		const el = make({ multiple: "" });
		el.setDragging(true);
		expect(el.querySelector(".modded-strip--hot")).not.toBeNull();

		el.addFiles(["C:/a.png"]);
		const id = el.files[0]!.id;
		el.setProgress(id, 70);
		expect((el.querySelector(`[data-bar="${id}"]`) as HTMLElement).getAttribute("style")).toContain("70%");
		expect(el.querySelector(`[data-status="${id}"]`)?.textContent).toBe("Uploading 70%");
	});

	it("wires the remove control the mod redrew back to the element's removal behavior", () => {
		const el = make({ multiple: "" });
		el.addFiles(["C:/a.png", "C:/b.png"]);
		(el.querySelectorAll<HTMLButtonElement>(".modded-drop")[0] as HTMLButtonElement).click();
		expect(el.files.map((f) => f.name)).toEqual(["b.png"]);
	});
});
