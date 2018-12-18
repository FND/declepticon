"use strict";
let { objectKeys } = require("./validators");
let { warn, repr } = require("./util");

let OPTIONAL = Symbol("optional field");
let SKIP_SLOT = Symbol("optional slot");

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

	validate(data, { context, onError = warn } = {}) {
		if(context) {
			this.context = context; // XXX: hacky
		}
		let allValid = true;

		// determine expected top-level structure while validating field values
		let expectedFields = Object.entries(this.constructor.fields).reduce((memo,
				[key, validators]) => {
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
				if(optional && !data.hasOwnProperty(key)) { // XXX: does not support prototypes
					return true;
				}
				if(validator) {
					if(validator.prototype instanceof Record) {
						if(!value) {
							return false;
						}
						let subRecord = new validator(); // eslint-disable-line new-cap
						return subRecord.validate(value, { context: this, onError });
					}
					if(validator.call) {
						return validator(value);
					}
				}
				return validator === value;
			});
			if(!valid) {
				allValid = false;
				onError(`${this} invalid ${repr(key)}: ${repr(value, true)}`);
			}

			return memo;
		}, { expected: [], ignore: [] });

		// check top-level structure
		objectKeys(data, expectedFields, (type, diff) => {
			let delta = diff.map(entry => repr(entry)).join(", ");
			let desc = diff.length === 1 ? "entry" : "entries";
			onError(`${this}: ${type} ${desc} ${delta}`);
		});

		return allValid;
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
