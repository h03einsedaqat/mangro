// =============================================================
// ===== مدیریت زبان با منوی کشویی =====
// =============================================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ---- باز و بسته کردن منوی کشویی ----
    var dropdownBtn = document.getElementById('langDropdownBtn');
    var dropdownMenu = document.getElementById('langDropdownMenu');

    if (dropdownBtn && dropdownMenu) {
        dropdownBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('open');
            dropdownMenu.classList.toggle('open');
        });

        // بستن منو با کلیک خارج از آن
        document.addEventListener('click', function() {
            dropdownBtn.classList.remove('open');
            dropdownMenu.classList.remove('open');
        });

        // جلوگیری از بسته شدن منو هنگام کلیک روی خود منو
        dropdownMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // ---- انتخاب زبان از منو ----
    var langItems = document.querySelectorAll('.lang-dropdown-menu li');
    langItems.forEach(function(item) {
        item.addEventListener('click', function() {
            var lang = this.getAttribute('data-lang');
            if (lang) {
                window.loadLanguage(lang);
                // بستن منو
                if (dropdownBtn) dropdownBtn.classList.remove('open');
                if (dropdownMenu) dropdownMenu.classList.remove('open');
                // به‌روزرسانی کلاس active
                langItems.forEach(function(li) {
                    li.classList.remove('active');
                });
                this.classList.add('active');
                // به‌روزرسانی برچسب دکمه
                var label = document.getElementById('currentLangLabel');
                if (label) {
                    label.textContent = this.textContent.trim();
                }
            }
        });
    });
});

// ===== توابع اصلی مدیریت زبان (با پشتیبانی از dropdown) =====

window.toggleLanguage = function(lang) {
    if (typeof langData === "undefined") {
        console.warn("فایل language.js بارگذاری نشده است.");
        return;
    }
    var currentLang = localStorage.getItem("lang") || "fa";
    var newLang = lang || (currentLang === "fa" ? "en" : "fa");
    window.loadLanguage(newLang);
};

if (typeof langData !== "undefined") {
    window.updateTexts = function(lang) {
        document.querySelectorAll("[data-lang]").forEach(function(el) {
            var key = el.getAttribute("data-lang");
            if (langData[lang] && langData[lang][key] !== undefined) {
                el.innerHTML = langData[lang][key];
            }
        });
        document.querySelectorAll("[data-lang-placeholder]").forEach(function(el) {
            var key = el.getAttribute("data-lang-placeholder");
            if (langData[lang] && langData[lang][key] !== undefined) {
                el.placeholder = langData[lang][key];
            }
        });

        // به‌روزرسانی برچسب دکمه dropdown
        var label = document.getElementById('currentLangLabel');
        if (label) {
            var activeItem = document.querySelector('.lang-dropdown-menu li.active');
            if (activeItem) {
                label.textContent = activeItem.textContent.trim();
            } else {
                // اگر هیچ آیتم active نبود، بر اساس زبان تنظیم کن
                var langNames = { fa: 'فارسی', en: 'English', ar: 'العربية' };
                label.textContent = langNames[lang] || 'فارسی';
            }
        }

        // به‌روزرسانی کلاس active در منو
        document.querySelectorAll('.lang-dropdown-menu li').forEach(function(li) {
            li.classList.toggle('active', li.getAttribute('data-lang') === lang);
        });

        var pageTitleEl = document.getElementById('pageTitle');
        if (pageTitleEl) {
            var titleKey = pageTitleEl.getAttribute("data-lang");
            if (titleKey && langData[lang] && langData[lang][titleKey] !== undefined) {
                document.title = langData[lang][titleKey];
            }
        }
        var body = document.body;
        if (lang === "en" || lang === "ar") {
            body.classList.add("lang-en");
        } else {
            body.classList.remove("lang-en");
        }
        document.documentElement.dir = "rtl";
        document.documentElement.lang = lang;
    };

    window.getCurrentLanguage = function() {
        return localStorage.getItem("lang") || "fa";
    };

    window.loadLanguage = function(lang) {
        localStorage.setItem("lang", lang);
        window.updateTexts(lang);
        // به‌روزرسانی کلاس active در منو (دوباره برای اطمینان)
        document.querySelectorAll('.lang-dropdown-menu li').forEach(function(li) {
            li.classList.toggle('active', li.getAttribute('data-lang') === lang);
        });
        // به‌روزرسانی برچسب دکمه
        var label = document.getElementById('currentLangLabel');
        if (label) {
            var activeItem = document.querySelector('.lang-dropdown-menu li.active');
            if (activeItem) {
                label.textContent = activeItem.textContent.trim();
            }
        }
    };

    // بارگذاری اولیه
    var savedLang = window.getCurrentLanguage();
    window.loadLanguage(savedLang);

} else {
    console.warn("فایل language.js بارگذاری نشده است.");
}