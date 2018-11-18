"use strict";

let { Record, optional, skipSlot, eager } = require("./record");
let validators = require("./validators");
let { abort, log, repr } = require("./util");

module.exports = {
	transformation,
	struct,
	optional,
	skipSlot,
	eager,
	validators,
	log,
	repr
};

function transformation(descriptor) {
	let cls = struct(descriptor);
	return (data, context) => {
		let record = new cls(); // eslint-disable-line new-cap
		record.ingest(data, { context, logger: descriptor.logger });
		return record;
	};
}

// accepts either a descriptor object or `name, fields, stringify` as arguments;
// slots are only required for top-level structures
function struct(name, fields, stringify) {
	let comprehensive = !fields;
	let descriptor = comprehensive ? name : { name, fields, stringify };

	validateDescriptor(descriptor, { comprehensive }); // avoids cryptic exceptions
	if(comprehensive) {
		({ name, stringify } = descriptor);
	}
	if(!stringify) {
		stringify = () => "";
	}

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

function validateDescriptor(descriptor, { comprehensive }) {
	let expected = {
		expected: ["name", "fields"],
		ignore: ["stringify", "logger"]
	};
	let type = comprehensive ? "expected" : "ignore";
	expected[type].push("slots");

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
