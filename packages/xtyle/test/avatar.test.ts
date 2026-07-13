import { describe, expect, it } from "vitest";
import { avatarClass, avatarInitials, avatarLabel, avatarMarkup } from "../src/markup/avatar.js";

describe("avatar initials", () => {
	it("takes first + last for a full name, one letter for a single word", () => {
		expect(avatarInitials("Ada Lovelace")).toBe("AL");
		expect(avatarInitials("Prince")).toBe("P");
		expect(avatarInitials("ada lovelace")).toBe("AL");
	});

	it("reads the first and last word, not the first two", () => {
		expect(avatarInitials("Katherine Grace Johnson")).toBe("KJ");
	});

	it("shrugs off ragged whitespace and empty names", () => {
		expect(avatarInitials("  Grace   Hopper  ")).toBe("GH");
		expect(avatarInitials("")).toBe("");
		expect(avatarInitials("   ")).toBe("");
		expect(avatarInitials(null)).toBe("");
		expect(avatarInitials(undefined)).toBe("");
	});

	it("keeps an astral first character whole instead of splitting a surrogate pair", () => {
		// A char-code split would emit half a surrogate pair here and render a replacement glyph.
		expect(avatarInitials("🚀 Apollo")).toBe("🚀A");
		expect(avatarInitials("Ædifice")).toBe("Æ");
	});

	it("paints the initials as real content, never as the default slot's fallback", () => {
		// Slot fallback is a trap here: every framework binding emits a whitespace text node between
		// the element's tags, shadow DOM assigns it to the default slot, and an assigned node — even
		// one made of nothing but a space — suppresses the fallback. The initials would silently
		// vanish in every Svelte/Astro caller while still reading back correctly from `textContent`.
		const html = avatarMarkup({ userName: "Ada Lovelace" });
		expect(html).toContain('<span class="xtyle-avatar__initials" part="initials">AL</span>');
		expect(html).not.toContain("<slot>AL</slot>");
		expect(html).toContain("<slot></slot>");
	});

	it("suppresses the initials when the consumer filled the default slot", () => {
		const html = avatarMarkup({ userName: "Ada Lovelace", initials: "" });
		expect(html).not.toContain("xtyle-avatar__initials");
		expect(html).toContain("<slot></slot>");
	});

	it("renders no initials element when there is no name to derive from", () => {
		expect(avatarMarkup({ alt: "Anonymous" })).not.toContain("xtyle-avatar__initials");
	});

	it("escapes a name that would otherwise break out of the markup", () => {
		const html = avatarMarkup({ userName: '<script>x</script> Bad' });
		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;");
	});
});

describe("avatar accessible name", () => {
	it("names the avatar by userName when no alt is given", () => {
		expect(avatarLabel({ userName: "Ada Lovelace" })).toBe("Ada Lovelace");
		expect(avatarMarkup({ userName: "Ada Lovelace" })).toContain('aria-label="Ada Lovelace"');
	});

	it("prefers an explicit alt over the name", () => {
		expect(avatarLabel({ alt: "Portrait of Ada", userName: "Ada Lovelace" })).toBe("Portrait of Ada");
	});

	it("reads the status after the name, and leaves no dangling separator when one half is absent", () => {
		expect(avatarLabel({ userName: "Grace Hopper", statusLabel: "Online" })).toBe("Grace Hopper — Online");
		expect(avatarLabel({ statusLabel: "Online" })).toBe("Online");
		expect(avatarLabel({})).toBe("");
	});

	it("escapes a quote in the label instead of breaking the attribute", () => {
		expect(avatarMarkup({ alt: 'A "quoted" name' })).toContain("&quot;");
	});

	it("names the avatar only when it has a name, never with an empty one", () => {
		// An unnamed `role="img"` fails WCAG on its own — and `role="img"` makes the subtree
		// presentational, so an avatar carrying only a slotted icon would announce as a nameless
		// image rather than exposing what it holds. The SSR path used to emit it unconditionally
		// while the client fragment guarded it, so identical props rendered different a11y semantics.
		const unnamed = avatarMarkup({});
		expect(unnamed).not.toContain('role="img"');
		expect(unnamed).not.toContain('aria-label=""');
		expect(avatarMarkup({ userName: "Ada Lovelace" })).toContain('role="img"');
	});
});

describe("avatar status-dot pulse", () => {
	it("a bare / true pulse breathes the status dot at the slow cadence", () => {
		expect(avatarClass({ status: "success", pulse: true })).toContain("xtyle-avatar--pulse-slow");
		expect(avatarClass({ status: "success", pulse: "slow" })).toContain("xtyle-avatar--pulse-slow");
	});

	it("pulse=\"fast\" breathes at the quick cadence", () => {
		expect(avatarClass({ status: "success", pulse: "fast" })).toContain("xtyle-avatar--pulse-fast");
	});

	it("is a no-op without a status dot to animate", () => {
		expect(avatarClass({ pulse: true })).not.toContain("pulse");
		expect(avatarClass({ pulse: "fast" })).not.toContain("pulse");
	});

	it("a status dot without pulse stays static", () => {
		expect(avatarClass({ status: "success" })).not.toContain("pulse");
	});

	it("renders the pulse class alongside the status dot in the markup", () => {
		const html = avatarMarkup({ alt: "GH", status: "success", statusLabel: "Online", pulse: true });
		expect(html).toContain("xtyle-avatar--pulse-slow");
		expect(html).toContain("xtyle-avatar__status-dot");
	});
});
