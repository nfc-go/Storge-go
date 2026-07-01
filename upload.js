/**
 * NebulaDrive Automated Payload Streaming Layer
 * Architecture: Non-Blocking FileReader Base64 Pipeline Interceptor
 */

class UploadEngine {
    constructor() {
        this.fileInputTrigger = document.getElementById("sidebar-file-input");
        this.processFileInputChange = this.processFileInputChange.bind(this);
        this.handleIncomingFileArrayCollection = this.handleIncomingFileArrayCollection.bind(this);
    }

    initialize() {
        if (this.fileInputTrigger) {
            this.fileInputTrigger.addEventListener("change", this.processFileInputChange);
        }
        this.registerDragAndDropBoundarySinks();
    }

    processFileInputChange(event) {
        if (!event || !event.target || !event.target.files) return;
        const list = event.target.files;
        if (list.length === 0) return;
        this.handleIncomingFileArrayCollection(list);
        event.target.value = "";
    }

    registerDragAndDropBoundarySinks() {
        const zone = document.body;
        if (!zone) return;
        const stop = (e) => { e.preventDefault(); e.stopPropagation(); };

        ["dragenter", "dragover", "dragleave", "drop"].forEach(name => zone.addEventListener(name, stop, false));
        zone.addEventListener("drop", (e) => {
            const dt = e.dataTransfer;
            if (dt && dt.files && dt.files.length > 0) this.handleIncomingFileArrayCollection(dt.files);
        }, false);
    }

    handleIncomingFileArrayCollection(fileListCollection) {
        if (typeof globalStorageEngine === "undefined") return;
        for (let i = 0; i < fileListCollection.length; i++) {
            const file = fileListCollection[i];
            if (!globalStorageEngine.hasAvailableSpace(file.size)) {
                alert(`Limit Exceeded. Cannot ingest: "${file.name}"`);
                continue;
            }
            this.serializeAndCommitAssetToSandbox(file);
        }
    }

    serializeAndCommitAssetToSandbox(targetFileEntity) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const base64Token = e.target.result;
                if (!base64Token) throw new Error("Empty payload resolution.");

                const record = {
                    id: this.generateUUID(),
                    name: targetFileEntity.name,
                    type: targetFileEntity.type || "application/octet-stream",
                    size: targetFileEntity.size,
                    content: base64Token,
                    isFavorite: false,
                    isDeleted: false,
                    uploadDate: new Date().toISOString()
                };

                globalStorageEngine.commitFile(record);
            } catch (err) {
                console.error(err);
            }
        };
        reader.readAsDataURL(targetFileEntity);
    }

    generateUUID() {
        let ts = new Date().getTime();
        return "nebula-fxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            let r = Math.random() * 16;
            ts = Math.floor(ts / 16);
            return (c === "x" ? (r | 0) : ((r & 0x3) | 0x8)).toString(16);
        });
    }
}

const globalUploadEngine = new UploadEngine();
document.addEventListener("DOMContentLoaded", () => globalUploadEngine.initialize());
