const EXPORT = ['BookmarkTreeContext'];

function BookmarkTreeContext(popup) {
    popup.addEventListener('popupshowing', this, false);
    popup.addEventListener('command', this, false);
}

const ID_PREFIX = 'hBookmark-bookmark-context-';

BookmarkTreeContext.items = {
    showRecent: {
        onCommand: function (treeView) treeView.showBySearchString(''),
        shouldDisplay: function (treeView) !treeView.isAscending,
    },
    showOld: {
        onCommand: function (treeView) treeView.showBySearchString(''),
        shouldDisplay: function (treeView) treeView.isAscending,
    },
};

extend(BookmarkTreeContext.prototype, {
    forEachItem: function BTC_forEachItem(callback, thisObject) {
        for (let [key, item] in new Iterator(BookmarkTreeContext.items)) {
            let menuitem = document.getElementById(ID_PREFIX + key);
            if (!menuitem) continue;
            callback.call(thisObject, item, menuitem);
        }
    },

    handleEvent: function BTC_handleEvent(event) {
        treeView = document.popupNode.parentNode.view.wrappedJSObject;
        switch (event.type) {
        case 'popupshowing':
            this.forEachItem(function (item, menuitem) {
                menuitem.hidden = !item.shouldDisplay(treeView);
            }, this);
            break;

        case 'command':
            this.forEachItem(function (item, menuitem) {
                item.onCommand(treeView);
            }, this);
            break;
        }
    },
});
