import { describe, expect, it } from "vitest";
import { getComponent } from "../src/manifest/registry.js";
import { MEMBERS_READ_THROUGH } from "../src/manifest/members-since.generated.js";
import { manifestAsOf } from "../src/mcp/members-as-of.js";

const speaks = "0.13.0";
const progress = getComponent("progress")!;
const props = (c: { props: Array<{ name: string }> }) => c.props.map((p) => p.name);

describe("a component answered as of an older version", () => {
	it("leaves out the props, parts and examples that version never had", () => {
		const { component, omittedMembers, caveat } = manifestAsOf(progress, "0.11.0", speaks);
		for (const name of ["orient", "label", "reading", "note"]) expect(props(component), name).not.toContain(name);
		expect(props(component)).toContain("variant");
		expect(omittedMembers).toBeGreaterThan(0);
		expect(caveat).toContain("0.11.0");
	});

	it("keeps what had shipped by then", () => {
		const { component } = manifestAsOf(progress, "0.12.0", speaks);
		expect(props(component)).toEqual(expect.arrayContaining(["orient", "label", "reading", "note"]));
	});

	it("passes the current manifest through whole when asked for the version it describes", () => {
		const answer = manifestAsOf(progress, speaks, speaks);
		expect(answer.component).toBe(progress);
		expect(answer.omittedMembers).toBe(0);
		expect(answer.caveat).toBeUndefined();
	});

	it("dates a member no published version carried at the version being built", () => {
		const fresh = manifestAsOf({ ...progress, props: [...progress.props, { name: "neverShipped", type: "string", description: "", bindings: [] }] }, MEMBERS_READ_THROUGH!, speaks);
		expect(props(fresh.component)).not.toContain("neverShipped");
	});
});
