/* ==========================================================================
   NebulaDrive / NFC GO - Professional Storage Engine Core
   ========================================================================== */

class StorageEngineCore {
    constructor() {
        this.storageKey = "nfc_go_vault_files";
        this.maxQuotaBytes = 5 * 1024 * 1024;
        this.files = this.loadFromStorage();
        this.activePreviewFileId = null;
        
        setTimeout(() => {
            this.updateQuotaUI();
            this.renderNodes("all");
            this.bindModalActionButtons();
        }, 300);
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    saveToStorage() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.files));
        this.updateQuotaUI();
    }

    handleUpload(fileList) {
        Array.from(fileList).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileObj = {
                    id: "node_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    data: e.target.result, 
                    isFavorite: false, 
                    date: new Date().toLocaleDateString()
                };
                
                this.files.push(fileObj);
                this.saveToStorage();
                this.renderNodes(window.currentCategoryView || "all");
            };
            reader.readAsDataURL(file);
        });
    }

    filter(category) {
        this.renderNodes(category);
    }

    getUsedBytes() {
        return this.files.reduce((acc, f) => acc + f.size, 0);
    }

    updateQuotaUI() {
        const usedBytes = this.getUsedBytes();
        const pct = Math.min((usedBytes / this.maxQuotaBytes) * 100, 100).toFixed(1);
        const usedKB = (usedBytes / 1024).toFixed(1);

        if(document.getElementById("quota-progress-fill")) document.getElementById("quota-progress-fill").style.width = `${pct}%`;
        if(document.getElementById("quota-progress-fill-mobile")) document.getElementById("quota-progress-fill-mobile").style.width = `${pct}%`;
        if(document.getElementById("quota-used-text")) document.getElementById("quota-used-text").textContent = `${usedKB} KB`;
        if(document.getElementById("quota-used-text-mobile")) document.getElementById("quota-used-text-mobile").textContent = `${Math.round(pct)}%`;
    }

    openFilePreview(fileId) {
        const file = this.files.find(f => f.id === fileId);
        if (!file) return;

        this.activePreviewFileId = fileId;
        const currentLang = document.documentElement.getAttribute("lang") || "en";

        document.getElementById("preview-modal-title").textContent = file.name;

        const body = document.getElementById("preview-modal-body");
        body.innerHTML = "";
        if (file.type.startsWith("image/")) {
            body.innerHTML = `<img src="${file.data}" style="max-width:100%; max-height:300px; object-fit:contain; border-radius:8px;">`;
        } else if (file.type.startsWith("video/")) {
            body.innerHTML = `<video src="${file.data}" controls style="max-width:100%; max-height:300px; border-radius:8px;"></video>`;
        } else {
            body.innerHTML = `<i class="fa-solid fa-file" style="font-size: 5rem; color:#fff;"></i>`;
        }

        const favBtn = document.getElementById("action-fav-btn");
        const favTxt = document.getElementById("txt-fav-btn");
        if (file.isFavorite) {
            favBtn.classList.add("is-active");
            favTxt.textContent = currentLang === "ar" ? "إلغاء المفضلة" : "Remove Favorite";
        } else {
            favBtn.classList.remove("is-active");
            favTxt.textContent = currentLang === "ar" ? "إضافة للمفضلة" : "Favorite";
        }

        document.getElementById("media-preview-modal").classList.remove("hidden-modal");
    }

    bindModalActionButtons() {
        document.getElementById("action-fav-btn").onclick = () => {
            if (!this.activePreviewFileId) return;
            const file = this.files.find(f => f.id === this.activePreviewFileId);
            if (file) {
                file.isFavorite = !file.isFavorite;
                this.saveToStorage();
                this.openFilePreview(this.activePreviewFileId);
                this.renderNodes(window.currentCategoryView || "all");
            }
        };

        document.getElementById("action-download-btn").onclick = () => {
            if (!this.activePreviewFileId) return;
            const file = this.files.find(f => f.id === this.activePreviewFileId);
            if (file) {
                const link = document.createElement("a");
                link.href = file.data;
                link.download = file.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        };

        document.getElementById("action-delete-btn").onclick = () => {
            if (!this.activePreviewFileId) return;
            const currentLang = document.documentElement.getAttribute("lang") || "en";
            const confirmMsg = currentLang === "ar" ? "هل أنت متأكد من حذف هذا الملف نهائياً؟" : "Are you sure you want to permanently delete this file?";
            
            if (confirm(confirmMsg)) {
                this.files = this.files.filter(f => f.id !== this.activePreviewFileId);
                this.saveToStorage();
                document.getElementById("media-preview-modal").classList.add("hidden-modal");
                this.activePreviewFileId = null;
                this.renderNodes(window.currentCategoryView || "all");
            }
        };
    }

    renderNodes(category = "all") {
        const matrix = document.getElementById("explorer-nodes-matrix");
        if (!matrix) return;
        matrix.innerHTML = "";

        let filtered = this.files;
        const currentLang = document.documentElement.getAttribute("lang") || "en";

        if (category === "images" || category === "photos") {
            filtered = this.files.filter(f => f.type.startsWith("image/"));
        } else if (category === "videos") {
            filtered = this.files.filter(f => f.type.startsWith("video/"));
        } else if (category === "favorites") {
            filtered = this.files.filter(f => f.isFavorite === true);
        }

        if (filtered.length === 0) {
            const noFilesText = currentLang === "ar" ? "لا توجد ملفات في هذا القسم حالياً." : "No files found in this section.";
            matrix.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; opacity:0.5; font-weight:bold; color: var(--text-color);">${noFilesText}</div>`;
            return;
        }

        filtered.forEach(file => {
            const card = document.createElement("div");
            card.className = "file-card";
            card.style = "background: var(--card-bg, #fff); padding: 15px; border-radius: 18px; border: 1px solid #eaeaea; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.02);";
            
            card.onclick = () => this.openFilePreview(file.id);

            let previewHTML = `<i class="fa-solid fa-file" style="font-size: 3rem; color:#aaa;"></i>`;
            if (file.type.startsWith("image/")) {
                previewHTML = `<img src="${file.data}" style="width:100%; height:120px; object-fit:contain; border-radius:12px; margin-bottom:10px;">`;
            } else if (file.type.startsWith("video/")) {
                previewHTML = `<div style="width:100%; height:120px; background:#f8f9fa; border-radius:12px; display:flex; align-items:center; justify-content:center; margin-bottom:10px;"><i class="fa-solid fa-video" style="font-size: 2.5rem; color:var(--accent-color, #007bff);"></i></div>`;
            }

            let favBadgeHTML = file.isFavorite ? `<div class="fav-badge"><i class="fa-solid fa-heart"></i></div>` : '';

            card.innerHTML = `
                ${favBadgeHTML}
                ${previewHTML}
                <div style="font-weight:bold; font-size:0.9rem; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; margin-top:8px; color: var(--text-color);">${file.name}</div>
                <div style="font-size:0.8rem; opacity:0.6; margin-top:4px; color: var(--text-color);">${(file.size / 1024).toFixed(1)} KB</div>
            `;
            matrix.appendChild(card);
        });
    }
}

window.StorageEngine = new StorageEngineCore();
