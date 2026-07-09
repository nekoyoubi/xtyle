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
		"Timeline turns a semantic ordered list into a vertical activity feed. It wraps an `<ol>` of `<li>` events and decorates them: each item grows a themed dot on a connector rail that runs from one event to the next and stops at the last. It renders no markup of its own beyond the classes it adds, so the list stays the source of truth for order and content, and screen readers hear a plain ordered list. Inside an item, a `<strong>` reads as the event title, a `<time>` as its timestamp, and a `<p>` as the body; the same styling is available through `xtyle-timeline__title` / `__meta` / `__body` classes if the markup can't use those elements. Being standalone (like `Table`), it needs no runtime to render, only the derived token register the rail and dots draw from.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "list",
			description: "The decorated ordered list; carries no bullets and no default spacing.",
			selector: ".xtyle-timeline__list",
			tokens: [],
		},
		{
			name: "item",
			description: "One event. Its marker dot and the connector rail below it are drawn as pseudo-elements.",
			selector: ".xtyle-timeline__item",
			tokens: ["--space-5", "--space-4", "--accent", "--bg-0", "--line", "--border-thin", "--border-thick", "--radius-full"],
		},
		{
			name: "title",
			description: "The event title: a `<strong>` (or `.xtyle-timeline__title`).",
			selector: ".xtyle-timeline__item > strong",
			tokens: ["--text-sm", "--weight-semibold", "--fg-0", "--leading-tight"],
		},
		{
			name: "meta",
			description: "The timestamp or secondary line: a `<time>` (or `.xtyle-timeline__meta`).",
			selector: ".xtyle-timeline__item > time",
			tokens: ["--text-xs", "--fg-2"],
		},
		{
			name: "body",
			description: "The event body copy: a `<p>` (or `.xtyle-timeline__body`).",
			selector: ".xtyle-timeline__item > p",
			tokens: ["--text-sm", "--fg-1", "--leading-normal", "--space-1"],
		},
	],
	props: [],
	variants: [],
	sizes: [],
	states: [],
	slots: [
		{
			name: "default",
			description: "The ordered list. Provide an `<ol>` (or `<ul>`) whose `<li>` children are the events.",
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
	],
	a11y: [
		"It renders a semantic ordered list, so assistive tech announces the events in order with no ARIA to wire; the dots and rail are decorative pseudo-elements that carry no content.",
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
