/* ==========================================================================
   NFC GO - Cloud Storage Engine Powered by Supabase (Forever Free)
   ========================================================================== */

class CloudStorageEngine {
    constructor() {
        // مفاتيح الربط السحابية الخاصة بمشروعك يا ريس
        this.supabaseUrl = "https://wnjaqocmvvomlexnuhuh.supabase.co";
        this.supabaseKey = "EyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduamFxb2NtdnZvbWxleG51aHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NDY1MDIsImV4cCI6MjA5ODUyMjUwMn0.IhNkg_LK1hKvBTOYtOZwL0ZGrA35nXsGPD2W9sHt0UI";

        // استخراج الـ ID الفريد من الرابط ليفصل الكروت عن بعضها
        this.cardId = this.getCardIdFromUrl();
        
        // مفاتيح كاش المتصفح للاحتفاظ بجلسة الدخول المؤقتة فقط
        this.authSessionKey = `nfc_session_auth_${this.cardId}`;
        this.quotaLabelKey = `custom_quota_label_${this.cardId}`;
        this.quotaBytesKey = `custom_quota_bytes_${this.cardId}`;

        // المساحة الافتراضية 20 جيجا بايت لكل كارت جديد
        this.maxQuotaBytes = parseInt(localStorage.getItem(this.quotaBytesKey)) || (20 * 1024 * 1024 * 1024);
        this.files = [];
        this.activePreviewFileId = null;

        // تهيئة جداول السحاب تلقائياً وفحص الأمان
        this.initCloudVault();
    }

    getCardIdFromUrl() {
        const hash = window.location.hash;
        if (!hash || hash === "#all" || hash === "#images" || hash === "#videos" || hash === "#favorites") {
            return "default_vault";
        }
        let cleanId = hash.replace("#/", "").replace("#?id=", "");
        cleanId = cleanId.split("?")[0].split("/")[0]; 
        return cleanId || "default_vault";
    }

    // فحص الحساب والمزامنة مع السحاب
    async initCloudVault() {
        this.showCloudLoading(true);
        try {
            // جلب الحساب الخاص بهذا الكارت من السحاب
            const account = await this.cloudFetch('vault_accounts', `card_id=eq.${this.cardId}`);
            
            if (!account || account.length === 0) {
                // [ First Scan ] الحساب مش موجود .. نفتح شاشة التسجيل لأول مرة
                this.renderRegisterScreen();
            } else {
                // الحساب موجود .. نشوف هل مسجل دخول على المتصفح ده ولا نطلب الباسورد (Second Scan)
                const isUnlocked = sessionStorage.getItem(this.authSessionKey);
                if (isUnlocked === "true") {
                    await this.loadCloudFiles();
                    this.showCloudLoading(false);
                } else {
                    this.renderLoginScreen(account[0].password, account[0].username);
                }
            }
        } catch (err) {
            console.error("Cloud Error:", err);
            alert("سيرفر السحاب واجه مشكلة في الاتصال، تأكد من إعدادات الجداول في Supabase.");
            this.showCloudLoading(false);
        }
    }

    // شاشة الفحص الأول (First Scan)
    renderRegisterScreen() {
        this.removeExistingOverlay();
        const lockOverlay = document.createElement("div");
        lockOverlay.id = "nfc-auth-overlay";
        lockOverlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:#111116; z-index:99999; display:flex; justify-content:center; align-items:center; color:#fff; font-family:sans-serif; padding:20px; box-sizing:border-box;";
        
        lockOverlay.innerHTML = `
            <div style="background:#1f1f2e; padding:30px; border-radius:16px; width:100%; max-width:360px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.5); border:1px solid #333;">
                <i class="fa-solid fa-cloud-arrow-up" style="font-size:3.5rem; color:#007bff; margin-bottom:15px;"></i>
                <h2 style="margin:0 0 10px; font-size:1.4rem;">NFC GO Cloud - إعداد الحساب</h2>
                <p style="font-size:0.85rem; color:#aaa; margin-bottom:5px;">رقم الكارت: <span style="color:#007bff; font-weight:bold;">${this.cardId}</span></p>
                <p style="font-size:0.85rem; color:#aaa; margin-bottom:20px;">الفحص الأول: اختر اسم مستخدم وباسورد لحفظ ملفاتك سحابياً مدى الحياة.</p>
                <input type="text" id="reg-username" placeholder="اسم المستخدم" style="width:100%; padding:12px; margin-bottom:12px; border-radius:8px; border:1px solid #444; background:#111; color:#fff; text-align:center;">
                <input type="password" id="reg-password" placeholder="كلمة المرور السرية" style="width:100%; padding:12px; margin-bottom:20px; border-radius:8px; border:1px solid #444; background:#111; color:#fff; text-align:center;">
                <button id="btn-save-account" style="width:100%; padding:12px; background:#28a745; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:1rem;">إنشاء الحساب السحابي</button>
            </div>
        `;
        document.body.appendChild(lockOverlay);

        document.getElementById("btn-save-account").onclick = async () => {
            const user = document.getElementById("reg-username").value.trim();
            const pass = document.getElementById("reg-password").value.trim();
            if(!user || !pass) { alert("برجاء ملء البيانات أولاً!"); return; }

            this.showCloudLoading(true);
            await this.cloudInsert('vault_accounts', { card_id: this.cardId, username: user, password: pass });
            sessionStorage.setItem(this.authSessionKey, "true");
            
            alert("تم إنشاء حسابك السحابي بنجاح! سيتم فتح الخزنة التخزينية الحين.");
            lockOverlay.remove();
            window.location.reload();
        };
    }

    // شاشة الفحص الثاني والأبدي (Second Scan & Forever) من أي جهاز
    renderLoginScreen(correctPassword, username) {
        this.removeExistingOverlay();
        const lockOverlay = document.createElement("div");
        lockOverlay.id = "nfc-auth-overlay";
        lockOverlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:#111116; z-index:99999; display:flex; justify-content:center; align-items:center; color:#fff; font-family:sans-serif; padding:20px; box-sizing:border-box;";
        
        lockOverlay.innerHTML = `
            <div style="background:#1f1f2e; padding:30px; border-radius:16px; width:100%; max-width:360px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.5); border:1px solid #333;">
                <i class="fa-solid fa-lock" style="font-size:3.5rem; color:#dc3545; margin-bottom:15px;"></i>
                <h2 style="margin:0 0 10px; font-size:1.4rem;">خزنة NFC GO السحابية</h2>
                <p style="font-size:0.85rem; color:#aaa; margin-bottom:20px;">مرحباً بك يا <span style="color:#28a745; font-weight:bold;">${username}</span>، اكتب الباسورد لفتح ملفاتك.</p>
                <input type="password" id="login-password" placeholder="اكتب كلمة المرور هنا" style="width:100%; padding:12px; margin-bottom:20px; border-radius:8px; border:1px solid #444; background:#111; color:#fff; text-align:center; font-size:1.2rem; letter-spacing:2px;">
                <button id="btn-unlock-vault" style="width:100%; padding:12px; background:#007bff; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:1rem;">فتح ملفاتي السحابية</button>
            </div>
        `;
        document.body.appendChild(lockOverlay);

        const checkUnlock = async () => {
            const enteredPass = document.getElementById("login-password").value;
            if (enteredPass === correctPassword) {
                sessionStorage.setItem(this.authSessionKey, "true");
                lockOverlay.remove();
                await this.loadCloudFiles();
            } else {
                alert("الباسورد غير صحيح! حاول مجدداً.");
            }
        };

        document.getElementById("btn-unlock-vault").onclick = checkUnlock;
        document.getElementById("login-password").onkeydown = (e) => { if(e.key === "Enter") checkUnlock(); };
    }

    async loadCloudFiles() {
        this.showCloudLoading(true);
        const fetched = await this.cloudFetch('vault_files', `card_id=eq.${this.cardId}`);
        this.files = fetched || [];
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
                    const fileObj = {
                        card_id: this.cardId,
                        file_id: "node_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        data_base64: e.target.result, 
                        is_favorite: false, 
                        date_added: new Date().toLocaleDateString()
                    };
                    
                    await this.cloudInsert('vault_files', fileObj);
                    resolve();
                };
                reader.readAsDataURL(file);
            });
        }
        await this.loadCloudFiles();
    }

    async toggleFavoriteCloud(fileId, currentStatus) {
        this.showCloudLoading(true);
        await this.cloudUpdate('vault_files', { is_favorite: !currentStatus }, `and=(card_id.eq.${this.cardId},file_id.eq.${fileId})`);
        await this.loadCloudFiles();
        this.openFilePreview(fileId);
    }

    async deleteFileCloud(fileId) {
        this.showCloudLoading(true);
        await this.cloudDelete('vault_files', `and=(card_id.eq.${this.cardId},file_id.eq.${fileId})`);
        document.getElementById("media-preview-modal").classList.add("hidden-modal");
        this.activePreviewFileId = null;
        await this.loadCloudFiles();
    }

    // ==========================================
    // 🌐 الدوال المساعدة للتواصل مع سيرفر Supabase API
    // ==========================================
    async cloudFetch(table, queryStr = "") {
        const res = await fetch(`${this.supabaseUrl}/rest/v1/${table}?${queryStr}`, {
            headers: { "apikey": this.supabaseKey, "Authorization": `Bearer ${this.supabaseKey}` }
        });
        return res.ok ? await res.json() : [];
    }

    async cloudInsert(table, dataObj) {
        await fetch(`${this.supabaseUrl}/rest/v1/${table}`, {
            method: "POST",
            headers: { "apikey": this.supabaseKey, "Authorization": `Bearer ${this.supabaseKey}`, "Content-Type": "application/json", "Prefer": "return=representation" },
            body: JSON.stringify(dataObj)
        });
    }

    async cloudUpdate(table, dataObj, queryStr) {
        await fetch(`${this.supabaseUrl}/rest/v1/${table}?${queryStr}`, {
            method: "PATCH",
            headers: { "apikey": this.supabaseKey, "Authorization": `Bearer ${this.supabaseKey}`, "Content-Type": "application/json" },
            body: JSON.stringify(dataObj)
        });
    }

    async cloudDelete(table, queryStr) {
        await fetch(`${this.supabaseUrl}/rest/v1/${table}?${queryStr}`, {
            method: "DELETE",
            headers: { "apikey": this.supabaseKey, "Authorization": `Bearer ${this.supabaseKey}` }
        });
    }

    // ==========================================
    // ⚙️ دوال الواجهة والعرض (UI)
    // ==========================================
    filter(category) { this.renderNodes(category); }
    getUsedBytes() { return this.files.reduce((acc, f) => acc + f.size, 0); }

    updateQuotaUI() {
        const usedBytes = this.getUsedBytes();
        const pct = Math.min((usedBytes / this.maxQuotaBytes) * 100, 100).toFixed(1);
        const usedKB = (usedBytes / 1024).toFixed(1);
        const currentLabel = localStorage.getItem(this.quotaLabelKey) || "20 GB";

        if(document.getElementById("quota-progress-fill")) document.getElementById("quota-progress-fill").style.width = `${pct}%`;
        if(document.getElementById("quota-progress-fill-mobile")) document.getElementById("quota-progress-fill-mobile").style.width = `${pct}%`;
        if(document.getElementById("quota-used-text")) document.getElementById("quota-used-text").textContent = usedKB > 1024 ? `${(usedKB/1024).toFixed(1)} MB` : `${usedKB} KB`;
        if(document.getElementById("quota-used-text-mobile")) document.getElementById("quota-used-text-mobile").textContent = `${Math.round(pct)}%`;
        if(document.getElementById("quota-total-text")) document.getElementById("quota-total-text").textContent = currentLabel;
    }

    openFilePreview(fileId) {
        const file = this.files.find(f => f.file_id === fileId);
        if (!file) return;
        this.activePreviewFileId = fileId;
        const currentLang = document.documentElement.getAttribute("lang") || "en";

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

        const favBtn = document.getElementById("action-fav-btn");
        const favTxt = document.getElementById("txt-fav-btn");
        if (file.is_favorite) {
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
            const file = this.files.find(f => f.file_id === this.activePreviewFileId);
            if (file) this.toggleFavoriteCloud(file.file_id, file.is_favorite);
        };
        document.getElementById("action-download-btn").onclick = () => {
            if (!this.activePreviewFileId) return;
            const file = this.files.find(f => f.file_id === this.activePreviewFileId);
            if (file) {
                const link = document.createElement("a");
                link.href = file.data_base64;
                link.download = file.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        };
        document.getElementById("action-delete-btn").onclick = () => {
            if (!this.activePreviewFileId) return;
            const currentLang = document.documentElement.getAttribute("lang") || "en";
            if (confirm(currentLang === "ar" ? "هل أنت متأكد من حذف هذا الملف سحابياً؟" : "Delete this file from cloud permanently?")) {
                this.deleteFileCloud(this.activePreviewFileId);
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
            filtered = this.files.filter(f => f.is_favorite === true);
        }

        if (filtered.length === 0) {
            matrix.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; opacity:0.5; font-weight:bold; color:var(--text-color);">${currentLang === "ar" ? "لا توجد ملفات سحابية." : "No cloud files."}</div>`;
            return;
        }

        filtered.forEach(file => {
            const card = document.createElement("div");
            card.className = "file-card";
            card.style = "background: var(--card-bg, #fff); padding:15px; border-radius:18px; border:1px solid #eaeaea; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.02);";
            card.onclick = () => this.openFilePreview(file.file_id);

            let previewHTML = `<i class="fa-solid fa-file" style="font-size:3rem; color:#aaa;"></i>`;
            if (file.type.startsWith("image/")) {
                previewHTML = `<img src="${file.data_base64}" style="width:100%; height:120px; object-fit:contain; border-radius:12px; margin-bottom:10px;">`;
            } else if (file.type.startsWith("video/")) {
                previewHTML = `<div style="width:100%; height:120px; background:#f8f9fa; border-radius:12px; display:flex; align-items:center; justify-content:center; margin-bottom:10px;"><i class="fa-solid fa-video" style="font-size:2.5rem; color:var(--accent-color, #007bff);"></i></div>`;
            }

            card.innerHTML = `
                ${file.is_favorite ? `<div class="fav-badge"><i class="fa-solid fa-heart"></i></div>` : ''}
                ${previewHTML}
                <div style="font-weight:bold; font-size:0.9rem; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; margin-top:8px; color:var(--text-color);">${file.name}</div>
                <div style="font-size:0.8rem; opacity:0.6; margin-top:4px; color:var(--text-color);">${(file.size / 1024).toFixed(1)} KB</div>
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
                loader.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:100000; display:flex; flex-direction:column; justify-content:center; align-items:center; color:#fff; font-family:sans-serif;";
                loader.innerHTML = `<i class="fa-solid fa-cloud" class="fa-spin" style="font-size:3rem; color:#007bff; animation: fa-spin 2s linear infinite;"></i><p style="margin-top:15px; font-weight:bold;">جاري مزامنة ورفع البيانات سحابياً...</p>`;
                document.body.appendChild(loader);
            }
        } else if (loader) { loader.remove(); }
    }

    removeExistingOverlay() {
        const el = document.getElementById("nfc-auth-overlay");
        if (el) el.remove();
    }
}

window.StorageEngine = new CloudStorageEngine();
