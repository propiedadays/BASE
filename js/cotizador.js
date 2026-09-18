(function () {
  "use strict";

  // ───────────────────────────────────────────────────────────
  // ⚠️ VALORES DE REFERENCIA — confirmar con Arista antes de publicar:
  // precios por m², beneficios incluidos, y el catálogo de actividades
  // (BOQ) que arma "¿Qué incluye tu cotización?".
  // ───────────────────────────────────────────────────────────
  var PRICE_PER_M2 = {
    esencial: [800000, 1100000],
    confort: [1300000, 1600000],
    alta: [2000000, 3000000]
  };
  var FINISH_LABEL = { esencial: "Esencial", confort: "Confort", alta: "Alta gama" };

  // El brief de precio original habla de un multiplicador por "tipo de
  // espacio" cocina/baño ×1.25–1.30, habitación ×0.85, resto ×1.00 — pero
  // el Paso 1 solo pregunta Apartamento/Casa/Oficina como tipo de espacio,
  // no cocina/baño/habitación como alcance completo del proyecto. Mientras
  // se confirma con Arista cómo debe aplicarse esa distinción, las tres
  // opciones quedan en el bucket "resto" (×1.00).
  var SPACE_MULTIPLIER = { apartamento: 1.00, casa: 1.00, oficina: 1.00 };
  var SPACE_LABEL = { apartamento: "Apartamento", casa: "Casa", oficina: "Oficina o local" };

  var SCOPE_STEP = 0.05;
  var KEEP_DISCOUNT = 0.025;
  var MIN_MULTIPLIER = 0.55;
  var WHATSAPP_NUMBER = "573008458177";
  var DEFAULT_SCOPE = ["demolicion", "redes", "pisos", "pintura", "cocina_int", "banos", "carpinteria"];

  var CITY_OPTIONS = ["Medellín", "Sabaneta", "Itagüí", "Bello", "Rionegro", "Marinilla", "El Retiro"];

  var SCOPE_ITEMS = [
    { id: "demolicion", t: "Demolición", d: "Retiro de acabados o muros existentes" },
    { id: "redes", t: "Redes eléctricas / hidráulicas", d: "Cambio o ampliación de instalaciones" },
    { id: "pisos", t: "Pisos", d: "Cambio de piso en el área" },
    { id: "pintura", t: "Pintura", d: "Estuco y pintura general" },
    { id: "cocina_int", t: "Cocina integral", d: "Mesón, muebles y enchape de cocina" },
    { id: "banos", t: "Baños", d: "Enchape, aparatos y mueble de baño" },
    { id: "carpinteria", t: "Carpintería / mobiliario", d: "Closets y muebles a medida" }
  ];
  var SCOPE_LABEL = {};
  SCOPE_ITEMS.forEach(function (s) { SCOPE_LABEL[s.id] = s.t; });

  var KEEP_ITEMS = [
    { id: "pisos_ex", t: "Pisos existentes" },
    { id: "meson_ex", t: "Mesón de cocina" },
    { id: "sanit_ex", t: "Aparatos sanitarios y grifería" },
    { id: "puertas_ex", t: "Puertas y clósets actuales" },
    { id: "electr_ex", t: "Instalación eléctrica actual" },
    { id: "vent_ex", t: "Ventanería" }
  ];

  // Copy siguiendo la guía de voz: específico, sin adjetivos vacíos, tú, sin emoji.
  // Confirmar con Arista antes de publicar — no agregar cifras propias.
  var BENEFITS = [
    "Presupuesto cerrado, sin sorpresas",
    "Reportes semanales con fotos",
    "Un ingeniero acompaña tu obra",
    "Administración delegada o todo costo según tu preferencia",
    "Contrato firmado antes de iniciar",
    "Garantía de 6 meses en mano de obra"
  ];

  // Iconos de línea, trazo 1.5, dorado vía currentColor — nunca relleno ni emoji.
  var CHECK_ICON = '<svg class="icon" viewBox="0 0 12 12" fill="none"><path d="M2 6.2 L4.8 9 L10 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CHAT_ICON = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12a8 8 0 1 1 3.3 6.5L4 20l1.3-3.6A7.96 7.96 0 0 1 4 12Z" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var HOUSE_ICON = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 11.5 12 4l9 7.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 10v9.5a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1V15a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4.5a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1V10" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var TREND_ICON = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 17 9.5 10 14 14.5 21 6" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 6h6v6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var DEFAULT_STATE = function () {
    return {
      space: "apartamento", city: null, area: null, timing: null, rooms: null, baths: null,
      name: "", email: "", phone: "",
      use: null,
      finish: "confort", scope: DEFAULT_SCOPE.slice(),
      keep: []
    };
  };
  var state = DEFAULT_STATE();

  var STEPS = ["form", "use", "budget1", "personalize", "keep", "budget2"];
  var STEP_META = {
    form: { n: 1, label: "Tu proyecto" },
    use: { n: 2, label: "El uso final" },
    budget1: { n: 3, label: "Presupuesto inicial" },
    personalize: { n: 4, label: "Personaliza tu proyecto" },
    keep: { n: 5, label: "Qué conservar" }
  };
  var TOTAL_STEPS = 5;

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function fmtCOP(n) {
    n = Math.round(n / 50000) * 50000;
    return "$" + n.toLocaleString("es-CO");
  }

  var container = document.getElementById("steps");

  function stepShell(title, sub) {
    var s = el("div", "step");
    s.appendChild(el("h1", "step-title", title));
    if (sub) s.appendChild(el("p", "step-sub", sub));
    return s;
  }

  function addNav(s, opts) {
    var nav = el("div", "quote-step-nav");
    if (opts.showBack) {
      var back = el("button", "btn btn-ghost", "←");
      back.type = "button";
      back.addEventListener("click", opts.onBack);
      nav.appendChild(back);
    }
    var next = el("button", "btn btn-primary", "<span>" + (opts.label || "Continuar") + "</span>");
    next.type = "button";
    next.disabled = !opts.isValid();
    next.addEventListener("click", function () { if (opts.isValid()) opts.onNext(); });
    nav.appendChild(next);
    s.appendChild(nav);
    return function () { next.disabled = !opts.isValid(); };
  }

  // ---------- Paso 1: formulario del proyecto ----------
  function renderForm() {
    var s = stepShell("Cuéntanos de tu proyecto", "Con esto preparamos un primer estimado de tu remodelación.");

    var hero = el("div", "quote-hero-panel");
    hero.innerHTML = '<img class="photo" src="assets/proyecto-loft-altillo.jpg" alt="Loft remodelado por Arista en Medellín">' +
      '<div class="hp-label">Arista · Espacios y Proyectos</div>';
    s.appendChild(hero);

    var grid = el("div", "form-grid");

    function selectField(label, id, options, placeholder) {
      var f = el("div", "field");
      var sel = document.createElement("select");
      sel.id = id;
      var opt0 = document.createElement("option");
      opt0.value = ""; opt0.textContent = placeholder || "Selecciona…"; opt0.disabled = true; opt0.selected = true;
      sel.appendChild(opt0);
      options.forEach(function (o) {
        var op = document.createElement("option");
        op.value = o[0]; op.textContent = o[1];
        sel.appendChild(op);
      });
      var lab = document.createElement("label"); lab.htmlFor = id; lab.textContent = label;
      f.appendChild(lab); f.appendChild(sel);
      return { wrap: f, el: sel };
    }

    function textField(label, id, type, placeholder, autocomplete) {
      var f = el("div", "field");
      var inp = document.createElement("input");
      inp.type = type; inp.id = id; inp.placeholder = placeholder || "";
      if (autocomplete) inp.autocomplete = autocomplete;
      var lab = document.createElement("label"); lab.htmlFor = id; lab.textContent = label;
      f.appendChild(lab); f.appendChild(inp);
      return { wrap: f, el: inp };
    }

    var fSpace = selectField("Tipo de espacio", "spaceInput", [["apartamento", "Apartamento"], ["casa", "Casa"], ["oficina", "Oficina o local"]]);
    var fCity = selectField("Ciudad", "cityInput", CITY_OPTIONS.map(function (c) { return [c, c]; }));
    var fArea = textField("Área construida (m²)", "areaInput", "number", "Ej. 75");
    var fTiming = selectField("Fecha estimada de inicio", "timingInput", [["ya", "Lo antes posible"], ["1-3", "En 1 a 3 meses"], ["3-6", "En 3 a 6 meses"], ["explorando", "Aún explorando opciones"]]);
    var fRooms = selectField("Habitaciones", "roomsInput", [["1", "1"], ["2", "2"], ["3", "3"], ["4", "4+"]]);
    var fBaths = selectField("Baños", "bathsInput", [["1", "1"], ["2", "2"], ["3", "3+"]]);
    var fName = textField("Nombre", "nameInput", "text", "Tu nombre", "name");
    var fEmail = textField("Correo electrónico", "emailInput", "email", "tucorreo@ejemplo.com", "email");
    var fPhone = textField("WhatsApp", "phoneInput", "tel", "Ej. 300 123 4567", "tel");

    var row = el("div", "field-row");
    row.appendChild(fRooms.wrap); row.appendChild(fBaths.wrap);

    [fSpace.wrap, fCity.wrap, fArea.wrap, fTiming.wrap].forEach(function (w) { grid.appendChild(w); });
    grid.appendChild(row);
    [fName.wrap, fEmail.wrap, fPhone.wrap].forEach(function (w) { grid.appendChild(w); });
    s.appendChild(grid);

    fSpace.el.value = state.space || "";
    if (state.city) fCity.el.value = state.city;
    if (state.area) fArea.el.value = state.area;
    if (state.timing) fTiming.el.value = state.timing;
    if (state.rooms) fRooms.el.value = state.rooms;
    if (state.baths) fBaths.el.value = state.baths;
    fName.el.value = state.name; fEmail.el.value = state.email; fPhone.el.value = state.phone;

    var refresh;
    fSpace.el.addEventListener("change", function () { state.space = fSpace.el.value; refresh(); });
    fCity.el.addEventListener("change", function () { state.city = fCity.el.value; refresh(); });
    fArea.el.addEventListener("input", function () { var v = parseInt(fArea.el.value, 10); state.area = (v && v > 0) ? v : null; refresh(); });
    fTiming.el.addEventListener("change", function () { state.timing = fTiming.el.value; refresh(); });
    fRooms.el.addEventListener("change", function () { state.rooms = fRooms.el.value; refresh(); });
    fBaths.el.addEventListener("change", function () { state.baths = fBaths.el.value; refresh(); });
    fName.el.addEventListener("input", function () { state.name = fName.el.value.trim(); refresh(); });
    fEmail.el.addEventListener("input", function () { state.email = fEmail.el.value.trim(); refresh(); });
    fPhone.el.addEventListener("input", function () { state.phone = fPhone.el.value.trim(); refresh(); });

    refresh = addNav(s, {
      showBack: false,
      isValid: function () {
        return !!(state.space && state.city && state.area && state.timing && state.rooms && state.baths &&
          state.name.length > 1 && /\S+@\S+\.\S+/.test(state.email) && state.phone.replace(/\D/g, "").length >= 7);
      },
      onNext: function () { goTo(1); }
    });
    return s;
  }

  // ---------- Paso 2: uso final ----------
  function renderUse() {
    var s = stepShell("¿Cómo quieres usar este espacio?", "Esto define cómo enfocamos los acabados y el presupuesto.");
    var cards = el("div", "use-cards");
    var options = [
      { id: "vivir", t: "Vivir", icon: HOUSE_ICON, q: "Busco un espacio alineado con mi estilo de vida y mis rutinas diarias." },
      { id: "inversion", t: "Arrendar o vender", icon: TREND_ICON, q: "Quiero un espacio atractivo y competitivo para el mercado." }
    ];
    var refresh;
    options.forEach(function (o) {
      var c = el("button", "use-card", o.icon + '<div class="u-title">' + o.t + '</div><div class="u-quote">“' + o.q + '”</div>');
      c.type = "button";
      c.addEventListener("click", function () {
        state.use = o.id;
        cards.querySelectorAll(".use-card").forEach(function (x) { x.classList.remove("is-selected"); });
        c.classList.add("is-selected");
        refresh();
      });
      if (state.use === o.id) c.classList.add("is-selected");
      cards.appendChild(c);
    });
    s.appendChild(cards);
    refresh = addNav(s, {
      showBack: true, onBack: function () { goTo(0); },
      isValid: function () { return !!state.use; },
      onNext: function () { goTo(2); }
    });
    return s;
  }

  // ---------- BOQ (actividades) ----------
  // ⚠️ Catálogo de referencia — reemplazar por el listado real de Arista.
  function buildBOQ() {
    var area = state.area || 0, rooms = parseInt(state.rooms, 10) || 1, baths = parseInt(state.baths, 10) || 1;
    var cats = [];
    function cat(name, items) { items = items.filter(Boolean); if (items.length) cats.push({ name: name, items: items }); }

    cat("Generales", [
      { d: "Paneles LED para iluminación en cielo", u: "UND", q: Math.max(4, Math.round(area / 6)) },
      state.scope.indexOf("demolicion") > -1 ? { d: "Demolición de acabados existentes", u: "M²", q: area } : null,
      state.scope.indexOf("pisos") > -1 ? { d: "Mortero de nivelación", u: "M²", q: area } : null,
      state.scope.indexOf("pintura") > -1 ? { d: "Estuco y pintura general", u: "M²", q: Math.round(area * 2.4) } : null
    ]);
    cat("Pisos y enchapes", [
      state.scope.indexOf("pisos") > -1 ? { d: "Suministro e instalación de piso", u: "M²", q: area } : null,
      state.scope.indexOf("pisos") > -1 ? { d: "Guardaescoba en todo el perímetro", u: "ML", q: Math.round(Math.sqrt(area) * 4) } : null
    ]);
    cat("Cocina", [
      state.scope.indexOf("cocina_int") > -1 ? { d: "Mesón en cuarzo", u: "ML", q: 3.5 } : null,
      state.scope.indexOf("cocina_int") > -1 ? { d: "Muebles superiores e inferiores", u: "ML", q: 4.5 } : null,
      state.scope.indexOf("cocina_int") > -1 ? { d: "Enchape de cocina", u: "M²", q: Math.round(area * 0.12) } : null
    ]);
    cat("Baños", [
      state.scope.indexOf("banos") > -1 ? { d: "Enchape de baño", u: "M²", q: baths * 7 } : null,
      state.scope.indexOf("banos") > -1 ? { d: "Mueble y lavamanos", u: "UND", q: baths } : null,
      state.scope.indexOf("banos") > -1 ? { d: "Aparatos sanitarios", u: "UND", q: baths } : null
    ]);
    cat("Eléctrico e hidráulico", [
      state.scope.indexOf("redes") > -1 ? { d: "Puntos eléctricos nuevos", u: "UND", q: Math.max(6, Math.round(area / 4)) } : null,
      state.scope.indexOf("redes") > -1 ? { d: "Puntos hidrosanitarios", u: "UND", q: rooms + baths } : null
    ]);
    cat("Carpintería", [
      state.scope.indexOf("carpinteria") > -1 ? { d: "Closet a medida", u: "ML", q: +(rooms * 2.2).toFixed(1) } : null
    ]);

    return cats;
  }

  function computeRange() {
    var band = PRICE_PER_M2[state.finish] || PRICE_PER_M2.confort;
    var mult = SPACE_MULTIPLIER[state.space] || 1;
    var extraScopes = Math.max(0, state.scope.length - 2);
    mult += extraScopes * SCOPE_STEP;
    mult -= state.keep.length * KEEP_DISCOUNT;
    mult = Math.max(MIN_MULTIPLIER, mult);
    var area = state.area || 0;
    return { min: band[0] * area * mult, max: band[1] * area * mult };
  }

  function waHref() {
    var range = computeRange();
    var msgLines = [
      "Hola Arista, quiero cotizar una remodelación:",
      "- Espacio: " + (SPACE_LABEL[state.space] || "") + " en " + (state.city || ""),
      "- Área: " + state.area + " m²",
      "- Habitaciones: " + state.rooms + " · Baños: " + state.baths,
      "- Uso: " + (state.use === "vivir" ? "Vivir" : "Arrendar o vender"),
      "- Acabados: " + FINISH_LABEL[state.finish],
      "- Alcance: " + state.scope.map(function (id) { return SCOPE_LABEL[id]; }).join(", "),
      "- Inicio deseado: " + state.timing,
      "- Nombre: " + state.name,
      "- Rango estimado: " + fmtCOP(range.min) + " – " + fmtCOP(range.max)
    ];
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msgLines.join("\n"));
  }

  function renderBudgetTicket(s, opts) {
    var range = computeRange();
    s.appendChild(el("p", "eyebrow", opts.eyebrowText));
    if (opts.titleText) { s.appendChild(el("h1", "step-title", opts.titleText)); }
    s.appendChild(el("p", "budget-range", fmtCOP(range.min) + " – " + fmtCOP(range.max)));
    s.appendChild(el("hr", "budget-rule"));
    s.appendChild(el("p", "budget-caption", "Valor estimado de los acabados · <b>" + FINISH_LABEL[state.finish] + "</b>"));

    if (opts.showPersonalize) {
      var pnav = el("div", "quote-step-nav");
      var pbtn = el("button", "btn btn-primary", "<span>Personalizar</span>");
      pbtn.type = "button";
      pbtn.addEventListener("click", function () { goTo(3); });
      pnav.appendChild(pbtn);
      s.appendChild(pnav);
    }

    s.appendChild(el("hr", "quote-divider"));

    s.appendChild(el("div", "quote-section-label", "Beneficios incluidos"));
    var bgrid = el("div", "benefits-grid");
    BENEFITS.forEach(function (b) {
      bgrid.appendChild(el("div", "benefit", CHECK_ICON + "<span>" + b + "</span>"));
    });
    s.appendChild(bgrid);

    s.appendChild(el("hr", "quote-divider"));

    var boq = buildBOQ();
    var totalActs = boq.reduce(function (sum, c) { return sum + c.items.length; }, 0);
    var al = el("div", "quote-section-label");
    al.innerHTML = "<span>¿Qué incluye tu cotización?</span><span class=\"count\">" + totalActs + " actividades</span>";
    s.appendChild(al);

    var table = el("div", "activity-table");
    table.appendChild(el("div", "at-head", '<span class="c1">Descripción</span><span class="c2">Unidad</span><span class="c3">Cant.</span>'));
    boq.forEach(function (c) {
      table.appendChild(el("div", "at-cat", c.name));
      c.items.forEach(function (it) {
        table.appendChild(el("div", "at-row", '<span class="c1">' + it.d + '</span><span class="c2">' + it.u + '</span><span class="c3">' + it.q + '</span>'));
      });
    });
    s.appendChild(table);

    var banner = el("div", "cta-banner");
    banner.innerHTML =
      '<p class="cb-eyebrow" style="font-size:9.5px;letter-spacing:.28em;text-transform:uppercase;color:var(--gold-400);margin:0 0 10px">Siguiente paso</p>' +
      '<h2>Un solo equipo responde <em>por el diseño y por la obra</em></h2>' +
      '<p>' + opts.note + '</p>' +
      '<a class="btn btn-primary" href="' + waHref() + '" target="_blank" rel="noopener">' + CHAT_ICON + '<span>Hablemos de tu proyecto</span></a>';
    s.appendChild(banner);

    if (opts.showBack) {
      var nav = el("div", "quote-step-nav");
      var back = el("button", "btn btn-ghost", "←"); back.type = "button";
      back.addEventListener("click", opts.onBack);
      nav.appendChild(back);
      var restart = el("button", "btn btn-primary", "<span>Empezar de nuevo</span>"); restart.type = "button";
      restart.addEventListener("click", function () {
        state = DEFAULT_STATE();
        goTo(0);
      });
      nav.appendChild(restart);
      s.appendChild(nav);
    }
  }

  function renderBudget1() {
    var s = el("div", "step");
    renderBudgetTicket(s, {
      eyebrowText: "Tu cotización base",
      showPersonalize: true,
      showBack: false,
      note: "Este es un primer estimado con acabados Confort. Personalízalo para ajustar nivel de acabados, alcance del trabajo y qué elementos actuales quieres conservar — o agenda directamente una visita técnica sin costo."
    });
    return s;
  }

  // ---------- Paso 4: personalizar ----------
  function renderPersonalize() {
    var s = stepShell("Personaliza tu proyecto", "Ajusta el nivel de acabados y qué incluye el trabajo.");

    s.appendChild(el("p", "quote-section-label", "Nivel de acabados"));
    var finishChoices = el("div", "choices");
    var finishOptions = [
      { id: "esencial", t: "Esencial", d: "Materiales funcionales, buena relación costo–durabilidad" },
      { id: "confort", t: "Confort", d: "Materiales de gama media, mejores terminaciones" },
      { id: "alta", t: "Alta gama", d: "Materiales premium y acabados a medida" }
    ];
    finishOptions.forEach(function (o) {
      var c = el("button", "choice"); c.type = "button"; c.dataset.kind = "radio";
      c.innerHTML = '<span class="c-main"><span class="c-title">' + o.t + '</span><span class="c-desc">' + o.d + '</span></span><span class="c-check">' + CHECK_ICON + '</span>';
      c.addEventListener("click", function () {
        state.finish = o.id;
        finishChoices.querySelectorAll(".choice").forEach(function (x) { x.classList.remove("is-selected"); });
        c.classList.add("is-selected");
      });
      if (state.finish === o.id) c.classList.add("is-selected");
      finishChoices.appendChild(c);
    });
    s.appendChild(finishChoices);

    var subB = el("p", "quote-section-label", "Alcance del trabajo");
    subB.style.marginTop = "20px";
    s.appendChild(subB);
    var scopeChoices = el("div", "choices");
    var refresh;
    SCOPE_ITEMS.forEach(function (o) {
      var c = el("button", "choice"); c.type = "button"; c.dataset.kind = "checkbox";
      c.innerHTML = '<span class="c-main"><span class="c-title">' + o.t + '</span><span class="c-desc">' + o.d + '</span></span><span class="c-check">' + CHECK_ICON + '</span>';
      c.addEventListener("click", function () {
        var idx = state.scope.indexOf(o.id);
        if (idx === -1) { state.scope.push(o.id); c.classList.add("is-selected"); }
        else { state.scope.splice(idx, 1); c.classList.remove("is-selected"); }
        refresh();
      });
      if (state.scope.indexOf(o.id) > -1) c.classList.add("is-selected");
      scopeChoices.appendChild(c);
    });
    s.appendChild(scopeChoices);

    refresh = addNav(s, {
      showBack: true, onBack: function () { goTo(2); },
      isValid: function () { return state.scope.length > 0; },
      onNext: function () { goTo(4); }
    });
    return s;
  }

  // ---------- Paso 5: qué conservar ----------
  function renderKeep() {
    var s = stepShell("¿Qué elementos actuales quieres conservar?", "Lo que conserves se descuenta del alcance del trabajo.");

    var illus = el("div", "plan-illus");
    illus.innerHTML = '<svg viewBox="0 0 220 150" fill="none">' +
      '<rect x="10" y="15" width="200" height="120" stroke="#B8A068" stroke-width="1.4"/>' +
      '<line x1="95" y1="15" x2="95" y2="80" stroke="#B8A068" stroke-width="1.4"/>' +
      '<line x1="95" y1="80" x2="210" y2="80" stroke="#B8A068" stroke-width="1.4"/>' +
      '<line x1="150" y1="80" x2="150" y2="135" stroke="#B8A068" stroke-width="1.4"/>' +
      '</svg>';
    s.appendChild(illus);

    var choices = el("div", "choices");
    KEEP_ITEMS.forEach(function (o) {
      var c = el("button", "choice"); c.type = "button"; c.dataset.kind = "checkbox";
      c.innerHTML = '<span class="c-main"><span class="c-title">' + o.t + '</span></span><span class="c-check">' + CHECK_ICON + '</span>';
      c.addEventListener("click", function () {
        var idx = state.keep.indexOf(o.id);
        if (idx === -1) { state.keep.push(o.id); c.classList.add("is-selected"); }
        else { state.keep.splice(idx, 1); c.classList.remove("is-selected"); }
      });
      if (state.keep.indexOf(o.id) > -1) c.classList.add("is-selected");
      choices.appendChild(c);
    });
    s.appendChild(choices);

    addNav(s, {
      showBack: true, onBack: function () { goTo(3); },
      isValid: function () { return true; },
      label: "Ver mi cotización",
      onNext: function () { goTo(5); }
    });
    return s;
  }

  function renderBudget2() {
    var s = el("div", "step");
    renderBudgetTicket(s, {
      eyebrowText: "Tu cotización personalizada",
      showPersonalize: false,
      showBack: true,
      onBack: function () { goTo(4); },
      note: "Este rango ya refleja tus acabados, alcance y lo que decidiste conservar. Agenda una visita técnica sin costo y lo confirmamos contigo."
    });
    return s;
  }

  var RENDERERS = { form: renderForm, use: renderUse, budget1: renderBudget1, personalize: renderPersonalize, keep: renderKeep, budget2: renderBudget2 };

  function renderStepper(idx) {
    var key = STEPS[idx];
    var shell = document.getElementById("stepperShell");
    var meta = STEP_META[key];
    if (!meta) { shell.hidden = true; return; }
    shell.hidden = false;
    var stepper = document.getElementById("stepper");
    stepper.innerHTML = "";
    for (var i = 1; i <= TOTAL_STEPS; i++) {
      stepper.appendChild(el("div", "dot" + (i < meta.n ? " done" : "") + (i === meta.n ? " current" : "")));
      if (i < TOTAL_STEPS) { stepper.appendChild(el("div", "seg" + (i < meta.n ? " done" : ""))); }
    }
    document.getElementById("stepMeta").innerHTML = "Paso " + meta.n + " de " + TOTAL_STEPS + " · <b>" + meta.label.toUpperCase() + "</b>";
  }

  function renderFloatCta(key) {
    var shell = document.getElementById("floatCta");
    var isBudget = (key === "budget1" || key === "budget2");
    var canSend = state.phone && state.phone.replace(/\D/g, "").length >= 7;
    if (!isBudget || !canSend) { shell.hidden = true; shell.innerHTML = ""; return; }
    shell.hidden = false;
    shell.innerHTML = '<a href="' + waHref() + '" target="_blank" rel="noopener">' + CHAT_ICON + '<span>Hablemos</span></a>';
  }

  function goTo(idx) {
    var key = STEPS[idx];
    container.innerHTML = "";
    container.appendChild(RENDERERS[key]());
    renderStepper(idx);
    renderFloatCta(key);
    window.scrollTo(0, 0);
  }

  goTo(0);
})();
