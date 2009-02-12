
const Cc = Components.classes;
const Ci = Components.interfaces;
const StorageService = Cc["@mozilla.org/storage/service;1"].getService(Ci.mozIStorageService);
const StorageStatementWrapper = Components.Constructor('@mozilla.org/storage/statement-wrapper;1', 'mozIStorageStatementWrapper', 'initialize');

function log(message) {
    Cc["@mozilla.org/consoleservice;1"].
        getService(Ci.nsIConsoleService).logStringMessage(message);
}

(function () {
    var loader = Cc["@mozilla.org/moz/jssubscript-loader;1"].
                 getService(Ci.mozIJSSubScriptLoader).loadSubScript;
    //loader("chrome://hatenabookmark/content/GlobalLoader.js", window);
    //GlobalLoader.loadAll(window);
    // ローダー周り要整備
    window.hBookmark = {};
    "00_utils 05_database 06_models 10_sync".split(" ")
        .forEach(function (file) loader("chrome://hatenabookmark/content/javascripts/" + file + ".js"));

    window.addEventListener("load", function (event) {
        hBookmark.sidebar = new Sidebar();
    }, false);

    // テストしやすくするためには、
    // ここから下を別のファイルに分離しないといけない

    var hBookmark = window.hBookmark;
    var Widget = hBookmark.Widget = {};

    var Sidebar = Widget.Sidebar = function HBW_Sidebar() {
        var tagTreeView = new TagTreeView();
        document.getElementById("tag-tree").view = tagTreeView;
    };

    var TreeView = Widget.TreeView = function HBW_TreeView() {};
    extend(TreeView.prototype, {
        rowCount:            0,
        selection:           null,
        canDrop:             function (index, orientation) false,
        cycleCell:           function (row, col) {},
        cycleHeader:         function (col) {},
        drop:                function (row, orientation) {},
        getCellProperties:   function (row, col, properties) {},
        getCellText:         function (row, col) "",
        getCellValue:        function (row, col) "",
        getColumnProperties: function (col, properties) {},
        getImageSrc:         function (row, col) "",
        getLevel:            function (index) 0,
        getParentIndex:      function (rowIndex) -1,
        getProgressMode:     function (row, col) 0,
        getRowProperties:    function (index, properties) {},
        hasNextSibling:      function (rowIndex, afterIndex) false,
        isContainer:         function (index) false,
        isContainerEmpty:    function (index) false,
        isContainerOpen:     function (index) false,
        isEditable:          function (row, col) false,
        isSelectable:        function (row, col) false,
        isSeparator:         function (index) false,
        isSorted:            function () false,
        performAction:       function (action) {},
        performActionOnCell: function (action, row, col) {},
        performActionOnRow:  function (action, row) {},
        selectionChanged:    function () {},
        setCellText:         function (row, col, value) {},
        setCellValue:        function (row, col, value) {},
        setTree:             function (tree) {},
        toggleOpenState:     function (index) {}
    }, true);

    var TagTreeView = Widget.TagTreeView = function HBW_TagTreeView() {
        this._model = model('Tag');
        this._visibleData = [];
    };
    TagTreeView.prototype.__proto__ = TreeView.prototype;
    extend(TagTreeView.prototype, {
        _update: function () {
            // 無理やり。モデル側に改善が必要。
            var tags = this._model.findAll()
                .map(function (tag) tag.name)
                .sort()
                .filter(function (tag, i, tags) !i || tag !== tags[i - 1]);
            this._visibleData = tags;
        },
        get rowCount () this._visibleData.length,
        getCellText: function (row, col) this._visibleData[row],
        setTree: function (tree) {
            this._update();
        }
    }, true);
})();
