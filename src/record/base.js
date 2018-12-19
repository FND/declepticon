// NB: this module serves to avoid circular dependencies
"use strict";

exports.OPTIONAL = Symbol("optional field");

exports.BaseRecord = class BaseRecord {};

exports.validateStruct = (value, cls, { context, onError } = {}) => {
	if(!value) {
		return false;
	}

	let subRecord = new cls(); // eslint-disable-line new-cap
	return subRecord.validate(value, { context, onError });
};
