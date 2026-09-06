/* ============================================================
   js/cms.js — لودر محتوای داده‌محور سایت
   - تصاویر گالری صفحه اصلی (قابل مدیریت در پنل ادمین)
   - مقادیر تماس (شماره / ایمیل / آدرس)
   - صفحه آموزش (ویدیوها و دوره‌ها)
   محتوای متنی/چندزبانه‌ی صفحه اصلی توسط language.js (data-lang)
   مدیریت می‌شود تا ترجمه فارسی/انگلیسی/عربی برقرار بماند.
   نسخه‌ی ذخیره‌شده در پنل ادمین (localStorage) بر پیش‌فرض مقدم است.
   ============================================================ */
(function () {
  "use strict";

  var STORE_KEY = "mangro_content_v2";
  var base = /\/page\//.test(location.pathname) || /\/admin\//.test(location.pathname) ? "../" : "./";

  window.MangroStore = {
    key: STORE_KEY,
    get: function () {
      try { return JSON.parse(localStorage.getItem(STORE_KEY) || "null"); }
      catch (e) { return null; }
    },
    set: function (data) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); return true; }
      catch (e) { return false; }
    },
    clear: function () { localStorage.removeItem(STORE_KEY); }
  };

  function getByPath(obj, path) {
    if (!obj) return undefined;
    var parts = String(path).split(".");
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  window.AparatEmbed = function (url) {
    if (!url) return "";
    url = url.trim();
    if (url.indexOf("/video/video/embed/") !== -1) return url;
    var m = url.match(/aparat\.com\/v\/([A-Za-z0-9]+)/i);
    if (m) return "https://www.aparat.com/video/video/embed/videohash/" + m[1] + "/vt/frame?titleShow=true";
    m = url.match(/aparat\.com\/video\/v\/([A-Za-z0-9]+)/i);
    if (m) return "https://www.aparat.com/video/video/embed/videohash/" + m[1] + "/vt/frame?titleShow=true";
    return url;
  };

  var DATA = null;
  var loadedDefault = null;

  function deepMerge(b, o) {
    if (o === null || typeof o !== "object" || Array.isArray(o)) return o;
    if (b === null || typeof b !== "object" || Array.isArray(b)) return o;
    var out = {};
    Object.keys(b).forEach(function (k) { out[k] = b[k]; });
    Object.keys(o).forEach(function (k) { out[k] = deepMerge(b[k], o[k]); });
    return out;
  }

  function render() {
    if (!DATA) return;

    // سال جاری فوتر
    document.querySelectorAll(".year").forEach(function (y) { y.textContent = new Date().getFullYear(); });

    // مقادیر ساده‌ی data-cms (مثل عناوین و مقادیر تماس)
    document.querySelectorAll("[data-cms]").forEach(function (el) {
      var v = getByPath(DATA, el.getAttribute("data-cms"));
      if (v === undefined || v === null) return;
      el.innerHTML = v;
    });

    // ویژگی‌ها مثل  data-cms-attr="href:home.heroBtnUrl"  (چند مورد با ; جدا)
    document.querySelectorAll("[data-cms-attr]").forEach(function (el) {
      var pairs = el.getAttribute("data-cms-attr").split(";");
      pairs.forEach(function (pair) {
        var parts = pair.split(":");
        if (parts.length < 2) return;
        var attr = parts.shift().trim();
        var v = getByPath(DATA, parts.join(":").trim());
        if (v !== undefined && v !== null && v !== "") el.setAttribute(attr, v);
      });
    });

    // placeholderها  data-cms-ph="home.fNamePh"
    document.querySelectorAll("[data-cms-ph]").forEach(function (el) {
      var v = getByPath(DATA, el.getAttribute("data-cms-ph"));
      if (v === undefined || v === null) return;
      el.setAttribute("placeholder", v);
    });

    var h = DATA.home || {};

    // گالری (اسلایدها) — تصاویر فقط
    var galWrap = document.getElementById("gallerySlides");
    if (galWrap && h.gallery) {
      galWrap.innerHTML = (h.gallery || [])
        .map(function (img, i) {
          var raw = img.src || "";
          var src = /^(data:|https?:|\/)/i.test(raw) ? raw : (base || "") + raw;
          return (
            '<div class="swiper-slide" data-image="' + src + '">' +
            '<img src="' + src + '" alt="' + ((img.alt || "گالری مانگرو") + " " + (i + 1)) + '" ' +
            (i < 2 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"') + ' decoding="async" />' +
            "</div>"
          );
        })
        .join("");
    }

    var l = DATA.learning || {};

    // ویدیوهای آموزشی
    var vGrid = document.getElementById("videoGrid");
    if (vGrid && l.videos) {
      vGrid.innerHTML = (l.videos || [])
        .map(function (v, i) {
          var media;
          if ((v.type || "") === "file" || /\.(mp4|webm|ogg)$/i.test(v.src || "")) {
            media = '<div class="video-wrapper"><video controls preload="metadata"' +
              (v.poster ? ' poster="' + (base || "") + v.poster + '"' : "") +
              '><source src="' + (base || "") + v.src + '" type="video/mp4" />' +
              "مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.</video></div>";
          } else {
            media = '<div class="video-wrapper"><iframe src="' + window.AparatEmbed(v.src || v.url || "") +
              '" allowfullscreen loading="lazy"></iframe></div>';
          }
          return (
            '<div class="video-card">' + media +
            '<div class="video-info">' +
            (v.badge ? '<span class="badge">' + v.badge + "</span>" : "") +
            "<h3>" + (v.title || "") + "</h3>" +
            (v.desc ? "<p>" + v.desc + "</p>" : "") +
            '<div class="meta">' +
            (v.dur ? '<span class="meta-item"><i class="fas fa-clock"></i> ' + v.dur + "</span>" : "") +
            (v.views ? '<span class="meta-item"><i class="fas fa-eye"></i> ' + v.views + "</span>" : "") +
            "</div></div></div>"
          );
        })
        .join("");
    }

    // دوره‌ها
    var cList = document.getElementById("coursesList");
    if (cList && l.courses) {
      cList.innerHTML = (l.courses || [])
        .map(function (c, i) {
          return (
            '<a href="' + c.url + '" class="course-item" target="_blank" rel="noopener">' +
            '<span class="course-number">' + (i + 1) + "</span>" +
            '<div class="course-info"><span class="course-title">' + c.title + "</span></div>" +
            '<span class="course-arrow"><i class="fas fa-chevron-left"></i></span></a>'
          );
        })
        .join("");
    }

    window.dispatchEvent(new CustomEvent("mangro:content-ready"));
  }

  function applyOverride() {
    var override = window.MangroStore.get();
    if (override) {
      DATA = loadedDefault ? deepMerge(loadedDefault, override) : override;
    } else if (loadedDefault) {
      DATA = loadedDefault;
    }
    render();
  }

  function doRender() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", render);
    } else {
      render();
    }
  }

  fetch((base || "./") + "data/content.json")
    .then(function (r) { return r.json(); })
    .then(function (def) {
      loadedDefault = def;
      var ov = window.MangroStore.get();
      DATA = ov ? deepMerge(def, ov) : def;
      doRender();
    })
    .catch(function () {
      var ov = window.MangroStore.get();
      if (ov) { DATA = ov; doRender(); }
    });

  window.addEventListener("mangro:store-changed", applyOverride);
  window.addEventListener("storage", function (e) {
    if (e.key === STORE_KEY) applyOverride();
  });
})();
