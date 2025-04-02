htmx.defineExtension('dynamic-url', {
    onEvent: function (name, evt) {
        if (name !== "htmx:configRequest") {
            return;
        }

        let originalPath = evt.detail.path;
        const regex = /\{([^}]+)\}/g;

        if (!regex.test(originalPath)) {
             regex.lastIndex = 0;
             return;
        }
        regex.lastIndex = 0;

        const element = evt.detail.elt;
        const resolver = typeof htmx.config.dynamicUrlResolver === 'function' ? htmx.config.dynamicUrlResolver : null;
        const allowFallback = htmx.config.dynamicUrlAllowWindowFallback === true;
        let pathChanged = false;

        const resolveValue = (varName) => {
            let value;
            let resolved = false;

            if (resolver) {
                try {
                    const resolvedValue = resolver(varName, element);
                    if (resolvedValue !== undefined) {
                        value = resolvedValue;
                        resolved = true;
                    }
                } catch (e) {
                    console.error(`dynamic-url: Error in resolver function for "${varName}"`, e);
                }
            }

            if (!resolved && allowFallback) {
                try {
                    let current = window;
                    const parts = varName.split('.');
                    let found = true;
                    for (const part of parts) {
                        if (current === null || current === undefined || !Object.prototype.hasOwnProperty.call(current, part)) {
                            found = false;
                            break;
                        }
                        current = current[part];
                    }

                    if (found) {
                        value = (current && typeof current.get === 'function') ? current.get() : current;
                        resolved = true;
                    }
                } catch (e) {
                    console.error(`dynamic-url: Error during window fallback for "${varName}"`, e);
                    resolved = false;
                }
            }

            if (resolved) {
                return { resolved: true, value: value };
            } else {
                console.warn(`dynamic-url: Could not resolve "${varName}". Resolver: ${resolver ? 'tried' : 'none'}, Fallback: ${allowFallback ? 'enabled' : 'disabled'}.`);
                return { resolved: false };
            }
        };

        const finalPath = originalPath.replace(regex, (match, varName) => {
            const result = resolveValue(varName);
            if (result.resolved) {
                pathChanged = true;
                return encodeURIComponent(String(result.value));
            }
            return match;
        });

        if (pathChanged) {
            evt.detail.path = finalPath;
        }
    }
});