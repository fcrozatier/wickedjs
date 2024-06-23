import { readFileSync } from "fs";
import { describe, expect, it, test } from "vitest";
import { transform } from "../src/transformer.js";

test.each([
	[
		"create identifier",
		"let x = 1;",
		'let x = { get() { return eval(this.expr); }, expr: "1" };',
	],
	[
		"get identifier",
		"let y = x + 1;",
		'let y = { get() { return eval(this.expr); }, expr: "x.get() + 1" };',
	],
	["reassign identifier", "x = z + 2;", 'x.expr = "z.get() + 2";'],
	// ["update identifier", "x += z + 2;", 'x.expr += "z.get() + 2";'], Need to change += semantics
	["expression statement", "x + 1", "x.get() + 1"],
])("transform %s", async (_desc, before, after) => {
	const expanded = transform({
		content: before,
		filename: "file.svelte.ts",
	});

	expect(expanded.trim()).toEqual(after);
});

const filename = "reactivity.ts";
const content = readFileSync(`./tests/${filename}`, { encoding: "utf8" });

describe("reactivity", () => {
	it("is reactive", () => {
		const code = transform({ filename, content });
		expect(eval(code)).toEqual(3);
	});
});
