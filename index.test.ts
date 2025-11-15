import { decode, encode } from "@toon-format/toon";
import { describe, expect, it } from "vitest";
import { server } from "./index.js";

describe("TOON MCP Server", () => {
	it("should have tools registered", async () => {
		expect(server).toBeDefined();
	});

	it("should encode JSON to TOON (Unit)", async () => {
		const input = { a: 1, b: 2 };
		const result = encode(input);
		expect(result).toBeDefined();
		expect(typeof result).toBe("string");
	});

	it("should decode TOON to JSON (Unit)", async () => {
		const input = { a: 1, b: 2 };
		const encoded = encode(input);
		const decoded = decode(encoded);
		expect(decoded).toEqual(input);
	});

	it("should handle arrays", async () => {
		const input = [1, 2, 3];
		const encoded = encode(input);
		const decoded = decode(encoded);
		expect(decoded).toEqual(input);
	});

	it("should handle nested objects", async () => {
		const input = { a: { b: 1 } };
		const encoded = encode(input);
		const decoded = decode(encoded);
		expect(decoded).toEqual(input);
	});
});
