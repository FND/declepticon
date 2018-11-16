"use strict";

let { Record, eager } = require("./record");
let { objectKeys } = require("./validators");
let { abort, log, repr } = require("./util");

exports.transformation = transformation;
exports.eager = eager;

function transformation(descriptor) {
	validateDescriptor(descriptor); // avoids cryptic exceptions
	let { name } = descriptor;

	// generate a named subclass which merely operates as a dispatching closure
	let cls = { // temporary object allows for dynamic name assignment
		[name]: class extends Record {
			static get fields() {
				return descriptor.fields;
			}

			static get slots() {
				return descriptor.slots;
			}

			toString() {
				let details = descriptor.stringify(this);
				return super.toString(details);
			}
		}
	}[name];

	return data => {
		let record = new cls(); // eslint-disable-line new-cap
		record.ingest(data, descriptor.logger);
		return record;
	};
}

function validateDescriptor(descriptor) {
	let expected = {
		expected: ["name", "fields", "slots", "stringify"],
		ignore: ["logger"]
	};
	objectKeys(descriptor, expected, (type, diff) => {
		let suffix = diff.length === 1 ? "property" : "properties";
		suffix += " " + diff.map(prop => repr(prop)).join(", ");
		let msg = `${type} descriptor ${suffix}`;
		if(type === "missing") {
			abort(`ERROR: ${msg}`);
		}
		log.warn(msg);
	});
}
