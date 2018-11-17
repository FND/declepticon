declepticon
===========

declarative validation and transformation of inconsistently structured data

(the name is a [truly](https://en.wikipedia.org/wiki/Declarative_programming)
[terrible](https://en.wikipedia.org/wiki/Kleptomania)
[pun](https://en.wikipedia.org/wiki/Decepticon), because I had to come up with
_something_)


Usage
-----

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

This will result in a record instance `<Item #123>` with the properties
described by `slots`, reporting discrepancies within `data` that do not conform
to the expectations expressed within `fields`.

See tests for more elaborate examples.


Contributing
------------

* ensure [Node](http://nodejs.org) is installed
* `npm install` downloads dependencies
* `npm test` checks code for stylistic consistency


Alternatives
------------

* [joi](https://github.com/hapijs/joi)
* [clojure.spec](https://clojure.org/guides/spec)
