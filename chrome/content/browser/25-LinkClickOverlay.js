
const EXPORT = ['LinkClickOverlay'];
const BOOKMARK_TOP = 'http://b.hatena.ne.jp/';
const BOOKMARK_APPEND = '/append?';
const BOOKMARK_ADD = '/add?mode=confirm';
const BOOKMARK_ADD_CONFIRM = '/add.confirm?';
const ESCAPE_REGEX_CHECK = new RegExp('^https?%3A', 'i');

var LinkClickOverlay = {
    linkClickHandler: function(ev) {
        let link;
        if (ev.button != 0) return;

        if (link = (ev.target.href || (ev.target.parentNode ? ev.target.parentNode.href : null))) {
            if (link.indexOf(BOOKMARK_TOP) == 0) {
                let index, url, subindex;
                if ((index = link.indexOf(BOOKMARK_APPEND)) > 0) {
                    url = link.substring(index + BOOKMARK_APPEND.length);
                } else if ((index = link.indexOf(BOOKMARK_ADD_CONFIRM)) > 0)  {
                    subindex = index + BOOKMARK_ADD_CONFIRM.length;
                } else if ((index = link.indexOf(BOOKMARK_ADD)) > 0)  {
                    subindex = index + BOOKMARK_ADD.length;
                }
                if (subindex) {
                    link.substring(subindex).split('&').
                        forEach(function(e) {
                            let [key, value] = e.split('=');
                            if (key == 'url') url = value;
                        });
                }
                if (url) {
                    if (ESCAPE_REGEX_CHECK.test(url)) {
                        url = decodeURIComponent(url);
                    }
                    AddPanelManager.showPanel(url);
                    ev.stopPropagation();
                    ev.preventDefault();
                }
            }
        }
    },
    register: function() {
        gBrowser.addEventListener('click', LinkClickOverlay.linkClickHandler, true);
    },
    unregister: function() {
        gBrowser.removeEventListener('click', LinkClickOverlay.linkClickHandler, true);
    },
    get prefs() {
        if (!LinkClickOverlay._prefs) {
            LinkClickOverlay._prefs = new Prefs('extensions.hatenabookmark.link.');
        }
        return LinkClickOverlay._prefs;
    },
    prefsLinkOverlay: function(ev) {
        if (LinkClickOverlay.prefs.get('captureAddition')) {
            LinkClickOverlay.register();
        } else {
            LinkClickOverlay.unregister();
        }
    },
    onloadHandler: function(ev) {
        LinkClickOverlay.prefsLinkOverlay();
        LinkClickOverlay.prefs.createListener('captureAddition', LinkClickOverlay.prefsLinkOverlay);
    }
}

window.addEventListener('load', LinkClickOverlay.onloadHandler, false);


