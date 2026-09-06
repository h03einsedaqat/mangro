/* ============================================================
   js/video-player.js — پلیر ویدیوی معرفی (دکمه‌ی پخش سفارشی)
   روی هر عنصری با کلاس .video-wrapper که ویدیوی داخلی دارد
   و صفت data-intro-player را ندارد، اعمال می‌شود.
   ============================================================ */
(function () {
  "use strict";

  function build(wrap) {
    if (!wrap || wrap.dataset.introInit) return;
    var video = wrap.querySelector("video");
    if (!video) return;
    wrap.dataset.introInit = "1";

    // اگر دکمه‌ی پخش در HTML نبود، ساخته می‌شود
    var btn = wrap.querySelector(".video-play");
    if (!btn) {
      btn = document.createElement("button");
      btn.className = "video-play";
      btn.setAttribute("aria-label", "پخش ویدیو");
      btn.innerHTML =
        '<span class="ring"></span><span class="ring ring-2"></span><i class="fas fa-play"></i>';
      wrap.appendChild(btn);
    }

    // کنترل‌ها فقط بعد از شروع پخش نمایش داده شوند
    video.removeAttribute("controls");
    if (!video.getAttribute("preload")) video.setAttribute("preload", "metadata");
    video.setAttribute("playsinline", "");

    function play() {
      video.setAttribute("controls", "controls");
      wrap.classList.add("is-playing");
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }

    btn.addEventListener("click", play);
    video.addEventListener("click", function () {
      if (!wrap.classList.contains("is-playing")) play();
    });
    video.addEventListener("play", function () {
      wrap.classList.add("is-playing");
    });
    video.addEventListener("pause", function () {
      if (video.currentTime === 0) wrap.classList.remove("is-playing");
    });
    video.addEventListener("ended", function () {
      wrap.classList.remove("is-playing");
      video.removeAttribute("controls");
      video.currentTime = 0;
    });

    // پیش‌بارگذاری هنگام نزدیک شدن به بخش ویدیو
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) {
              video.setAttribute("preload", "auto");
              io.disconnect();
            }
          });
        },
        { rootMargin: "300px" }
      );
      io.observe(wrap);
    }
  }

  function initAll() {
    document
      .querySelectorAll(".video-wrapper")
      .forEach(function (w) {
        // کارت‌های صفحه‌ی آموزش پلیر سفارشی نمی‌گیرند
        if (w.closest(".video-card")) return;
        build(w);
      });
  }

  window.MangroVideoPlayer = initAll;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
  window.addEventListener("mangro:content-ready", initAll);
})();
