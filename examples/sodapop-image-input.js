// a file input for images, inspired by the one delivered with PicnicCSS
class SPImageInput extends Soda.pop('input') {
    #label;
    #backgroundImage = null;

    clear() {
        //utility method, because setting value programmatically does not fire the onchange event. See Note 1:
        //https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file
        this.value = '';
        if (this.#label) {
            this.#label.style.backgroundImage = this.#backgroundImage;
        }
    }
    connected() {
        this.type = 'file';
        this.accept = this.accept || 'image/*';
        //if multiple is set, only the first image is shown
        //(is there a good way to show all images or cycle through them?)
        let label = this.parentNode;
        //is it wrapped in a label? Use that label, else, add one:
        if (label.nodeName !== 'LABEL') {
            label = document.createElement('label');
            this.id = this.id || `sp-image-input-${Math.floor(Math.random() * 1000000000)}`;
            label.htmlFor = this.id;
            label.classList.add('sp-image-input-label');
            //add label *after* the input
            //another option would be to wrap the input, like: label.appendChild(this);
            //but that is harder to target selectively with CSS
            let nextSibling = this.nextElementSibling;
            if (nextSibling)
                this.parentNode.insertBefore(label, nextSibling)
            else
                this.parentNode.appendChild(label);
        }
        this.#label = label;
        //store the default inline background image (if any)
        this.#backgroundImage = this.#label.style.backgroundImage;
        //now we hide input and customize the label behaviour
        //the user is responsible for customizing the label appearance
        //if the label has a backgroundImage set with a CSS rule it will be
        //displayed again when the user cancels the selection of an image,
        //as in that case there is no image selected
        this.style.display = 'none';
        //reset background right on open dialog just in case an error arises when trying to read the image?
        //makes the code cleaner but feels strange for the user
        //label.onclick = e => label.style.backgroundImage = null;
        //so, set new background when selection change, reset it if no file is selected or sh*t happened
        this.onchange = e => {
            if (e.target.files.length) {
                try {
                    let reader = new FileReader();
                    reader.onloadend = () => {
                        label.style.backgroundImage = 'url(' + reader.result + ')';
                    }
                    reader.readAsDataURL(e.target.files[0]);
                    label.classList.remove('sp-image-input-error');
                } catch (e) {
                    label.classList.add('sp-image-input-error');
                    label.style.backgroundImage = null;
                }
            } else {
                label.style.backgroundImage = null;
            }
        }
    }
}

SPImageInput.register();