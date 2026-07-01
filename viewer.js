/**
 * NebulaDrive Multi-Format Decryption Media Viewer Subsystem
 * Architecture: Isolated Media Viewport Allocator and Memory Teardown Controller
 */

class MediaViewer {
    constructor() {
        this.globalModalLayer = document.getElementById("modal-global-container-layer");
        this.mediaViewerContainer = document.getElementById("modal-media-viewer-container");
        this.blockPicture = document.getElementById("viewport-picture");
        this.blockVideo = document.getElementById("viewport-video");
        this.blockAudio = document.getElementById("viewport-audio");
        this.blockText = document.getElementById("viewport-text");

        this.previewImg = document.getElementById("preview-img");
        this.previewVideo = document.getElementById("preview-video");
        this.previewAudio = document.getElementById("preview-audio");
        this.previewTextContent = document.getElementById("preview-text-content");
        this.modalMediaTitle = document.getElementById("modal-media-title");
        this.modalMediaSizeVal = document.getElementById("modal-media-size-val");

        this.btnCloseHeader = document.getElementById("btn-close-media-viewer");
        this.btnCloseFooter = document.getElementById("btn-close-media-footer");

        this.launchViewer = this.launchViewer.bind(this);
        this.terminateViewerLifecycle = this.terminateViewerLifecycle.bind(this);
    }

    initialize() {
        if (this.btnCloseHeader) this.btnCloseHeader.addEventListener("click", this.terminateViewerLifecycle);
        if (this.btnCloseFooter) this.btnCloseFooter.addEventListener("click", this.terminateViewerLifecycle);
    }

    launchViewer(fileRecord) {
        if (!fileRecord || !fileRecord.content) return;
        if (this.modalMediaTitle) this.modalMediaTitle.textContent = fileRecord.name || "Preview";
        if (this.modalMediaSizeVal) this.modalMediaSizeVal.textContent = parseFloat((fileRecord.size / 1024).toFixed(2)) + " KB";

        this.isolateAndHideAllViewports();
        if (this.globalModalLayer) this.globalModalLayer.classList.remove("hidden");
        if (this.mediaViewerContainer) this.mediaViewerContainer.classList.remove("hidden");

        const mime = (fileRecord.type || "application/octet-stream").toLowerCase();

        if (mime.startsWith("image/")) {
            if (this.previewImg) { this.previewImg.src = fileRecord.content; this.blockPicture.classList.remove("hidden"); }
        } else if (mime.startsWith("video/")) {
            if (this.previewVideo) { this.previewVideo.src = fileRecord.content; this.blockVideo.classList.remove("hidden"); this.previewVideo.load(); this.previewVideo.play().catch(()=>{}); }
        } else if (mime.startsWith("audio/")) {
            if (this.previewAudio) { this.previewAudio.src = fileRecord.content; this.blockAudio.classList.remove("hidden"); this.previewAudio.load(); this.previewAudio.play().catch(()=>{}); }
        } else {
            if (this.previewTextContent) { this.blockText.classList.remove("hidden"); this.previewTextContent.textContent = this.decodeBase64Text(fileRecord.content); }
        }
    }

    isolateAndHideAllViewports() {
        [this.blockPicture, this.blockVideo, this.blockAudio, this.blockText].forEach(b => { if (b) b.classList.add("hidden"); });
    }

    decodeBase64Text(dataUrl) {
        try {
            const fragments = dataUrl.split(",");
            if (fragments.length < 2) return dataUrl;
            const decoded = atob(fragments[1]);
            const buffer = new Uint8Array(decoded.length);
            for (let i = 0; i < decoded.length; i++) buffer[i] = decoded.charCodeAt(i);
            return new TextDecoder("utf-8").decode(buffer);
        } catch (e) {
            return dataUrl.substring(0, 300) + "... [Raw Encrypted String Payload]";
        }
    }

    terminateViewerLifecycle() {
        if (this.previewVideo) { this.previewVideo.pause(); this.previewVideo.src = ""; this.previewVideo.load(); }
        if (this.previewAudio) { this.previewAudio.pause(); this.previewAudio.src = ""; this.previewAudio.load(); }
        if (this.previewImg) this.previewImg.src = "";
        if (this.previewTextContent) this.previewTextContent.textContent = "";

        this.isolateAndHideAllViewports();
        if (this.mediaViewerContainer) this.mediaViewerContainer.classList.add("hidden");
        if (this.globalModalLayer) this.globalModalLayer.classList.add("hidden");
    }
}

const globalMediaViewer = new MediaViewer();
document.addEventListener("DOMContentLoaded", () => globalMediaViewer.initialize());
