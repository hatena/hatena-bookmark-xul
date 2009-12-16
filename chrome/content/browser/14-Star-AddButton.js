
function AddButton(uri, title, location) {
    this.uri = uri;
    this.title = title || '';
    this.location = location || '';
    this.operator = new Star.Operator(this.uri, this.title, this.location);
    this.quote = '';
}

extend(AddButton.prototype, {
    addStar: function SAB_addStar(element, color) {
        let tempStar = this.addTemporaryStar(element);
        this.operator.add(color, this.quote, bind(onStarAdded, this));
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

    rememberQuote: function SAB_rememberQuote() {
        this.quote = String(window.getSelection());
    },
});

Star.AddButton = AddButton;
