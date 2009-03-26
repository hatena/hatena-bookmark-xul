const EXPORT = ["FavoriteBookmark"];

function FavoriteBookmark(favorite) {
    this._favorite = favorite;
}

extend(FavoriteBookmark.prototype, {
    get name FB_get_name() this._favorite.name,

    get comment FB_get_comment() {
        let comment = "";
        if (this._favorite.tags.length)
            comment = "[" + this._favorite.tags.join("][") + "]";
        comment += (comment && " ") + this._favorite.body;
        return comment;
    },

    getProfileIcon: function FB_getProfileIcon(isLarge) {
        let name = this._favorite.name;
        return sprintf("http://www.hatena.ne.jp/users/%s/%s/profile%s.gif",
                       name.substring(0, 2), name, isLarge ? '' : '_s');
    },

    createImage: function FB_createImage() {
        let image = document.createElementNS(XUL_NS, "image");
        image.setAttribute("src", this.getProfileIcon(false));
        image.favorite = this;
        return image;
    }
});
