let hBookmark;

function warmUp() {
    utils.include('btil.js');
    let global = loadAutoloader('chrome://hatenabookmark/content/unknown.xul');
    hBookmark = global.hBookmark;
}

function testUserUtils() {
    let UserUtils = hBookmark.UserUtils;
    assert.isDefined(UserUtils);
    assert.matches(/\/users\/fo\/foo\/profile_s\.gif$/,
                  UserUtils.getProfileIcon('foo', false));
    assert.equals('http://www.hatena.ne.jp/bar/',
                  UserUtils.getHomepage('bar'));
    assert.equals('http://b.hatena.ne.jp/baz/',
                  UserUtils.getHomepage('baz', 'b'));
}
