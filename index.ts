#!/usr/bin/env npx tsx
import { realpathSync } from "node:fs";
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
		.describe("Number of spaces for indentation. Defaults to 2."),
	delimiter: z
		.enum([",", "\t", "|"])
		.optional()
		.describe(
			"Delimiter for array values (comma, tab, or pipe). Defaults to comma.",
		),
	keyFolding: z
		.enum(["off", "safe"])
		.optional()
		.describe(
			"Collapse single-key wrapper chains into dotted paths. Defaults to 'off'.",
		),
	flattenDepth: z
		.number()
		.optional()
		.describe("Maximum depth for key folding. Defaults to Infinity."),
});

export const encodeToolExecute = async (
	args: z.infer<typeof encodeParameters>,
) => {
	try {
		const jsonInput = JSON.parse(args.json);

		const result = encode(jsonInput, {
			indent: args.indent ?? 2,
			delimiter: args.delimiter ?? ",",
			keyFolding: args.keyFolding ?? "off",
			flattenDepth: args.flattenDepth ?? Infinity,
		});

		return result;
	} catch (error) {
		return `Error encoding TOON: ${
			error instanceof Error ? error.message : String(error)
		}`;
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
		.describe(
			"Enforce strict validation (e.g. array lengths). Defaults to true.",
		),
	expandPaths: z
		.enum(["off", "safe"])
		.optional()
		.describe(
			"Reconstruct dotted keys into nested objects. Defaults to 'off'.",
		),
});

export const decodeToolExecute = async (
	args: z.infer<typeof decodeParameters>,
) => {
	try {
		const result = decode(args.toon, {
			strict: args.strict ?? true,
			expandPaths: args.expandPaths ?? "off",
		});

		return JSON.stringify(result, null, 2);
	} catch (error) {
		return `Error decoding TOON: ${
			error instanceof Error ? error.message : String(error)
		}`;
	}
};

server.addTool({
	name: "decode_toon",
	description: "Convert TOON formatted text back into standard JSON.",
	parameters: decodeParameters,
	execute: decodeToolExecute,
});

const isMain = realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);

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

	if (transportArg?.toLowerCase() === "http-stream") {
		const portValue = portArg ?? process.env.PORT ?? "8080";
		const port = parseInt(portValue, 10);

		if (Number.isNaN(port)) {
			console.error(`Error: Invalid port specified: '${portValue}'.`);
			process.exit(1);
		}

		await server.start({
			transportType: "httpStream",
			httpStream: { port },
		});
	} else {
		await server.start({ transportType: "stdio" });
	}
}
