import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const SITE_FALLBACK = "https://xoji.dev";

const SUMMARY =
	"xoji is a themable-derivation engine and component contract. A named, swappable algorithm maps a small set of overridable anchors plus a few knobs into a full, internally-consistent design-token set, co-designed against a component library so any valid theme renders well out of the box. The algorithm is the durable asset; a theme is a materialized invocation of one.";

// Authored concept narrative under src/llms/. Order is the reading order in the
// full-text corpus. A fixed allow-list (never a glob) keeps gitignored working
// docs out of the published artifact by construction.
const CONCEPTS = ["overview", "open-register", "algorithms", "consuming"];

const GUIDES = [
	{
		slug: "start",
		title: "Getting Started",
		description: "Derive a theme and build against the component contract in a few minutes.",
	},
	{
		slug: "algorithms",
		title: "Authoring Algorithms",
		description: "Write an algorithm as an xript plugin: the mod anatomy, declared knobs, and the gauntlet that proves it.",
	},
	{
		slug: "extending-components",
		title: "Extending Components",
		description: "Extend a custom element, subclass a shipped component, and satisfy the coverage rule for tokens you add.",
	},
	{
		slug: "generator",
		title: "The Bench",
		description: "Derive themes live in the browser and author algorithms on-site, theme and algorithm studio in one.",
	},
	{
		slug: "changelog",
		title: "Changelog",
		description: "What changed in each xoji release.",
	},
];

const CATEGORY_ORDER = [
	["control", "Controls"],
	["form", "Forms"],
	["navigation", "Navigation"],
	["feedback", "Feedback"],
	["overlay", "Overlays"],
	["data-display", "Data display"],
	["layout", "Layout"],
	["shell", "Shell"],
];

function parseDoc(input) {
	const raw = input.replace(/\r\n/g, "\n");
	const lines = raw.split("\n");
	let title = "Untitled";
	let bodyStart = 0;
	for (let i = 0; i < lines.length; i += 1) {
		const heading = lines[i].match(/^#\s+(.+)$/);
		if (heading) {
			title = heading[1].trim();
			bodyStart = i + 1;
			break;
		}
	}
	const body = lines.slice(bodyStart).join("\n").trim();
	return { title, body };
}

function componentSection(component, url) {
	const lines = [`# Component: ${component.name}`, `Source: ${url}`, ""];
	lines.push(`Category: ${component.category}. Bindings: ${component.bindings.join(", ")}.`, "");
	lines.push(component.description || component.summary, "");

	if (component.props.length) {
		lines.push("## Props", "");
		for (const prop of component.props) {
			const opts = prop.options?.length ? ` (one of: ${prop.options.join(", ")})` : "";
			const def = prop.default !== undefined ? `, default \`${prop.default}\`` : "";
			lines.push(`- \`${prop.name}\`: \`${prop.type}\`${def}${opts}. ${prop.description}`);
		}
		lines.push("");
	}

	if (component.variants.length) {
		lines.push("## Variants", "");
		for (const variant of component.variants) lines.push(`- **${variant.name}**: ${variant.description}`);
		lines.push("");
	}

	if (component.states.length) {
		lines.push("## States", "");
		for (const state of component.states) lines.push(`- **${state.name}**: ${state.description}`);
		lines.push("");
	}

	if (component.slots.length) {
		lines.push("## Slots", "");
		for (const slot of component.slots) lines.push(`- **${slot.name}**: ${slot.description}`);
		lines.push("");
	}

	if (component.consumedTokens.length) {
		lines.push("## Consumed tokens", "");
		lines.push(component.consumedTokens.map((token) => `\`${token}\``).join(", "), "");
	}

	if (component.a11y.length) {
		lines.push("## Accessibility", "");
		for (const note of component.a11y) lines.push(`- ${note}`);
		lines.push("");
	}

	if (component.examples.length) {
		lines.push("## Examples", "");
		for (const example of component.examples) {
			lines.push(`### ${example.title}`, "");
			if (example.description) lines.push(example.description, "");
			const source = example.source.astro ?? example.source.html ?? example.source.svelte;
			if (source) lines.push("```", source.trim(), "```", "");
		}
	}

	return lines.join("\n").trim();
}

export function llmsTxt() {
	let conceptsDir;
	let site = SITE_FALLBACK;
	return {
		name: "xoji-llms-txt",
		hooks: {
			"astro:config:done": ({ config }) => {
				conceptsDir = join(fileURLToPath(config.srcDir), "llms");
				if (config.site) site = config.site.replace(/\/$/, "");
			},
			"astro:build:done": async ({ dir, logger }) => {
				const { listComponents } = await import("@xoji/core");
				const components = listComponents().slice().sort((a, b) => a.name.localeCompare(b.name));

				const concepts = [];
				for (const slug of CONCEPTS) {
					concepts.push(parseDoc(await readFile(join(conceptsDir, `${slug}.md`), "utf-8")));
				}

				const guideUrl = (slug) => `${site}/${slug}/`;
				const componentUrl = (id) => `${site}/components/${id}/`;

				const index = [`# xoji`, "", `> ${SUMMARY}`, ""];
				index.push(
					"xoji separates the reusable engine (an **algorithm**) from any one materialized **theme**. The token register is open: authors declare new tokens and rewire derivation, held by a single hard contract, a coverage check between what components consume and what an algorithm produces. A derived theme is just CSS custom properties; the runtime is optional.",
					"",
				);

				index.push("## Guides", "");
				for (const guide of GUIDES) {
					index.push(`- [${guide.title}](${guideUrl(guide.slug)}): ${guide.description}`);
				}
				index.push("");

				index.push("## Components", "");
				for (const [category, label] of CATEGORY_ORDER) {
					const inCategory = components.filter((component) => component.category === category);
					if (!inCategory.length) continue;
					index.push(`### ${label}`, "");
					for (const component of inCategory) {
						index.push(`- [${component.name}](${componentUrl(component.id)}): ${component.summary}`);
					}
					index.push("");
				}

				index.push("## Full text", "", `- [Full documentation](${site}/llms-full.txt): every concept and component reference inlined.`, "");

				const full = [`# xoji: Full Documentation`, "", `> ${SUMMARY}`, "", `Source: ${site}`, ""];
				full.push("", "## Concepts", "");
				for (const concept of concepts) {
					full.push("", "----------------------------------------", "", `# ${concept.title}`, "", concept.body, "");
				}
				full.push("", "## Components", "");
				for (const component of components) {
					full.push("", "----------------------------------------", "", componentSection(component, componentUrl(component.id)), "");
				}

				await writeFile(new URL("./llms.txt", dir), `${index.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`, "utf-8");
				await writeFile(new URL("./llms-full.txt", dir), `${full.join("\n").replace(/\n{4,}/g, "\n\n\n").trim()}\n`, "utf-8");
				logger.info(`xoji-llms-txt: wrote llms.txt and llms-full.txt (${concepts.length} concepts, ${components.length} components)`);
			},
		},
	};
}
