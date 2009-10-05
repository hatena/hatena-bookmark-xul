const EXPORT = ["TreeView"];

function TreeView() {}

extend(TreeView, {
    SORT_NATURAL: 0,
    SORT_ASCENDING: 1,
    SORT_DESCENDING: -1,
});

extend(TreeView.prototype, {
    get wrappedJSObject () this,
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
});
