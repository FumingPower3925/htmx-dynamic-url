# Dynamic URL Extension (`dynamic-url`) for HTMX

The Dynamic URL extension allows you to use placeholder variables within URL paths defined in `hx-` attributes (like `hx-get`, `hx-post`, etc.). It resolves these variables against a configured resolver function or, optionally, against the global `window` object just before the HTTP request is made.

This is useful for creating dynamic URLs based on JavaScript state without resorting to manually constructing URLs in script tags.

## Installation

Include the extension script (`dynamic-url.js` or the minified `dynamic-url.min.js`) after HTMX itself.

**Using Source:**
```html
<script src="path/to/dynamic-url.js"></script>
```
**Using Minified (Recommended for Production):**
```html
<script src="path/to/dynamic-url.min.js"></script>
```

> (Make sure `dynamic-url.js` is loaded before HTMX initializes or processes the relevant part of the DOM)


## Usage
Activate the extension using the `hx-ext` attribute, typically on a parent element or `body`:

```html
<body hx-ext="dynamic-url">
  ...
</body>
```
Then, use curly braces (`{}`) to denote placeholders in your `hx-` URL attributes:

```html
<button hx-get="/users/{userId}/orders/{orderId}" hx-target="#details">
  View Order {orderId}
</button>

<a hx-post="/items/{itemId}/activate" hx-swap="outerHTML">Activate Item</a>
```

## Configuration

The extension relies on configuration set via the global `htmx.config` object *before* HTMX processes the relevant elements.

`htmx.config.dynamicUrlResolver` **(Recommended)**

This is the **preferred** way to configure the extension, especially when working with JavaScript modules and non-global state. Assign a function that takes the variable name (string inside `{}`) as input and returns the resolved value. If the variable cannot be resolved, return `undefined`.

```js
// In your application setup code (e.g., app.js)
import { userStore, orderAtom } from './stores.js'; // Your state management

function resolveAppVariable(varName) {
    console.log(`DynamicURL Resolver looking for: ${varName}`);
    if (varName === 'userId') {
        return userStore.getCurrentUserId(); // Example access
    }
    if (varName === 'orderId') {
        return orderAtom.get(); // Example atom access
    }
    if (varName === 'user.email') {
        return userStore.get()?.email; // Example nested access
    }
    // Return undefined if the variable name isn't handled
    return undefined;
}

// Assign the resolver BEFORE htmx processes elements needing it
htmx.config.dynamicUrlResolver = resolveAppVariable;
```

`htmx.config.dynamicUrlAllowWindowFallback` **(Optional)**

Set this boolean option to `true` if you want the extension to attempt resolving variables via the global `window` object **if and only if** the `dynamicUrlResolver` is not configured or returns `undefined` for a given variable. Defaults to `false`.

```js
// Allow fallback (use with caution - prefers resolver)
htmx.config.dynamicUrlAllowWindowFallback = true;
```

When fallback is enabled, the extension will attempt to resolve `{varName}` by:

1. Checking `window.varName`.
2. If `varName` contains dots (e.g., `{myApp.user.id}`), it traverses the properties starting from `window.myApp`.
3. If the resolved property on `window` has a `.get()` method (like a Nano Stores atom), it calls `.get()` to retrieve the value. Otherwise, it uses the property value directly.

**Note:** Relying on the `window` fallback is generally discouraged in modern JavaScript development compared to using the explicit `dynamicUrlResolver`.

## Placeholder Resolution Process
For each placeholder like `{varName}` found in a URL:

1. The extension calls `htmx.config.dynamicUrlResolver(varName)` if the function is configured.
2. If the resolver returns a value (not `undefined`), that value is used.
3. If the resolver is not configured, or returns `undefined`, **and** if `htmx.config.dynamicUrlAllowWindowFallback` is `true`, the extension attempts to find `varName` on the `window` object (including dot notation and `.get()` pattern).
4. If a value is found by either method, it is URL-encoded and substituted into the path.
5. If the variable cannot be resolved by any enabled method, a warning is logged to the console, and the placeholder remains unchanged in the path (which will likely result in a 404 or server error).

## CSP Compliance

This extension is compliant with strict Content Security Policy (CSP) environments that disallow `'unsafe-eval'` and `'unsafe-inline'`, as it relies only on standard JavaScript property access, function calls, and string manipulation. Ensure HTMX itself and the extension script are loaded in a CSP-compliant manner.

## Testing

To build the project and run the tests against both source and minified versions for supported HTMX releases:

1. Clone the repository.
2. Run `npm install` to install dev dependencies.
3. Ensure Chrome/Chromium is installed and the `CHROME_PATH` environment variable is set to its executable path.
4. Run `npm test`. (This runs `npm run build` first). You can also run tests for specific versions/builds using scripts like `npm run test:v1:src`, `npm run test:v2:min`, etc.
