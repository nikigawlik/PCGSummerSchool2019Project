import PatternEditor from "./patternEditor.js";

export default class Simulator {
    constructor(canvas) {
        this.canvas = canvas;
        this.isRunning = false;
        this.data = new Array(canvas.width * canvas.height);
        this.accumulator = new Array(this.data.length);
        this.accumulatorMaxValue = 0;

        this.debugCheckbox = canvas.parentElement.querySelector("input.debugCheckbox");
        this.startButton = canvas.parentElement.querySelector("button.startButton");
        this.resetButton = canvas.parentElement.querySelector("button.resetButton");
        this.stepButton = canvas.parentElement.querySelector("button.stepButton");

        this.startButton.addEventListener("click", () => this.toggleRunning());
        this.resetButton.addEventListener("click", () => this.initWidthRandomValues());
        this.stepButton.addEventListener("click", () => {
            this.setRunning(false);
            this.doSimulationStep();
        });
        
        this.initWidthRandomValues();
    }

    toggleRunning() {
        this.setRunning(!this.isRunning);
    }

    setRunning(running) {
        this.isRunning = running;
        if(running) {
            this.intervalID = window.setInterval(() => this.doSimulationStep(), 1000/30);
        } else {
            window.clearInterval(this.intervalID);
        }
    }

    doSimulationStep() {
        for(let i = 0; i < this.accumulator.length; i++) {
            this.accumulator[i] = 0;
        }
        
        // unfortunately we hard-code size right now (It's just a prototype...)
        let pw = 3;
        for (let x = 0; x < this.canvas.width - (pw-1); x++)
        for (let y = 0; y < this.canvas.height - (pw-1); y++) {
            // find bad matches, find good matches

            // get neighborhood
            let data = [];
            for(let dy = 0; dy < pw; dy++) 
            for(let dx = 0; dx < pw; dx++) {
                let index = this.canvas.width * (y+dy) + x + dx;
                data.push(this.data[index]);
            }

            if(PatternEditor.doesMatchPatternTree(data)) {
                for(let dy = 0; dy < pw; dy++) 
                for(let dx = 0; dx < pw; dx++) {
                    let index = this.canvas.width * (y+dy) + x + dx;
                    this.accumulator[index]++;
                }
            }
        }

        let maxValue = this.accumulator.reduce((a, b) => Math.max(a, b));
        let sum = this.accumulator.reduce((a, b) => (a + b));

        if(!this.isRunning) console.log(`max: ${maxValue} sum: ${sum}`);

        this.accumulatorMaxValue = maxValue;

        this.redrawCanvas();

        // do replacement now
        let avgValue = this.accumulatorMaxValue / this.accumulator.length;
        for(let i = 0; i < this.data.length; i++) {
            let mutate = this.accumulator[i] < avgValue / 2;
            // let mutate = this.accumulator[i] == 0;
            // mutate = Math.random() < 0.01? !mutate : mutate;
            this.data[i] = mutate? Math.round(Math.random()) : this.data[i];
            // this.data[i] = this.accumulator[i] > avgValue? this.data[i] : Math.round(Math.random());
        }
    }
    
    initWidthRandomValues() {
        for(let i = 0; i < this.data.length; i++) {
            this.data[i] = Math.round(Math.random());
        }
        this.redrawCanvas();
    }

    redrawCanvas() {
        let ctx = this.canvas.getContext("2d");
        let dat = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        let debug = this.debugCheckbox.checked;

        if(debug) {
            for(let i = 0; i < this.data.length; i++) {
                let g = 255 - Math.floor(this.data[i] * 255);
                let b = Math.floor(this.accumulator[i] * 255 / Math.max(this.accumulatorMaxValue, 1));
                dat.data[i*4] = 0;
                dat.data[i*4 + 1] = g;
                dat.data[i*4 + 2] = b;
                dat.data[i*4 + 3] = 255;
            }
        } else {
            for(let i = 0; i < this.data.length; i++) {
                let val = 255 - Math.floor(this.data[i] * 255);
                dat.data[i*4] = 
                dat.data[i*4 + 1] =
                dat.data[i*4 + 2] = val;
                dat.data[i*4 + 3] = 255;
            }
        }

        ctx.putImageData(dat, 0, 0);
    }
}

window.addEventListener("load", () => {
    let simulatorElements = document.querySelectorAll("canvas.simulator");
    for(let simulatorElement of simulatorElements) {
        simulatorElement.simulator = new Simulator(simulatorElement);
    }
});