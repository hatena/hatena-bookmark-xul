const Cc = Components.classes;
const Ci = Components.interfaces;

var hBookmark = Components.utils.import("resource://hatenabookmark/modules/base.jsm", {});
hBookmark.require("Widget.TagTreeView");

window.addEventListener("load", function () {
    // XXX 本当はSidebarウィジェットを作る。
    // とりあえず確認のためツリービューだけ表示。
    var tagTreeView = new hBookmark.Widget.TagTreeView();
    document.getElementById("tag-tree").view = tagTreeView;
}, false);
