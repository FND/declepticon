"use strict";

exports.eager = eager;

exports.Record = class Record {
	ingest(data) {
		// separate eager (pre-validation) from lazy (post-validation) transformers
		let transformers = Object.entries(this.constructor.slots).reduce((memo,
				[slot, transformer]) => {
			let collection;
			if(transformer === eager) { // shortcut
				transformer = true;
				collection = memo.preval;
			} else if(transformer.eager) {
				transformer = transformer.transformer;
				collection = memo.preval;
			} else {
				collection = memo.postval;
			}
			collection.set(slot, transformer);
			return memo;
		}, {
			preval: new Map(),
			postval: new Map()
		});

		// populate instance properties
		let setSlot = (transformer, slot) => {
			let value;
			if(transformer === true) { // adopt original value
				value = data[slot]; // eslint-disable-line no-var
			} else if(transformer.call) { // arbitrary transformation
				value = transformer(data);
			} else { // transfer value from another property
				value = data[transformer];
			}
			this[slot] = value;
		};

		transformers.preval.forEach(setSlot);
		this.validate(data);
		transformers.postval.forEach(setSlot);
	}

	validate(data) {
		// TODO
	}

	toString(details) { // XXX: argument violates standard contract
		return `<${this.constructor.name}${details ? ` ${details}` : ""}>`;
	}
};

function eager(transformer) {
	return {
		transformer: transformer === undefined ? true : transformer,
		eager: true
	};
}
