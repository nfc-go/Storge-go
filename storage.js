/* ==========================================================================
   NebulaDrive / NFC GO - Professional Storage Engine Core with Auth Lock
   ========================================================================== */

class StorageEngineCore {
    constructor() {
        this.storageKey = "nfc_go_vault_files";
        // المساحة الافتراضية تبدأ من 20 جيجا بايت كما طلبت يا ريس
        this.maxQuotaBytes = parseInt(localStorage.getItem("custom_quota_bytes")) || (20 * 1024 * 1024 * 1024);
        this.files = this.loadFromStorage();
        this.activePreviewFileId = null;
        
        // تشغيل فحص الأمان والحساب فوراً عند التحميل
        this.initSecurityCheck();
        
        setTimeout(() => {
            this.updateQuotaUI();
            this.renderNodes("all");
            this.bindModalActionButtons();
        }, 300);
    }

    // ==========================================
    // 🔒 نظام الفحص الأول والثاني (Auth System)
    // ==========================================
    initSecurityCheck() {
        // بنشوف هل العميل عمل حساب قبل كده ولا دي أول قراءة للكارت (First Scan)
        const hasAccount = localStorage.getItem("nfc_vault_has_account");
        
        // إنشاء شاشة القفل ديناميكياً لحماية الملفات بالكامل
        const lockOverlay = document.createElement("div");
        lockOverlay.id = "nfc-auth-overlay";
        lockOverlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:#111116; z-index:99999; display:flex; justify-content:center; align-items:center; color:#fff; font-family:sans-serif; padding:20px; box-sizing:border-box;";
        
        if (!hasAccount) {
            // === [ First Scan ] === إنشاء الحساب لأول مرة
            lockOverlay.innerHTML = `
                <div style="background:#1f1f2e; padding:30px; border-radius:16px; width:100%; max-width:360px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.5); border:1px solid #333;">
                    <i class="fa-solid fa-user-shield" style="font-size:3.5rem; color:#007bff; margin-bottom:15px;"></i>
                    <h2 style="margin:0 0 10px; font-size:1.4rem;">NFC GO - Setup Account</h2>
                    <p style="font-size:0.85rem; color:#aaa; margin-bottom:20px;">First Scan: Create your secure username and password below.</p>
                    <input type="text" id="reg-username" placeholder="Choose Username" style="width:100%; padding:12px; margin-bottom:12px; border-radius:8px; border:1px solid #444; background:#111; color:#fff; text-align:center;">
                    <input type="password" id="reg-password" placeholder="Create Password" style="width:100%; padding:12px; margin-bottom:20px; border-radius:8px; border:1px solid #444; background:#111; color:#fff; text-align:center;">
                    <button id="btn-save-account" style="width:100%; padding:12px; background:#28a745; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:1rem;">Create & Save Account</button>
                </div>
            `;
            document.body.appendChild(lockOverlay);

            document.getElementById("btn-save-account").onclick = () => {
                const user = document.getElementById("reg-username").value.trim();
                const pass = document.getElementById("reg-password").value.trim();
                if(!user || !pass) {
                    alert("Please fill in both fields!");
                    return;
                }
                localStorage.setItem("nfc_vault_user", user);
                localStorage.setItem("nfc_vault_pass", pass);
                localStorage.setItem("nfc_vault_has_account", "true");
                alert("Account created successfully! Welcome to your secure space.");
                lockOverlay.remove();
            };
        } else {
            // === [ Second Scan & Forever ] === طلب الباسورد فقط في المرات القادمة
            lockOverlay.innerHTML = `
                <div style="background:#1f1f2e; padding:30px; border-radius:16px; width:100%; max-width:360px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.5); border:1px solid #333;">
                    <i class="fa-solid fa-lock" style="font-size:3.5rem; color:#dc3545; margin-bottom:15px;"></i>
                    <h2 style="margin:0 0 10px; font-size:1.4rem;">NFC GO - Secure Lock</h2>
                    <p style="font-size:0.85rem; color:#aaa; margin-bottom:20px;">Enter your password to unlock your storage vault.</p>
                    <input type="password" id="login-password" placeholder="Enter Password" style="width:100%; padding:12px; margin-bottom:20px; border-radius:8px; border:1px solid #444; background:#111; color:#fff; text-align:center; font-size:1.2rem; letter-spacing:2px;">
                    <button id="btn-unlock-vault" style="width:100%; padding:12px; background:#007bff; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:1rem;">Unlock Storage</button>
                </div>
            `;
            document.body.appendChild(lockOverlay);

            const checkUnlock = () => {
                const enteredPass = document.getElementById("login-password").value;
                const correctPass = localStorage.getItem("nfc_vault_pass");
                if (enteredPass === correctPass) {
                    lockOverlay.remove();
                } else {
                    alert("Incorrect password! Access Denied.");
                }
            };

            document.getElementById("btn-unlock-vault").onclick = checkUnlock;
            document.getElementById("login-password").onkeydown = (e) => {
                if(e.key === "Enter") checkUnlock();
            };
        }
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

        const currentLabel = localStorage.getItem("custom_quota_label") || "20 GB";

        if(document.getElementById("quota-progress-fill")) document.getElementById("quota-progress-fill").style.width = `${pct}%`;
        if(document.getElementById("quota-progress-fill-mobile")) document.getElementById("quota-progress-fill-mobile").style.width = `${pct}%`;
        if(document.getElementById("quota-used-text")) document.getElementById("quota-used-text").textContent = usedKB > 1024 ? `${(usedKB/1024).toFixed(1)} MB` : `${usedKB} KB`;
        if(document.getElementById("quota-used-text-mobile")) document.getElementById("quota-used-text-mobile").textContent = `${Math.round(pct)}%`;
        if(document.getElementById("quota-total-text")) document.getElementById("quota-total-text").textContent = currentLabel;
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
