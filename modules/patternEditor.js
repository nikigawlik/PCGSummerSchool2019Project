export default class PatternEditor {
    constructor(canvas) {
        this.canvas = canvas;

        this.data = new Array(canvas.width * canvas.height);
        for(let i = 0; i < canvas.width * canvas.height; i++) {
            this.data[i] = 0;
        }
        this.redrawCanvas();

        this.canvas.addEventListener("click", (ev) => this.doClick(ev));
    }

    doClick(event) {
        // get relative position
        let rect = this.canvas.getBoundingClientRect();
        let x = event.x - rect.left;
        let y = event.y - rect.top;
        // scaling, rounding
        x = Math.floor(x * this.canvas.width / rect.width);
        y = Math.floor(y * this.canvas.height / rect.height);

        // modify
        let index = (y * this.canvas.width + x);
        this.data[index] = this.data[index]? 0 : 1; // invert color
        this.redrawCanvas();
        PatternEditor.buildPatternTree();
    }

    redrawCanvas() {
        let ctx = this.canvas.getContext("2d");
        let dat = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // for (let x = 0; x < this.canvas.width; x++)
        //     for (let y = 0; y < this.canvas.height; y++) {
        //         let index = (y * this.canvas.width + x) * 4;

        for(let i = 0; i < this.data.length; i++) {
            let val = 255 - Math.floor(this.data[i] * 255);
            dat.data[i*4] = dat.data[i*4 + 1] = dat.data[i*4 + 2] = val;
            dat.data[i*4 + 3] = 255;
        }

        ctx.putImageData(dat, 0, 0);
    }

    static buildPatternTree() {
        let root = {};
        for(let pattern of PatternEditor.patterns) {
            // Important: all patterns are assumed to be same size.
            // otherwise this iteration would have to be done in a more general way
            let node = root;
            for(let i = 0; i < pattern.data.length; i++) {
                node = node[pattern.data[i]] = node[pattern.data[i]] || {};
            }
        }

        PatternEditor.patternTree = root;
        console.log(`new pattern tree: ${JSON.stringify(PatternEditor.patternTree)}`);
    }

    static doesMatchPatternTree(data) {
        let node = PatternEditor.patternTree;
        for(let i = 0; i < data.length; i++) {
            if(!node[data[i]]) {
                return false;
            }
            node = node[data[i]];
        }
        return true;
    }
}

window.addEventListener("load", () => {
    let editorElements = document.querySelectorAll("canvas.patternEditor");
    PatternEditor.patterns = [];
    for(let editorElement of editorElements) {
        editorElement.patternEditor = new PatternEditor(editorElement);
        PatternEditor.patterns.push(editorElement.patternEditor);
    }

    PatternEditor.buildPatternTree();
});