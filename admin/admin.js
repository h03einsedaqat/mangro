/* ============================================================
   admin.js — پنل مدیریت مانگرو (نسخه‌ی کامل و پایدار)
   بخش‌های قابل مدیریت:
   - صفحه اصلی: هیرو، ویژگی‌ها، عنوان‌ها، دانلود، اکسل، فرم، فوتر
   - گالری تصاویر صفحه اصلی
   - ویدیوهای آموزشی و دوره‌ها (صفحه آموزش)
   - اطلاعات تماس
   - پیام‌های فرم تماس
   ذخیره: هر ویرایش بلافاصله در localStorage ثبت می‌شود و با
   «ذخیره و انتشار» هم همان داده‌ها ذخیره/منتشر می‌گردد.
   ============================================================ */
(function () {
  "use strict";

  var CFG_KEY = "mangro_admin_cfg";
  var AUTH_KEY = "mangro_admin_authed";
  var STORE = "mangro_content_v2";
  var MSGS = "mangro_messages";
  var BASE = "../data/content.json";

  var DATA = null;
  var toastWrap = null;
  var saveBtn = null;

  /* ---------- ابزار ---------- */
  function cfg() { try { return JSON.parse(localStorage.getItem(CFG_KEY) || "null") || {}; } catch (e) { return {}; } }
  function saveCfg(c) { localStorage.setItem(CFG_KEY, JSON.stringify(c)); }
  function storeGet() { try { return JSON.parse(localStorage.getItem(STORE) || "null"); } catch (e) { return null; } }
  function storeSet(d) { try { localStorage.setItem(STORE, JSON.stringify(d)); return true; } catch (e) { return false; } }
  var SERVER_MSGS = null;   // پیام‌های خوانده‌شده از سرور
  function token() {
    var el = $("#saveToken");
    var t = el && el.value ? el.value.trim() : "";
    return t || (cfg().token || "mangro-save-v1");
  }
  function messages() {
    if (SERVER_MSGS) return SERVER_MSGS;
    try { return JSON.parse(localStorage.getItem(MSGS) || "[]"); } catch (e) { return []; }
  }
  function setMessages(a) {
    SERVER_MSGS = a;
    try { localStorage.setItem(MSGS, JSON.stringify(a)); } catch (e) {}
  }
  // خواندن پیام‌ها از سرور (data/messages.json از طریق php/messages.php)
  function fetchMessages() {
    if (!window.fetch) return Promise.resolve(null);
    return fetch("../php/messages.php?token=" + encodeURIComponent(token()))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.ok && Array.isArray(j.items)) {
          SERVER_MSGS = j.items;
          try { localStorage.setItem(MSGS, JSON.stringify(j.items)); } catch (e) {}
          return j.items;
        }
        return null;
      })
      .catch(function () { return null; });
  }
  // حذف روی سرور
  function serverMsgAction(payload) {
    if (!window.fetch) return Promise.resolve(false);
    return fetch("../php/messages.php", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token() },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.ok) { SERVER_MSGS = j.items || []; return true; }
        return false;
      })
      .catch(function () { return false; });
  }
  function deepMerge(b, o) {
    if (o === null || typeof o !== "object" || Array.isArray(o)) return o;
    if (b === null || typeof b !== "object" || Array.isArray(b)) return o;
    var out = {}; Object.keys(b).forEach(function (k) { out[k] = b[k]; });
    Object.keys(o).forEach(function (k) { out[k] = deepMerge(b[k], o[k]); });
    return out;
  }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function getPath(o, p) { return p.split(".").reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }
  function setPath(o, p, v) {
    var parts = p.split(".");
    var cur = o;
    for (var i = 0; i < parts.length - 1; i++) { if (cur[parts[i]] == null) cur[parts[i]] = {}; cur = cur[parts[i]]; }
    cur[parts[parts.length - 1]] = v;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function resolveImg(s) { return /^(data:|https?:|\/)/i.test(s || "") ? s : "../" + s; }
  function toast(msg, type) {
    var t = document.createElement("div");
    t.className = "toast " + (type || "ok");
    t.innerHTML = '<i class="fas ' + (type === "err" ? "fa-circle-xmark" : "fa-circle-check") + '"></i> ' + esc(msg);
    toastWrap.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }
  // ثبت آنی در حافظه
  function persist() {
    if (!DATA) return false;
    storeSet(DATA);
    try { window.dispatchEvent(new CustomEvent("mangro:store-changed")); } catch (e) {}
    return true;
  }
  function flashSaved() {
    if (!saveBtn) return;
    saveBtn.innerHTML = '<i class="fas fa-check"></i> ذخیره شد';
    setTimeout(function () { saveBtn.innerHTML = '<i class="fas fa-cloud-arrow-up"></i> ذخیره و انتشار'; }, 1500);
  }

  /* ---------- ورود ---------- */
  function ensurePass() { var c = cfg(); if (!c.pass) { c.pass = "mangro@1403"; saveCfg(c); } return c; }
  function showApp() { $("#loginScreen").style.display = "none"; $("#adminShell").style.display = "flex"; }
  function initAuth() {
    ensurePass();
    if (sessionStorage.getItem(AUTH_KEY) === "1") showApp();
    $("#loginForm").addEventListener("submit", function (e) {
      e.preventDefault();
      if ($("#passwordInput").value === cfg().pass) {
        sessionStorage.setItem(AUTH_KEY, "1");
        $("#loginError").style.display = "none";
        showApp();
        loadData();
      } else { $("#loginError").style.display = "block"; }
    });
    $("#logoutBtn").addEventListener("click", function () { sessionStorage.removeItem(AUTH_KEY); location.reload(); });
  }

  /* ---------- داده ---------- */
  function loadData() {
    fetch(BASE + "?v=" + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (def) {
        DATA = storeGet() ? deepMerge(def, storeGet()) : def;
        ensureStructure();
        renderAll();
      })
      .catch(function () {
        DATA = storeGet();
        if (DATA) { ensureStructure(); renderAll(); }
        else toast("فایل داده پیدا نشد.", "err");
      });
  }
  function ensureStructure() {
    if (!DATA.home) DATA.home = {};
    if (!DATA.home.gallery) DATA.home.gallery = [];
    if (!DATA.learning) DATA.learning = {};
    if (!DATA.learning.videos) DATA.learning.videos = [];
    if (!DATA.learning.courses) DATA.learning.courses = [];
  }

  /* ---------- ناوبری ---------- */
  var TITLES = {
    dashboard: "داشبورد", home: "صفحه اصلی", gallery: "گالری تصاویر", videos: "ویدیوهای آموزشی",
    courses: "دوره‌های آموزشی", contact: "اطلاعات تماس", messages: "پیام‌های تماس",
    settings: "تنظیمات", help: "راهنما"
  };
  function openTab(name) {
    $$(".panel").forEach(function (p) { p.style.display = "none"; });
    var t = $("#tab-" + name); if (t) t.style.display = "block";
    $("#pageTitle").textContent = TITLES[name] || "";
    if (name === "dashboard") renderDashboard();
    if (name === "messages") renderMessages();
    if (name === "help") renderHelp();
    window.scrollTo(0, 0);
  }
  function initNav() {
    $$(".nav-item").forEach(function (it) {
      it.addEventListener("click", function () {
        $$(".nav-item").forEach(function (x) { x.classList.remove("active"); });
        it.classList.add("active");
        openTab(it.getAttribute("data-tab"));
        var sn = $("#sideNav"); if (sn) sn.classList.remove("open");
      });
    });
    $("#navToggle").addEventListener("click", function () {
      var sn = $("#sideNav"); if (sn) sn.classList.toggle("open");
    });
  }

  /* ---------- رندر اصلی ---------- */
  function renderAll() {
    if (!DATA) return;
    buildHomeEditor();
    renderGallery();
    renderVideos();
    renderCourses();
    bindPathFields(document); // تماس و هر فیلد data-path
    renderDashboard();
  }

  /* ============ ویرایشگر صفحه اصلی (schema) ============ */
  function buildHomeEditor() {
    var root = $("#homeEditor");
    if (!root || root.dataset.built) return;
    root.dataset.built = "1";

    var groups = [
      { title: "بخش معرفی (هیرو)", fields: [
        ["عنوان اصلی", "home.heroTitle", "textarea"],
        ["توضیح کوتاه", "home.heroDesc", "textarea"],
        ["متن دکمه دانلود", "home.heroBtn", "text"],
        ["لینک دکمه دانلود", "home.heroBtnUrl", "url"],
        ["تصویر داخل گوشی (مسیر/لینک)", "home.heroScreen", "text"]
      ]},
      { title: "ویژگی‌ها", fields: [
        ["عنوان بخش", "home.featuresTitle", "text"]
      ]},
      { title: "تیترها", fields: [
        ["عنوان گالری", "home.galleryTitle", "text"],
        ["عنوان ویدیو", "home.videoTitle", "text"],
        ["متن دکمه سایر آموزش‌ها", "home.videoMoreBtn", "text"],
        ["عنوان دانلود", "home.downloadTitle", "text"],
        ["عنوان بخش اکسل", "home.excelTitle", "text"],
        ["توضیح بخش اکسل", "home.excelSub", "textarea"],
        ["متن دکمه «توضیحات»", "home.excelBtn", "text"],
        ["متن فوتر", "home.footerText", "text"]
      ]}
    ];

    var featGroup = { title: "ویژگی‌های چهارگانه", fields: [] };
    for (var i = 1; i <= 4; i++) {
      featGroup.fields.push(["ویژگی " + i + " — عنوان", "home.feature" + i + "Title", "text"]);
      featGroup.fields.push(["ویژگی " + i + " — توضیح", "home.feature" + i + "Desc", "textarea"]);
    }
    groups.push(featGroup);

    var dl = { title: "لینک‌های دانلود (اندروید / آیفون / PWA)", fields: [] };
    [["d1", "آیفون"], ["d2", "اندروید"], ["d3", "PWA"]].forEach(function (p) {
      dl.fields.push([p[1] + " — عنوان", "home." + p[0] + "Label", "text"]);
      dl.fields.push([p[1] + " — زیرنویس", "home." + p[0] + "Sub", "text"]);
      dl.fields.push([p[1] + " — لینک", "home." + p[0] + "Url", "url"]);
    });
    groups.push(dl);

    var ex = { title: "آیتم‌های اکسل", fields: [] };
    [["e1", "حسابداری"], ["e2", "انبار"], ["e3", "بارکد"], ["e4", "مغایرت"]].forEach(function (p) {
      ex.fields.push([p[1] + " — عنوان", "home." + p[0] + "Label", "text"]);
      ex.fields.push([p[1] + " — لینک صفحه", "home." + p[0] + "Url", "url"]);
    });
    groups.push(ex);

    var fm = { title: "فرم تماس", fields: [
      ["برچسب نام", "home.fNameLabel", "text"], ["Placeholder نام", "home.fNamePh", "text"],
      ["برچسب شماره", "home.fPhoneLabel", "text"], ["Placeholder شماره", "home.fPhonePh", "text"],
      ["برچسب پیام", "home.fMsgLabel", "text"], ["Placeholder پیام", "home.fMsgPh", "text"],
      ["متن دکمه ارسال", "home.fSubmit", "text"]
    ]};
    groups.push(fm);

    var ct = { title: "عنوان تماس", fields: [
      ["عنوان بخش تماس", "home.contactTitle", "text"]
    ]};
    groups.push(ct);

    var html = groups.map(function (g) {
      var f = g.fields.map(function (item) {
        var label = item[0], path = item[1], type = item[2];
        var ctl = type === "textarea"
          ? '<textarea data-path="' + path + '"></textarea>'
          : '<input type="' + (type || "text") + '" data-path="' + path + '"' + (type === "url" ? ' dir="ltr"' : "") + ' />';
        return '<div class="field"><label>' + esc(label) + "</label>" + ctl + "</div>";
      }).join("");
      return '<div class="card" style="margin-bottom:16px"><h3 style="margin-bottom:14px">' + esc(g.title) + "</h3>" + f + "</div>";
    }).join("");
    root.innerHTML = html;

    bindPathFields(root);

    // دکمه‌های افزودن ویژگی بیشتر اختیاری — برای سادگی همان ۴ مورد.
    var addNote = document.createElement("p");
    addNote.style.cssText = "color:var(--muted);font-size:.85rem;text-align:center";
    addNote.textContent = "برای عوض کردن آیکون ویژگی‌ها یا افزودن بخش جدید، می‌توانیم بعداً تنظیم کنیم. حالا همه متن‌ها و لینک‌ها قابل ویرایش‌اند.";
    root.appendChild(addNote);
  }

  // اتصال فیلدهای [data-path]
  function bindPathFields(root) {
    if (!DATA) return;
    $$("[data-path]", root).forEach(function (el) {
      if (el.dataset.pBound) return;
      el.dataset.pBound = "1";
      var v = getPath(DATA, el.dataset.path);
      el.value = v == null ? "" : v;
      el.addEventListener("input", function () {
        setPath(DATA, el.dataset.path, el.value);
        persist();
      });
    });
  }

  /* ============ گالری ============ */
  function renderGallery() {
    var list = $("#galleryList");
    var imgs = DATA.home.gallery || [];
    if (!imgs.length) { list.innerHTML = '<div class="empty">هنوز تصویری ثبت نشده است.</div>'; return; }
    list.innerHTML = imgs.map(function (img, i) {
      var src = img.src || "";
      return (
        '<div class="item-card">' +
        '<div class="item-thumb">' + (src ? '<img src="' + esc(resolveImg(src)) + '" alt="" />' : '<i class="fas fa-image"></i>') + "</div>" +
        '<div class="item-body">' +
        '<div class="field"><label>مسیر / لینک عکس (مثلاً img/name.webp)</label>' +
        '<input class="g-src" data-i="' + i + '" value="' + esc(src) + '" dir="ltr" /></div>' +
        '<div class="field"><label>آپلود از کامپیوتر</label>' +
        '<input type="file" class="g-file" data-i="' + i + '" accept="image/*" /></div>' +
        '<div class="field"><label>توضیح تصویر (اختیاری)</label>' +
        '<input class="g-alt" data-i="' + i + '" value="' + esc(img.alt || "") + '" /></div>' +
        "</div>" +
        '<div class="item-tools">' +
        '<button class="icon-btn g-up" data-i="' + i + '" title="بالا" ' + (i === 0 ? "disabled" : "") + '><i class="fas fa-chevron-up"></i></button>' +
        '<button class="icon-btn g-down" data-i="' + i + '" title="پایین" ' + (i === imgs.length - 1 ? "disabled" : "") + '><i class="fas fa-chevron-down"></i></button>' +
        '<button class="icon-btn danger g-del" data-i="' + i + '" title="حذف"><i class="fas fa-trash"></i></button>' +
        "</div></div>"
      );
    }).join("");
    bindGallery();
  }
  function bindGallery() {
    function on(sel, ev, fn) { $$(sel).forEach(function (e) { e.addEventListener(ev, function () { fn(+e.getAttribute("data-i")); }); }); }
    on(".g-src", "input", function (i) { DATA.home.gallery[i].src = $$(".g-src")[i].value; persist(); });
    on(".g-alt", "input", function (i) { DATA.home.gallery[i].alt = $$(".g-alt")[i].value; persist(); });
    $$(".g-file").forEach(function (el) {
      el.addEventListener("change", function () {
        var i = +el.getAttribute("data-i");
        var f = el.files && el.files[0];
        if (!f) return;
        if (f.size > 800 * 1024) toast("برای انتشار دائمی بهتر است در پوشه img آپلود و مسیرش را وارد کنید.", "err");
        var rd = new FileReader();
        rd.onload = function (e) { DATA.home.gallery[i].src = e.target.result; persist(); renderGallery(); };
        rd.readAsDataURL(f);
      });
    });
    on(".g-up", "click", function (i) { move(DATA.home.gallery, i, -1); });
    on(".g-down", "click", function (i) { move(DATA.home.gallery, i, 1); });
    on(".g-del", "click", function (i) { DATA.home.gallery.splice(i, 1); persist(); renderGallery(); });
  }

  /* ============ ویدیوها ============ */
  function renderVideos() {
    var list = $("#videoList");
    var vids = DATA.learning.videos || [];
    if (!vids.length) { list.innerHTML = '<div class="empty">ویدیویی ثبت نشده است.</div>'; return; }
    list.innerHTML = vids.map(function (v, i) {
      var isFile = v.type === "file";
      return (
        '<div class="item-card">' +
        '<div class="item-thumb" style="font-size:1.5rem"><i class="fas ' + (isFile ? "fa-file-video" : "fa-youtube") + '"></i></div>' +
        '<div class="item-body">' +
        '<div class="field"><label>عنوان ویدیو</label><input class="v-title" data-i="' + i + '" value="' + esc(v.title || "") + '" /></div>' +
        '<div class="field-row">' +
        '<div class="field"><label>لینک آپارات یا آدرس فایل</label><input class="v-src" data-i="' + i + '" value="' + esc(v.src || v.url || "") + '" dir="ltr" /></div>' +
        '<div class="field"><label>نوع</label><select class="v-type" data-i="' + i + '">' +
        '<option value="aparat"' + (!isFile ? " selected" : "") + '>آپارات / امبد</option>' +
        '<option value="file"' + (isFile ? " selected" : "") + '>فایل ویدیو (mp4)</option></select></div></div>' +
        '<div class="field"><label>برچسب / دسته</label><input class="v-badge" data-i="' + i + '" value="' + esc(v.badge || "") + '" /></div>' +
        '<div class="field"><label>توضیح کوتاه</label><textarea class="v-desc" data-i="' + i + '">' + esc(v.desc || "") + "</textarea></div>" +
        "</div>" +
        '<div class="item-tools">' +
        '<button class="icon-btn v-up" data-i="' + i + '" ' + (i === 0 ? "disabled" : "") + '><i class="fas fa-chevron-up"></i></button>' +
        '<button class="icon-btn v-down" data-i="' + i + '" ' + (i === vids.length - 1 ? "disabled" : "") + '><i class="fas fa-chevron-down"></i></button>' +
        '<button class="icon-btn danger v-del" data-i="' + i + '"><i class="fas fa-trash"></i></button>' +
        "</div></div>"
      );
    }).join("");
    bindVideos();
  }
  function bindVideos() {
    function on(sel, ev, fn) { $$(sel).forEach(function (e) { e.addEventListener(ev, function () { fn(+e.getAttribute("data-i")); }); }); }
    on(".v-title", "input", function (i) { DATA.learning.videos[i].title = $$(".v-title")[i].value; persist(); });
    on(".v-src", "input", function (i) { DATA.learning.videos[i].src = $$(".v-src")[i].value; delete DATA.learning.videos[i].url; persist(); });
    on(".v-badge", "input", function (i) { DATA.learning.videos[i].badge = $$(".v-badge")[i].value; persist(); });
    on(".v-desc", "input", function (i) { DATA.learning.videos[i].desc = $$(".v-desc")[i].value; persist(); });
    on(".v-type", "change", function (i) { DATA.learning.videos[i].type = $$(".v-type")[i].value; persist(); });
    on(".v-up", "click", function (i) { move(DATA.learning.videos, i, -1); });
    on(".v-down", "click", function (i) { move(DATA.learning.videos, i, 1); });
    on(".v-del", "click", function (i) { DATA.learning.videos.splice(i, 1); persist(); renderVideos(); });
  }

  /* ============ دوره‌ها ============ */
  function renderCourses() {
    var list = $("#courseList");
    var arr = DATA.learning.courses || [];
    if (!arr.length) { list.innerHTML = '<div class="empty">دوره‌ای ثبت نشده است.</div>'; return; }
    list.innerHTML = arr.map(function (c, i) {
      return (
        '<div class="item-card">' +
        '<div class="item-thumb" style="background:linear-gradient(140deg,#ff8a00,#fbbf24);color:#fff;font-weight:800">' + (i + 1) + "</div>" +
        '<div class="item-body">' +
        '<div class="field"><label>عنوان دوره</label><input class="c-title" data-i="' + i + '" value="' + esc(c.title || "") + '" /></div>' +
        '<div class="field"><label>لینک دوره (آپارات)</label><input class="c-url" data-i="' + i + '" value="' + esc(c.url || "") + '" dir="ltr" /></div>' +
        "</div>" +
        '<div class="item-tools">' +
        '<button class="icon-btn c-up" data-i="' + i + '" ' + (i === 0 ? "disabled" : "") + '><i class="fas fa-chevron-up"></i></button>' +
        '<button class="icon-btn c-down" data-i="' + i + '" ' + (i === arr.length - 1 ? "disabled" : "") + '><i class="fas fa-chevron-down"></i></button>' +
        '<button class="icon-btn danger c-del" data-i="' + i + '"><i class="fas fa-trash"></i></button>' +
        "</div></div>"
      );
    }).join("");
    bindCourses();
  }
  function bindCourses() {
    function on(sel, ev, fn) { $$(sel).forEach(function (e) { e.addEventListener(ev, function () { fn(+e.getAttribute("data-i")); }); }); }
    on(".c-title", "input", function (i) { DATA.learning.courses[i].title = $$(".c-title")[i].value; persist(); });
    on(".c-url", "input", function (i) { DATA.learning.courses[i].url = $$(".c-url")[i].value; persist(); });
    on(".c-up", "click", function (i) { move(DATA.learning.courses, i, -1); });
    on(".c-down", "click", function (i) { move(DATA.learning.courses, i, 1); });
    on(".c-del", "click", function (i) { DATA.learning.courses.splice(i, 1); persist(); renderCourses(); });
  }

  function move(arr, i, dir) {
    var j = i + dir;
    if (j < 0 || j >= arr.length) return;
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    persist(); renderGallery(); renderVideos(); renderCourses();
  }

  /* ============ افزودن ============ */
  function bindAdd() {
    $("#addGalleryBtn").addEventListener("click", function () {
      DATA.home.gallery.push({ src: "", alt: "تصویر مانگرو" }); persist(); renderGallery();
    });
    $("#addVideoBtn").addEventListener("click", function () {
      DATA.learning.videos.push({ type: "aparat", src: "", badge: "آموزش تخصصی", title: "ویدیوی جدید", desc: "" }); persist(); renderVideos();
    });
    $("#addCourseBtn").addEventListener("click", function () {
      DATA.learning.courses.push({ title: "عنوان دوره جدید", url: "" }); persist(); renderCourses();
    });
  }

  /* ============ داشبورد ============ */
  function renderDashboard() {
    var box = $("#statCards");
    if (!box || !DATA) return;
    var stats = [
      { ic: "fa-images", n: (DATA.home.gallery || []).length, l: "تصویر گالری" },
      { ic: "fa-video", n: (DATA.learning.videos || []).length, l: "ویدیوی آموزشی" },
      { ic: "fa-list", n: (DATA.learning.courses || []).length, l: "دوره" },
      { ic: "fa-envelope-open-text", n: messages().length, l: "پیام" }
    ];
    box.innerHTML = stats.map(function (s) {
      return '<div class="stat-card"><div class="ic"><i class="fas ' + s.ic + '"></i></div><div><b>' + s.n + "</b><span>" + s.l + "</span></div></div>";
    }).join("");
  }

  /* ============ پیام‌ها ============ */
  function renderMessages(skipFetch) {
    var list = $("#messagesList");
    if (!list) return;
    if (!skipFetch) {
      list.innerHTML = '<div class="empty"><i class="fas fa-spinner fa-spin"></i> در حال دریافت پیام‌ها از سرور...</div>';
      fetchMessages().then(function (items) {
        if (items === null) {
          var cached = messages();
          if (!cached.length) {
            list.innerHTML =
              '<div class="empty">اتصال به سرور برقرار نشد.<br><small>مطمئن شوید سایت روی هاست باز شده و توکن در تنظیمات درست است.</small></div>';
            return;
          }
        }
        renderMessages(true);
        renderDashboard();
      });
      return;
    }
    var ms = messages();
    if (!ms.length) { list.innerHTML = '<div class="empty">پیامی ثبت نشده است.</div>'; return; }
    list.innerHTML = ms.map(function (m, i) {
      var d = m.date ? new Date(m.date).toLocaleString("fa-IR") : "";
      return (
        '<div class="message-item"><div class="msg-head"><b>' + esc(m.name) + "</b><time>" + d + "</time></div>" +
        '<div class="msg-meta"><span><i class="fas fa-phone"></i> ' + esc(m.phone) + "</span></div>" +
        '<p>' + esc(m.message) + "</p>" +
        '<button class="btn btn-red btn-sm" style="margin-top:8px" data-mi="' + i + '"><i class="fas fa-trash"></i> حذف</button></div>'
      );
    }).join("");
    $$("#messagesList [data-mi]").forEach(function (b) {
      b.addEventListener("click", function () {
        var idx = +b.getAttribute("data-mi");
        serverMsgAction({ action: "delete", index: idx }).then(function (ok) {
          if (!ok) {
            var ms = messages(); ms.splice(idx, 1); setMessages(ms);
            toast("حذف روی سرور انجام نشد؛ فقط از نمایش محلی حذف شد.", "err");
          }
          renderMessages(true); renderDashboard();
        });
      });
    });
  }

  /* ============ راهنما ============ */
  function renderHelp() {
    $("#helpText").textContent =
      "🔹 صفحه اصلی: تمام متن‌ها، عنوان‌ها، لینک‌های دانلود و اکسل و فرم تماس قابل ویرایش است.\n" +
      "   • این متن‌ها در حالت فارسی همان چیزی است که می‌نویسید؛ در انگلیسی/عربی ترجمه می‌شود.\n\n" +
      "🔹 گالری تصاویر: تصاویر اسلایدر «تصاویر برنامه» صفحه اصلی.\n" +
      "   • افزودن → «افزودن تصویر» → آپلود (پیش‌نمایش موقت) یا وارد کردن مسیر مثل img/name.webp\n" +
      "   • برای انتشار دائمی عکس را از FTP در پوشه img بگذارید و مسیرش را بنویسید.\n\n" +
      "🔹 ویدیوهای آموزشی: کارت‌های صفحه آموزش. لینک آپارات یا فایل ویدیو + عنوان.\n\n" +
      "🔹 دوره‌های آموزشی: لیست همه دوره‌های صفحه آموزش.\n\n" +
      "🔹 اطلاعات تماس: شماره / ایمیل / آدرس.\n\n" +
      "🔹 پیام‌های تماس: پیام‌های فرم تماس مستقیماً از سرور (data/messages.json) خوانده می‌شود\n" +
      "   و یک نسخه هم به ایمیل مدیر ارسال می‌گردد. برای کار کردن این بخش، توکن تنظیمات باید\n" +
      "   با توکن php/messages.php یکی باشد و پوشه‌ی data اجازه‌ی نوشتن داشته باشد.\n\n" +
      "📌 ذخیره و انتشار:\n" +
      "   • هر تغییر همین‌جا ذخیره می‌شود و با «ذخیره و انتشار» منتشر می‌شود.\n" +
      "   • برای اینکه همه‌ی بازدیدکننده‌ها ببینند: «دانلود فایل داده» بزنید و content.json را در مسیر data/ روی هاست جایگزین کنید؛\n" +
      "     یا اگر هاست PHP دارد «ذخیره روی سرور» را با توکن هماهنگ با php/save_content.php بزنید.\n\n" +
      "رمز پیش‌فرض: mangro@1403 (در تنظیمات عوض کنید).";
  }

  /* ============ دکمه‌های بالا و ابزار ============ */
  function bindTop() {
    // توکن ذخیره‌شده را در فیلد بگذار و هر تغییری را نگه دار
    var tokEl = $("#saveToken");
    if (tokEl) {
      var c0 = cfg();
      if (c0.token) tokEl.value = c0.token;
      tokEl.addEventListener("change", function () {
        var c = cfg(); c.token = tokEl.value.trim(); saveCfg(c);
      });
    }
    saveBtn = $("#saveBtn");
    // «ذخیره و انتشار»: اول در همین مرورگر ذخیره می‌شود و همزمان تلاش می‌کند
    // روی سرور (PHP) هم ذخیره کند تا برای همه‌ی بازدیدکننده‌ها اعمال شود.
    // اگر PHP در دسترس نبود (مثلاً پیش‌نمایش محلی) بدون خطا، فقط پیام می‌دهد.
    function doPublish(silent) {
      if (!DATA) return Promise.resolve();
      persist();
      var tok = ($("#saveToken") && $("#saveToken").value.trim()) || "mangro-save-v1";
      if (!tok) {
        if (!silent) toast("تغییرات در همین مرورگر ذخیره شد. برای انتشار روی هاست، «دانلود فایل داده» را بگیرید و در data/ جایگزین کنید.");
        return Promise.resolve();
      }
      return fetch("../php/save_content.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": tok },
        body: JSON.stringify(DATA)
      })
        .then(function (r) {
          return r.json().then(function (j) { return { httpOk: r.ok, j: j }; })
            .catch(function () { return { httpOk: r.ok, j: null }; });
        })
        .then(function (res) {
          if (res.httpOk && res.j && res.j.ok) {
            toast("ذخیره شد و روی سرور برای همه‌ی بازدیدکننده‌ها منتشر شد.");
            return true;
          }
          if (!res.httpOk) {
            if (!silent) toast("سرور PHP در دسترس نیست (پیش‌نمایش محلی). تغییرات در همین مرورگر ذخیره شد. روی هاست، «ذخیره و انتشار» هم برای همه اعمال می‌شود.");
            return false;
          }
          if (!silent) toast((res.j && res.j.msg) || "خطا", "err");
          return false;
        })
        .catch(function () {
          if (!silent) toast("سرور PHP در دسترس نیست. تغییرات در همین مرورگر ذخیره شد.");
          return false;
        });
    }
    window.MangroPublish = doPublish;
    saveBtn.addEventListener("click", function () {
      if (!DATA) { toast("ابتدا داده بارگذاری شود.", "err"); return; }
      doPublish(false);
      flashSaved();
    });

    $("#viewSiteBtn").addEventListener("click", function (e) {
      e.preventDefault();
      if (DATA) persist();
      window.location.href = "../index.html";
    });

    function exportJSON() {
      if (!DATA) return;
      var blob = new Blob([JSON.stringify(DATA, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "content.json";
      document.body.appendChild(a); a.click(); a.remove();
    }
    $("#downloadBtn").addEventListener("click", exportJSON);
    $("#exportBtn").addEventListener("click", exportJSON);

    $("#resetBtn").addEventListener("click", function () {
      if (confirm("همه تغییرات محلی پاک و به حالت پیش‌فرض برمی‌گردد؟")) {
        localStorage.removeItem(STORE);
        location.reload();
      }
    });
    $("#clearMessagesBtn").addEventListener("click", function () {
      if (!confirm("همه پیام‌ها حذف شوند؟")) return;
      serverMsgAction({ action: "clear" }).then(function (ok) {
        if (!ok) { setMessages([]); toast("حذف روی سرور انجام نشد.", "err"); }
        renderMessages(true); renderDashboard();
      });
    });
    $("#changePassBtn").addEventListener("click", function () {
      var c = cfg();
      if ($("#oldPass").value !== c.pass) { toast("رمز فعلی اشتباه است.", "err"); return; }
      var n = $("#newPass").value;
      if (n.length < 4) { toast("رمز جدید حداقل ۴ کاراکتر.", "err"); return; }
      c.pass = n; saveCfg(c); toast("رمز عبور تغییر کرد.");
      $("#oldPass").value = ""; $("#newPass").value = "";
    });
    $("#serverSaveBtn").addEventListener("click", function () {
      if (!DATA) return;
      var tok = $("#saveToken").value.trim();
      if (!tok) { toast("توکن را وارد کنید.", "err"); return; }
      var btn = $("#serverSaveBtn");
      btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ذخیره...';
      fetch("../php/save_content.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": tok },
        body: JSON.stringify(DATA)
      })
        .then(function (r) { return r.json().catch(function () { return { ok: false, msg: "پاسخ نامعتبر" }; }); })
        .then(function (res) {
          if (res && res.ok) toast("روی سرور ذخیره شد.");
          else toast((res && res.msg) || "خطا", "err");
        })
        .catch(function () { toast("به سرور PHP متصل نشد.", "err"); })
        .finally(function () { btn.disabled = false; btn.innerHTML = '<i class="fas fa-server"></i> ذخیره روی سرور (PHP)'; });
    });
  }

  /* ============ راه‌اندازی ============ */
  function init() {
    toastWrap = $("#toastWrap");
    initNav();
    bindAdd();
    bindTop();
    initAuth();
    if (sessionStorage.getItem(AUTH_KEY) === "1") loadData();
  }
  document.addEventListener("DOMContentLoaded", init);
})();
