const Cc = Components.classes;
const Ci = Components.interfaces;

var hBookmark =
    Components.utils.import("resource://hatenabookmark/modules/base.jsm", {});
hBookmark.require("Widget.Sidebar");

window.addEventListener("load", function () {
    hBookmark.sidebar = new hBookmark.Widget.Sidebar(document);
}, false);
