"use strict";
const canvas = document.querySelector("#canvas");
const imageTools = document.querySelector(".image-tools");
const downloadbtn = document.querySelector(".download-img__btn");
const downloadlink = document.querySelector(".download-img");
const imgRes = document.querySelector(".img-res-info");
const loader = document.querySelector(".loading");
const loaderTxt = document.querySelector(".loading__txt");
const filterCheckBoxes = document.getElementsByClassName("image-tools__input");
const fileselector = document.querySelector("#main-form__file-input");
const pixelColor = document.querySelector(".pixel-color__ctn");
class ImageProcessor {
    constructor() {
        this.fetchBitampImage = this.fetchBitampImage.bind(this);
        this.performFilterOperation = this.performFilterOperation.bind(this);
        this.downloadImage = this.downloadImage.bind(this);
        this.selectPixelColor = this.selectPixelColor.bind(this);
        this.canvasCtx = canvas.getContext('2d');
        fileselector.addEventListener("change", this.fetchBitampImage);
        canvas.addEventListener('mousemove', this.selectPixelColor);
    }
    async fetchBitampImage(e) {
        let metaImage = e.target.files[0];
        try {
            this.bitmapImage = await createImageBitmap(metaImage);
            imgRes.innerText = `Resolution: ${this.bitmapImage.width} * ${this.bitmapImage.height}`;
            this.drawImage();
        }
        catch (error) {
            console.log(error);
        }
    }
    drawImage() {
        this.canvasCtx.drawImage(this.bitmapImage, 0, 0, this.bitmapImage.width, this.bitmapImage.height, 0, 0, canvas.width, canvas.height);
        imageTools.addEventListener("change", this.performFilterOperation);
    }
    performFilterOperation(e) {
        let image = this.canvasCtx.getImageData(0, 0, this.bitmapImage.width, this.bitmapImage.height);
        let filterImage = this.canvasCtx.createImageData(image);
        if (e.target.checked) {
            downloadbtn.removeAttribute("disabled");
            downloadbtn.addEventListener('click', this.downloadImage);
            switch (e.target) {
                case filterCheckBoxes[0]:
                    this.blurImage(image, filterImage);
                    break;
                case filterCheckBoxes[1]:
                    this.warmImage(image);
                    break;
                case filterCheckBoxes[2]:
                    this.grayScaleImage(image);
                    break;
                case filterCheckBoxes[3]:
                    this.sharpenImage(image, filterImage);
                    break;
                case filterCheckBoxes[4]:
                    this.drawImage();
                    break;
                case filterCheckBoxes[5]:
                    this.invertImage(image);
            }
        }
    }
    invertImage(image) {
        let imageData = image.data;
        console.log(imageData);
        for (let index = 0; index < imageData.length; index += 4) {
            imageData[index] = 255 - imageData[index];
            imageData[index + 1] = 255 - imageData[index + 1];
            imageData[index + 2] = 255 - imageData[index + 2];
        }
        this.canvasCtx.putImageData(image, 0, 0);
    }
    warmImage(image) {
        let imageData = image.data;
        for (let index = 0; index < imageData.length; index += 4) {
            imageData[index] = imageData[index] * 1.05;
            imageData[index + 1] = imageData[index + 1] * 1.05;
            imageData[index + 2] = imageData[index + 2] * 1.05;
            imageData[index + 3] = imageData[index + 3] * 1.05;
        }
        this.canvasCtx.putImageData(image, 0, 0);
        createCodeElement("warm filter applied", imgRes);
    }
    grayScaleImage(image) {
        let imageData = image.data;
        configureLoaderAria.call(this, "grayscale");
        for (let index = 0; index < imageData.length; index += 4) {
            if (imageData[index] - imageData[index + 1] > 50 && imageData[index] - imageData[index + 2] > 50) {
                imageData[index] = 255;
            }
            else {
                let gray = (0.21 * imageData[index] + 0.72 * imageData[(index + 1)] + 0.07 * imageData[(index + 2)]) / 3;
                imageData[index] = imageData[index + 1] = imageData[index + 2] = gray;
            }
        }
        this.canvasCtx.putImageData(image, 0, 0);
        createCodeElement("grayscale filter applied", imgRes);
        loaderIndicator.call(this, "grayscale");
    }
    blurImage(image, imageToFilter) {
        let kernel = [[1, 1, 1], [1, 1, 1], [1, 1, 1]];
        let divisor = 9;
        const workerPath = "./scripts/workers/imageprocessor.js";
        let imageProcessorWorker = constructWorker(workerPath);
        imageProcessorWorker.postMessage({ image, imageToFilter, kernel, divisor }, [image.data.buffer, imageToFilter.data.buffer]);
        configureLoaderAria("blur");
        imageProcessorWorker.addEventListener('message', e => {
            let filteredImage = e.data;
            this.canvasCtx.putImageData(filteredImage, 0, 0);
            createCodeElement("blur filter applied", imgRes);
            loaderIndicator("blur");
        });
    }
    sharpenImage(image, imageToFilter) {
        const kernel = [[0, -1, 0], [-1, 5, -1], [0, -1, 0]];
        const workerPath = "./scripts/workers/imageprocessor.js";
        let imageProcessorWorker = constructWorker(workerPath);
        imageProcessorWorker.postMessage({ image, imageToFilter, kernel }, [image.data.buffer, imageToFilter.data.buffer]);
        configureLoaderAria("sharpen");
        imageProcessorWorker.addEventListener('message', e => {
            let filteredImage = e.data;
            this.canvasCtx.putImageData(filteredImage, 0, 0);
            createCodeElement("sharpen filter applied", imgRes);
            loaderIndicator("sharpen");
        });
    }
    downloadImage() {
        let downloadURL = canvas.toDataURL('image/png');
        downloadlink.setAttribute("href", downloadURL);
    }
    selectPixelColor(e) {
        let image = this.canvasCtx.getImageData(0, 0, canvas.width, canvas.height);
        let imageData = image.data;
        let red = imageData[(e.offsetX + image.width * e.offsetY) * 4];
        let green = imageData[(e.offsetX + image.width * e.offsetY) * 4 + 1];
        let blue = imageData[(e.offsetX + image.width * e.offsetY) * 4 + 2];
        let alpha = imageData[(e.offsetX + image.width * e.offsetY) * 4 + 3];
        let pixelcolor = `rgba(${red},${green},${blue},${alpha / 255})`;
        pixelColor.style.backgroundColor = pixelcolor;
        pixelColor.innerText = pixelcolor;
    }
}
function constructWorker(workerPath) {
    const worker = new Worker(workerPath);
    return worker;
}
function createCodeElement(text, parent) {
    let element = document.createElement("code");
    element.innerText = text;
    parent.append(element);
}
function loaderIndicator(filtertype) {
    loaderTxt.innerText = `${filtertype} filter applied`;
    setTimeout(() => {
        loader.setAttribute("aria-hidden", "true");
        setTimeout(() => { loaderTxt.innerText = `Applying ${filtertype} filter`; }, 1500);
    }, 1000);
}
function configureLoaderAria(filtertype) {
    loader.setAttribute("aria-hidden", "false");
    loaderTxt.innerText = `Applying ${filtertype} filter`;
}
let imageprocessor = new ImageProcessor();
