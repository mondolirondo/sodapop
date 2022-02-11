class SPTriStateCheckbox extends Soda.pop('input') {

    #indet = false;

    connected() {
        this.type = 'checkbox'; // make it a checkbox if it is not yet
        this.#indet = this.indeterminate;
        this.addEventListener('click', () => {
            if (this.#indet) {
                //indeterminate have just been cleared due to the click set as unchecked
                this.checked = this.#indet = false;
            } else if (!this.checked) {
                //not checked and not indeterminated? It comes from a checked state, set as indeterminated
                this.#indet = this.indeterminate = true;
            }
            if (this.checked)
                this.setAttribute('checked', '');
            else
                this.removeAttribute('checked');
            if (this.indeterminate)
                this.setAttribute('indeterminate', '');
            else
                this.removeAttribute('indeterminate');
        });
    }
}

SPTriStateCheckbox.register();