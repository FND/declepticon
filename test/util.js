"use strict";

exports.makeLogger = () => {
	let info = [];
	let warn = [];
	return {
		messages: { info, warn },
		info: (...msg) => void log(msg, info),
		warn: (...msg) => void log(msg, warn)
	};
};

function log(messages, list) {
	let entry = messages.join(" <|> ");
	list.push(entry);
}
