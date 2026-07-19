import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-timeline>
	<ol>
		<li>
			<strong>Deployed v0.6.0</strong>
			<time>2 hours ago</time>
			<p>The accessibility pass and the new gallery mockup went live.</p>
		</li>
		<li>
			<strong>Merged the release branch</strong>
			<time>yesterday</time>
		</li>
		<li>
			<strong>Opened the milestone</strong>
			<time>last week</time>
		</li>
	</ol>
</xtyle-timeline>`;

const svelteExample = `<script lang="ts">
	import { Timeline } from "@xtyle/svelte";
</script>

<Timeline>
	<ol>
		<li><strong>Deployed v0.6.0</strong><time>2 hours ago</time></li>
		<li><strong>Merged the release branch</strong><time>yesterday</time></li>
	</ol>
</Timeline>`;

const astroExample = `---
import Timeline from "@xtyle/astro/Timeline.astro";
---

<Timeline>
	<ol>
		<li><strong>Deployed v0.6.0</strong><time>2 hours ago</time></li>
		<li><strong>Merged the release branch</strong><time>yesterday</time></li>
	</ol>
</Timeline>`;

export const timelineManifest: ComponentManifest = {
	id: "timeline",
	name: "Timeline",
	since: "0.6.0",
	category: "content",
	keywords: ["activity feed", "history", "log", "event list", "changelog", "feed"],
	seeAlso: ["steps", "tree", "stat"],
	summary: "A vertical activity feed: an ordered list drawn as a connected rail of dots.",
	description:
		"Timeline turns a semantic ordered list into a vertical activity feed. Author an `<ol>` of `<li>` events and each one takes a themed dot on a connector rail that runs from one event to the next and stops at the last. The dot and the rail are real nodes rendered by the component's fill, not lines painted onto the author's markup, so a mod can swap the dot for a per-event icon or draw the rail dashed — while each event's content is relocated into its content region untouched, and the rendered list stays a semantic `<ol>` screen readers hear in order. Inside an event, a `<strong>` reads as the title, a `<time>` as its timestamp, and a `<p>` as the body; the same styling is available through `xtyle-timeline__title` / `__meta` / `__body` classes if the markup can't use those elements.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "list",
			description: "The rendered ordered list; carries no bullets and no default spacing.",
			selector: ".xtyle-timeline__list",
			tokens: [],
		},
		{
			name: "item",
			description: "One event: its dot, the rail running to the next event, and its content. Carries any attributes the author put on the source `<li>`.",
			selector: ".xtyle-timeline__item",
			tokens: ["--space-5", "--space-4"],
		},
		{
			name: "dot",
			description: "The event's marker on the rail. A real node, so a mod can replace it with a per-event icon or status glyph.",
			selector: ".xtyle-timeline__dot",
			tokens: ["--accent", "--bg-0", "--border-thick", "--radius-full"],
		},
		{
			name: "rail",
			description: "The line running from one event's dot down to the next. The last event has none, so the feed ends at its dot.",
			selector: ".xtyle-timeline__rail",
			tokens: ["--line", "--border-thin"],
		},
		{
			name: "content",
			description: "The region each event's authored content is relocated into, beside its dot.",
			selector: ".xtyle-timeline__content",
			tokens: [],
		},
		{
			name: "title",
			description: "The event title: a `<strong>` (or `.xtyle-timeline__title`).",
			selector: ".xtyle-timeline__content > strong",
			tokens: ["--text-sm", "--weight-semibold", "--fg-0", "--leading-tight"],
		},
		{
			name: "meta",
			description: "The timestamp or secondary line: a `<time>` (or `.xtyle-timeline__meta`).",
			selector: ".xtyle-timeline__content > time",
			tokens: ["--text-xs", "--fg-2"],
		},
		{
			name: "body",
			description: "The event body copy: a `<p>` (or `.xtyle-timeline__body`).",
			selector: ".xtyle-timeline__content > p",
			tokens: ["--text-sm", "--fg-1", "--leading-normal", "--space-1"],
		},
	],
	props: [
		{
			name: "static",
			type: "boolean",
			default: "false",
			description:
				"Astro only: emit the server-rendered feed but never load the runtime to hydrate it. The dots, rails, and per-event content regions are rendered from the authored `<li>`s at build time, so a static timeline is complete; hydration only adds re-reading the list when it changes. The Svelte and raw-element paths always upgrade, so they carry no equivalent.",
			bindings: ["astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [],
	slots: [
		{
			name: "default",
			description:
				"The ordered list. Provide an `<ol>` (or `<ul>`) whose `<li>` children are the events. Each event's content is relocated into the rendered item's content region, and any attributes on the source `<li>` ride along onto the rendered item.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--space-1",
		"--space-4",
		"--space-5",
		"--accent",
		"--bg-0",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--line",
		"--border-thin",
		"--border-thick",
		"--radius-full",
		"--text-sm",
		"--text-xs",
		"--weight-semibold",
		"--leading-tight",
		"--leading-normal",
	],
	composition: [
		"Feed it real markup: an order history, a changelog, an audit trail, a deploy log. Each `<li>` is one event.",
		"Pair a `<strong>` title with a `<time>` for the when, and an optional `<p>` for the detail; leave the `<p>` off for a terse feed.",
		"Drop a `Badge` or an `Icon` inside an item for a status chip beside the title; both inherit the derived theme.",
		"The dot and the rail are the fill's own nodes: a mod filling `component.timeline` can turn the dot into a per-event icon or dash the rail, without the app changing a line.",
	],
	a11y: [
		"It renders a semantic ordered list, so assistive tech announces the events in order with no ARIA to wire; the dot and rail nodes are decorative and carry `aria-hidden`.",
		"Order is conveyed by the list itself, not by color, so a color-deficient or screen-reader user reads the same sequence.",
		"Use a real `<time datetime=\"…\">` for timestamps so the machine-readable date is exposed alongside the human label.",
	],
	examples: [
		{
			id: "activity-feed",
			title: "Activity feed",
			description: "An ordered list of events; each item takes a dot on the connector rail.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
