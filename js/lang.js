// =============================================================
// ===== مدیریت زبان با منوی کشویی =====
// =============================================================

// --- افزودن ترجمه‌ی چند برچسب جدید به دیکشنری زبان (بدون تغییر language.js) ---
(function () {
  var extra = {
    fa: {
      features_kicker: "امکانات مانگرو",
      features_title: "چرا مانگرو؟",
      gallery_kicker: "نمایش برنامه",
      video_kicker: "آموزش",
      download_kicker: "نصب اپلیکیشن",
      excel_kicker: "نسخه‌های اکسل",
      contact_kicker: "ارتباط با ما",
      nav_admin: "ورود مدیریت",
      excel_sub: "مجموعه نرم‌افزارهای حسابداری، انبار و فروش مانگرو بر پایه اکسل",
      hero_t1: "امن و مطمئن",
      hero_t2: "پشتیبانی کامل",
      hero_t3: "به‌روزرسانی رایگان",
      video_caption: "معرفی کوتاه اپلیکیشن مانگرو"
    },
    en: {
      features_kicker: "Mangro Features",
      features_title: "Why Mangro?",
      gallery_kicker: "App Preview",
      video_kicker: "Learning",
      download_kicker: "Get the App",
      excel_kicker: "Excel Editions",
      contact_kicker: "Get in Touch",
      nav_admin: "Admin Login",
      excel_sub: "Mangro accounting, warehouse & sales software built on Excel",
      hero_t1: "Safe & Secure",
      hero_t2: "Full Support",
      hero_t3: "Free Updates",
      video_caption: "A quick tour of the Mangro app"
    },
    ar: {
      features_kicker: "مميزات مانجرو",
      features_title: "لماذا مانجرو؟",
      gallery_kicker: "معاينة التطبيق",
      video_kicker: "التعليم",
      download_kicker: "تثبيت التطبيق",
      excel_kicker: "إصدارات إكسل",
      contact_kicker: "تواصل معنا",
      nav_admin: "دخول الإدارة",
      excel_sub: "برمجيات المحاسبة والمخازن والمبيعات من مانجرو المبنية على إكسل",
      hero_t1: "آمن وموثوق",
      hero_t2: "دعم كامل",
      hero_t3: "تحديثات مجانية",
      video_caption: "جولة سريعة في تطبيق مانجرو"
    }
  };
  try {
    if (typeof langData !== "undefined") {
      ["fa", "en", "ar"].forEach(function (l) {
        if (langData[l]) {
          for (var k in extra[l]) langData[l][k] = extra[l][k];
        }
      });
    }
  } catch (e) {}
})();

// --- وقتی زبان «فارسی» است، متن‌های ویرایش‌شده در پنل (data-cms) حفظ می‌شوند؛
//     در انگلیسی/عربی ترجمه‌ی زبان اعمال می‌شود. ---
(function () {
  if (typeof window.updateTexts !== "function") return;
  var orig = window.updateTexts;
  window.updateTexts = function (lang) {
    var cache = [];
    if (lang === "fa") {
      document.querySelectorAll("[data-cms]").forEach(function (el) {
        cache.push({ el: el, html: el.innerHTML });
      });
      document.querySelectorAll("[data-cms-ph]").forEach(function (el) {
        cache.push({ el: el, ph: el.getAttribute("placeholder") });
      });
    }
    orig(lang);
    if (lang === "fa") {
      cache.forEach(function (c) {
        if (c.html !== undefined) c.el.innerHTML = c.html;
        if (c.ph !== undefined) c.el.setAttribute("placeholder", c.ph);
      });
    }
  };
})();

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

// --- پس از رندر شدن محتوای داده‌محور (cms.js) زبان جاری دوباره اعمال شود
//     تا با برگشت از پنل مدیریت، زبان انگلیسی/عربی به فارسی برنگردد. ---
(function () {
  function reapply() {
    try {
      var lang = (window.getCurrentLanguage && window.getCurrentLanguage()) || localStorage.getItem("lang") || "fa";
      if (lang !== "fa" && typeof window.updateTexts === "function") {
        window.updateTexts(lang);
      }
    } catch (e) {}
  }
  window.addEventListener("mangro:content-ready", reapply);
  window.addEventListener("pageshow", reapply);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) reapply();
  });
})();


// --- پاک‌سازی خودکار ایموجی از تیترها (حتی اگر نسخه‌ی کش‌شده یا
//     محتوای ذخیره‌شده در پنل هنوز ایموجی داشته باشد) ---
(function () {
  var EMOJI = /[\u2190-\u21FF\u2300-\u27BF\u2B00-\u2BFF\uFE0F\u200D]|[\uD83C-\uDBFF][\uDC00-\uDFFF]/g;
  function clean(el) {
    if (!el) return;
    var before = el.innerHTML;
    var after = before.replace(EMOJI, "").replace(/^\s+|\s+$/g, "").replace(/\s{2,}/g, " ");
    if (after !== before) el.innerHTML = after;
  }
  function stripTitles() {
    document.querySelectorAll(
      ".section-title-grad, .section-head h1, .section-head h2, .section-head h3, .section-title, .features-section .section-title"
    ).forEach(clean);
  }
  window.MangroStripTitleEmoji = stripTitles;

  // بعد از هر تغییر زبان
  if (typeof window.updateTexts === "function") {
    var orig = window.updateTexts;
    window.updateTexts = function (lang) {
      orig(lang);
      stripTitles();
    };
  }
  window.addEventListener("mangro:content-ready", stripTitles);
  window.addEventListener("pageshow", stripTitles);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", stripTitles);
  } else {
    stripTitles();
  }
  setTimeout(stripTitles, 300);
  setTimeout(stripTitles, 1200);
})();
