<h1 align="left"><img src="./docs/gson-query.png" width="256" alt="gson-query"></h1>

> gson-query lets you quickly select values, patterns or types from json-data. Its input requires a simple string, describing a concise query into your data

**npm package** `gson-query`. An es5-version is bundled at `dist/gson-query.js`. The command-line integration can be installed separately from [gson-query-cli](https://github.com/sagold/gson-query-cli).

- [Features](#features)
- [Introduction](#quick-introduction)
- [Breaking Changes](#breaking-changes)
- [API](#api)
- [About patterns](#about-patterns)
- [Further examples](#further-examples)


## Features

- [json-pointer](https://github.com/sagold/json-pointer) syntax `#/list/0/id`
- glob-patterns for properties (`*`, `**`)
- regex-support for properties `{any.*}`
- pattern-support for inifinite recursion `/tree(/nodes/*)+/value`
- or-patterns `/node((/left), (/right))`
- finite search in circular-data `**`
- lookahead-rules to test selected property `?property:value` and regex values `?property:{\d+}`
- and typechecks `/value?:array`


## Quick introduction

Basically, a **query** is a json-pointer, which describes a path of properties into the json-data

```js
import { get } from "gson-query";
const input = { object: { a: { id: "id-a" }, b: { id: "id-b" } } };

const values = get(input, "/object/a/id"); // ["id-a"]
```


But each property may also be a glob-pattern or a regular expression:

`*` selects all direct children

```js
const input = { object: { a: { id: "id-a" }, b: { id: "id-b" } } };

const values = get(input, "/object/*/id"); // ["id-a", "id-b"]
```


`**` selects all values

```js
const input = { object: { a: { id: "id-a" }, b: { id: "id-b" } } };

const values = get(input, "/object/**");
// [ { a: { id: "id-a" }, b: { id: "id-b" } }, { id: "id-a" }, "id-a", { id: "id-b" }, "id-b" ]
```


`{}` calls a regular expression

```js
const input = { object: { a: { id: "id-a" }, b: { id: "id-b" } } };

const values = get(input, "/{obj.*}/{.*}/id"); // ["id-a", "id-b"]
```


**lookahead** rules are used to validate the current value based on its properties

`?child` tests if a childProperty is defined

```js
const input = { object: { a: { id: "id-a" }, b: { id: "id-b" } } };

const values = get(input, "/object/*?id"); // [{ id: "id-a" }, { id: "id-b" }]
```


`?child:value` tests if a childProperty matches a value

```js
const input = { object: { a: { id: "id-a" }, b: { id: "id-b" } } };

const values = get(input, "/object/*?id:id-b"); // [{ id: "id-b" }]
```

lookahead rules can also be negated `?child:!value`, tested by regex `?child:{^re+}`, combined `?child&&other` or joined `?child||other`. Undefined may be tested with `?property:undefined`, per default `undefined` is excluded from matches.


**typechecks** can be used to query certain data-types

`?:<type>`, where `<type>` may be any of `["boolean", "string", "number", "object", "array", "value"]`

```js
const input = { object: { a: { id: 33 }, b: { id: "id-b" } } };

const values = get(input, "/**?:string"); // ["id-b"]
```

`?:value` will match all types except *objects* and *arrays*

```js
const input = { object: { a: { id: 33 }, b: { id: "id-b" } } };

const values = get(input, "/**?:value"); // [33, "id-b"]
```


**patterns** can be used to combine queries into a single result (*OR*) and to build up results from recursive queries (*+*)

Queries can be grouped by parenthesis, where `/a/b/c = /a(/b)(/c) = /a(/b/c)`.

`((/a), (/b))` resolves both queries on the previous result

```js
const input = { object: { a: { id: 33 }, b: { id: "id-b" } } };

const values = get(input, "/object((/a), (/b))"); // [{ id: 33 }, { id: "id-b" }]
```

and the result may be queried further

```js
get(input, "/object((/a), (/b))/id"); // [33, "id-b"]
get(input, "/object((/a), (/b))/id?:number"); // [33]
```

`(/a)+` will repeat the grouped query for all possible results

```js
const input = {
    id: 1,
    a: { // first iteration
        id: 2,
        a: { // second iteration
            id: 3
            a: 4 // last iteration
        }
    }
};

const values = get(input, "/(/a)+"); // [{ id: 2, a: { id: 3, a: 4 } }, { id: 3, a: 4 }, 4]
```


## Breaking Changes

- with version `v4.0.0` (2019/10/01)
    - the api has been simplified to methods `query.get` and `query.delete` (removed `run` and `pattern`)
- with version `v3.0.0`
    - the syntax has changed to es6, which might require code transpilation
    - queries for root-pointer (`#`, `#/`, `/`) now callback root object with `(rootObject, null, null, "#")`
- with `v2.0.0` a negated filter (lookahead), e.g. `*?valid:!true` will not return objects where `valid === undefined`. To match objects with missing properties you can still query them explicitly with `*?valid:!true||valid:undefined`


## API

*gson-query* exposes to methods `get` and `remove`

method  | signature                                                         | description
--------|-------------------------------------------------------------------|------------------------------
get     | (input:any, query: string, returnType?:string\|function)          | query data, returns results
remove  | (input:any, query: string, returnRemoved?:boolean)                | delete query targets, returns input


**get**

per default, *get* returns a list of all values

```js
import { get } from "gson-query";
const input = { object: { a: { id: 33 }, b: { id: "id-b" } } };
const values = get(input, "/**?:value"); // [33, "id-b"]
```

Using the optional value `returnType` you can change the result type to the following options
`["all", "value", "pointer", "map"]`. The string values can also be accessed as property on `get`: `get.ALL, get.VALUE, get.POINTER, get.MAP`:


returnType  | description
------------|------------------------------------------------------------------
"value"     | returns all matched values of the query `[33, "id-b"]`
"pointer"   | returns json-pointer to results `["#/object/a", "#/object/b"]`
"map"       | returns an pairs of `jsonPointer: resultValue` as an object
"all"       | returns a list, where each result is an array of `[value, keyToValue, parentObject, jsonPointer]`
function    | callback with `(value, keyToValue, parentObject, jsonPointer) => {}`. If a value is returned, the result will be replaced by the return-value


```js
import { get } from "gson-query";
const input = { object: { a: { id: 33 }, b: { id: "id-b" } } };

get(input, "/**?:value", get.VALUE); // [33, "id-b"]
get(input, "/**?:value", get.POINTER); // ["#/object/a/id", "#/object/b/id"]
get(input, "/**?:value", get.MAP); // { "#/object/a/id": 33, "#/object/b/id": "id-b" }

get(input, "/**?:value", get.ALL);
// [
//    [33, "id", { id: 33 }, "#/object/a/id"],
//    ["id-b", "id", { id: "id-b" }, "#/object/b/id"]
// ]

get(input, "/**?:value", (value, key, parent, pointer) => `custom-${pointer}`);
// ["custom-#/object/a/id", "custom-#/object/b/id"]
```


**remove** deletes any match from the input data.
Note: the input will be modified. If this is unwanted behaviour, copy your data up front.

```js
import { remove } from "gson-query";
const input = { object: { a: { id: 33 }, b: { id: "id-b" } } };

remove(input, "/object/*/id"); // { object: { a: {}, b: {} } };
```

Per default, the input object is returned. Setting the optional argument `returnRemoved = true`, will return a list of the removed items

```js
import { remove } from "gson-query";
const input = { object: { a: { id: 33 }, b: { id: "id-b" } } };

remove(input, "/object/*/id", true); // [ 33, "id-b" ]
```


## About patterns

Pattern-queries enable selection of recursive patterns and offer a way to build up a collection of data for further filterung. A pattern uses brackets `()` to identify repeatable structures and offers multiple selections for the same data-entry.

Using a pattern-query like `#/tree((/left),(/right))*` will recursively select all *left* and *right*-nodes. e.g.

```js
const data = {
  tree: {
    left: {
      id: "1",
      left: { id: "2" },
      right: { id: "3" }
    },
    right: {
      id: "4"
    }
  }
};

const result = get(data, "#/tree((/left),(/right))*/id");
// ["1", "2", "3", "4"]
```

**Note** that each pattern-queries is resovled using `query.get` and thus supports all mentioned features.

One use-case for pattern-queries can be found in json-schema specification. Any definition in `#/defs` may reference itself or be referenced circular. A linear query cannot describe the corresponding data, but pattern-queries might be sufficient.


#### details

A pattern is a simple group defined by brackets: `#/a(/b)/c`, which is identical to `#/a/b/c`. But a group may also have a quantifier `+`: `#/a(/b)+/c`. Using a quantifier, the query within the pattern will be applied as long as it matches any data. Its combined result will then be passed to `/c`.

e.g. applying the pattern `#/a(/b)+/c` on the following input data:

```js
const input = {
  a: {
    b: {
      c: "1",
      b: {
        c: "2",
        b: {}
      }
    }
  }
};
```

will first select property `a` and then repeatedly select property `b`: `[a/b, a/b/b, a/b/b/b]`. This result is filtered by `c`, which will return `["1", "2"]` (the last `b`-object has no property `c`).

Patterns can also be used for **OR**-operations. An *OR* is identified by a semicolon `,` and must be within and between patterns, like `((/a/b),(/c))`. **Not valid** patterns are *(/a/b, /c)* and *r/(/a/b),(/c)/f*.

Currently, using **OR** is *commutative* in a sense that `((/a),(/b)) = ((/b),(/a))`, (with a different ordering of the resulting set), *distributive* so that `/a((/b), (/c)) = ((/a/b), (/a/c))`. **Parenthesis** without a quantifier are *associative*, e.g. `#/a/b/c = #/a(/b)/c = #/a(/b/c) = #/a(/b)(/c)`. Thus, a pattern `((/b)(/c))+` can also be written like `(/b/c)+`.


## further examples

for further examples refer to the unit tests

- [query.delete](https://github.com/sagold/json-query/blob/master/test/unit/delete.test.js)
- [query.get](https://github.com/sagold/json-query/blob/master/test/unit/get.test.js)
