document.addEventListener("DOMContentLoaded", function () {
  // ===== راه‌اندازی Swiper =====
  var swiper = new Swiper(".mySwiper", {
    loop: true,
    autoplay: { delay: 3000, disableOnInteraction: false },
    pagination: { el: ".swiper-pagination", clickable: true },
    navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
    breakpoints: {
      320: { slidesPerView: 3, spaceBetween: 30 },
      640: { slidesPerView: 3, spaceBetween: 30 },
      768: { slidesPerView: 3, spaceBetween: 30 },
      1024: { slidesPerView: 3, spaceBetween: 30 },
    },
    effect: "slide",
    speed: 600,
  });

  // ===== لایت‌باکس =====
  var overlay = document.getElementById("lightboxOverlay");
  var lightboxImage = document.getElementById("lightboxImage");
  var closeBtn = document.getElementById("lightboxClose");
  if (overlay && lightboxImage && closeBtn) {
    document.querySelectorAll(".swiper-slide").forEach(function (slide) {
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
    closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      closeLightbox();
    });
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("active")) {
        closeLightbox();
      }
    });
    function closeLightbox() {
      overlay.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  // ===== منوی همبرگری (با لاگ برای تست) =====
  var hamburger = document.getElementById("hamburgerBtn");
  var navMenu = document.getElementById("navMenu");

  if (hamburger && navMenu) {
    // رویداد کلیک روی همبرگر
    hamburger.addEventListener("click", function (e) {
      e.stopPropagation();
      this.classList.toggle("active");
      navMenu.classList.toggle("open");
      // console.log("منو باز/بسته شد. کلاس open:", navMenu.classList.contains("open"));
    });

    // بستن منو با کلیک روی لینک‌ها (به جز دکمه زبان)
    navMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        hamburger.classList.remove("active");
        navMenu.classList.remove("open");
      });
    });
  } else {
    console.warn("⚠️ همبرگر یا منو در صفحه پیدا نشد.");
  }

  // ===== تنظیم لینک "خانه" (در صورت وجود) =====
  var homeLink = document.getElementById("homeLink");
  if (homeLink) {
    function updateHomeLink() {
      homeLink.setAttribute("href", window.innerWidth <= 850 ? "#hero-section-sm" : "#hero-section");
    }
    updateHomeLink();
    window.addEventListener("resize", updateHomeLink);
  }

  // ===== اعتبارسنجی فرم تماس =====
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
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ارسال...';
          submitBtn.classList.add("loading");
        }
      });
    }
  }
});