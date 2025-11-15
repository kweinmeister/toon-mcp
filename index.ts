import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { decode, encode } from "@toon-format/toon";
import { FastMCP } from "fastmcp";
import { z } from "zod";

export const server = new FastMCP({
	name: "TOON Format Server",
	version: "1.0.0",
});

export const encodeParameters = z.object({
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
		.default(Infinity)
		.describe("Maximum depth for key folding."),
});

export const encodeToolExecute = async (
	args: z.infer<typeof encodeParameters>,
) => {
	try {
		let data: unknown;
		try {
			data = JSON.parse(args.json);
		} catch (e) {
			return `Error: Invalid JSON input. ${e instanceof Error ? e.message : String(e)}`;
		}

		const result = encode(data, {
			indent: args.indent,
			delimiter: args.delimiter,
			keyFolding: args.keyFolding,
			flattenDepth: args.flattenDepth,
		});

		return result;
	} catch (error) {
		return `Error encoding TOON: ${error instanceof Error ? error.message : String(error)}`;
	}
};

server.addTool({
	name: "encode_toon",
	description: "Convert JSON data into compact TOON format to save tokens.",
	parameters: encodeParameters,
	execute: encodeToolExecute,
});

export const decodeParameters = z.object({
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
});

export const decodeToolExecute = async (
	args: z.infer<typeof decodeParameters>,
) => {
	try {
		const result = decode(args.toon, {
			strict: args.strict,
			expandPaths: args.expandPaths,
		});

		return JSON.stringify(result, null, 2);
	} catch (error) {
		return `Error decoding TOON: ${error instanceof Error ? error.message : String(error)}`;
	}
};

server.addTool({
	name: "decode_toon",
	description: "Convert TOON formatted text back into standard JSON.",
	parameters: decodeParameters,
	execute: decodeToolExecute,
});

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
	const { values } = parseArgs({
		args: process.argv.slice(2),
		options: {
			transport: { type: "string", default: "stdio" },
			port: { type: "string" },
		},
	});

	const transportArg = values.transport;
	const portArg = values.port;

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
