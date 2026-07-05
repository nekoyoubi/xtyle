/**
 * A deliberately tiny inline-markdown renderer for manifest prose.
 *
 * Manifest `summary` / `description` fields use a constrained subset of
 * markdown — inline code, bold, italic, and links — across one or more
 * paragraphs. A full markdown engine would be overkill and a new dependency,
 * so this handles exactly that subset and HTML-escapes everything else.
 *
 * The output is trusted only for first-party manifest content; it is not a
 * general-purpose sanitizer.
 */

const CODE_SENTINEL_OPEN = "@@XTYLECODE@@";
const CODE_SENTINEL_CLOSE = "@@/XTYLECODE@@";
const CODE_TOKEN = /@@XTYLECODE@@(\d+)@@\/XTYLECODE@@/g;

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function renderInline(text: string): string {
	const codeSpans: string[] = [];
	let working = text.replace(/`([^`]+)`/g, (_m, code: string) => {
		const token = `${CODE_SENTINEL_OPEN}${codeSpans.length}${CODE_SENTINEL_CLOSE}`;
		codeSpans.push(`<code>${escapeHtml(code)}</code>`);
		return token;
	});

	working = escapeHtml(working);

	working = working.replace(
		/\[([^\]]+)\]\(([^)]+)\)/g,
		(_m, label: string, href: string) =>
			`<a href="${escapeHtml(href)}">${label}</a>`,
	);
	working = working.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
	working = working.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");

	working = working.replace(
		CODE_TOKEN,
		(_m, index: string) => codeSpans[Number(index)] ?? "",
	);

	return working;
}

export function renderMarkdown(source: string): string {
	const paragraphs = source.trim().split(/\n{2,}/);
	return paragraphs
		.map((para) => `<p>${renderInline(para.trim())}</p>`)
		.join("\n");
}

export function renderMarkdownInline(source: string): string {
	return renderInline(source.trim());
}
