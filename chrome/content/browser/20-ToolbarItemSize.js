const EXPORT = ["ToolbarItemSize"];

var ToolbarItemSize = {
    _sheet: null,

    get maxWidth TIS_get_maxWidth() Prefs.bookmark.get("toolbar.maxItemWidth"),

    init: function TIS_init() {
        let style =
            "#hBookmarkToolbar toolbarbutton.bookmark-item " +
            "{ max-width: " + this.maxWidth + "px; }";
        let sspi = document.createProcessingInstruction(
            "xml-stylesheet",
            'type="text/css" href="data:text/css,' +
                encodeURIComponent(style) + '"');
        document.insertBefore(sspi, document.documentElement);
        this._sheet = sspi.sheet;
    },

    update: function TIS_update() {
        this._sheet.cssRules[0].style.maxWidth = this.maxWidth + "px";
        document.getElementById("hBookmarkToolbar").redraw();
    }
};

window.addEventListener("load", method(ToolbarItemSize, "init"), false);
Prefs.bookmark.createListener("toolbar.maxItemWidth",
                              method(ToolbarItemSize, "update"));
