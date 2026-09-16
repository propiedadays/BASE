(function () {
  "use strict";

  var WHATSAPP_NUMBER = "573008458177";

  // Sombra del navbar al hacer scroll
  var navbar = document.getElementById("navbar");
  function onScroll() {
    if (window.scrollY > 8) {
      navbar.classList.add("is-scrolled");
    } else {
      navbar.classList.remove("is-scrolled");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Menú móvil
  var navToggle = document.getElementById("navToggle");
  var navToggleIcon = document.getElementById("navToggleIcon");
  var MENU_ICON = navToggleIcon.innerHTML;
  var CLOSE_ICON = '<line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/>';

  function setNavOpen(isOpen) {
    document.body.classList.toggle("nav-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggleIcon.innerHTML = isOpen ? CLOSE_ICON : MENU_ICON;
  }

  navToggle.addEventListener("click", function () {
    setNavOpen(!document.body.classList.contains("nav-open"));
  });

  document.querySelectorAll(".nav-links a").forEach(function (link) {
    link.addEventListener("click", function () { setNavOpen(false); });
  });

  // Animación de entrada al hacer scroll (mejora progresiva: el contenido
  // ya es visible por CSS; solo activamos el efecto si hay IntersectionObserver).
  if ("IntersectionObserver" in window) {
    document.documentElement.classList.add("js-reveal");
    var revealEls = document.querySelectorAll(".reveal");
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  }

  // Formulario de contacto -> WhatsApp
  var form = document.getElementById("contactForm");
  var status = document.getElementById("formStatus");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var nombre = form.nombre.value.trim();
    var telefono = form.telefono.value.trim();
    var mensaje = form.mensaje.value.trim();

    if (!nombre || !telefono || !mensaje) {
      status.textContent = "Completa los tres campos para poder escribirte.";
      status.className = "form-status is-visible is-error";
      return;
    }

    var texto =
      "Hola Arista, soy " + nombre + " (" + telefono + "). " +
      "Quiero remodelar: " + mensaje;

    var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(texto);
    window.open(url, "_blank", "noopener");

    status.textContent = "Te llevamos a WhatsApp con tu mensaje listo para enviar.";
    status.className = "form-status is-visible";
  });
})();
