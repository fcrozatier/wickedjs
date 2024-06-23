# Wicked JS 👻

A compile-time reactive JS language extension.

## Idea

Wicked relies on the fact that JS is already reactive:

```js
// Standard JS
let x = 1;
const y = "x + 1";

eval(y); // 2

x += 1;

eval(y); // 3
```

and takes it to the next level with a great DX

```js
// Wicked JS
let x = 1;
const y = x + 1; // A derived value

x += 1;

y; // 3
```

## Features

### Reactive values and derived values

Reactivity works out of the box. The Wicked language is fully reactive with no need for a special syntax:

```js
let x = 1;
const y = x + 1; // A derived value

x += 1;

y; // 3
```

### Reactivity across boundaries

Reactivity spans your whole project and can cross function boundaries as if values were passed by reference:

```js
let x = 1;
const y = x + 1; // 2

const increment = (n) => {
	n = n + 1;
	return n;
};

increment(x); // "Passed as a reference"
y; // 3
```

Check out the [test](./tests) folder for more!

## Just kidding

This is a joke.

Please do not use this, it's both insecure (it relies on `eval` under the hood) and not performant.

I hope you had some fun reading this short note!

## Licence

MIT
