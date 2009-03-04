
/*
 * 試しにベタ実装
 */

const EXPORT = ['SuffixArray'];

var SuffixArray = function (string) {
    this.string = string;
}

SuffixArray.prototype = {
    createSuffixArray: function SuffixArray_createSuffixArray() {
        let str = this.string;
        let sary = [];
        for (let i = 0, len = str.length; i < len; i++) {
            sary[i] = str.substring(i, 20);
        }
        this.sary = sary;
    },
    set sary (sary) { this._sary = sary; this._len = sary.length },
    get sary () this._sary,
    get length () this._len,
    finder: function SuffixArray_finder(word) {
        if (!this.sary) this.createSuffixArray();
        let sary = this.sary;
        let len = this.length;
        let low = 0;
        let high = len - 1;
            let index = 0;
            do {
                if (sary[index].indexOf(word) == 0)
                    yield index;
            } while (++index < len);
            throw StopIteration;
    }
}

