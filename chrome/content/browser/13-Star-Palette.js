
let Palette = {
    get panel() {
        let panel = document.getElementById('hBookmark-star-palette');
        panel.addEventListener('click', this.onPanelClick, false);
        panel.addEventListener('popuphidden', this.onPanelHidden, false);
        document.addEventListener('mousedown', this.onDocumentMouseDown, true);
        delete this.panel;
        return this.panel = panel;
    },

    button: null,

    show: function SP_show(colors, button, anchor) {
        if (this.panel.state === 'open')
            this.panel.hidePopup();
        this.button = button;
        this.anchor = anchor;
        this.setStatus(colors);
        this.panel.openPopup(anchor, 'after_start', 0, 0, false, false);
    },

    setStatus: function SP_setStatus(colors) {
        for (let [color, count] in new Iterator(colors)) {
            let image = document.getElementById('hBookmark-star-palette-' + color);
            if (!image) continue;
            if (count)
                image.setAttribute('canadd', 'true');
            else
                image.removeAttribute('canadd');
        }
    },

    onPanelClick: function SP_onPanelClick(event) {
        if (event.button === 2) return;
        let target = event.target;
        let color = target.getAttribute('color');
        if (!color) return;
        if (target.hasAttribute('canadd'))
            Palette.button.addStar(Palette.anchor, color);
        else
            hOpenUILink(Star.strings.get('starShopURL'));
        Palette.panel.hidePopup();
    },

    onPanelHidden: function SP_onPanelHidden(event) {
        Palette.button = Palette.anchor = null;
    },

    onDocumentMouseDown: function SP_onDocumentMouseDown(event) {
        if (event.target === Palette.panel ||
            event.target.parentNode === Palette.panel)
            return;
        Palette.panel.hidePopup();
    },
};

Star.Palette = Palette;
