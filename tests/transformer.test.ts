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
	["call expression", "f(x);", "f(x);"],
])("transform %s", (_desc, before, after) => {
	const transformed = transform({
		content: before,
		filename: "file.ts",
	});

	expect(transformed.trim()).toEqual(after);
});

describe("reactivity", () => {
	test.each([
		["a-derived.js", 3],
		["b-self-assignment.js", 4],
		// ["c-function-boundary.js", 4],
	])("run %s", (filename, result) => {
		const content = readFileSync(`./tests/reactivity/${filename}`, {
			encoding: "utf8",
		});
		const code = transform({ filename, content });

		expect(eval(code)).toEqual(result);
	});
});
