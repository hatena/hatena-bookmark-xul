
Components.utils.import('resource://hatenabookmark/modules/21-SiteInfoSet-HatenaStar-Converter.jsm');

function testSelector2xpath() {
    assert.is('self::*', selector2xpath('parent'));
    assert.is('descendant::div[contains(concat(" ", normalize-space(@class), " "), " article ")]',
              selector2xpath('div.article'));
    assert.is('descendant::*[@id = "content"]',
              selector2xpath('#content'));
    assert.is('descendant::div/descendant::p/child::span',
              selector2xpath('div p > span'));
    assert.is('descendant::a[not(preceding-sibling::*)]',
              selector2xpath('a:first-child'));
    assert.is('descendant::p[contains(concat(" ", normalize-space(@class), " "), " foo ") and count(preceding-sibling::*) = 2]',
              selector2xpath('p.foo:nth-child(3)'));
    assert.is('descendant::div | descendant::p',
              selector2xpath('div, p'));
}
