# TypeScript Compiler

A TypeScript compiler for the monkey programming language.

Based on the excellent book ["Writing An Compiler In Go"](https://compilerbook.com/)

## ⚙️ Installation

To get started, clone the repository:

```bash
git clone https://github.com/bpetermann/ts-compiler.git
cd ts-compiler
```

Then, install dependencies and build the project:

```js
npm run build:fresh // Installs dependencies and builds the project
```

## 🚀 Start

Finally, start the REPL (Read-Eval-Print Loop):

```js
npm run start // Starts the REPL
```

## 📋 Usage Examples

```js
>> let a = 2; // Declare a variable
>> let baz = ["foo", "bar"]; // Declare an array
>> baz[0]; // Acesss array
>> let person = {"name": "Alice"}; // Declare a hash map
>> person["name"]; // Access map
```

Here's a basic example illustrating the declaration and invocation of a function:

```js
let fibonacci = fn(x) {
  if (x == 0) {
    0
  } else {
    if (x == 1) {
      return 1;
    } else {
      fibonacci(x - 1) + fibonacci(x - 2);
    }
  }
};
fibonacci(5);
```

Example of closures:

```js
let newClosure = fn(a) {
    fn() { a; };
    };
let closure = newClosure(99);
closure();
```

Close the REPL:

```js
eof;
```

## Syntax Overview

The syntax embodies a rich spectrum of functionalities, managing mathematical expressions, variable assignments, function definitions, calls, conditionals, and returns. It adeptly handles concepts like higher-order functions and closures.

Additionally, the compiler accommodates diverse data types — integers, booleans, strings, arrays, and hashes.

It also features a set of built-in functions tailored to expedite string/array operations and console output logging.

## 🧪 Tests

The following command will run all jest test suites:

```js
npm run test
```
