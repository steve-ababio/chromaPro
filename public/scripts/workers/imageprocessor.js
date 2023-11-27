"use strict";
onmessage = e => {
    let { image, imageToFilter, kernel, divisor } = e.data;
    performConvolution(image, imageToFilter, kernel, divisor);
};
function performConvolution(image, filterImage, kernel, divisor = 1) {
    let brightnessOffset = 1;
    const colorChanCount = 3;
    let imageData = image.data;
    let filterImageData = filterImage.data;
    for (let i = 0; i < imageData.length; i += 4) {
        for (let colorChannel = 0; colorChannel < colorChanCount; colorChannel++) {
            let index = i + colorChannel;
            filterImageData[index] = brightnessOffset + (kernel[0][0] * imageData[(index - image.width * 4) - 4] +
                kernel[0][1] * imageData[(index - image.width * 4)] +
                kernel[0][2] * imageData[(index - image.width * 4) + 4] +
                kernel[1][0] * imageData[index - 4] +
                kernel[1][1] * imageData[index] +
                kernel[1][2] * imageData[index + 4] +
                kernel[2][0] * imageData[(index + image.width * 4) - 4] +
                kernel[2][1] * imageData[index + image.width * 4] +
                kernel[2][2] * imageData[(index + image.width * 4) + 4]) / divisor;
        }
        filterImageData[i + 3] = 255;
    }
    postMessage(filterImage, [filterImageData.buffer]);
}
