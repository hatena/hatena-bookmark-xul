Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");
Components.utils.import("resource://hatenabookmark/modules/20-URLNormalizer.jsm");

function testNormalize() {
    function doTest(expected, actual) {
        let uri = IOService.newURI(actual, null, null)
        assert.is(expected, URLNormalizer.normalize(uri).asciiSpec);
    }

    doTest('http://www.amazon.co.jp/gp/product/B0015IQ776',
           'http://www.amazon.co.jp/exec/obidos/ASIN/B0015IQ776');
    doTest('http://www.amazon.co.jp/gp/product/B0015IQ776',
           'http://www.amazon.co.jp/exec/obidos/ASIN/B0015IQ776/');
    doTest('http://www.amazon.co.jp/gp/product/B0015IQ776',
           'http://www.amazon.co.jp/exec/obidos/ASIN/B0015IQ776/hatena-22/ref=nosim');
    doTest('http://www.amazon.co.jp/gp/product/B0015IQ776',
           'http://www.amazon.co.jp/dp/B0015IQ776/');
    doTest('http://www.amazon.co.jp/gp/product/B0015IQ776',
           'http://www.amazon.co.jp/dp/B0015IQ776');
    doTest('http://www.amazon.co.jp/gp/product/4000077155',
           'http://www.amazon.co.jp/%E3%83%95%E3%82%A1%E3%82%A4%E3%83%B3%E3%83%9E%E3%83%B3%E7%89%A9%E7%90%86%E5%AD%A6-5-%E3%83%95%E3%82%A1%E3%82%A4%E3%83%B3%E3%83%9E%E3%83%B3/dp/4000077155/ref=pd_bxgy_b_img_b');
    doTest('http://www.amazon.co.jp/gp/product/4480064141',
           'http://www.amazon.co.jp/gp/product/4480064141?ie=UTF8&linkCode=as2&tag=blogsofdankog-22n');
    doTest('http://www.amazon.co.jp/gp/product/4844325396',
           'http://www.amazon.co.jp/gp/product/4844325396?ie=UTF8&s=books&qid=1204387191&sr=1-1');

    doTest('http://www.hatena.ne.jp/',
           'http://www.hatena.ne.jp');
    doTest('http://www.hatena.ne.jp/',
           'http://www.hatena.ne.jp/');
    doTest('https://www.hatena.ne.jp/',
           'https://www.hatena.ne.jp');
    doTest('http://www.asahi.com/politics/update/0327/TKY200803260426.html',
           'http://www.asahi.com/politics/update/0327/TKY200803260426.html?ref=rss');
    doTest('http://naoya.dyndns.org/~naoya/mt/',
           'http://naoya.dyndns.org/%7Enaoya/mt/');
    doTest('http://naoya.dyndns.org/~naoya/mt/',
           'http://naoya.dyndns.org/~naoya/mt/');
    doTest('http://d.hatena.ne.jp/naoya/20080320/1206009912',
           'http://d.hatena.ne.jp/naoya/20080320/1206009912#more');
    doTest('http://d.hatena.ne.jp/naoya/20080320/1206009912',
           'http://d.hatena.ne.jp/naoya/20080320/1206009912#seemore');
    doTest('http://d.hatena.ne.jp/naoya/20080320/1206009912#komorebi',
           'http://d.hatena.ne.jp/naoya/20080320/1206009912#komorebi');

    doTest('http://d.hatena.ne.jp/asin/4501622601',
           'http://d.hatena.ne.jp/asin/4501622601/naoyadyndnsor-22');
    doTest('http://d.hatena.ne.jp/asin/4501622601',
           'http://d.hatena.ne.jp/asin/4501622601/');
    doTest('http://d.hatena.ne.jp/asin/4501622601',
           'http://d.hatena.ne.jp/asin/4501622601');

    doTest('http://jp.youtube.com/watch?v=1S3_Z3f2b20',
           'http://jp.youtube.com/watch?v=1S3_Z3f2b20&feature=dir');
    doTest('http://www.youtube.com/watch?v=1S3_Z3f2b20',
           'http://www.youtube.com/watch?v=1S3_Z3f2b20&feature=dir');
    doTest('http://www.youtube.com/watch?v=1S3_Z3f2b20',
           'http://youtube.com/watch?v=1S3_Z3f2b20&feature=dir');
}
