import { dotClass } from "../../../markup/dot";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface AvatarBindings {
	src?: string | null;
	alt?: string | null;
	userName?: string | null;
	/** Pre-resolved initials — the host suppresses them (`""`) when the consumer filled the default
	 * slot. They cannot ride as slot *fallback*: a binding's whitespace text node gets assigned to
	 * the default slot and an assigned node suppresses the fallback, space or not. */
	initials?: string;
	tone?: string;
	size?: string;
	shape?: string;
	status?: string | null;
	statusLabel?: string | null;
	pulse?: boolean | string | null;
}

function escapeHtml(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
	return escapeHtml(value).replace(/"/g, "&quot;");
}

/** Up to two initials for a person's name — first + last, or one letter for a single word. Split on
 * code points so an astral first character survives whole. Mirrors `avatarInitials` in the core. */
function avatarInitials(userName: string | null | undefined): string {
	const words = (userName ?? "").trim().split(/\s+/).filter(Boolean);
	if (!words.length) return "";
	const firstOf = (word: string): string => [...word][0] ?? "";
	const lead = firstOf(words[0] as string);
	const tail = words.length > 1 ? firstOf(words[words.length - 1] as string) : "";
	return (lead + tail).toUpperCase();
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: AvatarBindings, ops: OpsBuilder) => void) => void };
};

function avatarPulseClass(pulse: boolean | string | null | undefined, hasStatus: boolean): string | false {
	if (!hasStatus || pulse == null || pulse === false) return false;
	return pulse === "fast" ? "xtyle-avatar--pulse-fast" : "xtyle-avatar--pulse-slow";
}

/** The presence dot is the `Dot` primitive's own class list, built by the primitive's own function;
 * the avatar contributes nothing but its geometry class. The tone rides as `--dot-color`, set by the
 * `.xtyle-avatar--status-*` rules, so the dot needs no tone of its own. */
function avatarStatusDotClass(b: AvatarBindings): string {
	const pulse = b.status ? (b.pulse === "fast" ? "fast" : b.pulse ? "slow" : undefined) : undefined;
	return `${dotClass({ pulse })} xtyle-avatar__status-dot`;
}

function avatarClass(b: AvatarBindings): string {
	const tone = b.tone ?? "neutral";
	const size = b.size ?? "md";
	const shape = b.shape ?? "circle";
	return [
		"xtyle-avatar",
		`xtyle-avatar--${tone}`,
		size !== "md" && `xtyle-avatar--${size}`,
		shape === "square" && "xtyle-avatar--square",
		b.status && `xtyle-avatar--status-${b.status}`,
		avatarPulseClass(b.pulse, Boolean(b.status)),
	]
		.filter(Boolean)
		.join(" ");
}

function avatarLabel(b: AvatarBindings): string {
	const name = b.alt || b.userName || "";
	const status = b.statusLabel ?? "";
	if (name && status) return `${name} — ${status}`;
	return name || status;
}

function avatarInner(b: AvatarBindings): string {
	const src = b.src ?? null;
	const alt = b.alt ?? "";
	const image =
		src !== null
			? `<img class="xtyle-avatar__image" part="image" src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" onerror="this.remove()" />`
			: "";
	const initials = escapeHtml(b.initials ?? avatarInitials(b.userName));
	const initialsSpan = initials
		? `<span class="xtyle-avatar__initials" part="initials">${initials}</span>`
		: "";
	const fallback = `<span class="xtyle-avatar__fallback" part="fallback"><span class="xtyle-slot"><slot name="icon"></slot></span>${initialsSpan}<span class="xtyle-slot"><slot></slot></span></span>`;
	const statusDot = b.status
		? `<span class="${avatarStatusDotClass(b)}" part="status-dot" aria-hidden="true"></span>`
		: "";
	return `${image}${fallback}${statusDot}`;
}

function avatarHtml(b: AvatarBindings): string {
	const label = avatarLabel(b);
	const naming = label ? ` role="img" aria-label="${escapeAttr(label)}"` : "";
	return `<span part="avatar" class="${avatarClass(b)}"${naming}>${avatarInner(b)}</span>`;
}

hooks.fragment.mount("avatar", (bindings, ops) => {
	ops.replaceChildren("[data-avatar]", avatarHtml(bindings));
});

hooks.fragment.update("avatar", (bindings, ops) => {
	ops.setAttr('[part="avatar"]', "class", avatarClass(bindings));
	ops.setAttr('[part="avatar"]', "aria-label", avatarLabel(bindings));
	if (bindings.src != null) {
		ops.setAttr(".xtyle-avatar__image", "src", bindings.src);
		ops.setAttr(".xtyle-avatar__image", "alt", bindings.alt ?? "");
	}
});
