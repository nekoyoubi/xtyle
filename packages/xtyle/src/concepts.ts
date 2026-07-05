import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface Concept {
	id: string;
	title: string;
	body: string;
}

const CONCEPT_ORDER = ["overview", "open-register", "algorithms", "consuming"];

// Concepts ship as markdown beside the package's dist/ so a published install and
// the site build read one source. This module touches the filesystem, so it stays
// off the environment-neutral index entry and is imported only by Node consumers.
const conceptsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "concepts");

function parse(id: string, input: string): Concept {
	const lines = input.replace(/\r\n/g, "\n").split("\n");
	let title = id;
	let bodyStart = 0;
	for (let i = 0; i < lines.length; i += 1) {
		const heading = lines[i]?.match(/^#\s+(.+)$/);
		if (heading?.[1]) {
			title = heading[1].trim();
			bodyStart = i + 1;
			break;
		}
	}
	return { id, title, body: lines.slice(bodyStart).join("\n").trim() };
}

export function listConcepts(): Concept[] {
	return CONCEPT_ORDER.map((id) => parse(id, readFileSync(join(conceptsDir, `${id}.md`), "utf-8")));
}

export function getConcept(id: string): Concept | undefined {
	if (!CONCEPT_ORDER.includes(id)) return undefined;
	return parse(id, readFileSync(join(conceptsDir, `${id}.md`), "utf-8"));
}
