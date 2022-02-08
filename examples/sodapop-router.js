// router class for SPA
class SPRouter extends SodaPop {
    constructor() {
        super();
        this._bindedUpdate = this.update.bind(this); //will be used as an event handler
        SPRouter.location = SPRouter.location || '/';
    }

    get useShadow() {
        return true;
    }

    static goto(path) {
        SPRouter.location = path;
        SPRouter.locationMatched = false;
        const event = new CustomEvent('routechange', {detail: {path: SPRouter.location}});
        document.dispatchEvent(event);
    }

    connected() {
        //build the regex for route matching
        let path = this.getAttribute('path');
        // replace {id:d} with (?<id>[0-9]+) (a named capture group)
        // https://caniuse.com/mdn-javascript_builtins_regexp_named_capture_groups
        let routerPathRegexStr = path.replace(/{([^\/:}]+):d}/g, "(?<$1>[0-9]+)");
        // replace {id:regex} with (?<id>regex)
        routerPathRegexStr = routerPathRegexStr.replace(/{([^\/:}]+):([^\/}]+)}/g, "(?<$1>$2)");
        // replace {id} with (?<id>[^/]+)
        routerPathRegexStr = routerPathRegexStr.replace(/{([^\/:}]+)}/g, "(?<$1>[^/]+)");
        // also, replace ending /* with (?<*>/.*)
        routerPathRegexStr = routerPathRegexStr.replace(/\/\*$/g, "(?<*>.*)");
        // start and end placeholders
        routerPathRegexStr = '^' + routerPathRegexStr + '$';
        this._regex = new RegExp(routerPathRegexStr);
        document.addEventListener('routechange', this._bindedUpdate);
    }

    disconnected() {
        document.removeEventListener('routechange', this._bindedUpdate);
    }

    match(routePath) {
        return routePath === '*' || (routePath === 'else' && !SPRouter.locationMatched) || this._regex.test(SPRouter.location);
    }

    params() {
        let match = SPRouter.location.match(this._regex)
        return match && match.groups || {};
    }

    render() {
        let routePath = this.getAttribute('path');
        if (this.match(routePath)) {
            SPRouter.locationMatched = routePath !== 'else' && routePath !== '*'; // else and * does not count as a match
            // provide path arguments, like /article/{id}/summary
            let params = this.params(routePath, SPRouter.location);
            const event = new CustomEvent('routematched', {
                detail: {
                    path: SPRouter.location,
                    matches: routePath,
                    params
                }, bubbles: true
            });
            this.dataset.routeMatched = '';
            for (let param in params) {
                //setup params in <sp-router> element
                this.dataset[`${param}`] = params[param];
                //setup params in <sp-router> element children that request it
                //https://caniuse.com/#search=%3Ascope
                const attrNameKey = `route-set-${param}`;
                this.querySelectorAll(`:scope [${attrNameKey}]`).forEach(function (el) {
                    const attrName = el.getAttribute(attrNameKey);
                    el.setAttribute(attrName, params[param]);
                });
            }
            this.dispatchEvent(event);
            return document.createElement('slot');
        } else {
            delete this.dataset.routeMatched;
            for (let param in this.dataset) {
                if (param.endsWith('RouteParam')) {
                    delete this.dataset[param];
                }
            }
            return document.createDocumentFragment();
        }
    }
}

SPRouter.register();

// provides a history for SPRouter that can be controlled programmatically
class SPRouterHistory {
    #history = [];
    #index = -1;
    #paused = false;

    constructor() {
        document.addEventListener('routechange', () => this._update());
        this._update();
    }

    get paused() {
        return this.#paused;
    }

    get history() {
        return this.#history;
    }

    get current() {
        return this.#history[this.#index];
    }

    _update() {
        if (this.paused || SPRouter.location === this.current) {
            return;
        }
        this.#index++;
        this.#history.splice(this.#index);
        this.#history.push(SPRouter.location);
    }

    canGoBack(n = 1) {
        return this.#history.length && this.#index >= n;
    }

    canGoForward(n = 1) {
        return this.#history.length && this.#index < this.#history.length - n;
    }

    back(n = 1) {
        if (this.canGoBack(n)) {
            this.#index -= n;
            SPRouter.goto(this.#history[this.#index]);
        }
    }

    forward(n = 1) {
        if (this.canGoForward(n)) {
            this.#index += n;
            SPRouter.goto(this.#history[this.#index]);
        }
    }

    pause() {
        this.#paused = true;
    }

    resume() {
        this.#paused = false;
    }
}

// integrates SPRouter with the browser's history
class SPRouterBrowserHistory {
    constructor() {
        document.addEventListener('routechange', this._updateHash.bind(this));
        window.addEventListener("hashchange", this._updateRoute.bind(this));
        this._updateRoute();
        this._updateHash();
    }

    _hashForCurrentLocation() {
        return `#${SPRouter.location}`;
    }

    _locationForCurrentHash() {
        return window.location.hash.slice(1);
    }

    _updateHash() {
        if (this._hashForCurrentLocation() === window.location.hash) {
            return;
        }
        window.location.hash = this._hashForCurrentLocation();
    }

    _updateRoute() {
        if (this._hashForCurrentLocation() === window.location.hash) {
            return;
        }
        let routerLocation = this._locationForCurrentHash();
        if (routerLocation[0] === '/') { //otherwise, it is not a router related hash
            SPRouter.goto(routerLocation);
        }
    }
}

// class that notifies subscribers about an SPRouter tag being targeted, tags need an id to identify them
class SPRouterDispatcher {
    #subscribers = {};

    constructor() {
        document.addEventListener('routematched', ev => this._dispatch(ev));
    }

    subscribe(id, fn) {
        const subs = this.#subscribers[id] = this.#subscribers[id] || [];
        if (!subs.includes(fn)) {
            subs.push(fn);
        }
    }

    _dispatch(ev) {
        let id = ev.target.id || '';
        let subs = this.#subscribers[id];
        if (subs && subs.length) {
            subs.forEach(function (subscriber) {
                if (typeof subscriber === 'function') {
                    //check that it is still in the original list of subscriber
                    if (subs.includes(subscriber)) {
                        subscriber.call(undefined, ev, id);
                    }
                }
            });
        }
    }
}

// provides a linkable element for SPRouter (works like an anchor tag, <a>, but for states of the SPA)
class SPRouterLink extends SodaPop {
    constructor() {
        super();
        this._clickHandler = () => SPRouter.goto(this.getAttribute('path'));
    }

    get useShadow() {
        return false;
    }

    connected() {
        this.addEventListener('click', this._clickHandler);
    }

    disconnected() {
        this.removeEventListener('click', this._clickHandler);
    }
}

SPRouterLink.register();