/* global describe, it */
"use strict";

let { transformation, eager } = require("../src");
let { makeLogger } = require("./util");
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
		id: eager,
		designation: "name" // NB: intentionally _not_ eager
	},
	stringify: ({ id, designation }) => `#${id} "${designation}"`
};

describe("data validation", () => {
	it("should report discrepancies regarding top-level structure", () => {
		let descriptor = makeDescriptor();
		let transform = transformation(descriptor);

		let record = transform(DATA[0]);
		assertDeep(descriptor.logger.messages.info, []);
		assertDeep(descriptor.logger.messages.warn, [ /* eslint-disable max-len */
			'<Party #123 "undefined">: spurious entries `["type","id","name","zone","active"]`'
		]); /* eslint-enable max-len */
		// ensure data was transformed anyway
		assertDeep(Object.keys(record), ["id", "designation"]);
		assertSame(record.id, 123);
		assertSame(record.designation, "primo");

		// add fields specification
		descriptor.logger = makeLogger();
		descriptor.fields = {
			zone: acceptAll,
			id: acceptAll
		};
		transform = transformation(descriptor);

		record = transform(DATA[0]);
		assertDeep(descriptor.logger.messages.info, []);
		assertDeep(descriptor.logger.messages.warn, [
			'<Party #123 "undefined">: spurious entries `["type","name","active"]`'
		]);

		// extend fields specification
		descriptor.logger = makeLogger();
		descriptor.fields = {
			type: acceptAll,
			id: acceptAll,
			name: acceptAll,
			zone: acceptAll,
			active: acceptAll
		};
		transform = transformation(descriptor);

		record = transform(DATA[0]);
		assertDeep(descriptor.logger.messages.info, []);
		assertDeep(descriptor.logger.messages.warn, []);
	});
});

function makeDescriptor() {
	let logger = makeLogger(); // required to suppress nagging validation
	return Object.assign({ logger }, DESCRIPTOR);
}

function acceptAll() {
	return true;
}
