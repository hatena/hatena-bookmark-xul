const EXPORT = ["TagTreeMenuCommand"];

function TagTreeMenuCommand(view) {
    this.view = view;
    this.targetRow = -1;
    this.targetCol = null;
}

extend(TagTreeMenuCommand.prototype, {
    handleEvent: function TTMC_handleEvent(event) {
        switch (event.type) {
        case "command":
            if (this.targetRow === -1) break;
            let command = event.target.id.substring("tag-tree-menu-".length);
            this.view[command](this.targetRow, this.targetCol, event);
            break;

        case "popupshowing":
            let selection = this.view.selection;
            this.targetRow = selection.currentIndex;
            this.targetCol = selection.currentColumn;
            break;
        }
    }
});
