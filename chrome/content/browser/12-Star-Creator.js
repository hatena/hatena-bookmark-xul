
function Creator(title, location) {
    this.title = title || '';
    this.location = location || '';
}

extend(Creator.prototype, {
    createForEntry: function SC_createForEntry(entry, highlight) {
        return Star.createStarsForEntry(entry, highlight, true,
                                        this.title, this.location);
    },

    createPlaceholder: function SC_createPlaceholder(uri) {
        return Star.createPlaceholder(uri, this.title, this.location);
    },
});

Star.Creator = Creator;
