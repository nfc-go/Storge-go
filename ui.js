/* ==========================================================================
   NebulaDrive / NFC GO - Fail-Safe UI Management Engine (Anti-Crash Version)
   ========================================================================== */

// لمنع أي خطأ في الملفات الأخرى من إيقاف كود الواجهة
window.addEventListener('error', function(e) {
    console.warn("NebulaDrive Shield caught an external script error safely:", e.message);
    e.preventDefault(); 
}, true);

document.addEventListener("DOMContentLoaded", () => {
    // خلق زراير وهمية في الخلفية لو الملفات القديمة بتدور عليها عشان المتصفح ما يعملش Crash
    createDummyElementsForLegacyScripts();

    // تشغيل الأزرار الفعلية الحالية
    initializeThemeEngine();
    initializeLanguageEngine();
    initializeNavigationSystem();
    initializeUploadPipeline();
});

/**
 * 1. حماية النظام من ملفات الجافا سكريبت القديمة
 * لو ملف app.js أو غيره بيدور على id قديم، بنعمله عنصر وهمي عشان الكود ما يقفش
 */
function createDummyElementsForLegacyScripts() {
    const legacyIds = [
        "nav-all-trigger", "nav-images-trigger", "nav-videos-trigger", 
        "nav-documents-trigger", "upgrade-tier-trigger", "preview-close-trigger",
        "preview-download-btn", "premium-close-trigger", "billing-submit-btn"
    ];
    
    legacyIds.forEach(id => {
        if (!document.getElementById(id)) {
            const dummy = document.createElement("div");
            dummy.id = id;
            dummy.style.display = "none";
            document.body.appendChild(dummy);
        }
    });
}

/**
 * 2. محرك التحكم بالـ Dark Mode & Light Mode
 */
function initializeThemeEngine() {
    const themeBtn = document.getElementById("theme-toggle-trigger");
    if (!themeBtn) return;

    const savedTheme = localStorage.getItem("app-theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(themeBtn, savedTheme);

    themeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const targetTheme = currentTheme === "dark" ? "light" : "dark";
        
        document.documentElement.setAttribute("data-theme", targetTheme);
        localStorage.setItem("app-theme", targetTheme);
        updateThemeIcon(themeBtn, targetTheme);
    });
}

function updateThemeIcon(btn, theme) {
    btn.innerHTML = theme === "light" ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
}

/**
 * 3. محرك تغيير اللغات
 */
function initializeLanguageEngine() {
    const langBtn = document.getElementById("lang-toggle-btn");
    if (!langBtn) return;

    langBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const currentDir = document.documentElement.getAttribute("dir") || "ltr";
        if (currentDir === "ltr") {
            document.documentElement.setAttribute("dir", "rtl");
            document.documentElement.setAttribute("lang", "ar");
            const txt = document.getElementById("txt-lang-toggle");
            if (txt) txt.textContent = "English";
        } else {
            document.documentElement.setAttribute("dir", "ltr");
            document.documentElement.setAttribute("lang", "en");
            const txt = document.getElementById("txt-lang-toggle");
            if (txt) txt.textContent = "العربية";
        }
    });
}

/**
 * 4. نظام التنقل والتبويب للموبايل والكمبيوتر
 */
function initializeNavigationSystem() {
    const desktopLinks = document.querySelectorAll(".sidebar-nav .nav-link");
    const mobileLinks = document.querySelectorAll(".mobile-bottom-nav .mobile-nav-link");
    const allLinks = [...desktopLinks, ...mobileLinks];

    allLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetHash = link.getAttribute("href");
            
            allLinks.forEach(l => l.classList.remove("active"));
            allLinks.forEach(l => {
                if (l.getAttribute("href") === targetHash) l.classList.add("active");
            });

            // تحفيز الكود القديم لو كان شغال بناء على الضغط
            const legacyIdMap = {
                "#all": "nav-all-trigger",
                "#images": "nav-images-trigger",
                "#videos": "nav-videos-trigger"
            };
            const legacyId = legacyIdMap[targetHash];
            if (legacyId && document.getElementById(legacyId)) {
                document.getElementById(legacyId).click();
            }

            // التوجيه الأساسي للنظام
            if (window.Router && typeof window.Router.navigate === "function") {
                window.Router.navigate(targetHash);
            } else if (typeof window.filterFilesView === "function") {
                window.filterFilesView(targetHash.replace("#", ""));
            }
        });
    });
}

/**
 * 5. نظام معالجة ورفع الملفات الذكي
 */
function initializeUploadPipeline() {
    const fileInput = document.getElementById("binary-file-injector");
    if (!fileInput) return;

    fileInput.addEventListener("change", (e) => {
        const selectedFiles = e.target.files;
        if (selectedFiles.length === 0) return;

        // تمرير الملفات للمحركات التخزينية في app.js أو storage.js بالتبادل لضمان العمل
        if (window.StorageEngine && typeof window.StorageEngine.handleUpload === "function") {
            window.StorageEngine.handleUpload(selectedFiles);
        } else if (typeof window.handleFileUploadProcess === "function") {
            window.handleFileUploadProcess(selectedFiles);
        } else {
            alert(`Selected ${selectedFiles.length} file(s) successfully.`);
        }
    });
}

/**
 * عداد المساحة الدايناميكي
 */
function updateApplicationQuota(usedBytes, totalBytes = 5242880) {
    const percentage = Math.min((usedBytes / totalBytes) * 100, 100).toFixed(1);
    
    const desktopFill = document.getElementById("quota-progress-fill");
    const desktopText = document.getElementById("quota-used-text");
    if (desktopFill) desktopFill.style.width = `${percentage}%`;
    if (desktopText) desktopText.textContent = `${(usedBytes / 1024).toFixed(1)} KB`;

    const mobileFill = document.getElementById("quota-progress-fill-mobile");
    const mobileText = document.getElementById("quota-used-text-mobile");
    if (mobileFill) mobileFill.style.width = `${percentage}%`;
    if (mobileText) mobileText.textContent = `${Math.round(percentage)}%`;
}
window.updateApplicationQuota = updateApplicationQuota;
