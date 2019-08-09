import PatternEditor from "./patternEditor.js";
import { perlin2, seed } from "./noise.js";

export default class Simulator {
    constructor(canvas) {
        this.isRunning = false;
        this.canvas = canvas;
        this.data = new Array(canvas.width * canvas.height);
        this.accumulator = new Array(this.data.length);
        this.accumulatorMaxValue = 0;

        this.debugCheckbox = canvas.parentElement.querySelector("input.debugCheckbox");
        this.canvasSizeInput = canvas.parentElement.querySelector("input.canvasSize");
        this.iterationsInput = canvas.parentElement.querySelector("input.iterations");

        this.calcButton = canvas.parentElement.querySelector("button.calcButton");
        this.calcButton.addEventListener("click", () => {
            this.setRunning(false);
            this.initWidthRandomValues();
            for(let i = 0; i < this.iterationsInput.value; i++)
                this.doSimulationStep();
            
            this.redrawCanvas();
        });
        this.startButton = canvas.parentElement.querySelector("button.startButton");
        this.resetButton = canvas.parentElement.querySelector("button.resetButton");
        this.stepButton = canvas.parentElement.querySelector("button.stepButton");

        this.startButton.addEventListener("click", () => this.toggleRunning());
        this.resetButton.addEventListener("click", () => this.initWidthRandomValues());
        this.stepButton.addEventListener("click", () => {
            this.setRunning(false);
            this.doSimulationStep();
            this.redrawCanvas();
        });
        
        this.setNoiseType("uniform");
        this.initWidthRandomValues();
    }

    setCanvasSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.data = new Array(this.canvas.width * this.canvas.height);
        this.accumulator = new Array(this.data.length);
    }

    toggleRunning() {
        this.setRunning(!this.isRunning);
    }

    setRunning(running) {
        this.isRunning = running;
        if(running) {
            this.intervalID = window.setInterval(() => {
                this.doSimulationStep();
                this.redrawCanvas();
            }, 1000/30);
        } else {
            window.clearInterval(this.intervalID);
        }
    }

    doSimulationStep() {
        // let drive = Number(this.canvas.parentElement.querySelector("input.drive").value) / 100;

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
            let score = PatternEditor.getMatchScore(data);
            if(score != 0) {
                for(let dy = 0; dy < pw; dy++) 
                for(let dx = 0; dx < pw; dx++) {
                    let index = this.canvas.width * (y+dy) + x + dx;
                    this.accumulator[index] += score;
                }
            }
        }

        let maxValue = this.accumulator.reduce((a, b) => Math.max(a, b));
        let sum = this.accumulator.reduce((a, b) => (a + b));

        // if(!this.isRunning) console.log(`max: ${maxValue} sum: ${sum}`);

        this.accumulatorMaxValue = maxValue;

        // do replacement now
        // let avgValue = this.accumulatorMaxValue / this.accumulator.length;
        let avgValue = sum / this.accumulator.length;

        for(let y = 0; y < this.canvas.height; y++)
        for(let x = 0; x < this.canvas.width; x++) {
            let index = y * this.canvas.width + x;
            let mutate = this.accumulator[index] <= 0;
            this.data[index] = mutate? this.sampleNoise(x, y) : this.data[index];
        }
    }
    
    initWidthRandomValues() {
        this.setCanvasSize(this.canvasSizeInput.value, this.canvasSizeInput.value);
        for(let y = 0; y < this.canvas.height; y++)
        for(let x = 0; x < this.canvas.width; x++) {
            seed(Date.now());
            let index = y * this.canvas.width + x;
            this.data[index] = this.sampleNoise(x, y);
        }
        this.redrawCanvas();
    }

    setNoiseType(type) {
        switch(type) {
            case "perlin":
                this.sampleNoiseFunction = this.samplePerlinNoise;
                break;
            case "uniform":
            default:
                this.sampleNoiseFunction = this.sampleUniformNoise;
                break;
        }
    }

    sampleNoise(x, y) {
        return this.sampleNoiseFunction.call(this, x, y);
    }

    samplePerlinNoise(x, y) {
        let thres = perlin2(x / this.canvas.width * 6, y / this.canvas.height * 6);
        thres += this.noiseOffset;
        thres = (thres + 1) * 0.5;
        return Math.random() < thres ? 1 : 0;
    }

    sampleUniformNoise(x, y) {
        return Math.random() < 0.5+this.noiseOffset ? 1 : 0;
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
        
        let noiseSlider = simulatorElement.parentElement.querySelector("input.noiseAmount");
        noiseSlider.onchange = (ev) => { simulatorElement.simulator.noiseOffset = Number(noiseSlider.value); };
        noiseSlider.onchange();
        
        let noiseTypeButtons = simulatorElement.parentElement.querySelectorAll("input.noiseType");
        for(let noiseTypeButton of noiseTypeButtons) {
            noiseTypeButton.onchange = (ev) => {
                if(ev.target.checked) simulatorElement.simulator.setNoiseType(ev.target.value);
            };
            if(noiseTypeButton.checked) simulatorElement.simulator.setNoiseType(noiseTypeButton.value);
        }
    }
});