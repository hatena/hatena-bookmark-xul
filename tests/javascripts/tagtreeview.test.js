var hBookmark;
var view;
var treeBox = {
    treeBody: {},
    rowCountChanged: function () {},
    invalidateRow: function () {}
};

function warmUp() {
    utils.include("btil.js");
    var global = loadAutoloader("chrome://hatenabookmark/content/sidebar.xul");
    hBookmark = global.hBookmark;
}

function setUp() {
    prepareDatabase(hBookmark);

    view = new hBookmark.TagTreeView();
    view._setSortKey = function () {};
    view.setTree(treeBox);
}

function testTagTreeView() {
    assert.equals(view.rowCount, 3);
    var col = { id: "hBookmarkTagTree_currentTag" };
    var cellTexts = [0, 1, 2].map(function (i) view.getCellText(i, col));
    assert.equals(cellTexts.concat().sort(), ["JavaScript", "Perl", "Ruby"]);
    assert.equals(cellTexts[1], "Perl");
    assert.equals(view.isContainer(1), true);
    assert.equals(view.isContainerEmpty(1), false);
}

function testOpenClose() {
    view.toggleOpenState(1);
    assert.equals(view.rowCount, 5);

    assert.equals(view.getLevel(2), 1);
    assert.equals(view.getParentIndex(2), 1);
    assert.equals(view.hasNextSibling(2), true);

    assert.equals(view.getLevel(4), 0);
    assert.equals(view.getParentIndex(4), -1);
    assert.equals(view.hasNextSibling(4), false);

    view.toggleOpenState(1);
    assert.equals(view.rowCount, 3);

    assert.equals(view.isContainerOpen(1), false);

    assert.equals(view.getLevel(2), 0);
    assert.equals(view.getParentIndex(2), -1);
    assert.equals(view.hasNextSibling(2), false);
}

function testSelection() {
    view.selection = { currentIndex: 1 };
    assert.equals(view.selectedTags.join(), ["Perl"].join());

    view.toggleOpenState(1);
    view.selection.currentIndex = 2;
    assert.equals(view.selectedTags.join(), ["Perl", "JavaScript"].join());
}


