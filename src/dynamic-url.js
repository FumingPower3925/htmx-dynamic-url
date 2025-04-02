htmx.defineExtension('dynamic-url', {
    onEvent: function (name, evt) {
        if (name === "htmx:configRequest") {
            const element = evt.detail.elt;
            let path = evt.detail.path;
            const regex = /\{([^}]+)\}/g;
            let changed = false;

            const potentialVars = Array.from(path.matchAll(regex), m => m[1]);
            if (potentialVars.length === 0) {
                 return;
            }

            let finalPath = path;
            const uniqueVars = new Set(potentialVars);

            const resolver = typeof htmx.config.dynamicUrlResolver === 'function' ? htmx.config.dynamicUrlResolver : null;
            const allowFallback = htmx.config.dynamicUrlAllowWindowFallback === true;

            uniqueVars.forEach(varName => {
                let value;
                let resolved = false;

                if (resolver) {
                    try {
                        const resolvedValue = resolver(varName);
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
                        if (varName.includes('.')) {
                            const parts = varName.split('.');
                            const baseVarName = parts[0];
                            if (window.hasOwnProperty(baseVarName)) {
                                let current = window[baseVarName];
                                for (let i = 1; i < parts.length; i++) {
                                    if (current === null || current === undefined) {
                                        current = undefined;
                                        break;
                                    }
                                    current = current[parts[i]];
                                }
                                if (current !== undefined) {
                                    value = current;
                                    resolved = true;
                                }
                            }
                        } else {
                            if (window.hasOwnProperty(varName)) {
                                const potentialStore = window[varName];
                                if (potentialStore && typeof potentialStore.get === 'function') {
                                    value = potentialStore.get();
                                    resolved = true;
                                } else {
                                    value = potentialStore;
                                    resolved = true;
                                }
                            }
                        }
                    } catch (e) {
                         console.error(`dynamic-url: Error during window fallback for "${varName}"`, e);
                         resolved = false;
                    }
                }

                if (resolved) {
                    const varRegex = new RegExp(`\\{${varName}\\}`, 'g');
                    const valueString = String(value);
                    finalPath = finalPath.replace(varRegex, encodeURIComponent(valueString));
                    changed = true;
                } else {
                     console.warn(`dynamic-url: Could not resolve "${varName}". Resolver: ${resolver ? 'tried' : 'none'}, Fallback: ${allowFallback ? 'enabled' : 'disabled'}.`);
                }
            });

            if (changed) {
                evt.detail.path = finalPath;
            }
        }
    }
});