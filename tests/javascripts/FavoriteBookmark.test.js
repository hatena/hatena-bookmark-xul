let hBookmark;

function warmUp() {
    utils.include("btil.js");
    let global = loadAutoloader("chrome://hatenabookmark/content/addPanel.xml");
    hBookmark = global.hBookmark;
}

function testFavoriteBookmark() {
    let f = {
        name: "anonymous",
        body: "my comment",
        tags: ["foo", "bar"]
    };
    let fav = new hBookmark.FavoriteBookmark(f);

    assert.equals(f.name, fav.name);
    assert.equals("http://www.hatena.ne.jp/users/an/anonymous/profile_s.gif",
                  fav.getProfileIcon(false));
    assert.equals("[foo][bar] my comment", fav.comment);

    let image = fav.createImage();
    assert.isTrue(image.favorite === fav);
}
