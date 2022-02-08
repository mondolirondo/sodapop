// a web component that shows an 'empty' message under certain conditions
// add a content-selector attribute to the component, like <sp-empty-status content-selector=".content">
// add two slots to it: empty and content, like <div slot="empty"> and <div slot="content">
// when the content slot contains at least one element matched by the content-selector, it will be shown
// otherwise, the empty slot will be visible
class SPEmptyStatus extends SodaPop {
    get useShadow() {
        return true;
    }

    async connected() {
        await SPEmptyStatus.documentReady;
        this.targetNode = this.querySelector('[slot=content]');
        // observe the content slot and call update whenever it changes
        this.observer = new MutationObserver(this.update.bind(this));
        this.observer.observe(this.targetNode, {
            characterData: true,
            childList: true,
            subtree: true
        });
        this.update();
    }

    disconnected() {
        this.observer.disconnect();
    }

    render() {
        const slot = document.createElement('slot');
        // get the content selector
        // use this.contentSelector to easily allow subclasses with fixed content selector
        const contentSelector = this.contentSelector ?? this.getAttribute('content-selector') ?? false;
        const hasContent = contentSelector ?
            this.targetNode?.querySelectorAll(contentSelector).length :
            (this.targetNode?.childElementCount || this.targetNode?.innerText.trim().length);
        if (hasContent) {
            //has content
            slot.setAttribute('name', 'content');
        } else {
            //content is empty
            slot.setAttribute('name', 'empty');
        }
        return slot;
    }
}

SPEmptyStatus.register();