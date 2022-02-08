class SPImgFallback extends Soda.pop('img') {

    connected(fallback) {
        fallback = this.getAttribute('data-fallback') || fallback || '';
        this.addEventListener('error', () => {
            let src = this.getAttribute('src');
            if (src !== fallback) {
                this.setAttribute('src', fallback);
            }
        });
    }

}