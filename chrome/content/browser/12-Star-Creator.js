
function Creator(title, location) {
    this.title = title || '';
    this.location = location || '';
}

extend(Creator.prototype, {
    createForEntry: function SC_createForEntry(entry, highlight,
                                               withAddButton) {
        return Star.createStarsForEntry(entry, highlight, withAddButton,
                                        this.title, this.location);
    },

    createPlaceholder: function SC_createPlaceholder(uri) {
        return Star.createPlaceholder(uri, this.title, this.location);
    },
});

Star.Creator = Creator;
