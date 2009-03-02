
var LocationBar = {
    init: function LocationBar_init () {
        let self = this;

        let bar = this.bar;
        if (bar && bar.mController.mController) return;

        let controller = new AutoCompletePopupController(bar.mController);
        bar.mController = controller;

        addAround(LocationBarHelpers, '_searchBegin', function(proceed, args, target) {
            proceed(args);
            bar.mController.searchBegin();
        });
    },
    get bar() 
    {
        return document.getElementById('urlbar');
    },
};

function AutoCompletePopupController(aBaseController) 
{
    this.init(aBaseController);
}

AutoCompletePopupController.prototype = 
{
    resultItems: [
    ],

    cleanup: function() {
        this.resultItems.splice(0);
    },

    get controller()
    {
        return this.mController;
    },
 
    init : function(controller) 
    {
        this.mController = controller;
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

    searchBegin : function() {
        var word = this.input.textValue;
        this.cleanup();

        async.method(function() {
            let b = model('Bookmark');
            let res = b.search(word, 3);
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
                this.resultItems.push({
                    value: r.url,
                    comment: unEscapeURIForUI('utf-8', body),
                    style: tags.length ? 'tag' : 'favicon',
                    image: r.favicon.spec,
                });
            }
        }, this);
    },
 
    stopSearch : function() 
    {
        return this.controller.stopSearch();
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

EventService.createListener('load', function() {
    LocationBar.init();
});


