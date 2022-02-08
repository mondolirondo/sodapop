// A thin wrapper around web components
class Soda {
    static #keys = {};
    static #classes = new WeakMap();
    static #docReady = new Promise(accept => document.addEventListener("DOMContentLoaded", accept));

    // convert PascalCase to kebab-case (to name tags after class names)
    static _kebabize(str) {
        return str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, (caps, offset) => (offset ? "-" : "") + caps).toLowerCase();
    }

    static _registerAutonomousCustom() {
        customElements.define(Soda._kebabize(this.name), this);
    }

    static _registerCustom() {
        customElements.define(Soda._kebabize(this.name), this, {extends: this.extends});
    }

    // overwrite this method to modify the default behaviour of the generated class
    // returning a new class that extends the original, like:
    //      return class extends Soda.pop(tag) { <your code goes here> }
    //(see an example below)
    static makeClass(tag) {
        const base = tag ? document.createElement(tag).constructor : HTMLElement;
        // check if tag corresponds to an HTMLElement
        if (!(base === HTMLElement || base.prototype instanceof HTMLElement)) {
            throw new Error(`${base.name} does not inherit from HTMLElement`);
        }
        // define and return the wrapper
        return class extends base {
            constructor() {
                super();
                if (this.useShadow) {
                    this.attachShadow({mode: 'open'}); // what about {delegatesFocus: true|false}?
                }
            }

            get useShadow() {
                // any autonomous custom element can have a shadow DOM, but not every HTML element can, only:
                //     article, aside, blockquote, body, div, footer, h1-h6, header, main, nav, p, section, span
                return false;
            }

            // utility method to seamless get root node
            get root() {
                return this.shadowRoot || this;
            }

            #isGenerator(fn) {
                const fnType = fn.constructor.name;
                return fnType === 'GeneratorFunction' || fnType === 'AsyncGeneratorFunction';
            }

            // component lifecycle callbacks
            // do not override them, use the variant named without the 'Callback' ending
            connectedCallback() {
                //https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements
                //connectedCallback may be called once your element is no longer connected,
                //use Node.isConnected to make sure
                if (this.isConnected)
                    // if it is defined, call this.connected
                    this?.connected?.();
            }

            disconnectedCallback() {
                // if it is defined, call this.disconnected
                this?.disconnected?.();
            }

            // Note that to get the attributeChanged() callback to fire when an attribute changes,
            // you have to observe the attributes. This is done by specifying a static get observedAttributes()
            // that should return  an array containing the names of the attributes you want to observe
            // like this: static get observedAttributes() { return []; }
            attributeChangedCallback(attrName, oldVal, newVal) {
                // if it is defined, call this.attributeChanged
                this?.attributeChanged?.(attrName, oldVal, newVal);
            }

            adoptedCallback() {
                // if it is defined, call this.adopted
                this?.adopted?.();
            }
            // end of component lifecycle callbacks

            // here is where you build and return the component's content in the format that replace() expects it to be
            // if nothing (i.e. undefined) is returned, the content remains as-is
            render() {
            }

            // by default replace expects a set of Nodes or a DOMString, since it uses replaceChildren
            // you can override it to implement different replacement strategies, like DOM diffing and such
            replace(content) {
                this.root.replaceChildren(content);
            }

            // we could just call this.replace(await this.render()) however, this way
            // we allow render being a generator function, besides async, which comes
            // in handy, for instance to generate a temporary 'Loading...' state
            async update() {
                // check if render is a generator function
                if (this.#isGenerator(this.render)) {
                    // consume the generator
                    const generator = await this.render();
                    let content = await generator.next();
                    while (!content.done || content.value !== undefined) {
                        if (content.value !== undefined) {
                            // replace content
                            this.replace(content.value);
                        }
                        // ask for newer content
                        content = await generator.next();
                    }
                } else {
                    const content = await this.render();
                    if (content !== undefined) {
                        // just replace the content use await, just in case
                        await this.replace(content);
                    }
                }
                // if it is defined, call this.afterUpdate
                this?.afterUpdate?.();
            }
        };
    }

    // I know, I know, that's not a proper name
    // you can always alias it as getBaseClass or something dull like that
    static pop(tag = '') {
        // generate a unique id for the generated class
        // since Soda can and will be subclassed but the registry is shared,
        // we can not use just the tag name, so we prepend the class name of the current class
        const id = `${this.name}_${tag}`;
        // add the key
        Soda.#keys[id] = Soda.#keys[id] || {id};
        const key = Soda.#keys[id];
        // if the class does not exists yet
        if (!Soda.#classes.has(key)) {
            // generate and store it
            Soda.#classes.set(key, this.makeClass(tag));
            // get a reference to the class
            let customWebComponent = Soda.#classes.get(key);
            // define read-only property, holding the name of the tag
            Object.defineProperty(customWebComponent, "extends", {
                value: tag,
                writable: false
            });
            // add static documentReady promise (just because it is useful)
            customWebComponent.documentReady = Soda.#docReady;
            // add a static method to register web component
            customWebComponent.register = tag ? Soda._registerCustom : Soda._registerAutonomousCustom;
        }
        return Soda.#classes.get(key);
    }
}

const SodaPop = Soda.pop();

// You can extend Soda to modify its behaviour, for instance to use something more sophisticated and
// developer-friendly than replaceChildren

// Use HyperHTML or alike? https://github.com/WebReflection/uhtml
class HyperSoda extends Soda {
    static makeClass(tag) {
        return class extends Soda.pop(tag) {
            replace(content) {
                render(this.root, content);
            }
        };
    }
}

const HyperSodaPop = HyperSoda.pop();
