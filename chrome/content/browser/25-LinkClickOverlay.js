
const EXPORT = ['LinkClickOverlay'];
const BOOKMARK_TOP = 'http://b.hatena.ne.jp/';
const BOOKMARK_APPEND = '/append?';
const BOOKMARK_ADD = '/add?mode=confirm';
const BOOKMARK_ADD_CONFIRM = '/add.confirm?';
const BOOKMARK_ENTRY_ADD = '/entry/add/';
const ESCAPE_REGEX_CHECK = new RegExp('^https?%3A', 'i');

var LinkClickOverlay = {
    linkClickHandler: function(ev) {
        if (ev.button != 0) return;

        let target = ev.target;
        if (!(target instanceof Ci.nsIDOMHTMLElement)) return;
        if (target.parentNode instanceof Ci.nsIDOMHTMLAnchorElement)
            target = target.parentNode;

        if ((LinkClickOverlay.captureComments &&
             target.className === 'hatena-bcomment-view-icon') ||
            target.className.indexOf('hBookmark-widget-comments') !== -1) {
            let url = target.getAttributeNS(HB_NS, 'url');
            if (!url) {
                let match = (target.getAttribute('onclick') || '').match(/\'https?:\/\/(?:[^\\\']|\\.)+|\"https?:\/\/(?:[^\\\"]|\\.)+/) || [''];
                url = match[0].substring(1).replace(/\\((u[0-9a-zA-Z]{4}|x[0-9a-zA-Z]{2})|.)/g, function (m, seq, code) {
                    return code ? String.fromCharCode('0x' + code.substring(1)) : seq;
                });
            }
            if (url) {
                CommentViewer.show(url);
                ev.stopPropagation();
                ev.preventDefault();
            }
        }

        let link;
        if (LinkClickOverlay.captureAddition && (link = target.href)) {
            if (link.indexOf(BOOKMARK_TOP) == 0) {
                let index, url, subindex;
                if ((index = link.indexOf(BOOKMARK_APPEND)) > 0) {
                    url = link.substring(index + BOOKMARK_APPEND.length);
                } else if ((index = link.indexOf(BOOKMARK_ENTRY_ADD)) > 0) {
                    url = link.substring(index + BOOKMARK_ENTRY_ADD.length);
                    url = url.replace(/%23/g, '#');
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
        let LCO = LinkClickOverlay;
        LCO.captureAddition = LCO.prefs.get('captureAddition');
        LCO.captureComments = LCO.prefs.get('captureComments');
    },
    onloadHandler: function(ev) {
        LinkClickOverlay.prefsLinkOverlay();
        LinkClickOverlay.prefs.createListener('captureAddition', LinkClickOverlay.prefsLinkOverlay);
        LinkClickOverlay.prefs.createListener('captureComments', LinkClickOverlay.prefsLinkOverlay);
        LinkClickOverlay.register();
    }
}

window.addEventListener('load', LinkClickOverlay.onloadHandler, false);


