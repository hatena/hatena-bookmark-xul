
var EXPORT = ['LocationBar'];

// elementGetter(this, 'bar', 'urlbar', document);
elementGetter(this, 'panel', 'hBookmark-panel-urlbar', document);
elementGetter(this, 'list', 'hBookmark-urlbar-listbox', document);
elementGetter(this, 'icon', 'hBookmark-search-icon', document, true);

let E = createElementBindDocument(document);
let Bookmark = model('Bookmark');

var LocationBar = {
    registerEventListeners: function() {
        p('locationbar register');
        LocationBar.bar.addEventListener('keypress', LocationBar.barKeyPressTabHandler, true);
        LocationBar.bar.inputField.addEventListener('keydown', LocationBar.barKeyDownHandler, true);
        LocationBar.bar.inputField.addEventListener('keypress', LocationBar.barKeyPressHandler, false);
        LocationBar.bar.inputField.addEventListener('keyup', LocationBar.barKeyUpHandler, true);
    },
    unregisterEventListeners: function() {
        p('locationbar unregister');
        LocationBar.searchEnabled = false;
        LocationBar.bar.removeEventListener('keypress', LocationBar.barKeyPressTabHandler, true);
        LocationBar.bar.inputField.removeEventListener('keydown', LocationBar.barKeyDownHandler, true);
        LocationBar.bar.inputField.removeEventListener('keypress', LocationBar.barKeyPressHandler, false);
        LocationBar.bar.inputField.removeEventListener('keyup', LocationBar.barKeyUpHandler, true);
    },
    inited: false,
    init: function LocationBar_init() {
        list.addEventListener('keypress', LocationBar.listKeypressHandler, false);
        list.addEventListener('click', LocationBar.goLink, false);
        list.addEventListener('select', LocationBar.selectHandler, false);

        LocationBar.prefs.createListener('search', method(this, 'searchPrefsHandler'));
        LocationBar.searchPrefsHandler();

        /*
        addAround(LocationBarHelpers, '_searchBegin', function(proceed, args, target) {
            // if (LocationBar.searchEnabled)
            //     LocationBar.search();
            proceed(args);
        });
        */
    },
    searchPrefsHandler: function(ev) {
        if (LocationBar.prefs.get('search')) {
            LocationBar.registerEventListeners();
            icon.removeAttribute('hidden');
        } else {
            LocationBar.unregisterEventListeners();
            icon.setAttribute('hidden', true);
        }
    },
    _isSearch: false,
    selectHandler: function(ev) {
        /*
        let b = LocationBar.bar;
        (bar.controller.input || b.mController.input).textValue = list.selectedItem.value;
        */
    },
    get prefs() {
        if (!LocationBar._prefs) {
            LocationBar._prefs = new Prefs('extensions.hatenabookmark.locationbar.');
        }
        return LocationBar._prefs;
    },
    _fakeController: null,
    get fakeController() {
        if (!this._fakeController) 
            this._fakeController = new FakeAutoCompletePopupController(LocationBar.bar.mController);
        return this._fakeController;
    },
    get searchEnabled() this._isSearch,
    set searchEnabled(bool) {
        if (bool) {
            if (!User.user) {
                UIUtils.encourageLogin();
                return;
            }

            LocationBar._isSearch = true;
            /* XXX: 本当は AutoComplete をきちんと切りたい… 
             * ここで要素が見えてないと AutoComplete がエラーになるので直す
             */
            LocationBar.bar.mController = LocationBar.fakeController;
            document.getElementById('PopupAutoCompleteRichResult').setAttribute('hiddenByHBookmark', true);
            document.getElementById('PopupAutoCompleteRichResult').hidePopup();
            icon.removeAttribute('searchdisabled');
            // LocationBar.search();
        } else {
            LocationBar._isSearch = false;
            LocationBar.bar.mController = LocationBar.fakeController.controller;
            document.getElementById('PopupAutoCompleteRichResult').removeAttribute('hiddenByHBookmark');
            icon.setAttribute('searchdisabled', true);
            LocationBar.searchLastWord = null;
            LocationBar.hide();
        }
    },
    eventStopper: function(ev) {
        ev.stopPropagation();
    },
    iconClickHandler: function(ev) {
        setTimeout(function() {
            // タイミングをずらさないとうまくいかない
            LocationBar.toggle();
        }, 0);
        ev.stopPropagation();
    },
    toggle: function() {
        if (LocationBar.searchEnabled) {
            LocationBar.searchEnabled = false;
        } else {
            LocationBar.searchEnabled = true;
            // setTimeout(function() LocationBar.search(), 100);
        }
    },
    barKeyPressTabHandler: function(ev) {
        if (LocationBar.searchEnabled && ev.keyCode == ev.DOM_VK_TAB) {
            ev.preventDefault();
            ev.stopPropagation();
        }
    },
    barKeyPressHandler: function(ev) {
        if (LocationBar.searchEnabled)
            setTimeout(function() LocationBar.search() , 0);
    },
    toggleFlag: false,
    barKeyDownHandler: function(ev) {
        /* ここで stop すると、選択の List の挙動を変更できる
        p('keydown' + ev.keyCode);
        */
        let keyCode = ev.keyCode;
        if (ev.ctrlKey && ev.shiftKey &&
            (keyCode == ev.DOM_VK_SHIFT) &&
            LocationBar.prefs.get('searchToggle')
            ) {
            LocationBar.toggleFlag = true;
            ev.stopPropagation();
            return;
        }

        if (LocationBar.searchEnabled) {
            ev.stopPropagation();
            if (keyCode == ev.DOM_VK_TAB)
                ev.preventDefault();
            setTimeout(function() {
                // keyup 後にフォーカス移動をしたいので setTimeout

                if (keyCode == ev.DOM_VK_DOWN || (keyCode == ev.DOM_VK_TAB && !ev.shiftKey)) {
                    LocationBar.show();
                    list.focus();
                    list.selectedIndex = 0;
                } else if (keyCode == ev.DOM_VK_UP || (keyCode == ev.DOM_VK_TAB && ev.shiftKey)) {
                    LocationBar.show();
                    list.focus();
                    list.currentIndex = list.getRowCount() - 1;
                    list.ensureIndexIsVisible(list.selectedIndex);
                }
            }, 10);
        }
    },
    barKeyUpHandler: function(ev) {
        if (LocationBar.toggleFlag) {
            LocationBar.toggleFlag = false;
            LocationBar.toggle();
            if (LocationBar.searchEnabled) {
                LocationBar.search();
            }
        }
    },
    clearTimer: function() {
        clearTimeout(LocationBar.ctrlTimer);
        delete LocationBar.ctrlTimer;
    },
    clear: function() {
        while(list.firstChild) list.removeChild(list.firstChild);
    },
    searchLastWord: null,
    search: function LocationBar_search() {
        let word = LocationBar.bar.inputField.value;

        if (!word || (LocationBar.searchLastWord == word)) {
            LocationBar.hide();
            return;
        }

        LocationBar.searchLastWord = word;
        p('LocationBarSearch: ' + word);
        let res = Bookmark.search(word, 10);
        LocationBar.clear();
        if (res.length > 0) {
            LocationBar.resultRender(res);
        } else {
            LocationBar.hide();
        }
    },
    commentNone: decodeURIComponent(escape('コメント無し')),
    resultRender: function(res) {
        let row = list.getAttribute('rows');
        let height;
        res.forEach(function(b) {
            let tags;
            let comment;
            // XXX: context 指定してもうまくいかない
            let label;
            let item = E('richlistitem', {
                'class': 'hBookmark-urlbar-listitem', value:b.url},
                E('hbox', {flex: '1'}, 
                    E('vbox', null,
                        E('image', {src: b.favicon, width:'16px', height:'16px'})
                    ),
                    E('vbox', {flex: '1'}, 
                        E('label', {
                            class: 'hBookmark-urlbar-title', crop: 'end', flex: '1', value: b.title, tooltiptext: b.title}),
                        E('hbox', {tooltiptext: b.comment},
                            tags = E('label', {'class': 'hBookmark-urlbar-tags', value: b.tags.join(', ')}),
                            comment = E('label', {'class': 'hBookmark-urlbar-commentbody',flex: '1',  crop: 'end',  value: b.body})
                        ),

                        E('hbox', null,
                            E('label', {'class': 'hBookmark-urlbar-url', value: b.url, flex: '1', crop: 'end', tooltiptext: b.url}),
                            E('label', {'class': 'hBookmark-urlbar-date', value: b.dateYMD, tooltiptext: b.dateYMD})
                        )
                    )
                )
            );
            item.bookmark = b;
            if (b.tags.length == 0) {
                tags.parentNode.removeChild(tags);
                if (b.body.length == 0) {
                    comment.setAttribute('value', LocationBar.commentNone);
                    comment.setAttribute('class', 'hBookmark-urlbar-commentnone');
                }
            }
            list.appendChild(item);
            let rect = item.getBoundingClientRect();
            height = parseInt(rect.bottom - rect.top);
        });
        if (height) {
            list.setAttribute('height', '' + (height * Math.min(row, res.length)) + 'px');
        } else {
            // XXX
            // なんで height が空？
            // list.setAttribute('height', '' + (50 * Math.min(row, res.length)) + 'px');
            // setTimeout(function() {
            //     panel.openPopup(bar, 'after_end', 0, 0,false,false);
            // }, 200);
        }
        setTimeout(function() {
            list.setAttribute('rows', LocationBar.prefs.get('resultRows'));
            // let pRef = list.parentNode;
            // list.parentNode.removeChild(list);
            // pRef.appendChild(list);
            LocationBar.show();
        }, 0);
    },
    listMousemoveHandler: function LocationBar_listMousemoveHandler(ev) {
        // XXX
        if (ev.target.tagName == 'richlistitem') {
            list.selectedItem = ev.target;
            list.currentIndex = list.selectedIndex;
        }
    },
    listKeypressHandler: function LocationBar_listKeypressHandler(ev) {
        if (ev.keyCode == ev.DOM_VK_RETURN || ev.keyCode == ev.DOM_VK_ENTER) {
            LocationBar.goLink(ev);
        } else if (ev.keyCode == ev.DOM_VK_TAB) {
            // next
            if (ev.shiftKey) {
                if (list.selectedIndex == 0) {
                    LocationBar.listControler.last();
                } else {
                    list.selectedIndex = list.selectedIndex - 1;
                }
            } else {
                if (list.selectedIndex == list.getRowCount() - 1) {
                    LocationBar.listControler.first();
                } else {
                    list.selectedIndex = list.selectedIndex + 1;
                }
            }
            list.ensureIndexIsVisible(list.selectedIndex);
        } else if (ev.keyCode == 8) { // backspace?
            ev.stopPropagation();
            ev.preventDefault();
            LocationBar.bar.inputField.focus();
        }
    },
    listControler: {
        first: function() {
            list.selectedIndex = 0;
            list.ensureIndexIsVisible(list.selectedIndex);
        },
        last: function() {
            list.selectedIndex = list.getRowCount() - 1;
            list.ensureIndexIsVisible(list.selectedIndex);
        },
        clear: function() {
            list.selectedIndex = -1;
            LocationBar.hide();
        },
    },
    show: function() {
        panel.openPopup(LocationBar.bar, 'after_end', 0, 0,false,false);
    },
    hide: function() {
        panel.hidePopup();
    },
    _goLink: function(url, ev) {
        if (ev.target.getAttribute('class') == 'hBookmark-urlbar-entrylink') {
            url = entryURL(url);
        } else if (ev.target.getAttribute('class') == 'hBookmark-urlbar-entryedit') {
            hBookmark.AddPanelManager.showPanel(url);
            return;
        } 
        openUILink(url, ev);
        LocationBar.searchEnabled = false;
    },
    goLink: function LocationBar_goLink(ev) {
        if (ev.button == 2)
            return;
        ev.stopPropagation();
        ev.preventDefault();
        let item = ev.target.selectedItem;
        if (item && item.value) {
            LocationBar._goLink(item.value, ev);
            LocationBar.hide();
        } else {
            setTimeout(function() {
                let item = list.selectedItem;
                if (item && item.value) {
                    LocationBar._goLink(item.value, ev);
                    LocationBar.hide();
                }
            }, 0);
        }
    },
    get bar function() document.getElementById('urlbar'),
};

/*
 * Fx 3.0 では urlbar の autocomplete を無効化する方法が不明なため、
 * 何もしない nsIAutoCompleteController の偽コントローラを作る
 */
function FakeAutoCompletePopupController(aBaseController) 
{
    this.init(aBaseController);
}

FakeAutoCompletePopupController.prototype = {
    destroy: function() {
    },
    get controller() this.__originalController__,
    init : function(controller) this.__originalController__ = controller,

    STATUS_NONE              : Ci.nsIAutoCompleteController.STATUS_NONE, 
    STATUS_SEARCHING         : Ci.nsIAutoCompleteController.STATUS_SEARCHING,
    STATUS_COMPLETE_NO_MATCH : Ci.nsIAutoCompleteController.STATUS_COMPLETE_NO_MATCH,
    STATUS_COMPLETE_MATCH    : Ci.nsIAutoCompleteController.STATUS_COMPLETE_MATCH,
    get input() 
        this.controller.input,
    set input(aValue) 
        this.controller.input = aValue,
    get searchStatus() 
        this.controller.searchStatus,
    set searchStatus(aValue) 
        this.controller.searchStatus = aValue,
    get matchCount() 
        0,
    startSearch : function(aString) 
        null,
        //this.controller.startSearch(aString),
    stopSearch : function() 
        null,
        //this.controller.stopSearch(),
    handleText : function(aIgnoreSelection) 
        null,
        //this.controller.handleText(aIgnoreSelection),
    handleEnter : function(aIsPopupSelection) 
        this.controller.handleEnter(aIsPopupSelection),
    handleEscape : function() 
        //false,
        this.controller.handleEscape(),
    handleStartComposition : function() 
        null,
        //this.controller.handleStartComposition(),
    handleEndComposition : function() 
        null,
        //this.controller.handleEndComposition(),
    handleTab : function() {
        return null;
        //return this.controller.handleTab();
    },
    handleKeyNavigation : function(aKey) {
        //return true;
        return this.controller.handleKeyNavigation(aKey);
    },
    handleDelete : function() 
        //false,
        this.controller.handleDelete(),
    getValueAt : function(aIndex) 
        null,
    getCommentAt : function(aIndex) 
        null,
    getStyleAt : function(aIndex) 
        null,
    getImageAt : function(aIndex) 
        null,
    get searchString() 
        this.controller.searchString,
    set searchString(aValue)
        this.controller.searchString = aValue,
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIAutoCompleteController, Ci.nsISupports]),
}; 

EventService.createListener('load', function() {
    LocationBar.init();

    // toolbox 変更時の処理
    addAround(window, 'BrowserToolboxCustomizeDone', function(proceed, args, target) {
        LocationBar.unregisterEventListeners();
        proceed(args);
        LocationBar.init();
    });
});



