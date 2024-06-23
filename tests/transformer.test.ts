import { readFileSync } from "fs";
import { describe, expect, test } from "vitest";
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
	["self reassignment", "x = x + 1", "x.expr = `${x.expr} + 1`;"],
	// ["update identifier", "x += z + 2;", 'x.expr += "z.get() + 2";'], Need to change += semantics
	["expression statement", "x + 1", "x.get() + 1"],
])("transform %s", (_desc, before, after) => {
	const expanded = transform({
		content: before,
		filename: "file.svelte.ts",
	});

	expect(expanded.trim()).toEqual(after);
});

describe("reactivity", () => {
	test.each([
		["derived", 3],
		["self-assignment", 4],
	])("run %s", (filename, result) => {
		const content = readFileSync(`./tests/reactivity/${filename}.js`, {
			encoding: "utf8",
		});
		const code = transform({ filename, content });

		expect(eval(code)).toEqual(result);
	});
});
