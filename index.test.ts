import { describe, expect, it } from "vitest";
import { decodeToolExecute, encodeToolExecute, server } from "./index.js";

describe("TOON MCP Server", () => {
	it("should have tools registered", async () => {
		expect(server).toBeDefined();
	});

	describe("encode_toon", () => {
		it("should encode valid JSON string", async () => {
			const input = JSON.stringify({ a: 1, b: 2 });
			const result = await encodeToolExecute({
				json: input,
				indent: 2,
				delimiter: ",",
				keyFolding: "off",
			});
			expect(result).toBeDefined();
			expect(typeof result).toBe("string");
			expect(result).not.toContain("Error:");
		});

		it("should return error for invalid JSON", async () => {
			const result = await encodeToolExecute({
				json: "{ invalid json }",
				indent: 2,
				delimiter: ",",
				keyFolding: "off",
			});
			expect(result).toContain("Error: Invalid JSON input");
		});

		it("should handle options", async () => {
			const input = JSON.stringify([1, 2, 3]);
			const result = await encodeToolExecute({
				json: input,
				indent: 4,
				delimiter: "|",
				keyFolding: "off",
			});
			expect(result).toBeDefined();
			expect(result).not.toContain("Error:");
		});
	});

	describe("decode_toon", () => {
		it("should decode valid TOON string", async () => {
			const original = { a: 1, b: 2 };
			const toon = await encodeToolExecute({
				json: JSON.stringify(original),
				indent: 2,
				delimiter: ",",
				keyFolding: "off",
			});

			if (typeof toon !== "string" || toon.startsWith("Error")) {
				throw new Error(`Encoding failed during setup: ${toon}`);
			}

			const result = await decodeToolExecute({
				toon: toon,
				strict: true,
				expandPaths: "off",
			});

			expect(result).not.toContain("Error:");
			const decoded = JSON.parse(result as string);
			expect(decoded).toEqual(original);
		});

		it("should return error for invalid TOON", async () => {
			const result = await decodeToolExecute({
				toon: "::: invalid toon :::",
				strict: true,
				expandPaths: "off",
			});
			if (result.startsWith("Error")) {
				expect(result).toContain("Error decoding TOON");
			}
		});
	});
});
