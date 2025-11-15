import { fileURLToPath } from "node:url";
import { type Delimiter, decode, encode } from "@toon-format/toon";
import { FastMCP } from "fastmcp";
import { z } from "zod";

export const server = new FastMCP({
	name: "TOON Format Server",
	version: "1.0.0",
});

server.addTool({
	name: "encode_toon",
	description: "Convert JSON data into compact TOON format to save tokens.",
	parameters: z.object({
		json: z
			.string()
			.describe("The JSON data (as a string) to encode into TOON format."),
		indent: z
			.number()
			.optional()
			.default(2)
			.describe("Number of spaces for indentation."),
		delimiter: z
			.enum([",", "\t", "|"])
			.optional()
			.default(",")
			.describe("Delimiter for array values (comma, tab, or pipe)."),
		keyFolding: z
			.enum(["off", "safe"])
			.optional()
			.default("off")
			.describe("Collapse single-key wrapper chains into dotted paths."),
		flattenDepth: z
			.number()
			.optional()
			.describe("Maximum depth for key folding."),
	}),
	execute: async (args) => {
		try {
			let data: unknown;
			try {
				data = JSON.parse(args.json);
			} catch (e) {
				return `Error: Invalid JSON input. ${e instanceof Error ? e.message : String(e)}`;
			}

			const result = encode(data, {
				indent: args.indent,
				delimiter: args.delimiter as Delimiter,
				keyFolding: args.keyFolding,
				flattenDepth: args.flattenDepth,
			});

			return result;
		} catch (error) {
			return `Error encoding TOON: ${error instanceof Error ? error.message : String(error)}`;
		}
	},
});

server.addTool({
	name: "decode_toon",
	description: "Convert TOON formatted text back into standard JSON.",
	parameters: z.object({
		toon: z.string().describe("The TOON formatted string to decode."),
		strict: z
			.boolean()
			.optional()
			.default(true)
			.describe("Enforce strict validation (e.g. array lengths)."),
		expandPaths: z
			.enum(["off", "safe"])
			.optional()
			.default("off")
			.describe("Reconstruct dotted keys into nested objects."),
	}),
	execute: async (args) => {
		try {
			const result = decode(args.toon, {
				strict: args.strict,
				expandPaths: args.expandPaths,
			});

			return JSON.stringify(result, null, 2);
		} catch (error) {
			return `Error decoding TOON: ${error instanceof Error ? error.message : String(error)}`;
		}
	},
});

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
	const args = process.argv.slice(2);
	const transportArg = args.includes("--transport")
		? args[args.indexOf("--transport") + 1]
		: "stdio";
	const portArg = args.includes("--port")
		? args[args.indexOf("--port") + 1]
		: undefined;

	if (transportArg === "http-stream" || transportArg === "httpStream") {
		const port = portArg
			? parseInt(portArg, 10)
			: parseInt(process.env.PORT ?? "8080", 10);
		await server.start({
			transportType: "httpStream",
			httpStream: { port },
		});
	} else {
		await server.start({ transportType: "stdio" });
	}
}
