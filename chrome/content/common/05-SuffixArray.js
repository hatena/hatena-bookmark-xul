
/*
 * 試しにベタ実装
 */

const EXPORT = ['SuffixArray'];

var SuffixArray = function (string) {
    this.string = string;
    this.defaultLength = 20;
}

SuffixArray.prototype = {
    make: function SuffixArray_createSuffixArray() {
        let str = this.string.toLowerCase();
        let sary = [];
        let si = 0;
        for (let i = 0, len = (str.length * 3/4); i < len; i++) {
            let s = str.substr(i, this.defaultLength);
            if (s.indexOf("\n") == -1)
            sary[si++] = [s, i];
        }
        sary.sort(function(a, b) {
            if (a[0] > b[0]) {
                return 1;
            } else if (a[0] < b[0]) {
                return -1;
            }
            return 0;
        });
        this.sary = sary.map(function([_,i]) i);
    },
    set sary (sary) { this._sary = sary; this._len = sary.length },
    get sary () this._sary,
    get length () this._len,
    finder: function SuffixArray_finder(word) {
        let wLen = word.length;
        if (wLen == 0) throw StopIteration;
        if (!this.sary) this.make();

        word.toLowerCase();
        let str = this.string;
        let sary = this.sary;
        let len = this.length;
        let low = 0;
        let high = len - 1;
        let index = 0;

        do {
            if (str.substr(sary[index], wLen).indexOf(word) == 0)
                yield sary[index];
        } while (++index < len);
        throw StopIteration;
    }
}

