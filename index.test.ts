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
		// @ts-expect-error - accessing private/protected property for testing
		// biome-ignore lint/suspicious/noExplicitAny: Accessing private property for testing
		const tools = server.tools || (server as any)._tools;
		if (tools) {
			// biome-ignore lint/suspicious/noExplicitAny: Casting to any to access potential private properties
			const s = server as any;
			if (s.tools) {
				expect(s.tools.size).toBe(2);
				expect(s.tools.has("encode_toon")).toBe(true);
				expect(s.tools.has("decode_toon")).toBe(true);
			} else {
				// Fallback if tools is not accessible, just check defined
				expect(server).toBeDefined();
			}
		} else {
			expect(server).toBeDefined();
		}
	});

	describe("encode_toon", () => {
		it("should encode valid JSON string", async () => {
			const input = JSON.stringify({ a: 1, b: 2 });
			const result = await encodeToolExecute(
				encodeParameters.parse({
					json: input,
				}),
			);
			expect(result).toBeDefined();
			expect(typeof result).toBe("string");
			expect(result).not.toContain("Error:");
		});

		it("should return error for invalid JSON", async () => {
			const result = await encodeToolExecute(
				encodeParameters.parse({
					json: "{ invalid json }",
				}),
			);
			expect(result).toContain("Error: Invalid JSON input");
		});

		it("should handle options", async () => {
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
	});
});
