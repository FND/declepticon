/* global describe, it */
"use strict";

let { transformation, struct, optional, eager, validators } = require("../src");
let { injectLogger } = require("./util");
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
		let { descriptor, reset, messages } = injectLogger(DESCRIPTOR);
		let transform = transformation(descriptor);

		let record = transform(DATA[0]);
		assertDeep(messages, [ /* eslint-disable max-len */
			'<Party #123 "undefined">: spurious entries `type`, `id`, `name`, `zone`, `active`'
		]); /* eslint-enable max-len */
		// ensure data was transformed anyway
		assertDeep(Object.keys(record), ["id", "designation"]);
		assertSame(record.id, 123);
		assertSame(record.designation, "primo");

		// add fields specification
		reset();
		descriptor.fields = {
			zone: acceptAll,
			id: acceptAll
		};
		transform = transformation(descriptor);

		record = transform(DATA[0]);
		assertDeep(messages, [
			'<Party #123 "undefined">: spurious entries `type`, `name`, `active`'
		]);

		// extend fields specification
		reset();
		descriptor.fields = {
			type: acceptAll,
			id: acceptAll,
			name: acceptAll,
			zone: acceptAll,
			active: acceptAll
		};
		transform = transformation(descriptor);

		record = transform(DATA[0]);
		assertDeep(messages, []);
	});

	it("should support optional top-level fields", () => {
		let { descriptor, messages } = injectLogger(DESCRIPTOR);
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
		assertDeep(messages, [
			'<Party #undefined "undefined"> invalid `name`: `"bogus"`',
			'<Party #undefined "undefined">: missing entry `id`',
			'<Party #undefined "undefined">: spurious entry `extra`'
		]);
	});

	it("should report invalid property values in incoming data", () => {
		let { descriptor, messages } = injectLogger(DESCRIPTOR);
		descriptor.fields = {
			type: rejectAll,
			id: rejectAll,
			name: rejectAll,
			zone: rejectAll,
			active: rejectAll
		};
		let transform = transformation(descriptor);

		let record = transform(DATA[0]);
		assertDeep(messages, [
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
		let { descriptor, messages } = injectLogger(DESCRIPTOR);
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
		assertDeep(messages, [
			'<Party #123 "undefined"> invalid `name`: `"primo"`'
		]);
	});

	it("should support nested structures", () => {
		let { descriptor, messages, reset } = injectLogger(DESCRIPTOR);
		descriptor.fields = {
			id: 123,
			payload: struct("PartyPayload", {
				price: 456,
				data: struct("PartyData", {
					history: false
				})
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
		assertDeep(messages, [ /* eslint-disable max-len */
			'<Party #123 "undefined"> → <PartyPayload> invalid `price`: `undefined`',
			'<Party #123 "undefined"> → <PartyPayload> → <PartyData> invalid `history`: `"none"`',
			'<Party #123 "undefined"> → <PartyPayload> → <PartyData>: spurious entry `reserve`',
			'<Party #123 "undefined"> → <PartyPayload> invalid `data`: `{"history":"none","reserve":false}`',
			'<Party #123 "undefined"> → <PartyPayload>: missing entry `price`',
			'<Party #123 "undefined"> → <PartyPayload>: spurious entry `cost`',
			'<Party #123 "undefined"> invalid `payload`: `{"cost":456,"data":{"history":"none","reserve":false}}`',
			'<Party #123 "undefined"> invalid `active`: `undefined`',
			'<Party #123 "undefined">: missing entry `active`'
		]); /* eslint-enable max-len */

		reset();
		transform({
			id: 123,
			payload: null,
			active: true
		});
		assertDeep(messages, [
			'<Party #123 "undefined"> invalid `payload`: `null`'
		]);

		reset();
		descriptor.fields.payload = validators.arrayOf(struct("PartyPayload", {
			price: 456
		}), {
			onError: descriptor.onError
		});
		transform = transformation(descriptor);
		transform({
			id: 123,
			payload: [{ price: 123 }, { price: 456 }],
			active: true
		});
		assertDeep(messages, [
			"<PartyPayload> invalid `price`: `123`",
			'<Party #123 "undefined"> invalid `payload`: `[{"price":123},{"price":456}]`'
		]);
	});
});

function acceptAll() {
	return true;
}

function rejectAll() {
	return false;
}
