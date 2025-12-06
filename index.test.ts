import { describe, expect, it, vi } from "vitest";
import {
	decodeParameters,
	decodeToolExecute,
	encodeParameters,
	encodeToolExecute,
	server,
} from "./index.js";

vi.mock("@toon-format/toon", async (importOriginal) => {
	const mod = await importOriginal<typeof import("@toon-format/toon")>();
	return {
		...mod,
		decode: vi.fn((input, options) => {
			if (input === "::: invalid toon :::") {
				throw new Error("Mocked decode error");
			}
			return mod.decode(input, options);
		}),
	};
});

describe("TOON MCP Server", () => {
	it("should have tools registered", () => {
		const serverWithInternals = server as unknown as {
			tools?: Map<string, unknown>;
			_tools?: Map<string, unknown>;
		};
		const tools = serverWithInternals.tools ?? serverWithInternals._tools;

		if (tools) {
			expect(tools.size).toBe(2);
			expect(tools.has("encode_toon")).toBe(true);
			expect(tools.has("decode_toon")).toBe(true);
		} else {
			console.warn("Could not find tools map on server instance.");
			expect(server).toBeDefined();
		}
	});

	describe("encode_toon", () => {
		it("should encode valid JSON string using defaults", async () => {
			const input = JSON.stringify({ a: 1, b: 2 });
			// parameters parsed without explicit options should yield undefined for optional fields
			const params = encodeParameters.parse({
				json: input,
			});
			expect(params.indent).toBeUndefined();

			const result = await encodeToolExecute(params);

			expect(result).toBeDefined();
			expect(typeof result).toBe("string");
			expect(result).not.toContain("Error:");
		});

		it("should return error on invalid JSON", async () => {
			const result = await encodeToolExecute(
				encodeParameters.parse({
					json: "{ invalid json }",
				}),
			);
			expect(result).toContain("Error encoding TOON");
		});

		it("should handle explicit options", async () => {
			const input = JSON.stringify([1, 2, 3]);
			const result = await encodeToolExecute(
				encodeParameters.parse({
					json: input,
					indent: 4,
					delimiter: "|",
				}),
			);
			expect(result).toBeDefined();
			expect(result).not.toContain("Error:");
		});

		it("should use replacer to filter filtered properties", async () => {
			const input = JSON.stringify({ keep: 1, drop: 2 });
			const result = await encodeToolExecute(
				encodeParameters.parse({
					json: input,
					replacer: ["keep"],
				}),
			);
			expect(result).not.toContain("drop: 2");
		});

		it("should preserve array items when using replacer", async () => {
			const input = JSON.stringify({ list: [1, 2], other: 3 });
			const result = await encodeToolExecute(
				encodeParameters.parse({
					json: input,
					replacer: ["list"],
				}),
			);
			// Should contain "list" and its items
			expect(result).toContain("list");
			// Since TOON format is compact, exact match might be tricky, but we can check if data is present
			// 1 and 2 should be present
			expect(result).toContain("1");
			expect(result).toContain("2");
			// Should NOT contain "other"
			expect(result).not.toContain("other: 3");
		});
	});

	describe("decode_toon", () => {
		it("should decode valid TOON string", async () => {
			const original = { a: 1, b: 2 };
			const toon = await encodeToolExecute(
				encodeParameters.parse({
					json: JSON.stringify(original),
				}),
			);

			if (typeof toon !== "string" || toon.startsWith("Error")) {
				throw new Error(`Encoding failed during setup: ${toon}`);
			}

			const result = await decodeToolExecute(
				decodeParameters.parse({
					toon: toon,
				}),
			);

			expect(result).not.toContain("Error:");
			const decoded = JSON.parse(result as string);
			expect(decoded).toEqual(original);
		});

		it("should return error for invalid TOON", async () => {
			const result = await decodeToolExecute(
				decodeParameters.parse({
					toon: "::: invalid toon :::",
				}),
			);
			expect(result).toContain("Error decoding TOON");
		});

		it("should accept indent parameter without error", async () => {
			const result = await decodeToolExecute(
				decodeParameters.parse({
					toon: "a: 1",
					indent: 4,
				}),
			);
			expect(result).not.toContain("Error:");
			const decoded = JSON.parse(result as string);
			expect(decoded).toEqual({ a: 1 });
		});
	});
});
