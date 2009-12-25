
function AddButton(uri, title, location) {
    this.uri = uri;
    this.title = title || '';
    this.location = location || '';
    this.operator = new Star.Operator(this.uri, this.title, this.location);
}

extend(AddButton.prototype, {
    addStar: function SAB_addStar(element, color) {
        if (!Star.canModify) {
            hOpenUILink('http://s.hatena.ne.jp/guide'); // XXX localize this URL.
            return;
        }
        let tempStar = this.addTemporaryStar(element);
        let quote = String(window.getSelection());
        this.operator.add(color, quote, bind(onStarAdded, this));
        function onStarAdded(star) {
            if (!star || star.errors) {
                tempStar.parentNode.removeChild(tempStar);
                return;
            }
            let elem = Star.createStar(star.name, star.quote, star.color);
            tempStar.parentNode.replaceChild(elem, tempStar);
        }
    },

    addTemporaryStar: function SAB_addTemporaryStar(element) {
        let star = Star.createTemporaryStar();
        element.parentNode.appendChild(star);
        return star;
    },
});

Star.AddButton = AddButton;
