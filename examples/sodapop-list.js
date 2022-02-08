// requires https://github.com/SortableJS/Sortable
// a sortable list of elements that uses Sortable
// it also allow elements to be selected, toggling the .selected class on click
class SPList extends HyperSodaPop {
    connected() {
        if (this.hasAttribute('sortable')) {
            this.sortable = Sortable.create(this, {
                animation: 300,  // ms, animation speed moving items when sorting, `0` — without animation
                easing: "cubic-bezier(1, 0, 0, 1)", // Easing for animation. Defaults to null. See https://easings.net/
                //handle: ".mw-sort-handle",  // Drag handle selector within list items
                //filter: ".not-sortable",  // Selectors that do not lead to dragging (String or Function)
                draggable: ">.sortable",  // Selectors that lead to dragging (String or Function)
                dataIdAttr: 'data-id' // HTML attribute that is used by the `toArray()` method
            });
        }
        if (this.hasAttribute('selectable')) {
            this.addEventListener('click', function (ev) {
                if (ev.target.classList.contains('selectable')) {
                    ev.target.classList.toggle('selected');
                    const event = new CustomEvent('selectionchange', {
                        detail: {
                            target: ev.target,
                            selected: ev.target.classList.contains('selected')
                        }
                    });
                    this.dispatchEvent(event);
                }
            });
        }
    }

    selectAll() {
        if (this.hasAttribute('selectable')) {
            this.root.querySelectorAll('.selected').forEach(function (el) {
                el.classList.add('selected');
            });
        }
    }

    unselectAll() {
        if (this.hasAttribute('selectable')) {
            this.root.querySelectorAll('.selected').forEach(function (el) {
                el.classList.remove('selected');
            });
        }
    }

    toggleSelected() {
        if (this.hasAttribute('selectable')) {
            this.root.querySelectorAll('.selected').forEach(function (el) {
                el.classList.toggle('selected');
            });
        }
    }

    getSelected() {
        return this.root.querySelectorAll('.selected');
    }
}

SPList.register();