describe('Dynamic URL Extension', function() {
    var initialResolver = htmx.config.dynamicUrlResolver;
    var initialFallback = htmx.config.dynamicUrlAllowWindowFallback;

    function getDispatchedPath(elt) {
        return new Promise(resolve => {
            const listener = function(evt) {
                if (evt.detail.elt === elt || evt.detail.requestConfig?.elt === elt) {
                    evt.preventDefault();
                    document.body.removeEventListener('htmx:beforeRequest', listener);
                    resolve(evt.detail.requestConfig.path);
                }
            };
            document.body.addEventListener('htmx:beforeRequest', listener);

            htmx.process(elt);
            setTimeout(() => { htmx.trigger(elt, "click"); }, 0);
        });
    }

    function makeElt(attrs) {
        var elt = document.createElement("button");
        elt.setAttribute("hx-ext", "dynamic-url");
        elt.setAttribute("hx-trigger", "click");
        for (var key in attrs) {
            elt.setAttribute(key, attrs[key]);
        }
        document.body.appendChild(elt);
        return elt;
    }

    // Mock store/atoms needed for tests
    const mockChatIdAtom = { _val: 111, get() { return this._val; }};
    const mockUserStore = {
        _state: { id: 'test-user', email: 'test@example.com' },
        get() { return this._state; }
    };
    window.mockFallbackId = 888;
    window.mockFallbackSystem = { details: { code: 'alpha' }};
    window.mockFallbackAtom = { _val: 777, get() { return this._val; } };

    // --- HOOKS ---
    beforeEach(function() {
        htmx.config.dynamicUrlResolver = undefined;
        htmx.config.dynamicUrlAllowWindowFallback = false;
        htmx.findAll(document.body, "button[hx-ext='dynamic-url']").forEach(elt => elt.remove());
    });

    afterEach(function() {
        htmx.findAll(document.body, "button[hx-ext='dynamic-url']").forEach(elt => elt.remove());
    });

    after(function() {
        htmx.config.dynamicUrlResolver = initialResolver;
        htmx.config.dynamicUrlAllowWindowFallback = initialFallback;
        delete window.mockFallbackId;
        delete window.mockFallbackSystem;
        delete window.mockFallbackAtom;
    });


    // --- Test Cases ---

    it('should resolve variable using resolver', async function() {
        htmx.config.dynamicUrlResolver = function(varName) {
            if (varName === 'id') return 'resolved123';
            return undefined;
        };
        var elt = makeElt({'hx-get': '/items/{id}'});
        var path = await getDispatchedPath(elt);
        expect(path).to.equal('/items/resolved123');
    });

    it('should resolve nested variable using resolver', async function() {
        htmx.config.dynamicUrlResolver = function(varName) {
            if (varName === 'user.id') return mockUserStore.get().id;
            return undefined;
        };
        var elt = makeElt({'hx-get': '/users/{user.id}/details'});
        var path = await getDispatchedPath(elt);
        expect(path).to.equal('/users/test-user/details');
    });

    it('should resolve atom using resolver', async function() {
        htmx.config.dynamicUrlResolver = function(varName) {
            if (varName === 'chat') return mockChatIdAtom.get();
            return undefined;
        };
        var elt = makeElt({'hx-get': '/chats/{chat}'});
        var path = await getDispatchedPath(elt);
        expect(path).to.equal('/chats/111');
    });

     it('should URL encode resolved values', async function() {
        htmx.config.dynamicUrlResolver = function(varName) {
            if (varName === 'path') return 'a/b c';
            return undefined;
        };
        var elt = makeElt({'hx-get': '/data/{path}/info'});
        var path = await getDispatchedPath(elt);
        expect(path).to.equal('/data/a%2Fb%20c/info');
    });

     it('should handle multiple variables', async function() {
        htmx.config.dynamicUrlResolver = function(varName) {
            if (varName === 'userId') return 'u1';
            if (varName === 'orderId') return 'ord5';
            return undefined;
        };
        var elt = makeElt({'hx-get': '/users/{userId}/orders/{orderId}'});
        var path = await getDispatchedPath(elt);
        expect(path).to.equal('/users/u1/orders/ord5');
    });

     it('should not use fallback if disabled', async function() {
        var elt = makeElt({'hx-get': '/items/{mockFallbackId}'});
        var path = await getDispatchedPath(elt);
        expect(path).to.equal('/items/{mockFallbackId}');
    });

    it('should use window fallback if enabled and resolver fails', async function() {
        htmx.config.dynamicUrlResolver = function(varName) { return undefined; };
        htmx.config.dynamicUrlAllowWindowFallback = true;
        var elt = makeElt({'hx-get': '/items/{mockFallbackId}'});
        var path = await getDispatchedPath(elt);
        expect(path).to.equal('/items/888');
    });

    it('should use nested window fallback if enabled', async function() {
        htmx.config.dynamicUrlAllowWindowFallback = true;
        var elt = makeElt({'hx-get': '/systems/{mockFallbackSystem.details.code}'});
        var path = await getDispatchedPath(elt);
        expect(path).to.equal('/systems/alpha');
    });

     it('should use window fallback with .get() pattern if enabled', async function() {
        htmx.config.dynamicUrlAllowWindowFallback = true;
        var elt = makeElt({'hx-get': '/atoms/{mockFallbackAtom}'});
        var path = await getDispatchedPath(elt);
        expect(path).to.equal('/atoms/777');
    });

     it('should leave placeholder if resolver and fallback fail', async function() {
        htmx.config.dynamicUrlAllowWindowFallback = true;
        var elt = makeElt({'hx-get': '/data/{nonExistentVar}'});
        var path = await getDispatchedPath(elt);
        expect(path).to.equal('/data/{nonExistentVar}');
    });

     it('should do nothing if no placeholders', async function() {
        var elt = makeElt({'hx-get': '/static/path'});
        var path = await getDispatchedPath(elt);
        expect(path).to.equal('/static/path');
    });

     it('should handle resolver errors gracefully', async function() {
         htmx.config.dynamicUrlResolver = function(varName) {
             if (varName === 'bad') throw new Error("Resolver boom!");
             return undefined;
         };
         var elt = makeElt({'hx-get': '/error/{bad}'});
         var path = await getDispatchedPath(elt);
         expect(path).to.equal('/error/{bad}');
     });

});