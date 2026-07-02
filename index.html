/* ==========================================================================
   NebulaDrive / NFC GO - Professional Storage Engine Core
   ========================================================================== */

class StorageEngineCore {
    constructor() {
        this.storageKey = "nfc_go_vault_files";
        this.maxQuotaBytes = 5 * 1024 * 1024; // 5 MB الافتراضية
        this.files = this.loadFromStorage();
        
        // تشغيل فوري لتحديث المساحة والجدول أول ما الصفحة تفتح
        setTimeout(() => {
            this.updateQuotaUI();
            this.renderNodes("all");
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
                    data: e.target.result, // تشفير الصورة بالكامل لحفظها حية
                    date: new Date().toLocaleDateString()
                };
                
                this.files.push(fileObj);
                this.saveToStorage();
                this.renderNodes("all");
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

        // تحديث العداد الجانبي والعلوي للموبايل
        if(document.getElementById("quota-progress-fill")) document.getElementById("quota-progress-fill").style.width = `${pct}%`;
        if(document.getElementById("quota-progress-fill-mobile")) document.getElementById("quota-progress-fill-mobile").style.width = `${pct}%`;
        if(document.getElementById("quota-used-text")) document.getElementById("quota-used-text").textContent = `${usedKB} KB`;
        if(document.getElementById("quota-used-text-mobile")) document.getElementById("quota-used-text-mobile").textContent = `${Math.round(pct)}%`;
    }

    renderNodes(category = "all") {
        const matrix = document.getElementById("explorer-nodes-matrix");
        if (!matrix) return;
        matrix.innerHTML = "";

        let filtered = this.files;
        if (category === "images" || category === "photos") {
            filtered = this.files.filter(f => f.type.startsWith("image/"));
        } else if (category === "videos") {
            filtered = this.files.filter(f => f.type.startsWith("video/"));
        }

        if (filtered.length === 0) {
            matrix.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; opacity:0.5;">No files found in this section.</div>`;
            return;
        }

        filtered.forEach(file => {
            const card = document.createElement("div");
            card.className = "file-card";
            card.style = "background: var(--card-bg, #fff); padding: 15px; border-radius: 18px; border: 1px solid #eaeaea; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.02);";
            
            // لو الملف صورة يعرضها مصغرة وجميلة جداً
            let previewHTML = `<i class="fa-solid fa-file" style="font-size: 3rem; color:#aaa;"></i>`;
            if (file.type.startsWith("image/")) {
                previewHTML = `<img src="${file.data}" style="width:100%; height:120px; object-fit:contain; border-radius:12px; margin-bottom:10px;">`;
            }

            card.innerHTML = `
                ${previewHTML}
                <div style="font-weight:bold; font-size:0.9rem; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; margin-top:8px;">${file.name}</div>
                <div style="font-size:0.8rem; opacity:0.6; margin-top:4px;">${(file.size / 1024).toFixed(1)} KB</div>
            `;
            matrix.appendChild(card);
        });
    }
}

// تصدير المحرك للنافذة العامة لربطه بملف الـ index الحين
window.StorageEngine = new StorageEngineCore();
