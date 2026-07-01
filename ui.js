/**
 * NebulaDrive Master Client Dashboard Interface Rendering Engine
 * Architecture: Reactive State Observer & Language Translation Maps
 */

class DashboardUI {
    constructor() {
        this.currentViewFilter = "all";
        this.activeLocaleCode = "en";

        this.translationDictionary = {
            en: {
                brandName: "NebulaDrive", uploadBtn: "Upload New", navAll: "All Files", navPhotos: "Photos", navDocs: "Documents", navFavorites: "Favorites", navTrash: "Trash",
                quotaTitle: "Storage Space", quotaSuffix: "of 5 MB used", quotaSuffixPro: "of 500 MB used", upgradeBtn: "Upgrade Storage", searchPlaceholder: "Search secure files...",
                emptyTitle: "Your sandbox is empty", emptyDesc: "Upload files to encrypt them in your browser.", billingTitle: "Upgrade to Nebula Pro", billingBtn: "Activate Subscription"
            },
            ar: {
                brandName: "سديم درايف", uploadBtn: "رفع ملف جديد", navAll: "جميع الملفات", navPhotos: "الصور الرقمية", navDocs: "المستندات والوثائق", navFavorites: "المفضلة الآمنة", navTrash: "سلة المهملات",
                quotaTitle: "المساحة التخزينية", quotaSuffix: "من أصل 5 ميجابايت مستخدمة", quotaSuffixPro: "من أصل 500 ميجابايت مستخدمة", upgradeBtn: "ترقية الحساب", searchPlaceholder: "البحث في الملفات المشفرة...",
                emptyTitle: "مجلد الحاوية فارغ حالياً", emptyDesc: "قم برفع وتحميل ملفاتك لتشفيرها وحفظها تماماً.", billingTitle: "الترقية إلى الباقة الاحترافية", billingBtn: "تفعيل الاشتراك السريع"
            }
        };

        this.explorerGrid = document.getElementById("file-explorer-grid");
        this.emptyStateBlock = document.getElementById("explorer-empty-state");
        this.searchField = document.getElementById("dashboard-search");
        this.sortStrategySelect = document.getElementById("sort-strategy-select");
        this.langToggleBtn = document.getElementById("lang-toggle-btn");
        this.langToggleTxt = document.getElementById("txt-lang-toggle");
        this.quotaFillBar = document.getElementById("quota-progress-fill");
        this.quotaUsedTxt = document.getElementById("quota-used-text");
        this.quotaTotalTxt = document.getElementById("quota-total-text");
        this.btnUpgradeStorage = document.getElementById("sidebar-upgrade-btn");
        this.globalModalLayer = document.getElementById("modal-global-container-layer");
        this.billingContainer = document.getElementById("modal-billing-subscription-container");
        this.billingForm = document.getElementById("billing-checkout-form");
        this.btnCancelBilling = document.getElementById("btn-cancel-billing");
        this.btnCloseBillingHeader = document.getElementById("btn-close-billing");
        this.billingErrorBanner = document.getElementById("billing-error-feedback");
        this.layoutGridBtn = document.getElementById("layout-grid-btn");
        this.layoutListBtn = document.getElementById("layout-list-btn");

        this.syncPresentationLayer = this.syncPresentationLayer.bind(this);
        this.toggleLanguage = this.toggleLanguage.bind(this);
        this.handleNavigationClick = this.handleNavigationClick.bind(this);
        this.executeSearch = this.executeSearch.bind(this);
        this.submitBilling = this.submitBilling.bind(this);
    }

    initialize() {
        window.addEventListener("nebula:storageUpdated", this.syncPresentationLayer);
        window.addEventListener("nebula:authSuccess", this.syncPresentationLayer);

        document.querySelectorAll(".nav-link").forEach(link => link.addEventListener("click", this.handleNavigationClick));
        if (this.searchField) this.searchField.addEventListener("input", this.executeSearch);
        if (this.sortStrategySelect) this.sortStrategySelect.addEventListener("change", this.syncPresentationLayer);
        if (this.langToggleBtn) this.langToggleBtn.addEventListener("click", this.toggleLanguage);

        if (this.layoutGridBtn) this.layoutGridBtn.addEventListener("click", () => { this.layoutGridBtn.classList.add("active"); this.layoutListBtn.classList.remove("active"); this.explorerGrid.className = "explorer-grid view-mode-grid"; });
        if (this.layoutListBtn) this.layoutListBtn.addEventListener("click", () => { this.layoutListBtn.classList.add("active"); this.layoutGridBtn.classList.remove("active"); this.explorerGrid.className = "explorer-grid view-mode-list"; });

        if (this.btnUpgradeStorage) this.btnUpgradeStorage.addEventListener("click", () => { this.globalModalLayer.classList.remove("hidden"); this.billingContainer.classList.remove("hidden"); this.billingErrorBanner.classList.add("hidden"); });
        const closeBilling = () => { this.billingContainer.classList.add("hidden"); this.globalModalLayer.classList.add("hidden"); };
        if (this.btnCancelBilling) this.btnCancelBilling.addEventListener("click", closeBilling);
        if (this.btnCloseBillingHeader) this.btnCloseBillingHeader.addEventListener("click", closeBilling);
        if (this.billingForm) this.billingForm.addEventListener("submit", this.submitBilling);
    }

    handleNavigationClick(e) {
        e.preventDefault();
        document.querySelectorAll(".nav-link").forEach(n => n.classList.remove("active"));
        e.currentTarget.classList.add("active");
        this.currentViewFilter = e.currentTarget.getAttribute("data-filter") || "all";
        this.syncPresentationLayer();
    }

    executeSearch() {
        const term = (this.searchField ? this.searchField.value : "").toLowerCase().trim();
        const cards = document.querySelectorAll(".file-card-node");
        let visibleCount = 0;

        cards.forEach(card => {
            const name = (card.getAttribute("data-filename") || "").toLowerCase();
            if (name.includes(term)) { card.classList.remove("hidden"); visibleCount++; } else { card.classList.add("hidden"); }
        });

        if (this.emptyStateBlock) {
            if (visibleCount === 0 && cards.length > 0) this.emptyStateBlock.classList.remove("hidden");
            else if (cards.length === 0) this.emptyStateBlock.classList.remove("hidden");
            else this.emptyStateBlock.classList.add("hidden");
        }
    }

    submitBilling(e) {
        if (e) e.preventDefault();
        if (typeof globalStorageEngine !== "undefined") {
            globalStorageEngine.setSubscriptionTier("Pro");
            if (this.billingForm) this.billingForm.reset();
            this.billingContainer.classList.add("hidden");
            this.globalModalLayer.classList.add("hidden");
        }
    }

    toggleLanguage() {
        this.activeLocaleCode = (this.activeLocaleCode === "en") ? "ar" : "en";
        const locale = this.translationDictionary[this.activeLocaleCode];

        document.documentElement.setAttribute("dir", this.activeLocaleCode === "ar" ? "rtl" : "ltr");
        document.documentElement.setAttribute("lang", this.activeLocaleCode);
        if (this.langToggleTxt) this.langToggleTxt.textContent = this.activeLocaleCode === "ar" ? "English" : "العربية";

        document.getElementById("txt-brand-name").textContent = locale.brandName;
        document.getElementById("txt-upload-btn").textContent = locale.uploadBtn;
        document.getElementById("txt-nav-all").textContent = locale.navAll;
        document.getElementById("txt-nav-photos").textContent = locale.navPhotos;
        document.getElementById("txt-nav-docs").textContent = locale.navDocs;
        document.getElementById("txt-nav-favorites").textContent = locale.navFavorites;
        document.getElementById("txt-nav-trash").textContent = locale.navTrash;
        document.getElementById("txt-quota-title").textContent = locale.quotaTitle;
        document.getElementById("txt-upgrade-btn").textContent = locale.upgradeBtn;
        document.getElementById("txt-empty-title").textContent = locale.emptyTitle;
        document.getElementById("txt-empty-desc").textContent = locale.emptyDesc;
        document.getElementById("modal-billing-title").textContent = locale.billingTitle;
        document.getElementById("txt-billing-btn-label").textContent = locale.billingBtn;

        if (this.searchField) this.searchField.setAttribute("placeholder", locale.searchPlaceholder);
        this.syncPresentationLayer();
    }

    syncPresentationLayer() {
        if (typeof globalStorageEngine === "undefined") return;
        let dataset = globalStorageEngine.getFiles(this.currentViewFilter);
        const rule = this.sortStrategySelect ? this.sortStrategySelect.value : "name-asc";

        dataset.sort((a, b) => {
            switch (rule) {
                case "name-asc": return (a.name || "").localeCompare(b.name || "");
                case "name-desc": return (b.name || "").localeCompare(a.name || "");
                case "date-desc": return new Date(b.uploadDate) - new Date(a.uploadDate);
                case "date-asc": return new Date(a.uploadDate) - new Date(b.uploadDate);
                default: return 0;
            }
        });

        if (this.explorerGrid) {
            this.explorerGrid.querySelectorAll(".file-card-node").forEach(n => n.remove());
        }

        if (dataset.length === 0) {
            if (this.emptyStateBlock) this.emptyStateBlock.classList.remove("hidden");
        } else {
            if (this.emptyStateBlock) this.emptyStateBlock.classList.add("hidden");
            dataset.forEach(item => this.explorerGrid.appendChild(this.compileCard(item)));
        }

        this.refreshQuota();
        this.executeSearch();
    }

    compileCard(fileItem) {
        const card = document.createElement("div");
        card.className = "file-card-node";
        card.setAttribute("data-fileid", fileItem.id);
        card.setAttribute("data-filename", fileItem.name);

        let icon = "fa-solid fa-file-shield";
        if (fileItem.type.startsWith("image/")) icon = "fa-solid fa-file-image";
        else if (fileItem.type.startsWith("video/")) icon = "fa-solid fa-file-video";
        else if (fileItem.type.startsWith("audio/")) icon = "fa-solid fa-file-audio";

        card.innerHTML = `
            <div style="font-size: 2.2rem; margin-bottom: 12px; color: #5865f2; display: flex; align-items: center; justify-content: space-between;">
                <i class="${icon}"></i>
                <div style="display: flex; gap: 8px;">
                    <button type="button" class="fav-trigger" style="background:none; border:none; color:${fileItem.isFavorite ? '#f1c40f' : '#8a94a6'}; cursor:pointer; font-size:1rem;"><i class="${fileItem.isFavorite ? 'fa-solid' : 'fa-regular'} fa-star"></i></button>
                    <button type="button" class="delete-trigger" style="background:none; border:none; color:#ed4245; cursor:pointer; font-size:1rem;"><i class="fa-solid ${fileItem.isDeleted ? 'fa-trash-arrow-up' : 'fa-trash-can'}"></i></button>
                </div>
            </div>
            <div class="card-meta-click-target" style="cursor: pointer; flex-grow: 1;">
                <h4 style="font-size: 0.95rem; font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; margin-bottom: 4px;">${fileItem.name}</h4>
                <span style="font-size: 0.8rem; color: #8a94a6;">${parseFloat((fileItem.size / 1024).toFixed(2))} KB</span>
            </div>
        `;

        card.querySelector(".card-meta-click-target").addEventListener("click", () => {
            if (typeof globalMediaViewer !== "undefined") globalMediaViewer.launchViewer(fileItem);
        });

        card.querySelector(".fav-trigger").addEventListener("click", (e) => { e.stopPropagation(); globalStorageEngine.updateFileMetadata(fileItem.id, { isFavorite: !fileItem.isFavorite }); });
        card.querySelector(".delete-trigger").addEventListener("click", (e) => { e.stopPropagation(); if (fileItem.isDeleted) { globalStorageEngine.purgeFilePermanently(fileItem.id); } else { globalStorageEngine.updateFileMetadata(fileItem.id, { isDeleted: true }); } });

        return card;
    }

        refreshQuota() {
        if (typeof globalStorageEngine === "undefined") return;
        const state = globalStorageEngine._state;
        const totalBytes = (state.tier === "Pro") ? 500 * 1024 * 1024 : 5 * 1024 * 1024;
        
        let usedBytes = 0;
        state.files.forEach(f => usedBytes += Number(f.size || 0));

        if (this.quotaUsedTxt) this.quotaUsedTxt.textContent = parseFloat((usedBytes / 1024).toFixed(2)) + " KB";
        if (this.quotaTotalTxt) this.quotaTotalTxt.textContent = state.tier === "Pro" ? this.translationDictionary[this.activeLocaleCode].quotaSuffixPro : this.translationDictionary[this.activeLocaleCode].quotaSuffix;

        let pct = (usedBytes / totalBytes) * 100;
        if (this.quotaFillBar) {
            this.quotaFillBar.style.width = `${Math.min(pct, 100)}%`;
            this.quotaFillBar.style.backgroundColor = pct > 85 ? "#ed4245" : "#5865f2";
        }
        if (state.tier === "Pro" && this.btnUpgradeStorage) this.btnUpgradeStorage.style.display = "none";

        // ======= السطرين بتوع الموبايل اللي ضفناهم هنا في آخر الدالة =======
        const mobileFill = document.getElementById("quota-progress-fill-mobile");
        const mobileTxt = document.getElementById("quota-used-text-mobile");
        if (mobileFill) mobileFill.style.width = `${Math.min(pct, 100)}%`;
        if (mobileTxt) mobileTxt.textContent = Math.round(pct) + "%";
    }
