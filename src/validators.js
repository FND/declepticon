"use strict";

module.exports = { objectKeys };

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
