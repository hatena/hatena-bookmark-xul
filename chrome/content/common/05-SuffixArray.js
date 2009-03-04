
/*
 * 試しにベタ実装
 */

const EXPORT = ['SuffixArray'];

var SuffixArray = function (string) {
    this.string = string;
    this.lowerString = string.toLowerCase();
    this.defaultLength = 255;
}

SuffixArray.prototype = {
    make: function SuffixArray_createSuffixArray() {
        let string = this.lowerString;
        let sary = [];
        let saryIndex = 0;
        let str;
        let index;
        let dLen = this.defaultLength;
        p.b(function() {
        for (let i = 0, len = string.length; i < len; i++) {
            str = string.substr(i, dLen);
            index = str.indexOf("\n");
            if (index != 0) {
                if (index != -1)
                    str = str.substr(0, index);
                sary[saryIndex++] = [str, i];
            }
        }
        }, 'make index');
        p.b(function() {
        sary.sort(function(a, b) {
            if (a[0] > b[0]) {
                return 1;
            } else if (a[0] < b[0]) {
                return -1;
            }
            return 0;
        });
        }, 'sort');
        this.sary = sary.map(function([_,i]) i);
    },
    set sary (sary) { this._sary = sary; this._len = sary.length },
    get sary () this._sary,
    get length () this._len,
    search: function SuffixArray_search(word) {
        let wLen = word.length;
        if (wLen == 0) return [];
        if (!this.sary) this.make();

        word = word.toLowerCase();
        let string = this.lowerString;
        let sary = this.sary;
        let len = this.length;
        let lastIndex = -1;
        let index = parseInt(len / 2);

        let floor = Math.floor;
        let ceil = Math.ceil;

        let str;
        let range = index;

        while (lastIndex != index) {
            lastIndex = index;
            str = string.substr(sary[index], wLen);
            if (word < str) {
                range = floor(range / 2);
                index = index - range;
            } else if (word > str) {
                range = ceil(range / 2);
                index = index + range;
            } else {
                let res = [sary[index]];
                let start = index;
                while (string.substr(sary[--start], wLen) == word)
                    res.unshift(sary[start]);
                let end = index;
                while (string.substr(sary[++end], wLen) == word)
                    res.push(sary[end]);
                res.sort(function(a, b) a - b);
                return res;
            }
        }

        return [];
    }
}
/*
     while (low < high) {
            int middle = low + (high-low)/2;
            if (suffixes[middle].compareTo(p) >= 0) {
                high = middle;
            } else {
                low = middle+1;
            }
        }
        if (suffixes[high].startsWith(p)) {
            return len - suffixes[high].length();
        }
        return -1;
    }
*/
