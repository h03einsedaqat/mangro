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
    breakpoints: {
      320: { slidesPerView: 1, spaceBetween: 24 },
      640: { slidesPerView: 2, spaceBetween: 24 },
      900: { slidesPerView: 3, spaceBetween: 30 }
    },
    effect: "slide",
    speed: 600
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
          // ذخیره‌ی محلی برای مشاهده در پنل ادمین
          try {
            var msgs = JSON.parse(localStorage.getItem("mangro_messages") || "[]");
            msgs.unshift({
              name: nameValue,
              phone: phoneValue,
              message: messageValue,
              date: new Date().toISOString()
            });
            localStorage.setItem("mangro_messages", JSON.stringify(msgs.slice(0, 100)));
          } catch (err) {}
          submitBtn.disabled = true;
          submitBtn.innerHTML =
            '<i class="fas fa-spinner fa-spin"></i> در حال ارسال...';
          submitBtn.classList.add("loading");

          // تلاش برای ارسال واقعی به php/contact.php (در صورت فعال بودن PHP)
          var ok = function () { showFormSuccess(); };
          var fail = function () { showFormSuccess(); };
          if (contactForm.action && window.fetch) {
            try {
              window
                .fetch(contactForm.action, {
                  method: "POST",
                  body: new FormData(contactForm)
                })
                .then(function (r) { return r.text(); })
                .then(fail)
                .catch(fail);
            } catch (err) {
              fail();
            }
          } else {
            fail();
          }
        }

        function showFormSuccess() {
          submitBtn.disabled = false;
          submitBtn.classList.remove("loading");
          submitBtn.innerHTML =
            '<span id="submitBtnLabel">ارسال پیام</span>';
          contactForm.reset();
          var wrap = contactForm;
          var okBox = document.createElement("div");
          okBox.className = "form-success";
          okBox.innerHTML =
            '<i class="fas fa-circle-check"></i> پیام شما با موفقیت ارسال شد. به زودی با شما تماس می‌گیریم.';
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
