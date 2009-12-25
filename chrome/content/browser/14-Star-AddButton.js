
function AddButton(uri, title, location) {
    this.uri = uri;
    this.title = title || '';
    this.location = location || '';
    this.operator = new Star.Operator(this.uri, this.title, this.location);
}

extend(AddButton, {
    PALETTE_DELAY: 800,
});

extend(AddButton.prototype, {
    addStar: function SAB_addStar(element, color) {
        if (!Star.canModify) {
            hOpenUILink(Star.strings.get('starGuideURL'));
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

    showPaletteLater: function SAB_showPaletteLater(element) {
        if (!Star.canModify) return;
        this.paletteTimer = setTimeout(method(this, 'showPalette'),
                                       AddButton.PALETTE_DELAY, element);
    },

    showPalette: function SAB_showPalette(element) {
        this.paletteCommand =
            this.operator.getAvailableColors(bind(onGotColors, this));
        function onGotColors(colors) {
            this.paletteCommand = null;
            if (!colors) return;
            Star.Palette.show(colors, this, element);
        }
    },

    cancelPalette: function SAB_cancelPalette() {
        if (this.paletteTimer) {
            clearTimeout(this.paletteTimer);
            this.paletteTimer = 0;
        }
        if (this.paletteCommand) {
            this.paletteCommand.cancel();
            this.paletteCommand = null;
        }
    },
});

Star.AddButton = AddButton;
