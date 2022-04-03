"use strict";
class ImageToolsRadio extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.templateCode = document.getElementById("image-tools-radio-temp");
        let radioInputElement = this.templateCode.querySelector(".image-tools__input");
        radioInputElement.setAttribute("id", this.getAttribute("id"));
        radioInputElement.setAttribute("value", this.getAttribute("value"));
        console.log(this.templateCode);
    }
    render() {
        let clonedNode = this.templateCode.content.cloneNode(true);
        this.shadowRoot.append(clonedNode);
    }
}
customElements.define("imagetools-radio", ImageToolsRadio);
