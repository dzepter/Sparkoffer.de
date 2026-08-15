/* SUP Camp Kahler See – schlankes Vanilla-JS, keine Abhängigkeiten. */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header: Zustand beim Scrollen ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 24);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile Navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    var closeNav = function () {
      nav.classList.remove("is-open");
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        closeNav();
        toggle.focus();
      }
    });
  }

  /* ---------- Kurstermine: vergangene Termine ausblenden ----------
     Termine stehen als <li data-date="YYYY-MM-DD"> im Markup.
     Ohne JavaScript bleiben alle Termine (mit Jahr) sichtbar.  */
  document.querySelectorAll("[data-dates]").forEach(function (list) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var upcoming = 0;
    list.querySelectorAll("[data-date]").forEach(function (item) {
      var d = new Date(item.getAttribute("data-date") + "T23:59:59");
      if (d < today) {
        item.hidden = true;
      } else {
        upcoming++;
      }
    });
    var empty = document.querySelector(
      '[data-dates-empty="' + list.getAttribute("data-dates") + '"]'
    );
    if (empty) empty.hidden = upcoming > 0;
  });

  /* ---------- FAQ Accordion ---------- */
  document.querySelectorAll(".faq__item").forEach(function (item) {
    var btn = item.querySelector(".faq__q");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var open = item.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
    });
  });

  /* ---------- Dezente Reveals ---------- */
  if (!reducedMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".reveal").forEach(function (el) {
      io.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------- Galerie-Lightbox ---------- */
  var lightbox = document.getElementById("lightbox");
  if (lightbox) {
    var lbImg = lightbox.querySelector("img");
    var lbCaption = lightbox.querySelector(".lightbox__caption");
    var links = Array.prototype.slice.call(
      document.querySelectorAll(".gallery-grid a")
    );
    var current = -1;
    var lastFocus = null;

    var show = function (i) {
      current = (i + links.length) % links.length;
      var link = links[current];
      lbImg.src = link.getAttribute("href");
      lbImg.alt = link.querySelector("img").alt;
      if (lbCaption) lbCaption.textContent = link.getAttribute("data-caption") || "";
    };
    var open = function (i) {
      lastFocus = document.activeElement;
      show(i);
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";
      lightbox.querySelector(".lightbox__close").focus();
    };
    var close = function () {
      lightbox.classList.remove("is-open");
      lbImg.src = "";
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    };

    links.forEach(function (link, i) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        open(i);
      });
    });
    lightbox.querySelector(".lightbox__close").addEventListener("click", close);
    lightbox.querySelector(".lightbox__prev").addEventListener("click", function () {
      show(current - 1);
    });
    lightbox.querySelector(".lightbox__next").addEventListener("click", function () {
      show(current + 1);
    });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) close();
    });
    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });
  }

  /* ---------- Kontaktformular ----------
     Statische Seite ohne Server: das Formular validiert die Eingaben und
     öffnet eine vorbereitete E-Mail im Mailprogramm des Nutzers.  */
  var form = document.getElementById("contact-form");
  if (form) {
    var setError = function (field, message) {
      var wrap = field.closest(".form__field");
      var error = wrap && wrap.querySelector(".form__error");
      if (message) {
        wrap.classList.add("has-error");
        field.setAttribute("aria-invalid", "true");
        if (error) error.textContent = message;
      } else {
        wrap.classList.remove("has-error");
        field.removeAttribute("aria-invalid");
      }
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;
      var required = [
        ["vorname", "Bitte gib deinen Vornamen an."],
        ["name", "Bitte gib deinen Namen an."],
        ["email", "Bitte gib eine gültige E-Mail-Adresse an."],
        ["nachricht", "Bitte schreib uns kurz dein Anliegen."]
      ];
      required.forEach(function (pair) {
        var field = form.elements[pair[0]];
        var value = field.value.trim();
        var bad =
          !value ||
          (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
        setError(field, bad ? pair[1] : "");
        if (bad && valid) {
          field.focus();
          valid = false;
        } else if (bad) {
          valid = false;
        }
      });
      var consent = form.elements.datenschutz;
      var consentWrap = consent.closest(".form__consent");
      if (!consent.checked) {
        consentWrap.querySelector(".form__error").style.display = "block";
        if (valid) consent.focus();
        valid = false;
      } else {
        consentWrap.querySelector(".form__error").style.display = "";
      }
      if (!valid) return;

      var subject =
        "[" + form.elements.betreff.value + "] Anfrage über sup-camp-kahl.de";
      var body =
        "Name: " +
        form.elements.vorname.value.trim() +
        " " +
        form.elements.name.value.trim() +
        "\nE-Mail: " +
        form.elements.email.value.trim() +
        (form.elements.telefon.value.trim()
          ? "\nTelefon: " + form.elements.telefon.value.trim()
          : "") +
        "\n\n" +
        form.elements.nachricht.value.trim();
      window.location.href =
        "mailto:info@sup-camp-kahl.de?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(body);
    });
  }
})();
