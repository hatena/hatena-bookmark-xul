
var EXPORT = ['LocationBar'];

elementGetter(this, 'bar', 'urlbar', document);
elementGetter(this, 'panel', 'hBookmark-panel-urlbar', document);
elementGetter(this, 'list', 'hBookmark-urlbar-listbox', document);
elementGetter(this, 'icon', 'hBookmark-search-icon', document);

const nsIDOMKeyEvent = Ci.nsIDOMKeyEvent;

let E = createElementBindDocument(document);
let Bookmark = model('Bookmark');

window.addEventListener('load', function() {
    list.addEventListener('keypress', LocationBar.listKeypressHandler, false);
    // list.addEventListener('mousemove', LocationBar.listMousemoveHandler, false);
    list.addEventListener('click', LocationBar.goLink, false);
    list.addEventListener('select', LocationBar.selectHandler, false);

    LocationBar.bar.addEventListener('keypress', LocationBar.barKeyPressTabHandler, true);
    LocationBar.bar.inputField.addEventListener('keydown', LocationBar.barKeyDownHandler, true);
    LocationBar.bar.inputField.addEventListener('keypress', LocationBar.barKeyPressHandler, false);
    LocationBar.bar.inputField.addEventListener('keyup', LocationBar.barKeyUpHandler, true);
}, false);

var LocationBar = {
    inited: false,
    init: function LocationBar_init () {
        addAround(LocationBarHelpers, '_searchBegin', function(proceed, args, target) {
            /*
            if (LocationBar.searchEnabled)
                LocationBar.search();
            */
            proceed(args);
        });
    },
    _isSearch: false,
    selectHandler: function(ev) {
        /*
        let b = LocationBar.bar;
        (bar.controller.input || b.mController.input).textValue = list.selectedItem.value;
        */
    },
    _fakeController: null,
    get fakeController() {
        if (!this._fakeController) 
            this._fakeController = new FakeAutoCompletePopupController(bar.mController);
        return this._fakeController;
    },
    get searchEnabled() this._isSearch,
    set searchEnabled(bool) {
        if (bool) {
            LocationBar._isSearch = true;
            /* XXX: 本当は AutoComplete をきちんと切りたい… 
             * ここで要素が見えてないと AutoComplete がエラーになるので直す
             */
            bar.mController = LocationBar.fakeController;
            document.getElementById('PopupAutoCompleteRichResult').setAttribute('hiddenByHBookmark', true);
            document.getElementById('PopupAutoCompleteRichResult').hidePopup();
            icon.removeAttribute('searchdisabled');
            LocationBar.search();
        } else {
            LocationBar._isSearch = false;
            bar.mController = LocationBar.fakeController.controller;
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
            setTimeout(function() LocationBar.search(), 100);
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
    keyUpFlag: true,
    barKeyDownHandler: function(ev) {
        /* ここで stop すると、選択の List の挙動を変更できる
        p('keydown' + ev.keyCode);
        */
        let keyCode = ev.keyCode;
        if (ev.ctrlKey && keyCode == ev.DOM_VK_CONTROL) {
            if (!LocationBar.ctrlTimer && this.keyUpFlag) {
                this.keyUpFlag = false;
                LocationBar.ctrlTimer = setTimeout(
                function() { 
                    LocationBar.toggle();
                    LocationBar.clearTimer();
                }, 500);
                ev.preventDefault();
            }
            ev.stopPropagation();
        } else if (LocationBar.searchEnabled) {
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
        this.keyUpFlag = true;
        if (LocationBar.ctrlTimer) {
            LocationBar.clearTimer();
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
        let word = bar.inputField.value;

        if (!word || (LocationBar.searchLastWord == word)) {
            LocationBar.hide();
            return;
        }

        LocationBar.searchLastWord = word;
        p('LocationBarSearch: ' + word);
        let res = Bookmark.search(word, 10);
        this.clear();
        if (res.length > 0) {
            LocationBar.resultRender(res);
        } else {
            LocationBar.hide();
        }
    },
    resultRender: function(res) {
        let row = list.getAttribute('rows');
        let height;
        res.forEach(function(b) {
            let tags;
            let item = E('richlistitem', {'class': 'hBookmark-urlbar-listitem', value:b.url},
                E('hbox', null, 
                    E('vbox', null,
                        E('image', {src: b.favicon, width:'16px', height:'16px'}),
                        E('image', {'class': 'hBookmark-urlbar-entrylink'})
                    ),
                    E('vbox', null, 
                        E('label', {'class': 'hBookmark-urlbar-title', value: b.title, tooltiptext: b.title}),
                        E('hbox', {tooltiptext: b.comment},
                            tags = E('label', {'class': 'hBookmark-urlbar-tags', value: b.tags.join(', ')}),
                            E('label', {'class': 'hBookmark-urlbar-comment', value: b.body})
                        ),

                        E('hbox', null,
                            E('label', {'class': 'hBookmark-urlbar-url', value: b.url, tooltiptext: b.url}),
                            E('label', {'class': 'hBookmark-urlbar-date', value: b.dateYMD, tooltiptext: b.dateYMD})
                        )
                    )
                )
            );
            if (b.tags.length == 0) tags.parentNode.removeChild(tags);
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
            list.setAttribute('rows', 6);
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
            bar.inputField.focus();
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
        panel.openPopup(bar, 'after_end', 0, 0,false,false);
    },
    hide: function() {
        panel.hidePopup();
    },
    _goLink: function(url, ev) {
        if (ev.target.getAttribute('class') == 'hBookmark-urlbar-entrylink') {
            url = entryURL(url);
        }
        openUILink(url, ev);
        LocationBar.searchEnabled = false;
    },
    goLink: function LocationBar_goLink(ev) {
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

/*
LocationBar.__Searcher = {
    lastWord: null,
    searchBegin: function() {
        let word = this.controller.input.textValue;
        if (this.lastWord == word)
            return;

        this.controller.cleanup();
        this.clearTimeout();
        if (word.length == 0) return;
        this.timeout = setTimeout(method(this, 'searchTimeoutHandler'), 100);

    },
    clearTimeout: function() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        this.timeout = null;
    },
    searchTimeoutHandler: function() {
        this.clearTimeout();
        let word = this.controller.input.textValue;
        this.lastWord == word;
        //async.method(function() {
            let b = model('Bookmark');
            let res = b.search(word, 3);
            async.method(this.searchCompleteHandler, this, ThreadManager.mainThread, res, word);
        //}, this);
    },
    _bar: null,
    get bar()
    {
        if (!this._bar)
            return document.getElementById('urlbar');
        return this._bar;
    },
    _panel: null,
    get panel()
    {
        if (!this._panel)
            this._panel = document.getElementById('PopupAutoCompleteRichResult');
        return this._panel;
    },
    get controller() this.bar.controller,

    searchCompleteHandler: function(res, word) {
        for (var i = 0;  i < res.length; i++) {
            let r = res[i];
            let body = r.body;
            if (body.length > 1) {
                body = sprintf('%s - %s', body, r.title);
            } else {
                body = r.title;
            }
            let tags = r.tags;
            if (tags.length) {
                body = body + sprintf(" \u2013 %s", tags.join(', '));
            }
            this.controller.resultItems.push({
                value: r.url,
                comment: unEscapeURIForUI('utf-8', body),
                style: tags.length ? 'tag' : 'favicon',
                image: r.favicon,
            });
        }
        if (this.controller.resultItems.length) {
            this.bar.openPopup();
        }
    },
 
}

function AutoCompletePopupController(aBaseController) 
{
    this.init(aBaseController);
}

AutoCompletePopupController.prototype = 
{
    resultItems: [
    ],
    finished: false,

    cleanup: function() {
        this.finished = false;
        this.resultItems.splice(0);
    },

    get controller()
    {
        return this.__mController__;
    },
 
    init : function(controller) 
    {
        this.__mController__ = controller;
    },
 
    STATUS_NONE              : Ci.nsIAutoCompleteController.STATUS_NONE, 
    STATUS_SEARCHING         : Ci.nsIAutoCompleteController.STATUS_SEARCHING,
    STATUS_COMPLETE_NO_MATCH : Ci.nsIAutoCompleteController.STATUS_COMPLETE_NO_MATCH,
    STATUS_COMPLETE_MATCH    : Ci.nsIAutoCompleteController.STATUS_COMPLETE_MATCH,
 
    get input() 
    {
        return this.controller.input;
    },
    set input(aValue)
    {
        return this.controller.input = aValue;
    },
 
    get searchStatus() 
    {
        return this.controller.searchStatus;
    },
 
    set searchStatus(aValue) 
    {
        return this.controller.searchStatus = aValue;
    },
 
    get matchCount() 
    {
        return this.controller.matchCount + this.resultItems.length;
    },
 
    startSearch : function(aString) 
    {
        return this.controller.startSearch(aString);
    },

    stopSearch : function() 
    {
        let res = this.controller.stopSearch();
        if (this.resultItems.length) {
            let self = this;
            // selection の Index 位置の復元
            setTimeout(function(){
                self.input.popup.adjustHeight();
                self.input.openPopup();
            }, 10);
        }
        res;
    },
 
    handleText : function(aIgnoreSelection) 
    {
        return this.controller.handleText(aIgnoreSelection);
    },
 
    handleEnter : function(aIsPopupSelection) 
    {
        if (aIsPopupSelection) {
            this.input.textValue = this.getValueAt(this.input.popup.selectedIndex);
            return false;
        }
        return this.controller.handleEnter(aIsPopupSelection);
    },
 
    handleEscape : function() 
    {
        return this.controller.handleEscape();
    },
 
    handleStartComposition : function() 
    {
        return this.controller.handleStartComposition();
    },
 
    handleEndComposition : function() 
    {
        return this.controller.handleEndComposition();
    },
 
    handleTab : function() 
    {
        return this.controller.handleTab();
    },
 
    handleKeyNavigation : function(aKey) 
    {
        // based on xulmigemo/content/xulmigemo/places/locationBarOverlay.js
        const nsIDOMKeyEvent = Components.interfaces.nsIDOMKeyEvent;
        var input = this.input;
        var popup = input.popup;
        var isMac = navigator.platform.toLowerCase().indexOf('mac') == 0;
        if (
            true &&
            (
                aKey == nsIDOMKeyEvent.DOM_VK_UP ||
                aKey == nsIDOMKeyEvent.DOM_VK_DOWN ||
                aKey == nsIDOMKeyEvent.DOM_VK_PAGE_UP ||
                aKey == nsIDOMKeyEvent.DOM_VK_PAGE_DOWN
            )
            ) {
            if (popup.popupOpen) {
                var reverse = (aKey == nsIDOMKeyEvent.DOM_VK_UP || aKey == nsIDOMKeyEvent.DOM_VK_PAGE_UP);
                var page = (aKey == nsIDOMKeyEvent.DOM_VK_PAGE_UP || aKey == nsIDOMKeyEvent.DOM_VK_PAGE_DOWN);
                var completeSelection = input.completeSelectedIndex;
                popup.selectBy(reverse, page);
                if (completeSelection) {
                    var selectedIndex = popup.selectedIndex;
                    if (selectedIndex >= 0) {
                        input.textValue = this.getValueAt(selectedIndex);
                    }
                    else {
                        input.textValue = this.searchString;
                    }
                    input.selectTextRange(input.textValue.length, input.textValue.length);
                }
                return true;
            }
            else if (
                !isMac ||
                (
                    aKey == nsIDOMKeyEvent.DOM_VK_UP ?
                    (
                        input.selectionStart == 0 &&
                        input.selectionStart == input.selectionEnd
                    ) :
                    aKey == nsIDOMKeyEvent.DOM_VK_DOWN ?
                    (
                        input.selectionStart == input.selectionEnd &&
                        input.selectionEnd == input.textValue.length
                    ) :
                    false
                )
                ) {
                if (true) {
                    popup.adjustHeight();
                    input.openPopup();
                    return true;
                }
            }
        }
        else if (
            true &&
            (
                aKey == nsIDOMKeyEvent.DOM_VK_LEFT ||
                aKey == nsIDOMKeyEvent.DOM_VK_RIGHT ||
                (isMac && aKey == nsIDOMKeyEvent.DOM_VK_HOME)
            )
            ) {
            if (popup.popupOpen) {
                var selectedIndex = popup.selectedIndex;
                if (selectedIndex >= 0) {
                    input.textValue = this.getValueAt(selectedIndex);
                    input.selectTextRange(input.textValue.length, input.textValue.length);
                }
                input.closePopup();
            }
            this.searchString = input.textValue;
            return false;
        }
        return this.controller.handleKeyNavigation(aKey);
    },
 
    handleDelete : function() 
    {
        return this.controller.handleDelete();
    },
 
    getValueAt : function(aIndex) 
    {
        if (aIndex < this.resultItems.length) {
            return this.resultItems[aIndex].value;
        }
        return this.controller.getValueAt(aIndex - this.resultItems.length);
    },
 
    getCommentAt : function(aIndex) 
    {
        if (aIndex < this.resultItems.length) {
            return this.resultItems[aIndex].comment;
        }
        return this.controller.getCommentAt(aIndex - this.resultItems.length);
    },
 
    getStyleAt : function(aIndex) 
    {
        if (aIndex < this.resultItems.length) {
            return this.resultItems[aIndex].style;
        }
        return this.controller.getStyleAt(aIndex - this.resultItems.length);
    },
 
    getImageAt : function(aIndex) 
    {
        if (aIndex < this.resultItems.length) {
            return this.resultItems[aIndex].image;
        }
        return this.controller.getImageAt(aIndex - this.resultItems.length);
    },
 
    get searchString() 
    {
        return this.controller.searchString;
    },
    set searchString(aValue)
    {
        return this.controller.searchString = aValue;
    },
 
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIAutoCompleteController, Ci.nsISupports]),
}; 
*/

EventService.createListener('load', function() {
    LocationBar.init();
});

