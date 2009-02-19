const EXPORT = ["TagTreeMenuCommand"];

function TagTreeMenuCommand(view) {
    this.view = view;
}

extend(TagTreeMenuCommand.prototype, {
    handleEvent: function TTMC_handleEvent(event) {
        switch (event.type) {
        case "command":
            let command = event.target.id.substring("tag-tree-menu-".length);
            this.view[command]();
            break;

        case "popupshowing":
            break;
        }
    }
});
