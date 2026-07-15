// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
// side effect: defines <xtyle-toast> and <xtyle-toast-region> on the happy-dom registry
import "../src/elements/toast.js";
import type { XtyleToastRegion } from "../src/elements/toast.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/toast/source.generated.js";

/** Warm the fill so a render applies its ops synchronously, the way a live page does after first paint. */
beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
	vi.useRealTimers();
});

function region(): XtyleToastRegion {
	const el = document.createElement("xtyle-toast-region") as XtyleToastRegion;
	document.body.appendChild(el);
	return el;
}

function toast(attrs: Record<string, string> = {}, message = "Saved."): HTMLElement {
	const el = document.createElement("xtyle-toast");
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	el.textContent = message;
	document.body.appendChild(el);
	return el;
}

/** The card the fill draws, inside the toast's shadow root. */
function card(item: HTMLElement): HTMLElement | null {
	return item.shadowRoot?.querySelector<HTMLElement>(".xtyle-toast") ?? null;
}

/** Every toast the region is holding, pushed or placed. */
function stack(host: XtyleToastRegion): HTMLElement[] {
	return [...(host.shadowRoot?.querySelectorAll<HTMLElement>("xtyle-toast") ?? [])];
}

describe("<xtyle-toast> declarative", () => {
	it("draws the card, the severity glyph, and the close button through the fill", () => {
		const el = toast({ severity: "success" });
		expect(card(el)?.className).toContain("xtyle-toast--success");
		expect(card(el)?.getAttribute("role")).toBe("status");
		expect(el.shadowRoot?.querySelector(".xtyle-toast__icon svg")).not.toBeNull();
		expect(el.shadowRoot?.querySelector(".xtyle-toast__close")).not.toBeNull();
	});

	it("announces assertively for danger and warn", () => {
		expect(card(toast({ severity: "danger" }))?.getAttribute("role")).toBe("alert");
		expect(card(toast({ tone: "warn" }))?.getAttribute("aria-live")).toBe("assertive");
	});

	it("keeps the close button by default and drops it only on closable=false", () => {
		expect(toast().shadowRoot?.querySelector(".xtyle-toast__close")).not.toBeNull();
		expect(toast({ closable: "" }).shadowRoot?.querySelector(".xtyle-toast__close")).not.toBeNull();
		expect(toast({ closable: "true" }).shadowRoot?.querySelector(".xtyle-toast__close")).not.toBeNull();
		expect(toast({ closable: "false" }).shadowRoot?.querySelector(".xtyle-toast__close")).toBeNull();
	});

	it("removes itself when its close button dismisses it, unless a listener cancels", () => {
		const el = toast();
		el.addEventListener("dismiss", (event) => event.preventDefault(), { once: true });
		el.shadowRoot?.querySelector<HTMLElement>(".xtyle-toast__close")?.click();
		expect(el.isConnected).toBe(true);

		el.shadowRoot?.querySelector<HTMLElement>(".xtyle-toast__close")?.click();
		expect(el.isConnected).toBe(false);
	});
});

describe("toast-region.toast() — the imperative push", () => {
	it("pushes a real <xtyle-toast>, so the card comes from the same fill the declarative element uses", () => {
		const host = region();
		const item = host.toast({ message: "Settings saved.", tone: "success", variant: "solid" });

		expect(item.tagName.toLowerCase()).toBe("xtyle-toast");
		expect(stack(host)).toEqual([item]);
		const drawn = card(item);
		expect(drawn?.className).toContain("xtyle-toast--solid");
		expect(drawn?.className).toContain("xtyle-toast--success");
		expect(drawn?.getAttribute("aria-atomic")).toBe("true");
		expect(item.shadowRoot?.querySelector(".xtyle-toast__icon svg")).not.toBeNull();
		expect(item.shadowRoot?.querySelector(".xtyle-toast__close")).not.toBeNull();
		// the message rides the fill's own <slot>, not a hardcoded body div
		expect(item.shadowRoot?.querySelector(".xtyle-toast__message slot")).not.toBeNull();
		expect(item.textContent).toBe("Settings saved.");
	});

	it("carries the enter class on mount and drops it on the next frame", async () => {
		const host = region();
		const item = host.toast({ message: "Hi" });
		expect(item.classList.contains("xtyle-toast--enter")).toBe(true);
		await new Promise((resolve) => requestAnimationFrame(resolve));
		expect(item.classList.contains("xtyle-toast--enter")).toBe(false);
	});

	it("honours closable: false on a pushed toast", () => {
		const host = region();
		const item = host.toast({ message: "Copied.", closable: false });
		expect(item.shadowRoot?.querySelector(".xtyle-toast__close")).toBeNull();
	});

	it("renders no glyph for a color-only push and announces politely", () => {
		const host = region();
		const item = host.toast({ message: "Note.", tone: "violet" });
		expect(card(item)?.className).toContain("xtyle-toast--noicon");
		expect(card(item)?.className).toContain("xtyle-toast--violet");
		expect(card(item)?.getAttribute("role")).toBe("status");
	});

	it("escapes a hostile message, action label, and close label instead of injecting them", () => {
		const host = region();
		const item = host.toast({
			message: '<img src=x onerror="boom">',
			actionLabel: '<img src=x onerror="boom">',
			closeLabel: '" onmouseover="boom',
		});
		const shadow = item.shadowRoot!;
		expect(shadow.querySelector("img")).toBeNull();
		expect(item.querySelector("img")).toBeNull();
		expect(item.textContent).toBe('<img src=x onerror="boom">');
		expect(shadow.querySelector(".xtyle-toast__action")?.textContent).toBe('<img src=x onerror="boom">');
		const close = shadow.querySelector(".xtyle-toast__close");
		expect(close?.getAttribute("aria-label")).toBe('" onmouseover="boom');
		expect(close?.hasAttribute("onmouseover")).toBe(false);
	});

	it("runs the action callback and dismisses through the region's leave transition", () => {
		vi.useFakeTimers();
		const host = region();
		const onAction = vi.fn();
		const item = host.toast({ message: "File deleted.", actionLabel: "Undo", onAction, duration: 0 });

		item.shadowRoot?.querySelector<HTMLElement>(".xtyle-toast__action")?.click();

		expect(onAction).toHaveBeenCalledTimes(1);
		expect(item.classList.contains("xtyle-toast--leave")).toBe(true);
		vi.advanceTimersByTime(600);
		expect(item.isConnected).toBe(false);
	});

	it("hands the close button's dismissal back to the region, announcing it exactly once", () => {
		vi.useFakeTimers();
		const host = region();
		const item = host.toast({ message: "Saved.", duration: 0 });
		const dismissed = vi.fn();
		item.addEventListener("dismiss", dismissed);

		item.shadowRoot?.querySelector<HTMLElement>(".xtyle-toast__close")?.click();

		expect(dismissed).toHaveBeenCalledTimes(1);
		expect(item.classList.contains("xtyle-toast--leave")).toBe(true);
		vi.advanceTimersByTime(600);
		expect(item.isConnected).toBe(false);
	});

	it("lets a listener cancel a pushed toast's dismissal", () => {
		vi.useFakeTimers();
		const host = region();
		const item = host.toast({ message: "Saved.", duration: 0 });
		item.addEventListener("dismiss", (event) => event.preventDefault());

		item.shadowRoot?.querySelector<HTMLElement>(".xtyle-toast__close")?.click();

		vi.advanceTimersByTime(1000);
		expect(item.isConnected).toBe(true);
		expect(item.classList.contains("xtyle-toast--leave")).toBe(false);
	});

	it("auto-dismisses after the duration, and pauses while the pointer rests on it", () => {
		vi.useFakeTimers();
		const host = region();
		const item = host.toast({ message: "Saved.", duration: 1000 });

		item.dispatchEvent(new Event("pointerenter"));
		vi.advanceTimersByTime(5000);
		expect(item.isConnected).toBe(true);

		item.dispatchEvent(new Event("pointerleave"));
		vi.advanceTimersByTime(1000);
		expect(item.classList.contains("xtyle-toast--leave")).toBe(true);
		vi.advanceTimersByTime(600);
		expect(item.isConnected).toBe(false);
	});

	it("dismisses the oldest toast once the stack passes max", () => {
		vi.useFakeTimers();
		const host = region();
		host.setAttribute("max", "2");
		const first = host.toast({ message: "1", duration: 0 });
		host.toast({ message: "2", duration: 0 });
		host.toast({ message: "3", duration: 0 });

		expect(first.classList.contains("xtyle-toast--leave")).toBe(true);
		vi.advanceTimersByTime(600);
		expect(stack(host)).toHaveLength(2);
	});
});

// Last: the override registers hooks on the shared runtime for the rest of the file, so it must not
// run before the tests that assert the built-in markup.
describe("a component.toast override", () => {
	it("reshapes an imperatively pushed toast, not just a declarative one", async () => {
		await loadFill(
			{
				xript: "0.7",
				name: "test-toast-override",
				version: "0.0.1",
				capabilities: ["xtyle.component.toast"],
				entry: { script: "mod.js", format: "script" },
				fills: {
					"component.toast": [{ id: "toast", format: "text/html+jsml", source: "toast.html" }],
				},
			},
			{
				"mod.js": `hooks.fragment.mount("toast", function (b, ops) {
					ops.setAttr("[data-root]", "data-modded", "yes");
					ops.replaceChildren("[data-glyph]", '<em class="modded-glyph">!</em>');
				});
				hooks.fragment.update("toast", function (b, ops) {
					ops.setAttr("[data-root]", "data-modded", "yes");
					ops.replaceChildren("[data-glyph]", '<em class="modded-glyph">!</em>');
				});`,
				"toast.html": "",
			},
		);

		const placed = toast({ severity: "info" });
		expect(card(placed)?.getAttribute("data-modded")).toBe("yes");
		expect(placed.shadowRoot?.querySelector(".modded-glyph")).not.toBeNull();

		const host = region();
		const pushed = host.toast({ message: "Pushed.", severity: "info" });
		expect(card(pushed)?.getAttribute("data-modded")).toBe("yes");
		expect(pushed.shadowRoot?.querySelector(".modded-glyph")).not.toBeNull();
	});
});
