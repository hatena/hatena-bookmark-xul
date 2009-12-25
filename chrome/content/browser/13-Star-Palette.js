
let Palette = {
    get panel SP_get_panel() {
        let panel = document.getElementById('hBookmark-star-palette');
        panel.addEventListener('click', this.onPanelClick, false);
        panel.addEventListener('popuphidden', this.onPanelHidden, false);
        document.addEventListener('click', this.onDocumentClick, true);
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
            if (count)
                image.setAttribute('canadd', 'true');
            else
                image.removeAttribute('canadd');
        }
    },

    onPanelClick: function SP_onPanelClick(event) {
        let target = event.target;
        let color = target.getAttribute('color');
        if (!color) return;
        if (target.hasAttribute('canadd'))
            Palette.button.addStar(Palette.anchor, color);
        else
            hOpenUILink('https://www.hatena.ne.jp/shop/star'); // XXX Needs localization.
        Palette.panel.hidePopup();
    },

    onPanelHidden: function SP_onPanelHidden(event) {
        Palette.button = Palette.anchor = null;
    },

    onDocumentClick: function SP_onDocumentClick(event) {
        if (event.target === Palette.panel ||
            event.target.parentNode === Palette.panel)
            return;
        Palette.panel.hidePopup();
    },
};

Star.Palette = Palette;
