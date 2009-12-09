const EXPORT = ['StarAddButton'];

function StarAddButton(url, title, location) {
    this.url = url;
    this.title = title || '',
    this.location = location || '';
    this.adder = new StarAdder(url, title, location);
    this.quote = '';
    this.button = StarAddButton.baseButton.cloneNode(false);
    this.button.addEventListener('click', this, false);
    this.button.addEventListener('mouseover', this, false);
}

extend(StarAddButton, {
    get isAvailable SAB_s_get_isAvailable() StarAdder.isAvailable,
    baseButton: (function () {
        var button = document.createElementNS(XHTML_NS, 'img');
        button.className = 'hBookmark-star-add-button';
        button.alt = 'Add Star'; // XXX Needs localization!
        button.src = 'http://s.hatena.ne.jp/images/add.gif'; // XXX Use skin.
        return button;
    })(),
});

extend(StarAddButton.prototype, {
    addStar: function SAB_addStar(color) {
        let tempStar = this.addTemporaryStar();
        this.adder.add(color, this.quote, bind(onAddedStar, this));
        function onAddedStar(star) {
            if (!star || star.errors) {
                tempStar.parentNode.removeChild(tempStar);
                return;
            }
            // XXX 後でUtilitiesにまとめる
            let a = document.createElementNS(XHTML_NS, 'a');
            a.className = 'star'; // XXX star はまずい。hBookmark-star に。
            a.href = 'http://s.hatena.ne.jp/' + star.name;
            let img = document.createElementNS(XHTML_NS, 'img');
            img.src = 'http://s.hatena.ne.jp/images/star.gif';
            a.appendChild(img);
            a.user = star.name;
            a.quote = star.quote;
            //a.forComment =
            tempStar.parentNode.replaceChild(a, tempStar);
        }
    },

    addTemporaryStar: function SAB_addTemporaryStar() {
        // XXX 後でまとめる
        var img = document.createElementNS(XHTML_NS, 'img');
        img.src = 'http://s.hatena.ne.jp/images/star-temp.gif';
        this.button.nextSibling.appendChild(img);
        return img;
    },

    handleEvent: function SAB_handleEvent(event) {
        switch (event.type) {
        case 'click':
            this.addStar(null, '');
            break;

        case 'mouseover':
            this.quote = String(window.getSelection());
            break;
        }
    },
});
