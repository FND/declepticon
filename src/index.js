"use strict";

let { Record, optional, eager } = require("./record");
let validators = require("./validators");
let { abort, log, repr } = require("./util");

module.exports = {
	transformation,
	struct,
	optional,
	eager,
	validators,
	log,
	repr
};

function transformation(descriptor) {
	let cls = struct(descriptor, { strict: true });
	return data => {
		let record = new cls(); // eslint-disable-line new-cap
		record.ingest(data, descriptor.logger);
		return record;
	};
}

function struct(descriptor, { strict } = {}) {
	validateDescriptor(descriptor, { strict }); // avoids cryptic exceptions
	let { name, stringify = () => "" } = descriptor;

	// generate a named subclass which merely operates as a dispatching closure
	return { // temporary object allows for dynamic name assignment
		[name]: class extends Record {
			static get fields() {
				return descriptor.fields;
			}

			static get slots() {
				return descriptor.slots;
			}

			toString() {
				let details = stringify(this);
				return super.toString(details);
			}
		}
	}[name];
}

function validateDescriptor(descriptor, { strict }) {
	let expected = {
		expected: ["name", "fields"],
		ignore: ["stringify", "logger"]
	};
	if(strict) {
		let type = strict ? "expected" : "ignore";
		expected[type].push("slots");
	}

	validators.objectKeys(descriptor, expected, (type, diff) => {
		let suffix = diff.length === 1 ? "property" : "properties";
		suffix += " " + diff.map(prop => repr(prop)).join(", ");
		let msg = `${type} descriptor ${suffix}`;
		if(type === "missing") {
			abort(`ERROR: ${msg}`);
		}
		log.warn(msg);
	});
}
