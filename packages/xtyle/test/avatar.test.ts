import { describe, expect, it } from "vitest";
import { avatarClass, avatarMarkup } from "../src/markup/avatar.js";

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
