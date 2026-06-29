import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./tools.js";
import { registerResources } from "./resources.js";

export const SERVER_NAME = "xoji";

export interface ServerBuildInfo {
	name: string;
	version: string;
	builtAt: string;
}

function buildTimestamp(): string {
	try {
		return statSync(fileURLToPath(import.meta.url)).mtime.toISOString();
	} catch {
		return "unknown";
	}
}

export function createServer(version: string): McpServer {
	const server = new McpServer({ name: SERVER_NAME, version });
	registerTools(server, { name: SERVER_NAME, version, builtAt: buildTimestamp() });
	registerResources(server);
	return server;
}
