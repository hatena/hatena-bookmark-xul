
var LocationBar = {
    init: function LocationBar_init () {
        let self = this;

        let bar = this.bar;
        let controller = new AutoCompletePopupController(bar.mController);
        bar.mController = controller;
        //let controller = new Delegator(bar.mController);
        //let controller = createMock(bar.mController, {
        //    getValueAt: function(aIndex) {
        //    p('log:' + aIndex);
        //    return 'http://example.com/';
        //    }
        //});
        //let myController = hhhhhhhhhhhhhh
        //p(bar.controller);
        //p(bar.mController);
        //controller.getValueAt = function(aIndex) {
        //    p('log:' + aIndex);
        //    return 'http://example.com/';
        //};
        //bar.mController = controller;
        //p(bar.mController.getValueAt.toSource());
        //p(self.bar.controller.getValueAt.toSource());

        addAround(LocationBarHelpers, '_searchBegin', function(proceed, args, target) {
            proceed(args);
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
 
    get searchStatus(aValue) 
    {
        return this.controller.searchStatus;
    },
 
    get matchCount() 
    {
        return this.controller.matchCount;
    },
 
    startSearch : function(aString) 
    {
        return this.controller.startSearch(aString);
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
        return this.controller.handleKeyNavigation(aKey);
    },
 
    handleDelete : function() 
    {
        return this.controller.handleDelete();
    },
 
    getValueAt : function(aIndex) 
    {
        return 'http://example.com'; // this.controller.getValueAt(aIndex);
    },
 
    getCommentAt : function(aIndex) 
    {
        return this.controller.getCommentAt(aIndex);
    },
 
    getStyleAt : function(aIndex) 
    {
        return this.controller.getStyleAt(aIndex);
    },
 
    getImageAt : function(aIndex) 
    {
        return this.controller.getImageAt(aIndex);
    },
 
    get searchString() 
    {
        return this.controller.searchString;
    },
    set searchString(aValue)
    {
        return this.controller.searchString = aValue;
    },
 
    QueryInterface : function(aIID) 
    {
        if (aIID.equals(Ci.nsIAutoCompleteController) ||
            aIID.equals(Ci.nsISupports))
            return this;
        throw Components.results.NS_ERROR_NO_INTERFACE;
    }
}; 

EventService.createListener('load', function() {
    LocationBar.init();
});


