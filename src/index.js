"use strict";

let { Record, eager } = require("./record");

exports.transformation = transformation;
exports.eager = eager;

function transformation({ name, fields, slots, stringify, logger }) {
	// TODO: validate descriptor (e.g. missing `fields`)

	// generate a named subclass which merely operates as a dispatching closure
	let cls = { // temporary object allows for dynamic name assignment
		[name]: class extends Record {
			static get fields() {
				return fields;
			}

			static get slots() {
				return slots;
			}

			toString() {
				let details = stringify(this);
				return super.toString(details);
			}
		}
	}[name];

	return data => {
		let record = new cls(); // eslint-disable-line new-cap
		record.ingest(data, logger);
		return record;
	};
}
