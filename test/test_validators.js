/* global describe, it */
"use strict";

let { objectKeys } = require("../src/validators");
let { strictEqual: assertSame, deepStrictEqual: assertDeep } = require("assert");

describe("validators", () => {
	it("should detect discrepancies in objects' top-level structure", () => {
		let value = {
			foo: "hello",
			bar: "world"
		};
		let expected = ["foo", "bar"];
		let errors = [];
		let errback = (type, diff) => void errors.push({ type, diff });

		let valid = objectKeys(value, expected, errback);
		assertSame(valid, true);
		assertDeep(errors, []);

		expected.push("baz");
		valid = objectKeys(value, expected, errback);
		assertSame(valid, false);
		assertDeep(errors, [{
			type: "missing",
			diff: ["baz"]
		}]);

		value.baz = "…";
		errors = [];
		valid = objectKeys(value, expected, errback);
		assertSame(valid, true);
		assertDeep(errors, []);

		expected = ["lorem", "ipsum"];
		valid = objectKeys(value, expected, errback);
		assertSame(valid, false);
		assertDeep(errors, [{
			type: "missing",
			diff: ["lorem", "ipsum"]
		}, {
			type: "spurious",
			diff: ["foo", "bar", "baz"]
		}]);
	});
});
