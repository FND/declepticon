"use strict";
let SKIP_SLOT = Symbol("optional slot");
let OPTIONAL = Symbol("optional field");

exports.OPTIONAL = OPTIONAL;
exports.optional = (...validators) => ({ optional: OPTIONAL, validators });
exports.eager = eager;
exports.skipSlot = SKIP_SLOT;

exports.Record = class Record {
	// separates eager (pre-validation) from lazy (post-validation) transformers
	static get transformers() {
		let memo = this._transformers;
		if(memo) {
			return memo;
		}

		this._transformers = memo = Object.entries(this.slots).reduce((memo,
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
		return memo;
	}

	ingest(data, { context, onError }) {
		// populate instance properties
		let setSlot = (transformer, slot) => {
			let value;
			if(transformer === true) { // adopt original value
				value = data[slot];
			} else if(transformer.call) { // arbitrary transformation
				value = transformer.call(this, data, context);
				if(value === SKIP_SLOT) { // ignore
					return;
				}
			} else { // transfer value from another property
				value = data[transformer];
			}
			this[slot] = value;
		};

		let { preval, postval } = this.constructor.transformers;
		preval.forEach(setSlot);
		this.validate(data, { onError });
		postval.forEach(setSlot);
	}

	validate(data, { context, onError } = {}) {
		if(context) {
			this.context = context; // required for `#toString` -- XXX: hacky
		}

		// NB: `require` here avoids issues due to circular imports
		let { validate } = require("./validation");
		return validate(data, this.constructor.fields, { context: this, onError });
	}

	toString(details) { // XXX: argument violates standard contract
		let { context } = this;
		let prefix = context ? `${context} → ` : "";
		return `${prefix}<${this.constructor.name}${details ? ` ${details}` : ""}>`;
	}
};

function eager(transformer) {
	return {
		transformer: transformer === undefined ? true : transformer,
		eager: true
	};
}
