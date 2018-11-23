/* global describe, it */
"use strict";

let { transformation, skipSlot, eager } = require("../src");
let { silence, noop } = require("./util");
let { strictEqual: assertSame, deepStrictEqual: assertDeep } = require("assert");

let DATA = [{
	type: "party",
	id: 123,
	name: "primo",
	zone: "753",
	active: true
}, {
	type: "party",
	id: 456,
	name: "ultimo",
	zone: 175,
	active: false
}];

let DESCRIPTOR = {
	name: "Party",
	fields: {},
	slots: {
		category: "type",
		id: eager,
		designation: eager("name"),
		zone: ({ zone }) => Number.isInteger(zone) ? zone : parseInt(zone, 10),
		active: true
	},
	stringify: ({ id, designation }) => `#${id} "${designation}"`
};

describe("data transformation", () => {
	it("should transform incoming JSON-style data to corresponding records", () => {
		let descriptor = silence(DESCRIPTOR);
		let transform = transformation(descriptor);

		// NB: eager slots precede lazy ones
		let slots = ["id", "designation", "category", "zone", "active"];

		let record = transform(DATA[0]);
		assertDeep(Object.keys(record), slots);
		assertSame(record.category, "party");
		assertSame(record.id, 123);
		assertSame(record.designation, "primo");
		assertSame(record.zone, 753);
		assertSame(record.active, true);
		assertSame(`${record}`, '<Party #123 "primo">');

		record = transform(DATA[1]);
		assertDeep(Object.keys(record), slots);
		assertSame(record.category, "party");
		assertSame(record.id, 456);
		assertSame(record.designation, "ultimo");
		assertSame(record.zone, 175);
		assertSame(record.active, false);
		assertSame(`${record}`, '<Party #456 "ultimo">');
	});

	it("should support additional context for transformations", () => {
		let descriptor = Object.assign({}, DESCRIPTOR, {
			slots: {
				id: eager,
				zone: ({ zone }, context) => `${zone} (${context.range})`,
				repr: function() { return `${this}`; }
			},
			onError: noop
		});
		let transform = transformation(descriptor);

		let record = transform(DATA[0], { range: "small" });
		assertSame(record.id, 123);
		assertSame(record.zone, "753 (small)");
		assertSame(record.repr, '<Party #123 "undefined">');

		record = transform(DATA[0], { range: "large" });
		assertSame(record.zone, "753 (large)");
		assertSame(record.repr, '<Party #123 "undefined">');
	});

	it("should support skipping instance properties", () => {
		let descriptor = silence(DESCRIPTOR);
		let transform = transformation(descriptor);
		let record = transform(DATA[0]);
		assertDeep(Object.keys(record),
				["id", "designation", "category", "zone", "active"]);

		descriptor = Object.assign({}, DESCRIPTOR, {
			slots: Object.assign({}, DESCRIPTOR.slots, {
				zone: ({ zone }) => skipSlot
			}),
			onError: noop
		});
		transform = transformation(descriptor);
		record = transform(DATA[0]);
		assertDeep(Object.keys(record), ["id", "designation", "category", "active"]);
	});
});
