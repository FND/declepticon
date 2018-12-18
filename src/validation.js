"use strict";
let { Record, OPTIONAL } = require("./record");
let { objectKeys } = require("./validators");
let { warn, repr } = require("./util");

module.exports = function validate(data, fields, { context, onError = warn } = {}) {
	let allValid = true;

	// determine expected top-level structure while validating field values
	let expectedFields = Object.entries(fields).reduce((memo, [key, validators]) => {
		let optional = validators && validators.optional === OPTIONAL;
		if(optional) {
			validators = validators.validators;
		}
		memo[optional ? "ignore" : "expected"].push(key);

		// value is valid if at least one validator passes (`OR` conjunction)
		let value = data[key];
		if(!validators || !validators.pop) {
			validators = [validators];
		}
		let valid = validators.some(validator => {
			// a validator is either a `Record` (via a nested descriptor),
			// a function or the expected value
			if(optional && !data.hasOwnProperty(key)) { // XXX: prototypes not supported
				return true;
			}
			if(validator) {
				if(validator.prototype instanceof Record) {
					if(!value) {
						return false;
					}
					let subRecord = new validator(); // eslint-disable-line new-cap
					return subRecord.validate(value, { context, onError });
				}
				if(validator.call) {
					return validator(value);
				}
			}
			return validator === value;
		});
		if(!valid) {
			allValid = false;
			let prefix = context ? `${context} ` : "";
			onError(`${prefix}invalid ${repr(key)}: ${repr(value, true)}`);
		}

		return memo;
	}, { expected: [], ignore: [] });

	// check top-level structure
	objectKeys(data, expectedFields, (type, diff) => {
		let delta = diff.map(entry => repr(entry)).join(", ");
		let desc = diff.length === 1 ? "entry" : "entries";
		let prefix = context ? `${context}: ` : "";
		onError(`${prefix}${type} ${desc} ${delta}`);
	});

	return allValid;
};
