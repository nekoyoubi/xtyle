interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface BadgeBindings {
	variant?: string;
	tone?: string;
	size?: string;
	dot?: boolean;
	pulse?: string | null;
	count?: string | number | null;
	removable?: boolean;
	removeLabel?: string;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: BadgeBindings, ops: OpsBuilder) => void) => void };
};

const STATUS_WORD: { [k: string]: string } = {
	success: "Success",
	warn: "Warning",
	danger: "Danger",
	info: "Info",
};

const REMOVE_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" d="M6 6l12 12M18 6L6 18" /></svg>`;

function badgeClass(b: BadgeBindings): string {
	const variant = b.variant ?? "soft";
	const tone = b.tone ?? "neutral";
	const size = b.size ?? "md";
	const pulse = b.pulse === "fast" || b.pulse === "slow" ? b.pulse : null;
	return [
		"xoji-badge",
		`xoji-badge--${variant}`,
		`xoji-badge--${tone}`,
		size !== "md" && `xoji-badge--${size}`,
		pulse && b.dot && `xoji-badge--pulse-${pulse}`,
	]
		.filter(Boolean)
		.join(" ");
}

function badgeHtml(b: BadgeBindings): string {
	const tone = b.tone ?? "neutral";
	const statusWord = STATUS_WORD[tone];
	const srTone = statusWord ? `<span class="xoji-badge__sr-only" part="status-word">${statusWord}:</span>` : "";
	const dot = b.dot ? `<span class="xoji-badge__dot" part="dot" aria-hidden="true"></span>` : "";
	const countValue = b.count === null || b.count === undefined ? null : String(b.count);
	const hasCount = countValue !== null && countValue !== "" && countValue !== "undefined";
	const count = hasCount ? `<span class="xoji-badge__count" part="count">${countValue}</span>` : "";
	const removeLabel = b.removeLabel ?? "Remove";
	const remove = b.removable
		? `<button type="button" class="xoji-badge__remove" part="remove" aria-label="${removeLabel}">${REMOVE_ICON}</button>`
		: "";
	// `data-slot` rides alongside the native `<slot>` so the host can read the label text
	// (`slottedText()` → the composed remove-label) under the auto-light render, where there is no
	// shadow root to read host children from.
	return `<span part="badge" class="${badgeClass(b)}">${srTone}${dot}<span class="xoji-badge__label" part="label" data-slot><slot></slot></span>${count}${remove}</span>`;
}

hooks.fragment.mount("badge", (bindings, ops) => {
	ops.replaceChildren("[data-badge]", badgeHtml(bindings));
});

hooks.fragment.update("badge", (bindings, ops) => {
	ops.setAttr('[part="badge"]', "class", badgeClass(bindings));
	// The remove label is composed by the element from its slotted text, which the SSR build
	// can't know — so refresh it on every update. In light DOM, SSR hydration runs as an update
	// (never a mount rebuild), so an element-computed binding that only `mount` set would stay
	// stale otherwise.
	ops.setAttr(".xoji-badge__remove", "aria-label", bindings.removeLabel ?? "Remove");
});
