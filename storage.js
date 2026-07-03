/* ==========================================================================
   NFC GO - Google Sheets Dual-Engine (Split Files & Accounts)
   ========================================================================== */

class CloudStorageEngine {
    constructor() {
        // 🔐 رابط الـ Web App الأول (المسؤول عن الحسابات وباسوردات العملاء)
        this.accountsApiUrl = "https://script.google.com/macros/s/AKfycbyz75D8Tv7D5bO6oT_lknaIWjWCkpyaZWMzWqrDbmZx_qkjpuTtHmxAgHk3mJK3IKTs/exec";
        
        // 📂 رابط الـ Web App الثاني (المسؤول عن رفع وقراءة ملفات الـ Base64)
        this.filesApiUrl = "https://script.google.com/macros/s/AKfycbzOh3VgBkgT8x9epz8r3pyVi1EqyBXAUBFMKIznG0ckNM4rcFAtQJlTupZeQkhUBNM/exec";

        this.cardId = this.getCardIdFromUrl();
        this.authSessionKey = `nfc_session_auth_${this.cardId}`;
        this.quotaLabelKey = `custom_quota_label_${this.cardId}`;
        this.quotaBytesKey = `custom_quota_bytes_${this.cardId}`;

        this.maxQuotaBytes = 20 * 1024 * 1024 * 1024; // 20 جيجا كوتا افتراضية
        this.files = [];
        this.activePreviewFileId = null;

        this.initCloudVault();
    }

    getCardIdFromUrl() {
        const hash = window.location.hash;
        if (hash && hash.includes("#/") && hash !== "#/all" && hash !== "#/images" && hash !== "#/videos" && hash !== "#/favorites") {
            let cleanId = hash.replace("#/", "").split("?")[0].split("/")[0];
            if (cleanId) { localStorage.setItem("nfc_saved_card_id", cleanId); return cleanId; }
        }
        return localStorage.getItem("nfc_saved_card_id") || "default_vault";
    }

    async initCloudVault() {
        this.showCloudLoading(true);
        try {
            const account = await this.callGoogleSheets(this.accountsApiUrl, "fetch");
            if (!account || account.length === 0) {
                this.showCloudLoading(false);
                this.renderRegisterScreen();
            } else {
                if (sessionStorage.getItem(this.authSessionKey) === "true") {
                    await this.loadCloudFiles();
                } else {
                    this.showCloudLoading(false);
                    this.renderLoginScreen(account[0].password, account[0].username);
                }
            }
        } catch (err) {
            console.error("Initialization error:", err);
            this.showCloudLoading(false);
            this.renderRegisterScreen();
        }
    }

    renderRegisterScreen() {
        this.removeExistingOverlay();
        const lockOverlay = document.createElement("div");
        lockOverlay.id = "nfc-auth-overlay";
        lockOverlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:#111116; z-index:99999; display:flex; justify-content:center; align-items:center; color:#fff; font-family:sans-serif; padding:20px; box-sizing:border-box;";
        lockOverlay.innerHTML = `
            <div style="background:#1f1f2e; padding:30px; border-radius:16px; width:100%; max-width:360px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.5); border:1px solid #333;">
                <i class="fa-solid fa-file-excel" style="font-size:3.5rem; color:#28a745; margin-bottom:15px;"></i>
                <h2 style="margin:0 0 10px; font-size:1.4rem;">NFC GO - تفعيل الخزنة</h2>
                <p style="font-size:0.85rem; color:#aaa; margin-bottom:15px;">رقم الكارت الحالي: <span style="color:#28a745; font-weight:bold;">${this.cardId}</span></p>
                <form id="nfc-reg-form" onsubmit="return false;">
                    <input type="text" id="reg-username" placeholder="اسم المستخدم" required style="width:100%; padding:12px; margin-bottom:12px; border-radius:8px; border:1px solid #444; background:#111; color:#fff; text-align:center;">
                    <input type="password" id="reg-password" placeholder="كلمة المرور" required style="width:100%; padding:12px; margin-bottom:20px; border-radius:8px; border:1px solid #444; background:#111; color:#fff; text-align:center;">
                    <button type="button" id="btn-save-account" style="width:100%; padding:12px; background:#28a745; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">تفعيل الحساب سحابياً</button>
                </form>
            </div>
        `;
        document.body.appendChild(lockOverlay);

        document.getElementById("btn-save-account").onclick = async () => {
            const user = document.getElementById("reg-username").value.trim();
            const pass = document.getElementById("reg-password").value.trim();
            if(!user || !pass) { alert("يرجى إدخال البيانات!"); return; }

            this.showCloudLoading(true);
            const res = await this.callGoogleSheets(this.accountsApiUrl, "insert", { card_id: this.cardId, username: user, password: pass });
            this.showCloudLoading(false);
            if(res && res.success) {
                sessionStorage.setItem(this.authSessionKey, "true");
                alert("تم إنشاء حسابك بنجاح في جوجل شيت!");
                window.location.reload();
            } else {
                alert("حدث خطأ أثناء التفعيل، تأكد من صلاحيات الـ Web App والسطر الأول في الشيت.");
            }
        };
    }

    renderLoginScreen(correctPassword, username) {
        this.removeExistingOverlay();
        const lockOverlay = document.createElement("div");
        lockOverlay.id = "nfc-auth-overlay";
        lockOverlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:#111116; z-index:99999; display:flex; justify-content:center; align-items:center; color:#fff; font-family:sans-serif; padding:20px; box-sizing:border-box;";
        lockOverlay.innerHTML = `
            <div style="background:#1f1f2e; padding:30px; border-radius:16px; width:100%; max-width:360px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.5); border:1px solid #333;">
                <i class="fa-solid fa-lock" style="font-size:3.5rem; color:#dc3545; margin-bottom:15px;"></i>
                <h2 style="margin:0 0 10px; font-size:1.4rem;">خزنة NFC GO الآمنة</h2>
                <p style="margin-bottom:20px;">مرحباً يا <span style="color:#28a745; font-weight:bold;">${username}</span></p>
                <input type="password" id="login-password" placeholder="كلمة المرور" style="width:100%; padding:12px; margin-bottom:20px; border-radius:8px; border:1px solid #444; background:#111; color:#fff; text-align:center; font-size:1.2rem;">
                <button id="btn-unlock-vault" style="width:100%; padding:12px; background:#007bff; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">فتح الملفات</button>
            </div>
        `;
        document.body.appendChild(lockOverlay);

        const checkUnlock = async () => {
            if (document.getElementById("login-password").value === String(correctPassword)) {
                sessionStorage.setItem(this.authSessionKey, "true");
                lockOverlay.remove();
                await this.loadCloudFiles();
            } else { alert("كلمة المرور خاطئة!"); }
        };

        document.getElementById("btn-unlock-vault").onclick = checkUnlock;
        document.getElementById("login-password").onkeydown = (e) => { if(e.key === "Enter") checkUnlock(); };
    }

    async loadCloudFiles() {
        this.showCloudLoading(true);
        const fetchedData = await this.callGoogleSheets(this.filesApiUrl, "fetch");
        this.files = fetchedData || [];
        this.updateQuotaUI();
        this.renderNodes("all");
        this.showCloudLoading(false);
    }

    async handleUpload(fileList) {
        this.showCloudLoading(true);
        for (let file of Array.from(fileList)) {
            const reader = new FileReader();
            await new Promise((resolve) => {
                reader.onload = async (e) => {
                    await this.callGoogleSheets(this.filesApiUrl, "insert", {
                        card_id: this.cardId,
                        file_id: "node_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        data_base64: e.target.result,
                        is_favorite: false,
                        date_added: new Date().toLocaleDateString()
                    });
                    resolve();
                };
                reader.readAsDataURL(file);
            });
        }
        await this.loadCloudFiles();
    }

    async deleteFileCloud(fileId) {
        this.showCloudLoading(true);
        await this.callGoogleSheets(this.filesApiUrl, "delete", { card_id: this.cardId, file_id: fileId });
        document.getElementById("media-preview-modal").classList.add("hidden-modal");
        await this.loadCloudFiles();
    }

    async callGoogleSheets(apiUrl, action, data = {}) {
        try {
            const res = await fetch(apiUrl, {
                method: "POST",
                mode: "cors",
                body: JSON.stringify({ action: action, card_id: this.cardId, data: data, file_id: data.file_id || "" })
            });
            return await res.json();
        } catch(e) { 
            console.error("Fetch API error:", e);
            return []; 
        }
    }

    filter(category) { this.renderNodes(category); }
    getUsedBytes() { return this.files.reduce((acc, f) => acc + parseInt(f.size || 0), 0); }
    removeExistingOverlay() { const el = document.getElementById("nfc-auth-overlay"); if (el) el.remove(); }

    updateQuotaUI() {
        const usedBytes = this.getUsedBytes();
        const pct = Math.min((usedBytes / this.maxQuotaBytes) * 100, 100).toFixed(1);
        const usedKB = (usedBytes / 1024).toFixed(1);
        const currentLabel = localStorage.getItem(this.quotaLabelKey) || "20 GB";

        if(document.getElementById("quota-progress-fill")) document.getElementById("quota-progress-fill").style.width = `${pct}%`;
        if(document.getElementById("quota-progress-fill-mobile")) document.getElementById("quota-progress-fill-mobile").style.width = `${pct}%`;
        if(document.getElementById("quota-used-text")) document.getElementById("quota-used-text").textContent = usedBytes > 1048576 ? `${(usedBytes/1048576).toFixed(1)} MB` : `${usedKB} KB`;
        if(document.getElementById("quota-used-text-mobile")) document.getElementById("quota-used-text-mobile").textContent = `${Math.round(pct)}%`;
        if(document.getElementById("quota-total-text")) document.getElementById("quota-total-text").textContent = currentLabel;
    }

    openFilePreview(fileId) {
        const file = this.files.find(f => f.file_id === fileId);
        if (!file) return;
        this.activePreviewFileId = fileId;

        document.getElementById("preview-modal-title").textContent = file.name;
        const body = document.getElementById("preview-modal-body");
        body.innerHTML = "";

        if (file.type.startsWith("image/")) {
            body.innerHTML = `<img src="${file.data_base64}" style="max-width:100%; max-height:300px; object-fit:contain; border-radius:8px;">`;
        } else if (file.type.startsWith("video/")) {
            body.innerHTML = `<video src="${file.data_base64}" controls style="max-width:100%; max-height:300px; border-radius:8px;"></video>`;
        } else {
            body.innerHTML = `<i class="fa-solid fa-file" style="font-size: 5rem; color:#fff;"></i>`;
        }
        document.getElementById("media-preview-modal").classList.remove("hidden-modal");
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
        }

        if (filtered.length === 0) {
            matrix.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; opacity:0.5; font-weight:bold; color:var(--text-color);">${currentLang === "ar" ? "لا توجد ملفات مرفوعة." : "No files."}</div>`;
            return;
        }

        filtered.forEach(file => {
            const card = document.createElement("div");
            card.className = "file-card";
            card.style = "background: var(--card-bg, #fff); padding:15px; border-radius:18px; border:1px solid #eaeaea; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.02); cursor:pointer;";
            card.onclick = () => this.openFilePreview(file.file_id);

            let previewHTML = `<i class="fa-solid fa-file" style="font-size:3rem; color:#aaa;"></i>`;
            if (file.type.startsWith("image/")) {
                previewHTML = `<img src="${file.data_base64}" style="width:100%; height:120px; object-fit:contain; border-radius:12px; margin-bottom:10px;">`;
            } else if (file.type.startsWith("video/")) {
                previewHTML = `<div style="width:100%; height:120px; background:#f8f9fa; border-radius:12px; display:flex; align-items:center; justify-content:center; margin-bottom:10px;"><i class="fa-solid fa-video" style="font-size:2.5rem; color:#007bff;"></i></div>`;
            }

            card.innerHTML = `
                ${previewHTML}
                <div style="font-weight:bold; font-size:0.9rem; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; margin-top:8px; color:var(--text-color);">${file.name}</div>
                <div style="font-size:0.8rem; opacity:0.6; margin-top:4px; color:var(--text-color);">${(parseInt(file.size)/1024).toFixed(1)} KB</div>
            `;
            matrix.appendChild(card);
        });
    }

    showCloudLoading(show) {
        let loader = document.getElementById("cloud-loader-overlay");
        if (show) {
            if (!loader) {
                loader = document.createElement("div");
                loader.id = "cloud-loader-overlay";
                loader.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:100000; display:flex; flex-direction:column; justify-content:center; align-items:center; color:#fff; font-family:sans-serif;";
                loader.innerHTML = `
                    <div style="border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom:15px;"></div>
                    <p style="font-weight:bold; font-size:1rem;">جاري الاتصال السحابي بجوجل شيت...</p>
                    <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
                `;
                document.body.appendChild(loader);
            }
        } else if (loader) { loader.remove(); }
    }
}

window.StorageEngine = new CloudStorageEngine();
