// A dialog that returns a promise from showModal()
// The promise returns the 'close' event object
class SPDialog extends Soda.pop('dialog') {
    connected() {
        this._showModal = this.showModal;
        this.showModal = async function () {
            return new Promise(resolve => {
                this.addEventListener("close", handler);

                function handler(e) {
                    // remove this handler
                    e.target.removeEventListener("close", handler);
                    resolve(e);
                }

                this._showModal();
            });
        }
    }
}

SPDialog.register();