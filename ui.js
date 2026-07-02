/* ==========================================================================
   NebulaDrive / NFC GO - UI Management & Event Pipeline Engine
   Features: Unified Desktop & Mobile Event Listeners, Dynamic Theme & Language Toggles
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initializeThemeEngine();
    initializeLanguageEngine();
    initializeNavigationSystem();
    initializeUploadPipeline();
});

/**
 * 1. محرك التحكم بالـ Dark Mode & Light Mode
 */
function initializeThemeEngine() {
    const themeBtn = document.getElementById("theme-toggle-trigger");
    if (!themeBtn) return;

    // قراءة الثيم المحفوظ أو تعيين Light كافتراضي بناءً على طلبك
    const savedTheme = localStorage.getItem("app-theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(themeBtn, savedTheme);

    themeBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const targetTheme = currentTheme === "dark" ? "light" : "dark";
        
        document.documentElement.setAttribute("data-theme", targetTheme);
        localStorage.setItem("app-theme", targetTheme);
        updateThemeIcon(themeBtn, targetTheme);
    });
}

function updateThemeIcon(btn, theme) {
    if (theme === "light") {
        btn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else {
        btn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
}

/**
 * 2. محرك تغيير اللغات (العربية / الإنجليزية)
 */
function initializeLanguageEngine() {
    const langBtn = document.getElementById("lang-toggle-btn");
    if (!langBtn) return;

    langBtn.addEventListener("click", () => {
        const currentDir = document.documentElement.getAttribute("dir") || "ltr";
        if (currentDir === "ltr") {
            document.documentElement.setAttribute("dir", "rtl");
            document.documentElement.setAttribute("lang", "ar");
            document.getElementById("txt-lang-toggle").textContent = "English";
            // هنا تقدر تضيف تغيير نصوص الواجهة للعربية لو حابب
        } else {
            document.documentElement.setAttribute("dir", "ltr");
            document.documentElement.setAttribute("lang", "en");
            document.getElementById("txt-lang-toggle").textContent = "العربية";
        }
    });
}

/**
 * 3. نظام التنقل والتبويب الموحد (للكمبيوتر والموبايل معاً)
 */
function initializeNavigationSystem() {
    // جلب روابط الكمبيوتر وروابط الموبايل السفلية
    const desktopLinks = document.querySelectorAll(".sidebar-nav .nav-link");
    const mobileLinks = document.querySelectorAll(".mobile-bottom-nav .mobile-nav-link");
    const allLinks = [...desktopLinks, ...mobileLinks];

    allLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            // منع السلوك الافتراضي لروابط الهاش مؤقتاً لتمرير الفلترة
            const targetHash = link.getAttribute("href");
            
            // إزالة الحالة النشطة (Active) من كل الزراير في الكمبيوتر والموبايل
            allLinks.forEach(l => l.classList.remove("active"));
            
            // تفعيل الزرار اللي اضغط عليه والزرار التوأم له
            allLinks.forEach(l => {
                if (l.getAttribute("href") === targetHash) {
                    l.classList.add("active");
                }
            });

            // استدعاء نظام الفلترة الخاص بك (لو متوفر في الـ Router أو الـ Storage)
            if (window.Router && typeof window.Router.navigate === "function") {
                window.Router.navigate(targetHash);
            } else if (typeof window.filterFilesView === "function") {
                window.filterFilesView(targetHash.replace("#", ""));
            }
        });
    });
}

/**
 * 4. نظام معالجة ورفع الملفات الذكي
 */
function initializeUploadPipeline() {
    const fileInput = document.getElementById("binary-file-injector");
    if (!fileInput) return;

    // مراقبة اختيار الملفات الفعلي
    fileInput.addEventListener("change", (e) => {
        const selectedFiles = e.target.files;
        if (selectedFiles.length === 0) return;

        console.log(`${selectedFiles.length} file(s) selected for secure injection.`);

        // تمرير الملفات المرفوعة إلى كود المعالجة والتشفير الأساسي بتاعك (app.js أو storage.js)
        if (window.StorageEngine && typeof window.StorageEngine.handleUpload === "function") {
            window.StorageEngine.handleUpload(selectedFiles);
        } else if (typeof window.handleFileUploadProcess === "function") {
            window.handleFileUploadProcess(selectedFiles);
        } else {
            // كود افتراضي احتياطي لتأكيد القراءة الفورية
            alert(`تم اختيار ${selectedFiles.length} ملف بنجاح وجاري ربطهم بالمساحة التخزينية المفرزة!`);
        }
    });
}

/**
 * وظيفة تحديث العداد (Quota) دايناميكياً من خلال الأكواد الأخرى
 */
function updateApplicationQuota(usedBytes, totalBytes = 5242880) {
    const percentage = Math.min((usedBytes / totalBytes) * 100, 100).toFixed(1);
    
    // تحديث عداد الكمبيوتر
    const desktopFill = document.getElementById("quota-progress-fill");
    const desktopText = document.getElementById("quota-used-text");
    if (desktopFill) desktopFill.style.width = `${percentage}%`;
    if (desktopText) desktopText.textContent = `${(usedBytes / 1024).toFixed(1)} KB`;

    // تحديث عداد الموبايل العلوي الشيك (الموجود بالصورة)
    const mobileFill = document.getElementById("quota-progress-fill-mobile");
    const mobileText = document.getElementById("quota-used-text-mobile");
    if (mobileFill) mobileFill.style.width = `${percentage}%`;
    if (mobileText) mobileText.textContent = `${Math.round(percentage)}%`;
}

// تصدير الوظيفة لتكون عامة للنظام
window.updateApplicationQuota = updateApplicationQuota;
