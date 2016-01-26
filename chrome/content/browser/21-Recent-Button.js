
var EXPORT = ["RecentButton"];

elementGetter(this, 'subviewBody', 'PanelUI-hBookmark-recent-items', document);

var RecentButton = {
  tag: "",
  get count() hBookmark.Prefs.bookmark.get('recentItemCount'),
  getBookmarks: function() {
    try {
      return hBookmark.Model.Bookmark.findRecent(this.count);
    } catch (ex) {
      return [];
    }
  },
  createItem: function(bookmark) {
    let item = document.createElementNS(XUL_NS, "toolbarbutton");
    item.setAttribute("label", bookmark.title);
    item.setAttribute("class", "subviewbutton");
    hBookmark.getFaviconImageUriAsync(bookmark.url, faviconUriStr => {
      if (faviconUriStr !== "") item.setAttribute("image", faviconUriStr);
    });
    item.bookmark = bookmark
    return item;
  },
};

CustomizableUI.createWidget({
  id: "hBookmark-toolbar-recent-button",
  type: "view",
  label: "Haten Recent Bookmarks",
  viewId: "PanelUI-hBookmark-recent-view",
  onViewShowing: function (aEvent) {
    hBookmark.UIUtils.deleteContents(subviewBody);
    RecentButton.getBookmarks().forEach(bookmark => {
      subviewBody.appendChild(RecentButton.createItem(bookmark));
    });
  },
});


