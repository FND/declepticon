"use strict";

let array = value => !!(value && value.pop);
let arrayOf = validator => value => array(value) && value.every(item => validator(item));
let string = value => value ? !!value.substr : value === "";
// NB: ignores whitespace
let nonBlankString = value => string(value) && value.trim() !== "";

module.exports = {
	objectKeys,
	array,
	arrayOf,
	integerString: value => {
		if(!nonBlankString(value)) {
			return false;
		}
		return parseInt(value, 10).toString() === value.trim(); // XXX: crude?
	},
	nonBlankString,
	string,
	integer: value => Number.isInteger(value),
	boolean: value => value === true || value === false
};

// `value` is the object to be checked
// `expected` is either a list of keys or an object `{ expected, ignore }`, each
// in turn a list of keys (where list means either an array or a set)
// `callback` is invoked with both type (missing/spurious) and a list of
// differences for each error
function objectKeys(value, expected, callback) {
	if(expected.expected) { // complex expectations
		var { ignore } = expected; // eslint-disable-line no-var
		expected = expected.expected;
	}
	if(!ignore) {
		ignore = new Set();
	}
	let valid = true;

	let actual = new Set(Object.keys(value));
	// convert arrays
	[expected, ignore] = [expected, ignore].
		map(list => list.has ? list : new Set(list));

	let diff = [...expected].filter(item => !actual.has(item));
	if(diff.length) { // eslint-disable-next-line standard/no-callback-literal
		callback("missing", diff);
		valid = false;
	}

	diff = [...actual].filter(item => !expected.has(item) && !ignore.has(item));
	if(diff.length) { // eslint-disable-next-line standard/no-callback-literal
		callback("spurious", diff);
		valid = false;
	}

	return valid;
}
