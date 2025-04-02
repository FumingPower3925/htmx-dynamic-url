describe('Dynamic URL Extension', function() {
    var initialResolver = htmx.config.dynamicUrlResolver;
    var initialFallback = htmx.config.dynamicUrlAllowWindowFallback

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

    const mockChatIdAtom = { _val: 111, get() { return this._val; }};
    const mockUserStore = {
        _state: { id: 'test-user', email: 'test@example.com' },
        get() { return this._state; }
    };

    beforeEach(function() {
        htmx.config.dynamicUrlResolver = undefined;
        htmx.config.dynamicUrlAllowWindowFallback = false;
        htmx.findAll(document.body, "button[hx-ext='dynamic-url']").forEach(elt => elt.remove());

        window.mockFallbackId = 888;
        window.mockFallbackSystem = { details: { code: 'alpha' }};
        window.mockFallbackAtom = { _val: 777, get() { return this._val; } };
        window.mockSystem = null;
        window.mockEmpty = undefined;
        window.mockBadAtom = null;
        window.id = undefined;
    });

    afterEach(function() {
        htmx.findAll(document.body, "button[hx-ext='dynamic-url']").forEach(elt => elt.remove());
        delete window.mockFallbackId;
        delete window.mockFallbackSystem;
        delete window.mockFallbackAtom;
        delete window.mockSystem;
        delete window.mockEmpty;
        delete window.mockBadAtom;
        delete window.id;
    });

    after(function() {
        htmx.config.dynamicUrlResolver = initialResolver;
        htmx.config.dynamicUrlAllowWindowFallback = initialFallback;
    });

    describe('Resolver Logic', function() {
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

        it('should receive element context in resolver', async function() {
            htmx.config.dynamicUrlResolver = function(varName, elt) {
                if (varName === 'dataId') return elt.getAttribute('data-id');
                return undefined;
            };
            var elt = makeElt({'hx-get': '/data/{dataId}', 'data-id': 'elemSpecific'});
            var path = await getDispatchedPath(elt);
            expect(path).to.equal('/data/elemSpecific');
        });

        it('should prioritize resolver over fallback when both enabled', async function() {
            htmx.config.dynamicUrlResolver = function(varName) {
                if (varName === 'id') return 'fromResolver';
                return undefined;
            };
            window.id = 'fromFallback';
            htmx.config.dynamicUrlAllowWindowFallback = true;
            var elt = makeElt({'hx-get': '/items/{id}'});
            var path = await getDispatchedPath(elt);
            expect(path).to.equal('/items/fromResolver');
        });
    });

    describe('Window Fallback Logic', function() {
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

         it('should handle intermediate null/undefined in fallback path', async function() {
            window.mockSystem = { details: null };
            window.mockEmpty = undefined;
            htmx.config.dynamicUrlAllowWindowFallback = true;
            var elt1 = makeElt({'hx-get': '/systems/{mockSystem.details.code}'});
            var elt2 = makeElt({'hx-get': '/empty/{mockEmpty.value}'});

            var path1 = await getDispatchedPath(elt1);
            var path2 = await getDispatchedPath(elt2);

            expect(path1).to.equal('/systems/{mockSystem.details.code}');
            expect(path2).to.equal('/empty/{mockEmpty.value}');
          });

          it('should not resolve inherited properties via fallback', async function() {
              htmx.config.dynamicUrlAllowWindowFallback = true;
              var elt = makeElt({'hx-get': '/props/{toString}'});
              var path = await getDispatchedPath(elt);
              expect(path).to.equal('/props/{toString}');
          });
    });

    describe('General Behavior & Edge Cases', function() {
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

         it('should do nothing if no placeholders', async function() {
            var elt = makeElt({'hx-get': '/static/path'});
            var path = await getDispatchedPath(elt);
            expect(path).to.equal('/static/path');
        });

        it('should resolve value 0 correctly', async function() {
            htmx.config.dynamicUrlResolver = (varName) => (varName === 'zero' ? 0 : undefined);
            var elt = makeElt({'hx-get': '/items/{zero}'});
            var path = await getDispatchedPath(elt);
            expect(path).to.equal('/items/0');
        });

        it('should resolve value false correctly', async function() {
            htmx.config.dynamicUrlResolver = (varName) => (varName === 'flag' ? false : undefined);
            var elt = makeElt({'hx-get': '/flags/{flag}'});
            var path = await getDispatchedPath(elt);
            expect(path).to.equal('/flags/false');
        });
    });

    describe('Error Handling & Resolution Failure', function() {
         it('should leave placeholder if resolver and fallback fail', async function() {
            htmx.config.dynamicUrlAllowWindowFallback = true;
            var elt = makeElt({'hx-get': '/data/{nonExistentVar}'});
            var path = await getDispatchedPath(elt);
            expect(path).to.equal('/data/{nonExistentVar}');
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

         it('should handle fallback errors gracefully (e.g., .get() throws)', async function() {
            window.mockBadAtom = { get() { throw new Error("Fallback getter boom!"); } };
            htmx.config.dynamicUrlAllowWindowFallback = true;
            var elt = makeElt({'hx-get': '/atoms/{mockBadAtom}'});
            var path = await getDispatchedPath(elt);
            expect(path).to.equal('/atoms/{mockBadAtom}');
        });
    });
});