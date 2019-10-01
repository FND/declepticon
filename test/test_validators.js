/* global describe, it */
"use strict";

let { struct } = require("../src");
let {
	objectKeys,
	arrayOf,
	array,
	integerString,
	nonBlankString,
	string,
	integer,
	boolean
} = require("../src/validators");
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

	it("should detect arrays, optionally including its items", () => {
		assertSame(array("foo"), false);
		assertSame(array(["foo"]), true);
		assertSame(array(["foo", 123]), true);

		let integerArray = arrayOf(integer);
		let values = ["123", "456"];
		assertSame(integerArray([123, 456]), true);
		assertSame(integerArray(values), false);
		assertSame(arrayOf(integerString)(values), true);

		values = [];
		let errors = [];
		let complexArray = arrayOf(struct("Item", {
			id: 123
		}), {
			onError: msg => void errors.push(msg)
		});
		assertSame(complexArray(values), true);
		assertDeep(errors, []);
		values.push({ id: 123 });
		assertSame(complexArray(values), true);
		assertDeep(errors, []);
		values.push({ id: 456 });
		assertSame(complexArray(values), false);
		assertDeep(errors, ["<Item> invalid `id`: `456`"]);
	});

	it("should detect integers within strings", () => {
		assertSame(integerString(" 123 "), true);
		assertSame(integerString("0"), true);
		assertSame(integerString(""), false);
		assertSame(integerString(" "), false);
		assertSame(integerString(123), false);
		assertSame(integerString(null), false);
		assertSame(integerString(undefined), false);
	});

	it("should detect non-blank strings", () => {
		assertSame(nonBlankString("0"), true);
		assertSame(nonBlankString(""), false);
		assertSame(nonBlankString(" "), false);
		assertSame(nonBlankString(0), false);
		assertSame(nonBlankString(null), false);
		assertSame(nonBlankString(undefined), false);
	});

	it("should detect strings", () => {
		assertSame(string(""), true);
		assertSame(string(" "), true);
		assertSame(string("123"), true);
		assertSame(string(0), false);
		assertSame(string(null), false);
		assertSame(string(undefined), false);
	});

	it("should detect integers", () => {
		assertSame(integer("123"), false);
		assertSame(integer(123), true);
		assertSame(integer(0), true);
		assertSame(integer(null), false);
		assertSame(integer(undefined), false);
	});

	it("should detect booleans", () => {
		assertSame(boolean(true), true);
		assertSame(boolean(false), true);
		assertSame(boolean("true"), false);
		assertSame(boolean("false"), false);
		assertSame(boolean(null), false);
		assertSame(boolean(undefined), false);
	});
});
