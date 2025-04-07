# Dynamic URL Extension (`dynamic-url`) for HTMX

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Resolve `{placeholders}` in HTMX request URLs based on your application's JavaScript state.**

This extension allows you to use placeholder variables (`{myVar}`) within URL paths defined in `hx-*` attributes (like `hx-get`, `hx-post`, etc.). It dynamically resolves these variables against a configured JavaScript function just before the HTTP request is made, keeping your HTML clean and declarative.

## Table of Contents

* [Motivation](#motivation)
* [Features](#features)
* [Installation](#installation)
    * [CDN (Recommended)](#cdn-recommended)
    * [Local File](#local-file)
* [Usage](#usage)
* [Configuration](#configuration)
    * [`htmx.config.dynamicUrlResolver`](#htmxconfigdynamicurlresolver-recommended)
    * [`htmx.config.dynamicUrlAllowWindowFallback`](#htmxconfigdynamicurlallowwindowfallback-optional)
* [Placeholder Resolution Logic](#placeholder-resolution-logic)
* [Examples](#examples)
    * [Running the Examples](#running-the-examples)
* [Security Considerations](#security-considerations)
    * [CSP Compliance](#csp-compliance)
    * [Input Handling & URL Encoding](#input-handling--url-encoding)
    * [Regex Safety](#regex-safety)
    * [Subresource Integrity (SRI)](#subresource-integrity-sri)
* [Testing](#testing)
* [Contributing](#contributing)
* [License](#license)

## Motivation

When using HTMX, you often need to make requests to URLs that depend on the current client-side state (e.g., the ID of the currently selected user, the active theme, etc.). Traditionally, this might involve:

* Writing JavaScript `on HtmxConfigEvent` to manually modify `evt.detail.path` or `evt.detail.parameters`.
* Embedding state directly into HTML attributes, which can become messy.

The `dynamic-url` extension provides a cleaner, declarative approach. You define your URLs with intuitive placeholders directly in your `hx-*` attributes, and configure a central resolver function to supply the dynamic values from your application's state, regardless of how you manage that state (vanilla JS, Nano Stores, Zustand, Signals, etc.).

## Features

* **Declarative URLs:** Use simple `{placeholder}` syntax within `hx-*` URL attributes.
* **Centralized Logic:** Define a single JavaScript resolver function (`dynamicUrlResolver`) to fetch dynamic values.
* **State Agnostic:** Works with any JavaScript state management approach (global variables, modules, stores, atoms, signals, etc.).
* **Optional Fallback:** Can optionally fallback to resolving variables against the global `window` object (use with caution).
* **Multiple Placeholders:** Supports resolving multiple placeholders within a single URL (e.g., `/users/{userId}/items/{itemId}`).
* **Secure:** CSP compliant, uses safe placeholder detection, and applies standard URL encoding.

## Installation

Include the extension script **after** HTMX has been loaded.

### CDN (Recommended)

Use the jsDelivr CDN to load the extension. Replace `PLACEHOLDER...` with the correct SRI hash for enhanced security.

**Minified (Recommended for Production):**
```html
<script src="https://unpkg.com/htmx.org@1.9.12/dist/htmx.min.js" integrity="sha384-ujb1lZYygJmzgSwoxRggbCHcjc0rB2XoQrxeTUQyRjrOnlCoYta87iKBWq3EsdM2" crossorigin="anonymous"></script>

<script src="https://cdn.jsdelivr.net/gh/FumingPower3925/htmx-dynamic-url@main/dist/dynamic-url.min.js" integrity="sha384-xzJhFGTvjMySqCy1UJ/W3aBlfKC2xvFn/cxc0+VcRaJSL3HLvWX622kBDyi0c5Ro" crossorigin="anonymous"></script>
```

**Source (for debugging):**
```html
<script src="https://unpkg.com/htmx.org@1.9.12/dist/htmx.js" integrity="sha384-qbtR4rS9RrUMECUWDWM2+YGgN3U4V4ZncZ0BvUcg9FGct0jqXz3PUdVpU1p0yrXS" crossorigin="anonymous"></script>

<script src="https://cdn.jsdelivr.net/gh/FumingPower3925/htmx-dynamic-url@main/src/dynamic-url.js" integrity="sha384-RdVIdMW+QYVcpskO4t93z4xDEt5Ax6ROTZ3VkQmZ2z5fNH9jY1c7VFreodRtBDiZ" crossorigin="anonymous"></script>
```
> **Note:** Find the correct SRI hashes for the specific file versions you are using (e.g., via [srihash.org](https://www.srihash.org/)).

### Local File

Alternatively, download the file from the `dist/` or `src/` directory of this repository and include it locally:

**Minified:**
```html
<script src="path/to/htmx.min.js"></script>
<script src="path/to/your/vendor/dynamic-url.min.js"></script>
```
**Source:**
```html
<script src="path/to/htmx.js"></script>
<script src="path/to/your/vendor/dynamic-url.js"></script>
```

## Usage

1.  **Activate the Extension:** Add the `hx-ext="dynamic-url"` attribute to a parent element (like `<body>`) or directly on elements using dynamic URLs.
    ```html
    <body hx-ext="dynamic-url">
      </body>
    ```

2.  **Use Placeholders:** Use curly braces (`{}`) to denote placeholders in your `hx-*` URL attributes. The text inside the braces is the variable name your resolver function will receive.
    ```html
    <button hx-get="/api/users/{userId}" hx-target="#details">
      Load User {userId}
    </button>

    <a hx-post="/api/documents/{docId}/versions/{versionId}/activate"
       hx-swap="outerHTML">
       Activate Version {versionId}
    </a>

    <div hx-load="/api/items/{itemId}/widget"></div>
    ```
    > **Note:** The extension *only* resolves placeholders within the URL values of `hx-*` attributes (like `hx-get`, `hx-post`, `hx-put`, `hx-delete`, `hx-load`, `hx-source`, `hx-ws`, etc.). It does **not** automatically update placeholders found in regular text content (like the button text `Load User {userId}`). If you need to update visible text based on the same state, you'll need separate JavaScript logic, potentially triggered by state changes, which might involve calling `htmx.process()` on the relevant element. See the [Examples](#examples) for patterns.

## Configuration

Configure the extension by setting properties on the global `htmx.config` object. This configuration **must** be done *before* HTMX initializes or processes the elements that rely on this extension. Usually, this means setting it in a `<script>` tag after HTMX is loaded but before your main application logic or DOM content that uses the extension.

### `htmx.config.dynamicUrlResolver` **(Recommended)**

This is the **preferred** and most flexible way to configure the extension.

* **Type:** `function`
* **Signature:** `(variableName: string) => string | number | boolean | undefined`
* **Description:** Assign a JavaScript function that takes the placeholder variable name (the string inside `{}`) as input. The function should return the corresponding value from your application's state.
* **Return Value:**
    * Return the resolved `string`, `number`, or `boolean` value. These will be URL-encoded before substitution.
    * Return `undefined` if the `variableName` cannot be resolved by your logic. The extension will log a warning, and the placeholder will remain unchanged in the URL path.

```javascript
// --- Example: Using a simple state object ---

const appState = {
  currentUserId: 'usr_123',
  selectedItemId: 'item-xyz',
  apiVersion: 'v2'
};

function myResolver(varName) {
  console.log(`[Resolver] Looking for: {${varName}}`);
  // Check if the variable exists in our state object
  if (varName in appState) {
    return appState[varName]; // Return the value
  }
  // IMPORTANT: Return undefined for unhandled variables
  return undefined;
}

// Assign the resolver function to htmx config
htmx.config.dynamicUrlResolver = myResolver;

// --- Example: Integrating with a state store (like Nano Stores) ---
// import { userIdAtom, settingsAtom } from './my-stores.js';
//
// function storeResolver(varName) {
//   if (varName === 'userId') {
//     return userIdAtom.get();
//   }
//   if (varName === 'theme') {
//     return settingsAtom.get().theme;
//   }
//   return undefined;
// }
// htmx.config.dynamicUrlResolver = storeResolver;
```
See the [Examples](#examples) section for integrations with various state management libraries.

### `htmx.config.dynamicUrlAllowWindowFallback` **(Optional)**

Provides a fallback mechanism if the `dynamicUrlResolver` is not sufficient or not configured. **Use with caution.**

* **Type:** `boolean`
* **Default:** `false`
* **Description:** If set to `true`, the extension will attempt to resolve variables via the global `window` object **only if**:
    1.  `htmx.config.dynamicUrlResolver` is *not* configured, OR
    2.  The configured `dynamicUrlResolver` returns `undefined` for a given `variableName`.

When fallback is enabled, the extension attempts to resolve `{varName}` by:

1.  Checking `window[varName]`.
2.  If `varName` contains dots (e.g., `{myApp.user.id}`), it traverses properties starting from `window` (e.g., `window.myApp`, then `window.myApp.user`, then `window.myApp.user.id`).
3.  If the resolved property on `window` has a `.get()` method (a common pattern for stores like Nano Stores exposed globally), it calls `.get()` to retrieve the value. Otherwise, it uses the property value directly.

```javascript
// Example: Enable fallback (generally discouraged)
htmx.config.dynamicUrlAllowWindowFallback = true;

// Now, if `dynamicUrlResolver` doesn't resolve `{userId}`,
// the extension might look for `window.userId` or `window.appData.userId`, etc.
```

**Why avoid the fallback?** Relying on global `window` variables makes code harder to reason about, test, and maintain, especially in larger applications or when using modules. The explicit `dynamicUrlResolver` is much more robust although arguably more verbose.

## Placeholder Resolution Logic

For each `{placeholder}` found in an `hx-*` URL attribute just before an HTMX request is made:

1.  **Resolver Check:** If `htmx.config.dynamicUrlResolver` is configured, call `resolver(placeholderName)`.
2.  **Use Resolver Value:** If the resolver returns a value (not `undefined`), URL-encode this value and substitute it for the placeholder in the URL path. The process stops here for this placeholder.
3.  **Fallback Check:** If the resolver was not configured, or it returned `undefined`, *and* if `htmx.config.dynamicUrlAllowWindowFallback` is `true`, attempt to resolve the `placeholderName` via the `window` object (including dot notation and the `.get()` pattern).
4.  **Use Fallback Value:** If a value is found via the `window` fallback, URL-encode it and substitute it into the URL path. The process stops here.
5.  **Resolution Failed:** If the placeholder could not be resolved by either method (or if fallback was disabled), log a warning to the console. The original `{placeholder}` text will remain unchanged in the URL path, which will likely lead to a 404 or other server error.

## Examples

This repository includes a comprehensive set of examples demonstrating how to integrate `dynamic-url` with various state management approaches:

➡️ **[View Examples](./examples/)**

The examples cover:

* Vanilla JavaScript (simple objects/variables)
* Nano Stores
* Zustand (Vanilla)
* Jotai (Vanilla)
* @preact/signals-core
* Valtio

### Running the Examples

Each example is self-contained and uses CDN links for dependencies.

1.  Clone this repository: `git clone https://github.com/FumingPower3925/htmx-dynamic-url.git`
2.  Navigate to the root directory: `cd htmx-dynamic-url`
3.  Choose an example and navigate into its directory: `cd examples/1-vanilla-js` (or any other example number)
4.  Start a simple local web server in that directory. If you have Python 3:
    ```bash
    python -m http.server 8000
    ```
    (Or use `python -m SimpleHTTPServer 8000` for Python 2, or `npx serve`, etc.)
5.  Open your web browser and go to `http://localhost:8000`.
6.  Open the browser's developer console (F12) to see logs from the resolver and HTMX. Use the Network tab to inspect the requested URLs – they should have the placeholders correctly replaced. (Requests will likely 404, which is expected with a simple static server).

## Security Considerations

### CSP Compliance

This extension is designed to be compliant with strict Content Security Policy (CSP) environments that disallow `'unsafe-eval'` and `'unsafe-inline'`. It operates solely through:

* Standard JavaScript property access (`htmx.config`).
* Function calls (the user-provided resolver).
* Safe string manipulation and standard URL encoding (`encodeURIComponent`).

Ensure HTMX itself and this extension script are loaded in a CSP-compliant manner (e.g., using nonces, hashes, or appropriate `script-src` directives).

### Input Handling & URL Encoding

* The responsibility for sanitizing or validating state values lies *before* they are put into the state that your `dynamicUrlResolver` reads.
* The `dynamicUrlResolver` should return the intended data (`string`, `number`, `boolean`).
* The extension automatically applies `encodeURIComponent()` to the resolved value *after* it's returned by the resolver (or fallback) and *before* it's substituted into the URL path. This prevents values containing special characters (like `/`, `?`, `&`) from breaking the URL structure.

### Regex Safety

The internal mechanism for finding `{placeholders}` uses safe string methods or a non-vulnerable regular expression pattern. It does not execute user-provided patterns or introduce regex-based vulnerabilities (ReDoS).

### Subresource Integrity (SRI)

When loading this extension (or HTMX itself) from a CDN, it is highly recommended to use the `integrity` attribute on the `<script>` tag. This ensures the browser only executes the script if its content matches the expected hash, protecting against CDN compromises. Remember to generate the correct hash for the specific version you are using.

```html
<script src="https://cdn.jsdelivr.net/gh/FumingPower3925/htmx-dynamic-url@main/dist/dynamic-url.min.js"
        integrity="sha384-xzJhFGTvjMySqCy1UJ/W3aBlfKC2xvFn/cxc0+VcRaJSL3HLvWX622kBDyi0c5Ro"
        crossorigin="anonymous"></script>
```

## Testing

This project uses [Karma](https://karma-runner.github.io/), [Mocha](https://mochajs.org/), [Chai](https://www.chaijs.com/), and [Puppeteer](https://pptr.dev/) (via `karma-chrome-launcher`) to run tests against different versions of HTMX (v1 and v2) using both the source (`src/dynamic-url.js`) and minified (`dist/dynamic-url.min.js`) versions of the extension.

**Prerequisites:**

1.  Clone the repository: `git clone https://github.com/FumingPower3925/htmx-dynamic-url.git`
2.  Navigate to the root directory: `cd htmx-dynamic-url`
3.  Install development dependencies: `npm install`
4.  Ensure you have Google Chrome or Chromium installed.
5.  Set the `CHROME_PATH` environment variable to the full path of the Chrome/Chromium executable. Examples:
    * Linux: `export CHROME_PATH=/usr/bin/google-chrome`
    * macOS: `export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`
    * Windows (Command Prompt): `set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"`
    * Windows (PowerShell): `$env:CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'`

**Running Tests:**

* **Run all tests (Recommended):**
    ```bash
    npm test
    ```
    This command will first build the minified version (`npm run build`), then run the complete test suite against HTMX v1 & v2 using both the source and minified extension files.

* **Run tests only for the source file (HTMX v1 & v2):**
    ```bash
    npm run test:src
    ```

* **Run tests only for the minified file (HTMX v1 & v2):**
    ```bash
    npm run test:min
    ```

* **Run specific test combinations:**
    You can run tests for a specific HTMX version and extension build type using granular commands:
    * `npm run test:v1:src` (HTMX v1, Source File)
    * `npm run test:v1:min` (HTMX v1, Minified File)
    * `npm run test:v2:src` (HTMX v2, Source File)
    * `npm run test:v2:min` (HTMX v2, Minified File)

* **Watch Mode for Development:**
    To automatically re-run tests when files change, use the corresponding `watch` scripts:
    * `npm run test:watch:v1:src`
    * `npm run test:watch:v1:min`
    * `npm run test:watch:v2:src`
    * `npm run test:watch:v2:min`
    Press `Ctrl+C` to stop watch mode.

The tests use `cross-env` to set environment variables (`HTMX_VERSION`, `EXT_FILE`) needed by the Karma configuration (`karma.conf.cjs`).

## Contributing

Contributions are welcome! Please feel free to open an Issue to report bugs, suggest features, or ask questions.

If you'd like to submit code changes:

1.  Fork the repository.
2.  Create a new branch for your feature or bugfix.
3.  Make your changes.
4.  Ensure tests pass (`npm test`).
5.  Consider adding new tests for your changes if applicable.
6.  Submit a Pull Request against the `main` branch.

Please follow standard coding practices and try to match the existing code style.

## License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for details.
