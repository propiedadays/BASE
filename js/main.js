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

  // ---------------------------------------------------------------
  // Proyectos: cada tarjeta es un mini carrusel (foto + flechas + puntos).
  // Agregar un proyecto nuevo es solo sumar una entrada a PROJECTS.
  // ---------------------------------------------------------------
  var PROJECTS = [
    {
      name: "Loft integral",
      photos: [
        {
          src: "assets/proyecto-loft-cocina.jpg",
          alt: "Cocina integral y sala de un loft remodelado por Arista, con escalera hacia el altillo",
          caption: "Cocina, comedor y sala en un mismo espacio, bajo la escalera hacia el altillo."
        },
        {
          src: "assets/proyecto-loft-escalera.jpg",
          alt: "Vista del altillo hacia la escalera y los ventanales de un loft remodelado por Arista",
          caption: "Vista del altillo hacia la sala, con ventanales sobre la ciudad."
        }
      ]
    },
    {
      name: "Ciudadela El Paraíso",
      photos: [
        {
          src: "assets/proyecto-ciudadela-cocina.jpg",
          alt: "Cocina integral con isla en un apartamento remodelado por Arista en Ciudadela El Paraíso",
          caption: "Cocina integral con isla central y estufa empotrada."
        },
        {
          src: "assets/proyecto-ciudadela-bano.jpg",
          alt: "Baño remodelado por Arista en Ciudadela El Paraíso, con enchape decorativo",
          caption: "Baño con enchape decorativo y ducha en obra gris."
        }
      ]
    }
  ];

  var COMING_SOON = {
    name: "Próximamente",
    comingSoon: true,
    caption: "Síguenos en Instagram para ver el avance de nuestras obras."
  };

  var CHEVRON_LEFT = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
  var CHEVRON_RIGHT = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function buildProjectCard(project) {
    var card = el("div", "project-card reveal");

    var media = el("div", "media");
    card.appendChild(media);

    var body = el("div", "body");
    body.appendChild(el("span", null, project.name));
    var captionEl = el("p");
    body.appendChild(captionEl);
    card.appendChild(body);

    if (project.comingSoon) {
      var placeholder = document.createElement("img");
      placeholder.src = "assets/logo-arista.png";
      placeholder.alt = "";
      media.appendChild(placeholder);
      captionEl.textContent = project.caption;
      return card;
    }

    var photo = document.createElement("img");
    photo.className = "photo";
    media.appendChild(photo);

    var dots = [];
    var index = 0;

    function show(i) {
      index = i;
      var p = project.photos[index];
      photo.src = p.src;
      photo.alt = p.alt;
      captionEl.textContent = p.caption;
      dots.forEach(function (d, di) { d.classList.toggle("is-active", di === index); });
    }

    if (project.photos.length > 1) {
      var prev = el("button", "media-nav prev", CHEVRON_LEFT);
      prev.type = "button";
      prev.setAttribute("aria-label", "Foto anterior de " + project.name);
      prev.addEventListener("click", function () {
        show((index - 1 + project.photos.length) % project.photos.length);
      });

      var next = el("button", "media-nav next", CHEVRON_RIGHT);
      next.type = "button";
      next.setAttribute("aria-label", "Foto siguiente de " + project.name);
      next.addEventListener("click", function () {
        show((index + 1) % project.photos.length);
      });

      media.appendChild(prev);
      media.appendChild(next);

      var dotsWrap = el("div", "media-dots");
      project.photos.forEach(function () {
        var d = el("span", "dot");
        dots.push(d);
        dotsWrap.appendChild(d);
      });
      media.appendChild(dotsWrap);
    }

    show(0);
    return card;
  }

  var projectGrid = document.getElementById("projectGrid");
  if (projectGrid) {
    PROJECTS.forEach(function (p) { projectGrid.appendChild(buildProjectCard(p)); });
    projectGrid.appendChild(buildProjectCard(COMING_SOON));
  }

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
