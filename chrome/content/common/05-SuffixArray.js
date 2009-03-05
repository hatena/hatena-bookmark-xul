
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
        this.sary = sary.map(function([_,i]) i);
        p.b(function() {
            // array with offset
            var OffsetArray = function(arr, off, len) {
                off = off || 0;
                len = len || arr.length - off;
                return {
                    at: function(i) arr[i+off],
                    set: function(i, val) arr[i+off]=val,
                    slice: function(n, l) new OffsetArray(arr, off+n,
                                                          l || len-n),
                    length: len,
                    arr: arr
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
//                 let CharType = function(t, n){
//                     for (let i=0; i<n; i++) t[i]=0;
//                     let mask = [
//                         0x8000, 0x4000, 0x2000, 0x1000, // extended for 16bits
//                         0x0800, 0x0400, 0x0200, 0x0100, // extended for 16bits
//                         0x0080, 0x0040, 0x0020, 0x0010,
//                         0x0008, 0x0004, 0x0002, 0x0001,
//                     ];
//                     return {
//                         get: function(i) {
//                             // (t[(i)/16]&mask[(i)%16]) ? 1 : 0
//                             return (t[i >> 4] & mask[i & 0x0f]) ? 1 : 0;
//                         },
//                         set: function(i, b) {
//                             // t[(i)/16]=(b) ?
//                             //   (mask[(i)%16]|t[(i)/16])
//                             // : ((~mask[(i)%16])&t[(i)/16])
//                             return t[i >> 4]
//                                 = b ? (mask[i & 0x0f] | t[i >> 4])
//                                 : ((~(mask[i & 0x0f])) & t[i >> 4]);
//                         }
//                     };
//                 };

                // get buckets common
                let getBucketsCommon = function(s, k) {
                    let n = s.length;
                    let bkt = [];
                    for (let i=0; i <= k; i++) bkt[i]=0; // clear all buckets
                    for (let i=0; i < n; i++) bkt[s.at(i)]++;
                    return bkt;
                };
                // find buckets
                let getBuckets = function(s, k) {
                    let sum = 0;
                    let bkt = getBucketsCommon(s, k);
                    for (let i=0; i <= k; i++) {
                        let t = sum;
                        sum += bkt[i];
                        bkt[i] = t;
                    }
                    return bkt;
                };
                // find end of buckets
                let getBucketsEnd = function(s, k) {
                    let sum = 0;
                    let bkt = getBucketsCommon(s, k);
                    for (let i=0; i <= k; i++) {
                        sum += bkt[i];
                        bkt[i] = sum;
                    }
                    return bkt;
                };

                let induceSAl = function(t, sa, s, k) {
                    let bkt = getBuckets(s,k); // find starts of buckets
                    let n = s.length;
                    for (let i=0; i<n; i++) {
                        let j = sa.at(i)-1;
//                         if (j >= 0 && !t.get(j)) {
                        if (j >= 0 &&
                            !((t[j >> 4] & mask[j & 0x0f]) ? 1 : 0)) {
                            sa.set(bkt[s.at(j)]++, j);
                        }
                    }
                };
                let induceSAs = function(t, sa, s, k) {
                    let bkt = getBucketsEnd(s,k) // find ends of buckets
                    for (let i=n-1; i>=0; i--) {
                        j = sa.at(i)-1;
//                         if (j >= 0 && t.get(j)) {
                        if (j >= 0 &&
                            ((t[j >> 4] & mask[j & 0x0f]) ? 1 : 0)) {
                            sa.set(--bkt[s.at(j)], j);
                        }
                    }
                };

                let n = /*arguments[argn++] ||*/ s.length;
                let sa = arguments[argn++] || new OffsetArray([],0,n);
//                 let t = new CharType([], (n>>4)+1);
                let t = [];
                for (let i=0, size=(n>>4)+1; i<size; i++) t[i]=0;
                let bkt;

                let mask = [
                    0x8000, 0x4000, 0x2000, 0x1000, // extended for 16bits
                    0x0800, 0x0400, 0x0200, 0x0100, // extended for 16bits
                    0x0080, 0x0040, 0x0020, 0x0010,
                    0x0008, 0x0004, 0x0002, 0x0001,
                ];

                // Classify the type of each character
//                 t.set(n-2, 0); t.set(n-1, 1); // the sentinel must be in s1
                t[(n-2) >> 4] = (~(mask[(n-2) & 0x0f])) & t[(n-2) >> 4];
                t[(n-1) >> 4] = mask[(n-1) & 0x0f] | t[(n-1) >> 4];
                for (let i=n-3; i>=0; i--) {
                    let ch1 = s.at(i);
                    let ch2 = s.at(i+1);
//                     t.set(i, (ch1 < ch2 || (ch1==ch2 && t.get(i+1)==1)) ? 1:0);
                    t[i >> 4] = ((ch1 < ch2 || (ch1==ch2 && (
                        (t[(i+1) >> 4] & mask[(i+1) & 0x0f]) ? 1 : 0
                    ) == 1)) ? 1:0) ? (mask[i & 0x0f] | t[i >> 4])
                        : ((~(mask[i & 0x0f])) & t[i >> 4]);
                }

                // stage 1: reduce the problem by at least 1/2
                // sort all the S-substrings
                bkt = getBucketsEnd(s, k);
                for (let i=0; i<n; i++) sa.set(i, -1);
                for (let i=1; i<n; i++) {
//                     if (t.get(i) && !t.get(i-1)) { // isLMS
                    if ((
                        (t[i >> 4] & mask[i & 0x0f]) ? 1 : 0
                    ) && !(
                        (t[(i-1) >> 4] & mask[(i-1) & 0x0f]) ? 1 : 0
                    )) { // isLMS
                        sa.set(--bkt[s.at(i)], i);
                    }
                }

                induceSAl(t, sa, s, k);
                induceSAs(t, sa, s, k);

                // compact all the sorted substrings
                // into the first n1 items of SA
                // 2*n1 must be not larger than n (proveable)
                let n1 = 0;
                for (let i=0; i<n; i++) {
                    let sai = sa.at(i);
//                     if (sai > 0 && t.get(sai) && !t.get(sai-1)) { // isLMS
                    if (sai > 0 && (
                        (t[sai >> 4] & mask[sai & 0x0f]) ? 1 : 0
                    ) && !(
                        (t[(sai-1) >> 4] & mask[(sai-1) & 0x0f]) ? 1 : 0
                    )) { // isLMS
                        sa.set(n1++, sai);
                    }
                }

                // find the lexicographic names of all substrings
                for (let i=n1; i<n; i++) sa.set(i, -1); // init
                let name=0;
                let prev=-1;
                for (let i=0; i<n1; i++) {
                    let pos = sa.at(i); let diff = false;
                    for (let d=0; d<n; d++) {
                        let p1 = pos+d;
                        let p2 = prev+d;
                        if (prev == -1 || s.at(p1) != s.at(p2)
//                             || t.get(p1) != t.get(p2)) {
                            || (
                                (t[p1 >> 4] & mask[p1 & 0x0f]) ? 1 : 0
                            ) != (
                                (t[p2 >> 4] & mask[p2 & 0x0f]) ? 1 : 0
                            )) {
                            diff = true; break;
                        } else if (d>0 && // && (isLMS(pos1) || isLMS(pos2))
//                                    ((p1>0 && t.get(p1) && !t.get(p1-1)) ||
//                                     (p2>0 && t.get(p2) && !t.get(p2-1)))) {
                                   ((p1>0 && (
                                       (t[p1 >> 4] & mask[p1 & 0x0f]) ? 1 : 0
                                   ) && !(
                                       (t[(p1-1) >> 4] & mask[(p1-1) & 0x0f]) ? 1 : 0
                                   )) ||
                                    (p2>0 && (
                                       (t[p2 >> 4] & mask[p2 & 0x0f]) ? 1 : 0
                                    ) && !(
                                        (t[(p2-1) >> 4] & mask[(p2-1) & 0x0f]) ? 1 : 0
                                    )))) {
                            break;
                        }
                    }
                    if (diff) {
                        name++;
                        prev=pos;
                    }
                    pos = ((pos & 0x01) == 0) ? (pos >> 1) : ((pos-1) >> 1);
                    sa.set(n1+pos, name-1);
                }
                for (let i=n-1, j=n-1; i>=n1; i--) {
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
                bkt = getBucketsEnd(s, k); // find ends of buckets
                // put all left-most S characters into their buckets
                for (let i=1, j=0; i<n; i++) {
//                     if (t.get(i) && !t.get(i-1)) { // isLMS
                    if ((
                        (t[i >> 4] & mask[i & 0x0f]) ? 1 : 0
                    ) && !(
                        (t[(i-1) >> 4] & mask[(i-1) & 0x0f]) ? 1 : 0
                    )) { // isLMS
                        s1.set(j++, i); // get p1
                    }
                }
                for (let i=0; i<n1; i++) sa1.set(i, s1.at(sa.at(i)));
                for (let i=n1; i<n; i++) sa.set(i, -1); // init sa[n1..n-1]
                for (let i=n1-1; i>=0; i--) {
                    let j=sa.at(i); sa.set(i, -1);
                    sa.set(--bkt[s.at(j)], j);
                }
                induceSAl(t, sa, s, k);
                induceSAs(t, sa, s, k);

                return sa;
            }
            /* create suffix array by induced sorting
               s:  input string
               returns sa : int array */
            function SAIS(s) {
                let ss = [];
                let n = s.length;
                for (let i=0; i<n; i++) {
                    ss.push(s.charCodeAt(i));
                }
                return recSAIS(new OffsetArray(ss), 65536).arr;
            }
            sary = SAIS(string);
        }, 'SAIS');
        this.sary = sary;
        p(this.sary);
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
