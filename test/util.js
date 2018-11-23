"use strict";

module.exports = {
	injectLogger,
	silence: descriptor => Object.assign({ onError: noop }, descriptor),
	noop
};

function injectLogger(descriptor) {
	let { log, reset, messages } = makeLogger();
	return {
		descriptor: Object.assign({ onError: log }, descriptor),
		reset,
		messages
	};
}
function makeLogger() {
	let messages = [];
	return {
		log: (...msg) => {
			messages.push(msg.join(" "));
		},
		reset: () => {
			messages.length = 0;
		},
		messages
	};
}

function noop() {}
