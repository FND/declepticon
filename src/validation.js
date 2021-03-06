"use strict";

let { validateStruct, BaseRecord, OPTIONAL } = require("./record/base");
let { objectKeys } = require("./validators");
let { warn, repr } = require("./util");

let { hasOwnProperty } = Object.prototype;

exports.validate = (data, fields, { context, onError = warn } = {}) => {
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
			if(optional && !hasOwnProperty.call(data, key)) { // XXX: prototypes not supported
				return true;
			}
			if(validator) {
				if(validator.prototype instanceof BaseRecord) {
					return validateStruct(value, validator, { context, onError });
				}
				if(validator.call) {
					return validator(value);
				}
			}
			return validator === value;
		});
		if(!valid) {
			allValid = false;
			let msg = `invalid ${repr(key)}: ${repr(value, true)}`;
			onError(context ? `${context} ${msg}` : `${msg} in ${repr(data, true)}`);
		}

		return memo;
	}, { expected: [], ignore: [] });

	// check top-level structure
	objectKeys(data, expectedFields, (type, diff) => {
		let delta = diff.map(entry => repr(entry)).join(", ");
		let desc = diff.length === 1 ? "entry" : "entries";
		let msg = `${type} ${desc} ${delta}`;
		onError(context ? `${context}: ${msg}` : `${msg} for ${repr(data, true)}`);
	});

	return allValid;
};
