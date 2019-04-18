const randInt = (a, b)=>a+Math.floor(Math.random()*(b-a+1));

class A {
    constructor(m, n, words) {
        this.m = m;
        this.n = n;
        //the words to fit
        this.words = words.map(w=>w.toString());
        //all the letters in the words concatenated, for simulating the letter distribution
        this.letters = this.words.join("");
        
        this.lines = [];
        //the symbol '_' can't be in the words
        const makeEmptyLine = (len) => new Array(len).fill('_').join(""); //join to be strings
        
        //rows
        for (let i=0; i<this.m; i++) {
            this.lines.push(makeEmptyLine(this.n));
        }
        //cols
        for (let i=0; i<this.n; i++) {
            this.lines.push(makeEmptyLine(this.m));
        }
    
        //Make the empty diags array ['_', '__', ..., '__', '_']
        const makeDiags = () => {
            const ret = [];
            for (let k=0, kEnd=this.m+this.n-1; k<kEnd; k++) {
                let len;
                if (k<this.n) {
                    len = Math.min(this.m, k+1);
                    /*
                    let ind = [0, this.n-1-k];
                    let len = 0;
                    while(ind[0]<this.m && this[1]<this.n) {
                        ind[0]++;
                        ind[1]++;
                        len++;
                    }
                    //that is: len = Math.min(this.m, k+1)
                    */
                } else {
                    const rowK = k-this.n+1;
                    len = Math.min(this.n, this.m-rowK)
                }
                this.lines.push(makeEmptyLine(len));
            }
            return ret;
        };
        //diags
        for (let _ of ["skewDiag", "diag"]) {
            for (let dl of makeDiags()) {
                this.lines.push(dl);
            }
        }
        
        //for each word (key), on how many lines it is on (value)
        this.counts = {};
        for (let w of this.words) {
            this.counts[w] = 0;
        }
        
        //for each line, a set of what words it covers
        this.coveredWords = this.lines.map(()=>new Set());
        //total number of distinct words covered
        this.covered = 0;
        
        //Table that stores what lines the index [i][j] land on.
        //They are stored as 2-element arrays
        //where index of the line is first and then then the index on that line
        this.linesOf = [];
        let skewDiagStart = this.m+this.n;
        let diagStart = skewDiagStart + this.m+this.n-1;
        for (let i=0; i<this.m; i++) {
            let row = [];
            for (let j=0; j<this.n; j++) {
                let cell = [];
                
                cell.push([i, j]); //ith row, jth place
                cell.push([this.m+j, i]); //jth col, ith place
                //skew-diag:
                let skewDiagK = i+j;
                let skewDiagPlace = skewDiagK<this.m ? j : (j-(skewDiagK-this.m+1));
                cell.push([skewDiagStart+skewDiagK, skewDiagPlace]);
                //diag:
                let diagK = (this.m-1-i)+j;
                let diagPlace = diagK<this.m ? j : (j-(diagK-this.m+1));
                cell.push([diagStart+diagK, diagPlace]);
                
                row.push(cell);
            }
            this.linesOf.push(row);
        }
        
    }
    
    
    randomLetter() {
        return this.letters[randInt(0, this.letters.length-1)];
    }
    
    
    fillRandom() {
        for (let i=0; i<this.m; i++) {
            for (let j=0; j<this.n; j++) {
                let c = this.randomLetter();
                this.setCell(i, j, c);
            }
        }
    }
    
    
    /** Set of words the line of given index covers (can read both ways) */
    getCovers(lineInd) {
        const line = this.lines[lineInd];
        const lineLen = line.length;
        const s = line+"/"+line.split("").reverse().join("");
        return new Set(this.words.filter(w=>s.includes(w)));
        
        //"lines are arrays" -way:
        /*
        const ret = new Set();
        for (let w of this.words) {
            let wLen = w.length;
            let wasIn;
            for (let i=0, iEnd=lineLen-wLen; i<iEnd; i++) {
                wasIn = true;
                for (let j=0; j<wLen; j++) {
                    if (line[i+j] !== w[j]) {
                        wasIn = false;
                        break;
                    }
                }
                if (wasIn) break;
            }
            if (!wasIn) {
                for (let i=lineLen-1, iEnd=wLen-1; i>=iEnd; i--) {
                    wasIn = true;
                    for (let j=0; j<wLen; j++) {
                        if (line[i-j] !== w[j]) {
                            wasIn = false;
                            break;
                        }
                    }
                    if (wasIn) break;
                }
            }
            if (wasIn) ret.add(w);
        }
        return ret;
        */
    }
    
    setCell(i, j, c) {
        for (let [a, b] of this.linesOf[i][j]) {
            //array-way: this.lines[a][b] = c;
            this.lines[a] = this.lines[a].substring(0,b)+c+this.lines[a].substring(b+1);
            const coversPrev = this.coveredWords[a];
            const coversNow = this.getCovers(a);
            for (let w of coversPrev) {
                if (!coversNow.has(w)) {
                    this.counts[w]--;
                    if (this.counts[w]===0) this.covered--;
                }
            }
            for (let w of coversNow) {
                if (!coversPrev.has(w)) {
                    this.counts[w]++;
                    if (this.counts[w]===1) this.covered++;
                }
            }
            this.coveredWords[a] = coversNow;
        }
    }
    
    /** Perform a random seach by first changing cells randomly r times,
    * and then for k iterations changing one cell at a time and accepting
    * the change if it leads to better coverage.
    *
    * @returns the best found solution and its coverage as {covered, sol}
    */
    doASearch(k, r) {
        console.log("Doing a search with k = "+k+", r = "+r);
        for (let i=0; i<r; i++) {
            let x = randInt(0, this.m-1);
            let y = randInt(0, this.n-1);
            let c = this.randomLetter();
            this.setCell(x, y, c);
        }
        let sol = null;
        let bestCoverage = -1;
        let prev;
        for (let i=0; i<k; i++) {
            let x = randInt(0, this.m-1);
            let y = randInt(0, this.n-1);
            let c = this.randomLetter();
            prev = this.lines[x][y];
            this.setCell(x, y, c);
            if (this.covered>=bestCoverage) {
                sol = this.toString();
                bestCoverage = this.covered;
                //console.log("Found new best, of coverage "+bestCoverage);
                if (bestCoverage===this.words.length) {
                    console.log("Found complete solution!");
                    break;
                }
            } else {
                this.setCell(x, y, prev);
            }
        }
        return {coverage: bestCoverage, sol: sol};
    }
    
    
    search(searchN, searchR, iters=1) {
        let best = null;
        for (let i=0; i<iters; i++) {
            if (best && best.sol) {
                const solGrid = best.sol.split("\n").map(r=>r.split(""));
                for (let i=0; i<this.m; i++) {
                    for (let j=0; j<this.n; j++) {
                        this.setCell(i, j, solGrid[i][j]);
                    }
                }
            }
            const found = this.doASearch(searchN, searchR);
            if (!best || found.coverage>best.coverage) {
                best = found;
                console.log("Found new best, of coverage "+best.coverage);
                console.log(best.sol);
            }
        }
    }
    
    
    toString() {
        return this.lines.slice(0,this.m).map(x=>x/*.join("")*/).join("\n");
    }
    
}


A.cleanWords = arr => {
    const ret = [];
    const reverseString = s=>s.split("").reverse().join("");
    const hasAlready = x => {
        return ret.some( y=>y.indexOf(x)>=0 || y.indexOf(reverseString(x))>=0 );
    };
    for (let x of arr) {
        if (!hasAlready(x)) {
            ret.push(x);
        }
    }
    return ret;
};

A.getSquareWords = k => {
    let nums = new Array(k).fill(null).map((_,i)=>((i+1)**2).toString()).reverse();
    return A.cleanWords(nums);
};


const ahdRuu = (m, n, k, iters=10) => {
    const a = new A(m, n, A.getSquareWords(k));
    a.fillRandom();
    a.search(1e5, ((m+n)/2)|0, iters);
}

var startT = Date.now();
var a = new A(12, 12, A.getSquareWords(100));
a.fillRandom();
a.search(1e5, 13, 3);
console.log("Time: "+(Date.now()-startT));


/* 12x12 solution from Python program
var sol = `7 1 5 2 1 1 5 6 1 6 7 6
7 7 0 8 8 7 9 9 1 2 2 5
6 2 4 6 1 0 6 2 2 0 9 6
5 9 1 4 4 5 9 5 7 9 2 1
2 1 2 9 7 6 3 7 3 8 5 4
2 6 1 7 1 6 7 4 5 4 4 6
4 8 6 8 0 1 6 1 8 4 3 3
8 5 2 0 9 4 8 4 6 8 8 9
9 8 6 7 2 4 6 6 8 4 8 1
9 1 4 2 3 4 2 3 4 0 6 9
9 5 0 0 5 2 0 3 1 3 6 9
4 9 0 0 0 0 0 1 8 2 1 2`.split("\n").map(r=>r.split(" "));

for (let i=0; i<a.m; i++) {
    for (let j=0; j<a.n; j++) {
        a.setCell(i, j, sol[i][j]);
    }
}
*/


