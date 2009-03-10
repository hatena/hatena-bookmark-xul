function initToolbar() {
    let view = new ToolbarView();
    let toolbar = document.getElementById("hBookmarkToolbar");
    toolbar.view = view;
    toolbar.addEventListener("HBookmarkToolbarReady", view, false);
}

window.addEventListener("load", initToolbar, false);
