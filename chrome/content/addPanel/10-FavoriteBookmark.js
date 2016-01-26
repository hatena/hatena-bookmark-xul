var EXPORT = ["FavoriteBookmark"];

function FavoriteBookmark(favorite) {
    this._favorite = favorite;
}

extend(FavoriteBookmark.prototype, {
    get name() this._favorite.name,

    get comment() {
        let comment = "";
        if (this._favorite.tags.length)
            comment = "[" + this._favorite.tags.join("][") + "]";
        comment += (comment && " ") + this._favorite.body;
        return comment;
    },

    getProfileIcon: function FB_getProfileIcon(isLarge) {
        return UserUtils.getProfileIcon(this._favorite.name, isLarge);
    },

    getHomepage: function FB_getHomepage(service) {
        return UserUtils.getHomepage(this._favorite.name, service);
    },

    createImage: function FB_createImage() {
        let image = document.createElementNS(XUL_NS, "image");
        image.setAttribute("src", this.getProfileIcon(false));
        image.setAttribute("onclick", "if (event.button < 2) hBookmark.hOpenUILink(this.favorite.getHomepage('b'), event);");
        image.favorite = this;
        return image;
    }
});
