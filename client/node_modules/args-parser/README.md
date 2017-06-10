# args-parser
Straight-forward node.js arguments parser.

## Get the module

```bash
$ npm install args-parser
```

## How to use it?

### args(arguments)

Simply call the module passing it an `arguments` array such as `process.argv`:

```javascript
const args = require("args-parser")(process.argv)

console.info(args)
```

The returned value is an `Object` having a key for each argument given, and eventually a value if it's found an `=` sign.

Considering that simple command:

```bash
$ node ./script.js careful -dangerous --tomatoes=3 --tonight
```

Will return:

```json
{
   "careful": true,
   "dangerous": true,
   "tomatoes": 3,
   "tonight": true
}
```

So then you can easily check what you need:

```javascript
if (args.careful) {
    // Do something
}
```
