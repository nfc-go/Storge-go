/* ==========================================================================
   NebulaDrive / NFC GO - Absolute Fail-Safe Navigation & Theme Engine
   ========================================================================== */

// حقن عناصر وهمية فوراً لحماية النظام من الملفات القديمة التي تسبب توقف المتصفح
(function injectGuards() {
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
            document.documentElement.appendChild(dummy);
        }
    });
})();

// حماية حية من أخطاء الملفات الأخرى
window.addEventListener('error', function(e) {
    console.log("Nebula Shield caught external break:", e.message);
    e.preventDefault();
}, true);

// تشغيل الأحداث بمجرد جاهزية الـ DOM
document.addEventListener("DOMContentLoaded", () => {
    bindThemeControl();
    bindLanguageControl();
    bindNavigationControl();
    bindUploadControl();
});

function bindThemeControl() {
    const btn = document.getElementById("theme-toggle-trigger");
    if (!btn) return;
    
    const savedTheme = localStorage.getItem("app-theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    btn.innerHTML = savedTheme === "light" ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';

    btn.onclick = function(e) {
        e.preventDefault();
        const current = document.documentElement.getAttribute("data-theme");
        const target = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", target);
        localStorage.setItem("app-theme", target);
        btn.innerHTML = target === "light" ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    };
}

function bindLanguageControl() {
    const btn = document.getElementById("lang-toggle-btn");
    if (!btn) return;

    btn.onclick = function(e) {
        e.preventDefault();
        const dir = document.documentElement.getAttribute("dir") || "ltr";
        if (dir === "ltr") {
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
    };
}

function bindNavigationControl() {
    // التقاط الروابط العلوية والسفلية الجديدة للموبايل والكمبيوتر
    const links = document.querySelectorAll(".sidebar-nav .nav-link, .mobile-bottom-nav .mobile-nav-link");
    
    links.forEach(link => {
        link.onclick = function(e) {
            e.preventDefault();
            const href = link.getAttribute("href");
            
            // إزالة وتفعيل النمط النشط نشط
            links.forEach(l => l.classList.remove("active"));
            links.forEach(l => {
                if (l.getAttribute("href") === href) l.classList.add("active");
            });

            // تمرير الأكشن للكود القديم إذا كان يبحث عنه
            const legacyMap = { "#all": "nav-all-trigger", "#images": "nav-images-trigger", "#videos": "nav-videos-trigger" };
            const legacyId = legacyMap[href];
            if (legacyId && document.getElementById(legacyId)) {
                try { document.getElementById(legacyId).click(); } catch(err){}
            }

            // تشغيل الراوتر إن وجد
            if (window.Router && typeof window.Router.navigate === "function") {
                window.Router.navigate(href);
            } else if (typeof window.filterFilesView === "function") {
                window.filterFilesView(href.replace("#", ""));
            }
        };
    });
}

function bindUploadControl() {
    const input = document.getElementById("binary-file-injector");
    if (!input) return;

    input.onchange = function(e) {
        const files = e.target.files;
        if (files.length === 0) return;

        if (window.StorageEngine && typeof window.StorageEngine.handleUpload === "function") {
            window.StorageEngine.handleUpload(files);
        } else if (typeof window.handleFileUploadProcess === "function") {
            window.handleFileUploadProcess(files);
        } else {
            alert(`Selected ${files.length} file(s) successfully!`);
        }
    };
}

function updateApplicationQuota(usedBytes, totalBytes = 5242880) {
    const percentage = Math.min((usedBytes / totalBytes) * 100, 100).toFixed(1);
    const dFill = document.getElementById("quota-progress-fill");
    const dText = document.getElementById("quota-used-text");
    if (dFill) dFill.style.width = `${percentage}%`;
    if (dText) dText.textContent = `${(usedBytes / 1024).toFixed(1)} KB`;

    const mFill = document.getElementById("quota-progress-fill-mobile");
    const mText = document.getElementById("quota-used-text-mobile");
    if (mFill) mFill.style.width = `${percentage}%`;
    if (mText) mText.textContent = `${Math.round(percentage)}%`;
}
window.updateApplicationQuota = updateApplicationQuota;
