const EXPORT = ["CommentUtils"];

var CommentUtils = {
    getOverrideValue: function CmtUtl_getOverrideValue() {
        let textbox = document.getBindingParent(this);
        let tree = this.tree;
        let column = tree.columns.getNamedColumn("treecolAutoCompleteValue");
        return textbox._beforeTag +  "[" +
               tree.view.getCellText(tree.currentIndex, column) +
               "]" + textbox._afterTag;
    },

    splitComment: function CmtUtl_splitComment(comment, caretPos) {
        let head = comment.substring(0, caretPos);
        let tail = comment.substring(caretPos);
        let restTag = tail.match(/^([^?%\/\[\]]*)\]/);
        if (restTag) {
            head += restTag[1];
            tail = tail.substring(restTag[0].length);
        }
        let tag = "";
        let lastTag = head.match(/^(?:\[[^?%\/\[\]]+\])*\[([^?%\/\[\]]+)$/);
        if (lastTag) {
            tag = lastTag[1];
            head = head.substring(0, head.length - tag.length - 1);
        }
        return [head, tag, tail];
    }
};
