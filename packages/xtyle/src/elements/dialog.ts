import { XtyleElement, define, type StyleMode } from "./base.js";
import type { Size } from "../index.js";
import { dialogHostCss } from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/dialog/source.generated.js";

export class XtyleDialog extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private elementId = `xtyle-dialog-${Math.random().toString(36).slice(2, 8)}`;
	private rootWired = false;
	private wiredDialog: HTMLDialogElement | null = null;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "dialog", {
		applyIntent: (intent, event) => this.applyIntent(intent, event),
		afterApply: () => {
			this.wireNative();
			this.syncOpen();
		},
	});

	static get observedAttributes(): string[] {
		return ["open", "size", "heading", "label", "labelledby", "close-label", "no-close-button"];
	}

	get open(): boolean {
		return this.hasAttribute("open");
	}
	set open(value: boolean) {
		this.reflectBoolean("open", value);
	}

	get size(): Size {
		return (this.getAttribute("size") as Size) ?? "md";
	}
	set size(value: Size) {
		this.setAttribute("size", value);
	}

	private get dialogEl(): HTMLDialogElement | null {
		return this.root.querySelector("dialog");
	}

	/** Opens the dialog as a modal — native focus trap, restore, and Esc come for free. */
	showModal(): void {
		this.open = true;
	}

	/** Closes the dialog and restores focus to the previously focused element. */
	close(): void {
		this.open = false;
	}

	attributeChangedCallback(name: string): void {
		if (!this.root.firstChild) return;
		if (name === "open") {
			this.syncOpen();
			return;
		}
		this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			size: this.size,
			heading: this.getAttribute("heading"),
			label: this.getAttribute("label"),
			labelledby: this.getAttribute("labelledby"),
			closeLabel: this.getAttribute("close-label"),
			noCloseButton: this.hasAttribute("no-close-button"),
			elementId: this.elementId,
		};
	}

	/** Structural state ops can't patch incrementally: whether the close button and title exist, and
	 * which accessible-name attribute the `<dialog>` carries. A change here rebuilds; size / heading text are cheap patches. */
	private shapeSignature(): string {
		const heading = this.getAttribute("heading") != null;
		const label = this.getAttribute("label") != null;
		const labelledby = this.getAttribute("labelledby") != null;
		return `${!this.hasAttribute("no-close-button")}|${heading}|${label}|${labelledby}`;
	}

	private syncOpen(): void {
		const dialog = this.dialogEl;
		if (!dialog) return;
		if (this.open) {
			if (!dialog.open) dialog.showModal();
		} else if (dialog.open) {
			dialog.close();
		}
	}

	private warnIfUnnamed(): void {
		if (!this.getAttribute("heading") && !this.getAttribute("labelledby") && !this.getAttribute("label")) {
			console.warn(
				"xtyle-dialog: no accessible name. Provide a `heading`, `label`, or `labelledby` so the dialog is announced.",
			);
		}
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.preventDefault) event.preventDefault();
		if (intent.requestClose) this.close();
	}

	/** Wire the native `<dialog>` events the fragment scaffold can't express as handlers. Backdrop
	 * `click` bubbles, so it delegates on the shadow root once; `close`/`cancel` do not bubble, so they
	 * attach to the live `<dialog>` and re-attach whenever a remount rebuilds it. */
	private wireNative(): void {
		if (!this.rootWired) {
			this.rootWired = true;
			this.root.addEventListener("click", (event) => {
				if (event.target === this.dialogEl) this.close();
			});
		}
		const dialog = this.dialogEl;
		if (!dialog || dialog === this.wiredDialog) return;
		this.wiredDialog = dialog;
		dialog.addEventListener("close", () => {
			if (this.open) this.open = false;
			this.dispatchEvent(new Event("close", { bubbles: true, composed: true }));
		});
		dialog.addEventListener("cancel", () => {
			this.dispatchEvent(new Event("cancel", { bubbles: true, composed: true }));
		});
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(dialogHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.wireNative();
		this.warnIfUnnamed();
		this.syncOpen();
	}
}

define("xtyle-dialog", XtyleDialog);
