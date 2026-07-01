/**
 * NebulaDrive Multitenant Isolated Sandbox Storage Engine
 * Architecture: Prefixed LocalStorage Orchestrator with Quota Safeguards
 */

class StorageEngine {
    constructor() {
        this.LIMIT_FREE_TIER = 5 * 1024 * 1024;
        this.LIMIT_PRO_TIER = 500 * 1024 * 1024;
        this._activeWorkspaceId = "client_default";
        this._state = { files: [], tier: "Free" };
        this.handleWorkspaceChange = this.handleWorkspaceChange.bind(this);
    }

    initialize() {
        window.addEventListener("nebula:workspaceChanged", this.handleWorkspaceChange);
    }

    handleWorkspaceChange(event) {
        if (!event || !event.detail || !event.detail.workspaceId) return;
        this._activeWorkspaceId = event.detail.workspaceId;
        this.loadWorkspaceState();
    }

    getStorageKey() {
        return `${this._activeWorkspaceId}_vault_filesystem_state`;
    }

    loadWorkspaceState() {
        const storageKey = this.getStorageKey();
        try {
            const rawData = localStorage.getItem(storageKey);
            if (rawData) {
                const parsedState = JSON.parse(rawData);
                this._state.files = Array.isArray(parsedState.files) ? parsedState.files : [];
                this._state.tier = (parsedState.tier === "Pro") ? "Pro" : "Free";
            } else {
                this._state.files = [];
                this._state.tier = "Free";
            }
        } catch (exception) {
            console.error("NebulaDrive Engine Error: Load fallback triggered.", exception);
            this._state.files = [];
            this._state.tier = "Free";
        }
        this.notifyStorageStateUpdated();
    }

    saveState() {
        const storageKey = this.getStorageKey();
        try {
            localStorage.setItem(storageKey, JSON.stringify({
                files: this._state.files,
                tier: this._state.tier
            }));
        } catch (storageException) {
            console.error("NebulaDrive Engine Exception: State write failed.", storageException);
        }
        this.notifyStorageStateUpdated();
    }

    hasAvailableSpace(incomingByteSize) {
        const parsedIncomingSize = Number(incomingByteSize);
        if (isNaN(parsedIncomingSize) || parsedIncomingSize < 0) return false;

        let computedCurrentTotalBytes = 0;
        for (let i = 0; i < this._state.files.length; i++) {
            computedCurrentTotalBytes += Number(this._state.files[i].size || 0);
        }
        const allowedCeilingBytes = (this._state.tier === "Pro") ? this.LIMIT_PRO_TIER : this.LIMIT_FREE_TIER;
        return (computedCurrentTotalBytes + parsedIncomingSize) <= allowedCeilingBytes;
    }

    commitFile(fileModel) {
        if (!fileModel || !fileModel.id || !fileModel.name || typeof fileModel.size === 'undefined') return false;
        if (!this.hasAvailableSpace(fileModel.size)) return false;

        this._state.files.push(fileModel);
        this.saveState();
        return true;
    }

    updateFileMetadata(fileId, parameterPatchMap) {
        let matchingNodeFound = false;
        for (let i = 0; i < this._state.files.length; i++) {
            if (this._state.files[i].id === fileId) {
                this._state.files[i] = Object.assign({}, this._state.files[i], parameterPatchMap);
                matchingNodeFound = true;
                break;
            }
        }
        if (matchingNodeFound) {
            this.saveState();
            return true;
        }
        return false;
    }

    purgeFilePermanently(fileId) {
        const originalArrayLength = this._state.files.length;
        this._state.files = this._state.files.filter(item => item.id !== fileId);
        if (this._state.files.length !== originalArrayLength) {
            this.saveState();
            return true;
        }
        return false;
    }

    getFiles(viewFilter) {
        const chosenFilter = viewFilter || "all";
        return this._state.files.filter(fileItem => {
            if (chosenFilter === "trash") return fileItem.isDeleted === true;
            if (fileItem.isDeleted === true) return false;

            switch (chosenFilter) {
                case "all": return true;
                case "photos": return typeof fileItem.type === "string" && fileItem.type.startsWith("image/");
                case "documents": 
                    if (typeof fileItem.type !== "string") return false;
                    const mime = fileItem.type.toLowerCase();
                    return mime.startsWith("text/") || mime.includes("pdf") || mime.includes("msword") || mime.includes("officedocument");
                case "favorites": return fileItem.isFavorite === true;
                default: return true;
            }
        });
    }

    setSubscriptionTier(newTier) {
        if (newTier === "Pro" || newTier === "Free") {
            this._state.tier = newTier;
            this.saveState();
        }
    }

    notifyStorageStateUpdated() {
        const updateEvent = new CustomEvent("nebula:storageUpdated", {
            detail: { workspaceId: this._activeWorkspaceId, tier: this._state.tier, timestamp: Date.now() },
            bubbles: true
        });
        window.dispatchEvent(updateEvent);
    }
}

const globalStorageEngine = new StorageEngine();
globalStorageEngine.initialize();
