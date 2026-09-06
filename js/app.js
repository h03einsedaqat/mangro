/* ============================================================
   js/app.js — رفتارهای صفحه (منو، گالری، لایت‌باکس، فرم تماس)
   گالری و لایت‌باکس بعد از آماده‌شدن محتوای داده‌محور (cms.js)
   مقداردهی می‌شوند.
   ============================================================ */

// راه‌اندازی گالری + لایت‌باکس (باید بعد از پر شدن اسلایدها صدا زده شود)
function initGallery() {
  var wrap = document.querySelector(".mySwiper");
  if (!wrap || wrap.dataset.mangroInit) return;
  if (!window.Swiper) return;

  // اگر نمونه‌ی قبلی ساخته شده بود آن را نابود کن
  if (typeof wrap.swiper !== "undefined" && wrap.swiper) {
    wrap.swiper.destroy(true, true);
  }

  var swiper = new Swiper(".mySwiper", {
    loop: true,
    autoplay: { delay: 3000, disableOnInteraction: false },
    pagination: { el: ".swiper-pagination", clickable: true },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev"
    },
    centeredSlides: true,
    grabCursor: true,
    watchSlidesProgress: true,
    keyboard: { enabled: true },
    breakpoints: {
      320: { slidesPerView: 1.15, spaceBetween: 14 },
      480: { slidesPerView: 1.6, spaceBetween: 18 },
      640: { slidesPerView: 2.2, spaceBetween: 22 },
      900: { slidesPerView: 3, spaceBetween: 28 }
    },
    effect: "slide",
    speed: 650
  });
  wrap.dataset.mangroInit = "1";

  // ===== لایت‌باکس =====
  var overlay = document.getElementById("lightboxOverlay");
  var lightboxImage = document.getElementById("lightboxImage");
  var closeBtn = document.getElementById("lightboxClose");

  if (overlay && lightboxImage && closeBtn) {
    function bindLightbox() {
      document.querySelectorAll(".swiper-slide").forEach(function (slide) {
        if (slide.dataset.lightboxBound) return;
        slide.dataset.lightboxBound = "1";
        slide.addEventListener("click", function (e) {
          if (
            e.target.closest(".swiper-button-prev") ||
            e.target.closest(".swiper-button-next") ||
            e.target.closest(".swiper-pagination-bullet")
          ) {
            return;
          }
          var imgSrc = this.getAttribute("data-image");
          if (imgSrc) {
            lightboxImage.src = imgSrc;
            overlay.classList.add("active");
            document.body.style.overflow = "hidden";
          }
        });
      });
    }
    bindLightbox();
    // اسلایدهای بعدی (loop) را هم ببند
    var observer = new MutationObserver(bindLightbox);
    var wrapper = document.querySelector(".mySwiper .swiper-wrapper");
    if (wrapper) observer.observe(wrapper, { childList: true, subtree: true });

    function closeLightbox() {
      overlay.classList.remove("active");
      document.body.style.overflow = "";
    }
    if (!closeBtn.dataset.mangroBound) {
      closeBtn.dataset.mangroBound = "1";
      closeBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        closeLightbox();
      });
    }
    if (!overlay.dataset.mangroBound) {
      overlay.dataset.mangroBound = "1";
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) closeLightbox();
      });
    }
    if (!document.querySelector("[data-mangro-esc]")) {
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && overlay.classList.contains("active")) {
          closeLightbox();
        }
      });
      document.body.setAttribute("data-mangro-esc", "1");
    }
  }
}
window.initGallery = initGallery;

document.addEventListener("DOMContentLoaded", function () {
  // ===== منوی همبرگری =====
  var hamburger = document.getElementById("hamburgerBtn");
  var navMenu = document.getElementById("navMenu");

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", function (e) {
      e.stopPropagation();
      this.classList.toggle("active");
      navMenu.classList.toggle("open");
    });
    navMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        hamburger.classList.remove("active");
        navMenu.classList.remove("open");
      });
    });
  }

  // ===== تنظیم لینک "خانه" (در صورت وجود) =====
  var homeLink = document.getElementById("homeLink");
  if (homeLink) {
    function updateHomeLink() {
      homeLink.setAttribute(
        "href",
        window.innerWidth <= 960 ? "#hero-section-sm" : "#hero-section"
      );
    }
    updateHomeLink();
    window.addEventListener("resize", updateHomeLink);
  }

  // ===== گالری (اگر محتوا از قبل آماده بود) =====
  if (document.querySelector("#gallerySlides .swiper-slide")) {
    initGallery();
  }

  // ===== اعتبارسنجی و ارسال فرم تماس =====
  var contactForm = document.querySelector(".contact-form");
  if (contactForm) {
    var nameInput = document.getElementById("contactName");
    var phoneInput = document.getElementById("contactPhone");
    var messageInput = document.getElementById("contactMessage");
    var submitBtn = contactForm.querySelector(".btn-submit");
    if (nameInput && phoneInput && messageInput && submitBtn) {
      function showError(input, message) {
        var existingError = input.parentElement.querySelector(".error-message");
        if (existingError) existingError.remove();
        input.classList.add("input-error");
        var errorSpan = document.createElement("span");
        errorSpan.className = "error-message";
        errorSpan.style.color = "#dc3545";
        errorSpan.style.fontSize = "0.85rem";
        errorSpan.style.marginTop = "4px";
        errorSpan.style.display = "block";
        errorSpan.textContent = message;
        input.parentElement.appendChild(errorSpan);
      }
      function clearError(input) {
        input.classList.remove("input-error");
        var error = input.parentElement.querySelector(".error-message");
        if (error) error.remove();
      }
      [nameInput, phoneInput, messageInput].forEach(function (input) {
        input.addEventListener("input", function () {
          clearError(this);
        });
      });

      contactForm.addEventListener("submit", function (e) {
        [nameInput, phoneInput, messageInput].forEach(function (input) {
          clearError(input);
        });
        var isValid = true;
        var nameValue = nameInput.value.trim();
        if (nameValue.length < 3) {
          showError(nameInput, "نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد.");
          isValid = false;
        } else if (!/^[\u0600-\u06FF\s]+$/.test(nameValue)) {
          showError(nameInput, "نام باید فقط شامل حروف فارسی باشد.");
          isValid = false;
        }
        var phoneValue = phoneInput.value.trim();
        if (!/^09\d{9}$/.test(phoneValue)) {
          showError(phoneInput, "شماره تماس باید با ۰۹ شروع شود و ۱۱ رقم باشد.");
          isValid = false;
        }
        var messageValue = messageInput.value.trim();
        if (messageValue.length < 5) {
          showError(messageInput, "متن پیام باید حداقل ۵ کاراکتر باشد.");
          isValid = false;
        }
        if (!isValid) {
          e.preventDefault();
          var firstError = document.querySelector(".input-error");
          if (firstError) {
            firstError.scrollIntoView({ behavior: "smooth", block: "center" });
            firstError.focus();
          }
        } else {
          e.preventDefault();
          submitBtn.disabled = true;
          submitBtn.innerHTML =
            '<i class="fas fa-spinner fa-spin"></i> در حال ارسال...';
          submitBtn.classList.add("loading");

          // ارسال به سرور (php/contact.php) — پیام برای مدیر ایمیل و در پنل ذخیره می‌شود
          var action = contactForm.getAttribute("action") || "./php/contact.php";
          if (window.fetch) {
            window
              .fetch(action, {
                method: "POST",
                body: new FormData(contactForm)
              })
              .then(function (r) {
                return r.json().catch(function () {
                  return { ok: r.ok };
                });
              })
              .then(function (res) {
                if (res && res.ok) {
                  showFormSuccess(res.msg);
                } else {
                  showFormError((res && res.msg) || "ارسال پیام ناموفق بود. لطفاً دوباره تلاش کنید.");
                }
              })
              .catch(function () {
                showFormError("ارتباط با سرور برقرار نشد. لطفاً بعداً تلاش کنید.");
              });
          } else {
            contactForm.submit();
          }
        }

        function resetBtn() {
          submitBtn.disabled = false;
          submitBtn.classList.remove("loading");
          submitBtn.innerHTML = '<span id="submitBtnLabel">ارسال پیام</span>';
        }

        function showFormError(msg) {
          resetBtn();
          var old = contactForm.querySelector(".form-error-box");
          if (old) old.remove();
          var box = document.createElement("div");
          box.className = "form-success form-error-box";
          box.style.background = "rgba(220,53,69,.09)";
          box.style.borderColor = "rgba(220,53,69,.35)";
          box.style.color = "#b3202f";
          box.innerHTML = '<i class="fas fa-circle-exclamation"></i> ' + msg;
          contactForm.insertBefore(box, contactForm.firstChild);
          setTimeout(function () {
            if (box.parentNode) box.remove();
          }, 6000);
        }

        function showFormSuccess(msg) {
          resetBtn();
          contactForm.reset();
          var oldErr = contactForm.querySelector(".form-error-box");
          if (oldErr) oldErr.remove();
          var wrap = contactForm;
          var okBox = document.createElement("div");
          okBox.className = "form-success";
          okBox.innerHTML =
            '<i class="fas fa-circle-check"></i> ' + (msg || "پیام شما با موفقیت ارسال شد. به زودی با شما تماس می‌گیریم.");
          wrap.insertBefore(okBox, wrap.firstChild);
          setTimeout(function () {
            if (okBox.parentNode) okBox.remove();
          }, 5000);
        }
      });
    }
  }
});

// گالری بعد از آماده‌شدن محتوای داده‌محور راه‌اندازی شود
window.addEventListener("mangro:content-ready", function () {
  initGallery();
});

/* ============ ویدیوی معرفی: دکمه‌ی پخش سفارشی ============ */
(function () {
  function initIntroVideo() {
    var wrap = document.getElementById("introVideoWrap");
    var video = document.getElementById("introVideo");
    var btn = document.getElementById("introPlayBtn");
    if (!wrap || !video || wrap.dataset.introInit) return;
    wrap.dataset.introInit = "1";

    function play() {
      video.setAttribute("controls", "controls");
      wrap.classList.add("is-playing");
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }

    if (btn) btn.addEventListener("click", play);

    // کلیک روی خود پوستر هم پخش کند (قبل از شروع)
    video.addEventListener("click", function () {
      if (!wrap.classList.contains("is-playing")) play();
    });

    video.addEventListener("play", function () { wrap.classList.add("is-playing"); });
    video.addEventListener("pause", function () {
      if (video.currentTime === 0) wrap.classList.remove("is-playing");
    });
    video.addEventListener("ended", function () {
      wrap.classList.remove("is-playing");
      video.removeAttribute("controls");
      video.currentTime = 0;
    });

    // وقتی بخش ویدیو نزدیک شد، فایل را از قبل آماده کن (لود سریع‌تر)
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            video.setAttribute("preload", "auto");
            io.disconnect();
          }
        });
      }, { rootMargin: "300px" });
      io.observe(wrap);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initIntroVideo);
  } else {
    initIntroVideo();
  }
})();
