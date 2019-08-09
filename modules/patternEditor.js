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
        let goodPatternEditors = 
            document.querySelector(".goodPatterns")
            .querySelectorAll("canvas.patternEditor")
        ;
        let badPatternEditors = 
            document.querySelector(".badPatterns")
            .querySelectorAll("canvas.patternEditor")
        ;
        let patterns = [];
        for(let p of goodPatternEditors) {
            let pe = p.patternEditor;
            // pe.score = Number(p.parentElement.querySelector("input.patternScore").value);
            pe.score = 1;
            patterns.push(pe);
        }
        for(let p of badPatternEditors) {
            let pe = p.patternEditor;
            // pe.score = -Number(p.parentElement.querySelector("input.patternScore").value);
            pe.score = -1;
            patterns.push(pe);
        }

        let root = {};
        for(let pattern of patterns) {
            // Important: all patterns are assumed to be same size.
            // otherwise this iteration would have to be done in a more general way
            let node = root;
            for(let i = 0; i < pattern.data.length; i++) {
                node = node[pattern.data[i]] = node[pattern.data[i]] || {};
            }
            node.score = pattern.score;
        }

        PatternEditor.patternTree = root;
        // console.log(`new pattern tree: ${JSON.stringify(PatternEditor.patternTree)}`);
    }

    static getMatchScore(data) {
        let node = PatternEditor.patternTree;
        for(let i = 0; i < data.length; i++) {
            if(!node[data[i]]) {
                return 0;
            }
            node = node[data[i]];
        }

        return node.score;
    }
}

window.addEventListener("load", () => {
    // handle existing pattern editors on startup
    setupEvents(document);

    PatternEditor.buildPatternTree();

    // handle adding new patterns
    let addPatternButtons = document.querySelectorAll(".addPatternButton");
    for(let addPatternButton of addPatternButtons) {
        addPatternButton.onclick = (ev) => {
            let template = document.querySelector('#patternEditorTemplate');
            let clone = document.importNode(template.content, true);
            setupEvents(clone);
            let parent = ev.target.parentNode;
            parent.insertBefore(clone, ev.target);
            PatternEditor.buildPatternTree();
        }
    }

    // handle removing patterns

});

function setupEvents(rootNode) {
    let editorElements = rootNode.querySelectorAll("canvas.patternEditor");
    for(let editorElement of editorElements) {
        editorElement.patternEditor = new PatternEditor(editorElement);
    }

    let removePatternButtons = rootNode.querySelectorAll(".removePatternButton");
    for(let removePatternButton of removePatternButtons) {
        removePatternButton.onclick = ev => {
            ev.target.parentNode.remove();
            PatternEditor.buildPatternTree();
        }
    }

    let patternScoreFields = rootNode.querySelectorAll(".patternScore");
    for(let patternScoreField of patternScoreFields) {
        patternScoreField.onchange = ev => {
            PatternEditor.buildPatternTree();
        }
    }
}