"use strict";

exports.abort = function abort(msg, code = 1) {
	console.error(msg);
	process.exit(code);
};

exports.repr = repr;

exports.log = {
	info: (...msg) => void console.error(...msg),
	warn: (...msg) => void console.error("[WARNING]", ...msg)
};

// returns a value's technical representation
function repr(value, jsonify) {
	if(jsonify) {
		value = JSON.stringify(value);
	}
	return `\`${value}\``;
}
