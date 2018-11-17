/* global describe, it */
"use strict";

let { transformation, struct, optional, eager } = require("../src");
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

	it("should support optional top-level fields", () => {
		let descriptor = makeDescriptor();
		descriptor.fields = {
			type: optional(acceptAll),
			id: acceptAll,
			name: rejectAll,
			time: optional(rejectAll, rejectAll, rejectAll, acceptAll)
		};
		let transform = transformation(descriptor);

		transform({
			name: "bogus",
			time: 123456789,
			extra: null
		});
		assertDeep(descriptor.logger.messages.info, []);
		assertDeep(descriptor.logger.messages.warn, [
			'<Party #undefined "undefined"> invalid `name`: `"bogus"`',
			'<Party #undefined "undefined">: missing entries `["id"]`',
			'<Party #undefined "undefined">: spurious entries `["extra"]`'
		]);
	});

	it("should report invalid property values in incoming data", () => {
		let descriptor = makeDescriptor();
		descriptor.fields = {
			type: rejectAll,
			id: rejectAll,
			name: rejectAll,
			zone: rejectAll,
			active: rejectAll
		};
		let transform = transformation(descriptor);

		let record = transform(DATA[0]);
		assertDeep(descriptor.logger.messages.info, []);
		assertDeep(descriptor.logger.messages.warn, [
			'<Party #123 "undefined"> invalid `type`: `"party"`',
			'<Party #123 "undefined"> invalid `id`: `123`',
			'<Party #123 "undefined"> invalid `name`: `"primo"`',
			'<Party #123 "undefined"> invalid `zone`: `"753"`',
			'<Party #123 "undefined"> invalid `active`: `true`'
		]);
		// ensure data was transformed properly
		assertDeep(Object.keys(record), ["id", "designation"]);
		assertSame(record.id, 123);
		assertSame(record.designation, "primo");
	});

	it("should support multiple validators per field as `OR` conjunction", () => {
		let descriptor = makeDescriptor();
		descriptor.fields = {
			type: [rejectAll, acceptAll],
			id: [acceptAll, rejectAll],
			name: [rejectAll, rejectAll],
			zone: [acceptAll, acceptAll],
			active: [rejectAll, "always"]
		};
		let transform = transformation(descriptor);

		transform({
			type: "party",
			id: 123,
			name: "primo",
			zone: "753",
			active: "always"
		});
		assertDeep(descriptor.logger.messages.info, []);
		assertDeep(descriptor.logger.messages.warn, [
			'<Party #123 "undefined"> invalid `name`: `"primo"`'
		]);
	});

	it("should support nested structures", () => {
		let descriptor = makeDescriptor();
		descriptor.fields = {
			id: 123,
			payload: struct({
				name: "PartyPayload",
				fields: {
					price: 456,
					data: struct({
						name: "PartyData",
						fields: {
							history: false
						}
					})
				}
			}),
			active: true
		};
		let transform = transformation(descriptor);

		transform({
			id: 123,
			payload: {
				cost: 456,
				data: {
					history: "none",
					reserve: false
				}
			}
		});
		assertDeep(descriptor.logger.messages.info, []);
		assertDeep(descriptor.logger.messages.warn, [ /* eslint-disable max-len */
			'<Party #123 "undefined"> → <PartyPayload> invalid `price`: `undefined`',
			'<Party #123 "undefined"> → <PartyPayload> → <PartyData> invalid `history`: `"none"`',
			'<Party #123 "undefined"> → <PartyPayload> → <PartyData>: spurious entries `["reserve"]`',
			'<Party #123 "undefined"> → <PartyPayload> invalid `data`: `{"history":"none","reserve":false}`',
			'<Party #123 "undefined"> → <PartyPayload>: missing entries `["price"]`',
			'<Party #123 "undefined"> → <PartyPayload>: spurious entries `["cost"]`',
			'<Party #123 "undefined"> invalid `payload`: `{"cost":456,"data":{"history":"none","reserve":false}}`',
			'<Party #123 "undefined"> invalid `active`: `undefined`',
			'<Party #123 "undefined">: missing entries `["active"]`'
		]); /* eslint-enable max-len */

		descriptor.logger = makeLogger();
		transform({
			id: 123,
			payload: null,
			active: true
		});
		assertDeep(descriptor.logger.messages.info, []);
		assertDeep(descriptor.logger.messages.warn, [
			'<Party #123 "undefined"> invalid `payload`: `null`'
		]);
	});
});

function makeDescriptor() {
	let logger = makeLogger(); // required to suppress nagging validation
	return Object.assign({ logger }, DESCRIPTOR);
}

function acceptAll() {
	return true;
}

function rejectAll() {
	return false;
}
