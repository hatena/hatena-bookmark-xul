
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
            sary[saryIndex++] = [str, i];
            // index = str.indexOf("\n");
            // if (index != 0) {
            //     if (index != -1)
            //         str = str.substr(0, index);
            //     sary[saryIndex++] = [str, i];
            // }
        }
        }, 'create');
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
//         this.sary = sary.map(function([_,i]) i);
        let qsortSary = sary.map(function([_,i]) i);
        p.b(function() {
            // array with offset
            var OffsetArray = function(arr, off, len) {
                arr = arr || new Array(len);
                off = off || 0;
                len = len || arr.length - off;
                return {
                    at: function(i) arr[i+off],
                    set: function(i, val) arr[i+off]=val,
                    slice: function(n, l) new OffsetArray(arr, off+n,
                                                          l || len-n),
                    length: len,
                    arr: arr,
                    dump: function(n) {
                        let l = len > n ? n : len;
                        return arr.slice(off, off+l).join(',');
                    }
                };
            };
            /* create suffix array by induced sorting
               s:  input string
               k:  bucket size
               sa: Suffix Array which is partially built
                   (possibly empty array or null for the first time)
               returns sa : int array */
            function recSAIS(s, k/*, sa*/) {
                let argn = 2;
                // char type array
                let CharType = function(n){
                    let t = n instanceof Array ? n : new Array(n);
                    return {
                        get: function(i) t[i],
                        set: function(i, b) t[i] = b,
                        isLMS: function(i) t[i] && !t[i-1]
                    };
//                     n = (n>>4)+1;
//                     let t = new Array(n);
//                     for (let i=0; i<n; i++) t[i]=0;
//                     let mask = [
//                         0x8000, 0x4000, 0x2000, 0x1000,
//                         0x0800, 0x0400, 0x0200, 0x0100,
//                         0x0080, 0x0040, 0x0020, 0x0010,
//                         0x0008, 0x0004, 0x0002, 0x0001,
//                     ];
//                     return {
//                         get: function(i) {
//                             // (t[(i)/16]&mask[(i)%16]) ? 1 : 0
//                             return t[i >> 4] & mask[i & 0x0f] ? 1 : 0;
//                         },
//                         set: function(i, b) {
//                             // t[(i)/16]=(b) ?
//                             //   (mask[(i)%16]|t[(i)/16])
//                             // : ((~mask[(i)%16])&t[(i)/16])
//                             return t[i >> 4]
//                                 = b ? (mask[i & 0x0f] | t[i >> 4])
//                                 : ((~(mask[i & 0x0f])) & t[i >> 4]);
//                         },
//                         isLMS: function(i) {
//                             return (t[i>>4] & mask[i&0x0f] ? 1 : 0)
//                                 && !(t[(i-1)>>4] & mask[(i-1)&0x0f] ? 1 : 0);
//                         }
//                     };
                };

                let Buckets = function(s, k) {
                    let start = new Array(k);
                    let end = new Array(k);
                    let n = s.length;
                    let sum = 0;
                    for (let i=0; i <= k; i++) start[i] = 0;
                    for (let i=0; i < n; i++) start[s.at(i)]++;
                    for (let i=0; i <= k; i++) {
                        let t = sum;
                        sum += start[i];
                        start[i] = t;
                        end[i] = sum;
                    }
                    return {
                        cloneStartTo: function(bkt) {
                            for (let i=0; i <= k; i++) bkt[i] = start[i];
                            return bkt;
                        },
                        cloneEndTo: function(bkt) {
                            for (let i=0; i <= k; i++) bkt[i] = end[i];
                            return bkt;
                        },
                        get start() {
                            let bkt = new Array(k);
                            for (let i=0; i <= k; i++) bkt[i] = start[i];
                            return bkt;
                        },
                        get end() {
                            let bkt = new Array(k);
                            for (let i=0; i <= k; i++) bkt[i] = end[i];
                            return bkt;
                        }
                    };
                };
                let bkts = new Buckets(s, k);

                // merged induceSAl and induceSAs
                let induceSA = function(t, sa, s, bkts) {
                    let bktStart = bkts.start;
                    let bktEnd = bkts.end;
                    let n = s.length;
                    for (let i=0; i < n; i++) {
                        let j = sa.at(i)-1;
                        if (j >= 0 && !t.get(j)) {
                            sa.set(bktStart[s.at(j)]++, j);
                        }
                    }
                    for (let i=n-1; i >= 0; i--) {
                        let j = sa.at(i)-1;
                        if (j >= 0 && t.get(j)) {
                            sa.set(--bktEnd[s.at(j)], j);
                        }
                    }
                };

                let n = s.length;
                let sa = arguments[argn++] || new OffsetArray(null,0,n);
                let t = new CharType(n);
                let bkt = new Array(k);
                let n1 = 0;
                let name = 0;

                // Classify the type of each character
                t.set(n-2, 0); t.set(n-1, 1); // the sentinel must be in s1
                for (let i=n-3; i >= 0; i--) {
                    let ch1 = s.at(i);
                    let ch2 = s.at(i+1);
                    t.set(i, (ch1 < ch2 || (ch1==ch2 && t.get(i+1)==1)) ? 1:0);
                }

                // stage 1: reduce the problem by at least 1/2
                // sort all the S-substrings
                bkts.cloneEndTo(bkt);
                for (let i=0; i < n; i++) sa.set(i, -1);
                for (let i=n-2, t0=0, t1=t.get(n-1); 0 <= i; i--,t1=t0) {
                    if (!(t0 = t.get(i)) && t1) sa.set(--bkt[s.at(i+1)], i+1);
                }

                induceSA(t, sa, s, bkts);

                // compact all the sorted substrings
                // into the first n1 items of SA
                // 2*n1 must be not larger than n (proveable)
                for (let i=0; i < n; i++) {
                    let sai = sa.at(i);
                    if (sai > 0 && t.isLMS(sai)) {
                        sa.set(n1++, sai);
                    }
                }

                // store the length of all substrings
                for (let i=n1; i < n; i++) sa.set(i, -1); // init
                for (let i=n-2, j=n, t0=0, t1=t.get(n-1); 0 <= i; i--,t1=t0) {
                    if (!(t0 = t.get(i)) && t1) {
                        sa.set(n1 + ((i+1) >> 1), j-i-1);
                        j = i+1;
                    }
                }
                // find the lexicographic names of all substrings
                for (let i=0, q=n, qlen=0; i < n1; i++) {
                    let p = sa.at(i);
                    let plen = sa.at(n1 + (p >> 1));
                    let diff=1;
                    if (plen == qlen) {
                        let j;
                        for (j=0; j < plen && s.at(p+j) == s.at(q+j); j++);
                        if (j==plen) diff=0;
                    }
                    if (diff != 0) {
                        name++;
                        q = p;
                        qlen = plen;
                    }
                    sa.set(n1 + (p >> 1), name-1);
                }
                for (let i=n-1, j=n-1; i >= n1; i--) {
                    let sai = sa.at(i);
                    if (sai >= 0) sa.set(j--, sai);
                }

                // stage 2: solve the reduced problem
                // recurse if names are not yet unique
                let s1 = sa.slice(n-n1);
                let sa1 = sa.slice(0, n1);
                if (name < n1) {
                    recSAIS(s1, name-1, sa1);
                } else {
                    // generate the suffix array of s1 directly
                    for (let i=0; i<n1; i++) {
                        sa1.set(s1.at(i), i);
                    }
                }

                // stage 3: induce the result for the original problem
                bkts.cloneEndTo(bkt);
                // put all left-most S characters into their buckets
                for (let i=1, j=0; i < n; i++) {
                    if (t.isLMS(i)) {
                        s1.set(j++, i); // get p1
                    }
                }
                for (let i=0; i < n1; i++) sa1.set(i, s1.at(sa1.at(i)));
                for (let i=n1; i < n; i++) sa.set(i, -1); // init sa[n1..n-1]
                for (let i=n1-1; i >= 0; i--) {
                    let j=sa.at(i); sa.set(i, -1);
                    sa.set(--bkt[s.at(j)], j);
                }
                induceSA(t, sa, s, bkts);

                return sa;
            }
            /* create suffix array by induced sorting
               s:  input string
               returns sa : int array */
            function SAIS(s) {
                let n = s.length;
                let ss = new Array(n+1);
                for (let i=0; i<n; i++) {
                    ss[i] = s.charCodeAt(i);
                }
                ss[n] = 0;

                return recSAIS(new OffsetArray(ss), 65535).arr.slice(1);
            }
            sary = SAIS(string);
        }, 'SAIS');
        this.sary = sary;
        p('qsort', qsortSary.slice(0,1000));
        p('SAIS', this.sary.slice(0,1000));
        p('veryfy: ' + qsortSary.every(function(v,i)v==sary[i]));
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
