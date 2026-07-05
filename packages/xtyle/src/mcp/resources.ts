import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listConcepts } from "../concepts.js";
import { listComponents, getComponent } from "../manifest/registry.js";

export function registerResources(server: McpServer): void {
	for (const concept of listConcepts()) {
		const uri = `xtyle://concept/${concept.id}`;
		server.registerResource(
			`concept-${concept.id}`,
			uri,
			{ title: concept.title, description: `xtyle concept: ${concept.title}`, mimeType: "text/markdown" },
			async () => ({ contents: [{ uri, mimeType: "text/markdown", text: `# ${concept.title}\n\n${concept.body}` }] }),
		);
	}

	for (const component of listComponents()) {
		const uri = `xtyle://component/${component.id}`;
		server.registerResource(
			`component-${component.id}`,
			uri,
			{ title: component.name, description: component.summary, mimeType: "application/json" },
			async () => ({ contents: [{ uri, mimeType: "application/json", text: JSON.stringify(getComponent(component.id), null, 2) }] }),
		);
	}
}
