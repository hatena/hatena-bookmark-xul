const EXPORT = ["AddPanelView"];

function AddPanelView() {
    this.bookmark = null;
}

extend(AddPanelView.prototype, {
    get title APV_get_title() this.bookmark.title,
    get url APV_get_url() this.bookmark.url,
    get comment APV_get_comment() this.bookmark.comment,

    setup: function APV_setup(window) {
        let url = window.location.href;
        let bookmark = Model.Bookmark.findByUrl(url)[0];
        if (!bookmark) {
            bookmark = new Model.Bookmark;
            bookmark.title = (window.document && window.document.title) || url;
            bookmark.url = url;
            bookmark.comment = "";
        }
        this.bookmark = bookmark;
    }
});
