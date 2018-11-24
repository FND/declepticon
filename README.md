declepticon
===========

[![package version](https://img.shields.io/npm/v/declepticon.svg?style=flat)](https://www.npmjs.com/package/declepticon)
[![build status](https://travis-ci.org/FND/declepticon.svg?branch=master)](https://travis-ci.org/FND/declepticon)

declarative validation and transformation of inconsistently structured data

(the name is a [truly](https://en.wikipedia.org/wiki/Declarative_programming)
[terrible](https://en.wikipedia.org/wiki/Kleptomania)
[pun](https://en.wikipedia.org/wiki/Decepticon), because I had to come up with
_something_)


Usage
-----

```
$ npm install declepticon
```

```javascript
let { transformation, optional, eager, validators } = require("declepticon");

let { nonBlankString, integer } = validators;
let transform = transformation({
    name: "Item",
    fields: {
        id: integer,
        type: value => value === "item" || value === "entity",
        name: nonBlankString
    },
    slots: {
        id: eager,
        type: true,
        designation: eager("name")
    },
    stringify: ({ id }) => `#${id}`
});

let data = require("/path/to/data.json");
let record = transform(data);
```

This will turn the incoming JSON data into a record `<Item #123>` with the
properties described by `slots`, reporting discrepancies with regard to the
expectations expressed within `fields`.

Note that transformed records can be turned back into JSON via
`JSON.stringify(record)`, provided slots' values can be serialized.

See tests for more elaborate examples.


### API

Anything described here can be imported directly from the declepticon package
(e.g. `let { transformation, eager } = require("declepticon")`).

* `transformation(descriptor)` is the primary entry point, returning a function
  `transform(data, context)` to validate and transform `data` objects
  (optionally supplying an arbitrary `context` object for slot transformations)
  as described by `descriptor` properties (see below).

* `struct` is used to describe nested structures within descriptor fields.
* `optional` is a function used to indicate non-essential fields within
  descriptors. It accepts one more validators.
* `eager` is used to indicate that a slot should be populated _before_
  validation, for identification within error reporting (i.e. slots used within
  `stringify`). `eager` can be used by iteself or as a function with the
  name of the respective original field.
* `skipSlot`, if returned from a slot transformation, indicates that the
  respective slot should be omitted from an individual record.
* `validators` is a set of common type validators provided for convenience; see
  `validators.js` for details.
* `repr(value, jsonify)` is a utility function to return a value's technical
  representation (i.e. wrapping it in backticks), optionally converting it to
  JSON.


### Descriptors

Any descriptor object has the following properties:

* `name` is a string identifier used for error reporting:

  ```javascript
  name: "Item"
  ```

* `stringify` is an optional function which is passed the respective record and
  returns a string for use in error reporting:

  ```javascript
  stringify: ({ id, name }) => `${repr(id)} "${name}"`
  ```

  This will automatically be combined with `name` to result in
  ``<Item `123` "foo">``.

* `onError` is an optional function which is invoked with the respective message
  if a validation error occurs.

  ```javascript
  onError(message) {
      throw new Error(message);
  }
  ```

* `fields` is an object describing the expected shape of `data`, both with
  regard to its properties and their respective values:

  ```javascript
  fields: {
      id: value => Number.isInteger(value),
      type: "item",
      label: optional(value => value === true || value === false),
      details: struct("ItemDetails", {
          url: value => true
      })
  }
  ```

  The right-hand side consists of a validator or an array thereof (`OR`
  conjunction). A validator is typically a function which is passed the original
  value and returns `false` if that value is considered invalid. As a shortcut,
  the expected value may be used as a validator instead (strict equality
  comparison).

  Non-essential fields are flagged by passing the respective validator(s) to the
  `optional` function (see above).

  Nested structures are described by passing a name and fields object to the
  `struct` function (see above).

* `slots` is an object describing the shape of the transformed record:

  ```javascript
  slots: {
      id: eager,
      name: eager("name"),
      caption: "label",
      url: ({ details }, context) => details ? details.url + context : skipSlot
  }
  ```

  The right-hand side consists of a transformer. This is typically a function
  which is passed the original data object and the context object passed to the
  `transform` function (if any). It returns either the desired value (e.g.
  converting the original value into a number) or `skipSlot` to conditionally
  omit that slot.

  As a shortcut, `true` can be used to copy over the corresponding original
  value. If a string is used, the respective field's value is copied over
  instead.


Contributing
------------

* ensure [Node](http://nodejs.org) is installed
* `npm install` downloads dependencies
* `npm test` checks code for stylistic consistency


Alternatives
------------

* [joi](https://github.com/hapijs/joi)
* [clojure.spec](https://clojure.org/guides/spec)
