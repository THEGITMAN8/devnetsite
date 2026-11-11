document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var recapCount = document.querySelector("[data-recap-count]");
  var recapRoll = document.querySelector(".recap-roll");
  if (recapCount && recapRoll) {
    recapCount.textContent = String(recapRoll.querySelectorAll("img").length);
  }

  var header = document.getElementById("site-header");
  var toggle = document.getElementById("menu-toggle");
  var menu = document.getElementById("mobile-menu");
  var openIcon = toggle ? toggle.querySelector(".icon-open") : null;
  var closeIcon = toggle ? toggle.querySelector(".icon-close") : null;

  function focusable() {
    if (!menu) return [];
    return Array.prototype.slice.call(menu.querySelectorAll("a, button")).filter(function (el) {
      return !el.hasAttribute("disabled");
    });
  }

  function setOpen(open) {
    if (!toggle || !menu) return;
    menu.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (openIcon) openIcon.hidden = open;
    if (closeIcon) closeIcon.hidden = !open;
    if (open) {
      var items = focusable();
      if (items[0]) items[0].focus();
    }
  }

  if (toggle && menu) {
    setOpen(false);
    toggle.addEventListener("click", function () {
      setOpen(!menu.classList.contains("is-open"));
    });
    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (event) {
      if (!menu.classList.contains("is-open")) return;
      if (event.key === "Escape") {
        setOpen(false);
        toggle.focus();
        return;
      }
      if (event.key !== "Tab") return;
      var items = focusable();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.matchMedia("(min-width: 768px)").matches) setOpen(false);
    });
  }

  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var phoneQuery = window.matchMedia("(max-width: 767px)");
  var motionOn = document.documentElement.classList.contains("motion-on");
  var revealNodes = document.querySelectorAll(".reveal");
  function markVisible(node) {
    var rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 40) node.classList.add("is-in");
  }
  function markAllVisible() {
    revealNodes.forEach(markVisible);
  }
  if (motionOn || reduce || phoneQuery.matches || !("IntersectionObserver" in window)) {
    revealNodes.forEach(function (node) {
      node.classList.add("is-in");
    });
  } else if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.08 }
    );
    revealNodes.forEach(function (node) {
      revealObserver.observe(node);
    });
    markAllVisible();
    window.addEventListener("scroll", markAllVisible, { passive: true });
  } else {
    revealNodes.forEach(function (node) {
      node.classList.add("is-in");
    });
  }

  var sectionIds = ["network", "western", "landed", "about", "events", "recap", "cursor", "builds", "faq", "socials"];
  var sections = sectionIds
    .map(function (id) {
      return document.getElementById(id);
    })
    .filter(Boolean);

  function placeNav() {
    var current = "";
    sections.forEach(function (section) {
      if (section.getBoundingClientRect().top < 140) current = section.id;
    });
    document.querySelectorAll("[data-nav]").forEach(function (link) {
      if (link.getAttribute("aria-current") === "page") return;
      var section = link.getAttribute("data-section") || "";
      var on = section !== "" && section === current;
      if (on) link.setAttribute("aria-current", "true");
      else if (link.getAttribute("aria-current") === "true") link.removeAttribute("aria-current");
    });
    var indicator = document.querySelector(".nav-indicator");
    var nav = document.querySelector(".desktop-nav");
    if (!indicator || !nav) return;
    var link = current ? nav.querySelector('[data-section="' + current + '"]') : null;
    if (!link) link = nav.querySelector('[aria-current="page"]');
    if (!link || nav.offsetParent === null) {
      indicator.classList.remove("is-on");
      return;
    }
    var x = link.offsetLeft + link.offsetWidth / 2 - 12;
    indicator.style.transform = "translate3d(" + x.toFixed(1) + "px,0,0)";
    indicator.classList.add("is-on");
  }
  placeNav();
  window.addEventListener("scroll", placeNav, { passive: true });
  window.addEventListener("resize", placeNav);

  var stage = document.querySelector(".map-stage");
  var matrix = stage ? stage.querySelector(".matrix") : null;
  function showMapFallback() {
    if (!stage) return;
    stage.classList.add("map-stage--fallback");
    if (matrix) matrix.hidden = true;
  }
  if (matrix) {
    matrix.addEventListener("error", showMapFallback);
    if (matrix.complete && matrix.naturalWidth === 0) showMapFallback();
    var mapSrc = matrix.getAttribute("src");
    var sharpened = false;
    function sharpenMap() {
      if (sharpened || !mapSrc || !window.fetch || !window.DOMParser) return;
      if (!matrix || !matrix.parentNode || String(matrix.tagName).toLowerCase() !== "img") return;
      sharpened = true;
      fetch(mapSrc).then(function (res) {
        if (!res.ok) throw new Error("map");
        return res.text();
      }).then(function (text) {
        if (!matrix.parentNode) return;
        var doc = new DOMParser().parseFromString(text, "image/svg+xml");
        var svg = doc.documentElement;
        if (!svg || String(svg.tagName).toLowerCase() !== "svg") return;
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.removeAttribute("style");
        var styled = svg.querySelectorAll("[style]");
        for (var s = 0; s < styled.length; s++) styled[s].removeAttribute("style");
        svg.setAttribute("class", "matrix");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        matrix.replaceWith(svg);
        matrix = svg;
      }).catch(function () {
        sharpened = false;
        if (matrix.complete && matrix.naturalWidth === 0) showMapFallback();
      });
    }
    if (stage && "IntersectionObserver" in window) {
      var sharpenObserver = new IntersectionObserver(function (entries) {
        if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
        sharpenObserver.disconnect();
        sharpenMap();
      }, { rootMargin: "160px" });
      sharpenObserver.observe(stage);
    } else {
      sharpenMap();
    }
    if (stage) stage.addEventListener("pointerdown", sharpenMap, { once: true });
  }
  function drawMap() {
    if (!stage || stage.classList.contains("is-drawn")) return;
    var rect = stage.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.8 && rect.bottom > 80) stage.classList.add("is-drawn");
  }
  if (stage && !reduce && "IntersectionObserver" in window) {
    var mapObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          stage.classList.add("is-drawn");
          mapObserver.unobserve(stage);
        });
      },
      { threshold: 0.2 }
    );
    mapObserver.observe(stage);
    drawMap();
    window.addEventListener("scroll", drawMap, { passive: true });
  } else if (stage) {
    stage.classList.add("is-drawn");
  }

  var ONTARIO = { london: true, waterloo: true, guelph: true, toronto: true, kingston: true };

  function setupGeoMap(mapStage, svg, reduced) {
    var viewport = mapStage.querySelector(".map-viewport");
    var labelLayer = mapStage.querySelector(".map-labels");
    var SVG_NS = "http://www.w3.org/2000/svg";
    var parts = (svg.getAttribute("viewBox") || "0 0 1000 598.9").split(/[\s,]+/).map(Number);
    var outer = { x: parts[0] || 0, y: parts[1] || 0, w: parts[2] || 1000, h: parts[3] || 598.9 };
    var aspect = outer.w / outer.h;
    var beltW = 230;
    var belt = { x: 548, y: 188, w: beltW, h: beltW / aspect };
    var minW = 78;
    var view = { x: belt.x, y: belt.y, w: belt.w, h: belt.h };
    var pins = Array.prototype.slice.call(svg.querySelectorAll(".na-pin"));
    var ontarioPins = pins.filter(function (pin) { return ONTARIO[pin.getAttribute("data-city")]; });
    var tween = null;
    var exploded = false;
    var clustered = true;
    var arcsPlayed = false;
    var arcMode = "";
    var drag = null;
    var pointers = {};
    var pinchDist = 0;
    var sx = 0;
    var sy = 0;
    ontarioPins.forEach(function (pin) {
      sx += Number(pin.getAttribute("data-x"));
      sy += Number(pin.getAttribute("data-y"));
    });
    var centroid = {
      x: sx / (ontarioPins.length || 1),
      y: sy / (ontarioPins.length || 1)
    };
    var bias = {
      vancouver: [-1, -0.35],
      london: [-1, 0.55],
      waterloo: [-1, -1],
      guelph: [0.9, -1],
      toronto: [0.1, 1],
      kingston: [1, -0.15],
      montreal: [0.1, -1],
      halifax: [-1, -0.15],
      tucson: [0.35, 1],
      miami: [0, -1],
      boston: [1, -0.75],
      "new-york-city": [-1, 0.85],
      ontario: [0, -1]
    };

    function svgEl(name, attrs) {
      var el = document.createElementNS(SVG_NS, name);
      Object.keys(attrs).forEach(function (key) { el.setAttribute(key, attrs[key]); });
      return el;
    }

    var arcs = svgEl("g", { class: "na-arcs" });
    var pinLayer = svg.querySelector(".na-pins");
    svg.insertBefore(arcs, pinLayer);

    var cluster = svgEl("g", {
      class: "pin na-pin pin--cluster",
      "data-city": "ontario",
      "data-cluster": "ontario",
      "data-name": "Ontario",
      "data-country": "Canada",
      role: "button",
      tabindex: "0",
      "aria-label": "Ontario, 5 cities",
      "aria-pressed": "false"
    });
    cluster.appendChild(svgEl("circle", { class: "pin__pulse", r: "7", fill: "none" }));
    cluster.appendChild(svgEl("circle", { class: "pin__hit", r: "22", fill: "none" }));
    cluster.appendChild(svgEl("circle", { class: "pin__dot", r: "6" }));
    cluster.appendChild(svgEl("line", { class: "pin__leader", x1: "0", y1: "0", x2: "0", y2: "0" }));
    cluster.setAttribute("transform", "translate(" + centroid.x.toFixed(2) + " " + centroid.y.toFixed(2) + ")");
    pinLayer.appendChild(cluster);

    if (labelLayer) {
      pins.forEach(function (pin) {
        var el = document.createElement("button");
        el.type = "button";
        el.className = "map-label";
        el.setAttribute("data-city", pin.getAttribute("data-city") || "");
        el.textContent = pin.getAttribute("data-name") || "";
        el.setAttribute("aria-pressed", "false");
        labelLayer.appendChild(el);
        pin._label = el;
      });
      var hubLabel = document.createElement("button");
      hubLabel.type = "button";
      hubLabel.className = "map-label map-label--hub";
      hubLabel.setAttribute("data-city", "ontario");
      hubLabel.textContent = "Ontario · 5";
      hubLabel.setAttribute("aria-label", "Ontario, 5 cities");
      hubLabel.setAttribute("aria-pressed", "false");
      labelLayer.appendChild(hubLabel);
      cluster._label = hubLabel;
    }

    function onKey(pin) {
      pin.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        pin.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
    }
    pins.forEach(onKey);
    onKey(cluster);

    function geoScreen(pin) {
      var rect = svg.getBoundingClientRect();
      var x = Number(pin.getAttribute("data-x"));
      var y = Number(pin.getAttribute("data-y"));
      if (!rect.width) return { x: 0, y: 0 };
      return {
        x: rect.left + ((x - view.x) / view.w) * rect.width,
        y: rect.top + ((y - view.y) / view.h) * rect.height
      };
    }

    function ontarioGap() {
      var rect = svg.getBoundingClientRect();
      if (!rect.width) return 0;
      var pts = ontarioPins.map(geoScreen);
      var min = Infinity;
      for (var i = 0; i < pts.length; i++) {
        for (var j = i + 1; j < pts.length; j++) {
          var d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d < min) min = d;
        }
      }
      return min;
    }

    function placeAtGeo(pin) {
      pin.setAttribute("transform", "translate(" + pin.getAttribute("data-x") + " " + pin.getAttribute("data-y") + ")");
    }

    function separateOntario() {
      var rect = svg.getBoundingClientRect();
      if (!rect.width) return;
      var pts = ontarioPins.map(function (pin) {
        var g = geoScreen(pin);
        return { pin: pin, x: g.x, y: g.y, hx: g.x, hy: g.y };
      });
      var minGap = 30;
      function relax(spring) {
        for (var i = 0; i < pts.length; i++) {
          for (var j = i + 1; j < pts.length; j++) {
            var a = pts[i];
            var b = pts[j];
            var dx = b.x - a.x;
            var dy = b.y - a.y;
            var dist = Math.hypot(dx, dy);
            if (dist >= minGap) continue;
            var push = (minGap - dist) / 2 + 0.35;
            var ux;
            var uy;
            if (dist < 0.2) {
              var ang = (i + 1) * 1.35 + j;
              ux = Math.cos(ang);
              uy = Math.sin(ang);
            } else {
              ux = dx / dist;
              uy = dy / dist;
            }
            a.x -= ux * push;
            a.y -= uy * push;
            b.x += ux * push;
            b.y += uy * push;
          }
        }
        if (!spring) return;
        pts.forEach(function (p) {
          p.x += (p.hx - p.x) * 0.08;
          p.y += (p.hy - p.y) * 0.08;
        });
      }
      var n;
      for (n = 0; n < 40; n++) relax(true);
      for (n = 0; n < 30; n++) relax(false);
      var unit = view.w / rect.width;
      pts.forEach(function (p) {
        var gx = Number(p.pin.getAttribute("data-x"));
        var gy = Number(p.pin.getAttribute("data-y"));
        var dx = (p.x - p.hx) * unit;
        var dy = (p.y - p.hy) * unit;
        p.pin.setAttribute("transform", "translate(" + (gx + dx).toFixed(2) + " " + (gy + dy).toFixed(2) + ")");
      });
    }

    function arcPath(x1, y1, x2, y2) {
      var dx = x2 - x1;
      var dy = y2 - y1;
      var len = Math.hypot(dx, dy);
      if (len < 12) return "";
      var nx = -dy / len;
      var ny = dx / len;
      if (ny > 0) {
        nx *= -1;
        ny *= -1;
      }
      var bulge = Math.min(48, len * 0.16);
      var cx = (x1 + x2) / 2 + nx * bulge;
      var cy = (y1 + y2) / 2 + ny * bulge;
      return "M" + x1.toFixed(1) + " " + y1.toFixed(1) + " Q" + cx.toFixed(1) + " " + cy.toFixed(1) + " " + x2.toFixed(1) + " " + y2.toFixed(1);
    }

    function updateArcVisibility() {
      var padX = view.w * 0.08;
      var padY = view.h * 0.08;
      arcs.querySelectorAll(".na-arc").forEach(function (path) {
        var x = Number(path.getAttribute("data-x"));
        var y = Number(path.getAttribute("data-y"));
        var inside = x >= view.x - padX && x <= view.x + view.w + padX && y >= view.y - padY && y <= view.y + view.h + padY;
        path.classList.toggle("is-offscreen", !inside);
      });
    }

    function syncArcs(mode) {
      if (mode === arcMode) return;
      arcMode = mode;
      if (window.gsap) window.gsap.killTweensOf(".na-arc");
      arcs.replaceChildren();
      var london = document.querySelector('.na-pin[data-city="london"]');
      var origin = centroid;
      if (mode !== "hub" && london) {
        origin = { x: Number(london.getAttribute("data-x")), y: Number(london.getAttribute("data-y")) };
      }
      pins.forEach(function (pin) {
        var id = pin.getAttribute("data-city");
        if (mode === "hub" && ONTARIO[id]) return;
        if (mode !== "hub" && id === "london") return;
        var x = Number(pin.getAttribute("data-x"));
        var y = Number(pin.getAttribute("data-y"));
        var d = arcPath(origin.x, origin.y, x, y);
        if (!d) return;
        var path = svgEl("path", { class: "na-arc", d: d, "data-x": String(x), "data-y": String(y) });
        arcs.appendChild(path);
        if (reduced || arcsPlayed) return;
        var length = 0;
        try { length = path.getTotalLength(); } catch (err) { length = 0; }
        if (!length) return;
        path.setAttribute("stroke-dasharray", String(length));
        path.setAttribute("stroke-dashoffset", String(length));
      });
      updateArcVisibility();
    }

    function playArcs() {
      if (arcsPlayed) return;
      arcsPlayed = true;
      var paths = arcs.querySelectorAll(".na-arc");
      if (reduced || !window.gsap) {
        paths.forEach(function (path) {
          path.removeAttribute("stroke-dasharray");
          path.removeAttribute("stroke-dashoffset");
        });
        return;
      }
      paths.forEach(function (path, index) {
        var length = 0;
        try { length = path.getTotalLength(); } catch (err) { length = 0; }
        if (!length) return;
        path.setAttribute("stroke-dasharray", String(length));
        path.setAttribute("stroke-dashoffset", String(length));
        window.gsap.fromTo(path, { strokeDashoffset: length }, {
          strokeDashoffset: 0,
          duration: 0.55,
          delay: 0.08 + index * 0.035,
          ease: "power2.out",
          onComplete: function () {
            path.removeAttribute("stroke-dasharray");
            path.removeAttribute("stroke-dashoffset");
          }
        });
      });
    }

    function hidePin(pin, hide) {
      pin.classList.toggle("is-hidden", hide);
      pin.setAttribute("aria-hidden", hide ? "true" : "false");
      pin.setAttribute("tabindex", hide ? "-1" : "0");
      if (pin._label) {
        pin._label.hidden = hide;
        pin._label.tabIndex = hide ? -1 : 0;
      }
    }

    function applyCluster() {
      var gap = ontarioGap();
      var collapse = !exploded && gap < 26;
      clustered = collapse;
      mapStage.dataset.clustered = collapse ? "1" : "0";
      var tightOntario = exploded && view.w < 145;
      pins.forEach(function (pin) {
        var id = pin.getAttribute("data-city");
        hidePin(pin, (collapse && !!ONTARIO[id]) || (tightOntario && !ONTARIO[id]));
        if (!(exploded && ONTARIO[id] && gap < 26)) placeAtGeo(pin);
      });
      if (exploded && gap < 26) separateOntario();
      hidePin(cluster, !collapse);
      if (collapse) {
        cluster.setAttribute("transform", "translate(" + centroid.x.toFixed(2) + " " + centroid.y.toFixed(2) + ")");
      }
      syncArcs(collapse ? "hub" : "cities");
    }

    function syncDots() {
      var rect = svg.getBoundingClientRect();
      if (!rect.width) return;
      var unit = view.w / rect.width;
      pins.concat([cluster]).forEach(function (pin) {
        if (pin.classList.contains("is-hidden")) return;
        var dot = pin.querySelector(".pin__dot");
        var pulse = pin.querySelector(".pin__pulse");
        var hit = pin.querySelector(".pin__hit");
        var screenR = pin.classList.contains("pin--cluster") ? 7 : (pin.classList.contains("pin--founding") ? 6 : 4.5);
        if (dot) dot.setAttribute("r", (screenR * unit).toFixed(3));
        if (pulse) pulse.setAttribute("r", (screenR * unit).toFixed(3));
        if (hit) {
          var hitPx = pin.classList.contains("pin--cluster") ? 22 : 14;
          var nearest = nearestPx(pin);
          if (!pin.classList.contains("pin--cluster") && nearest > 0) {
            hitPx = Math.max(8, Math.min(14, nearest * 0.38));
          }
          hit.setAttribute("r", (hitPx * unit).toFixed(3));
        }
      });
    }

    function nearestPx(pin) {
      var dot = pin.querySelector(".pin__dot");
      if (!dot) return 0;
      var a = dot.getBoundingClientRect();
      var ax = a.left + a.width / 2;
      var ay = a.top + a.height / 2;
      var best = Infinity;
      pins.concat([cluster]).forEach(function (other) {
        if (other === pin || other.classList.contains("is-hidden")) return;
        var b = other.querySelector(".pin__dot");
        if (!b) return;
        var r = b.getBoundingClientRect();
        var d = Math.hypot(r.left + r.width / 2 - ax, r.top + r.height / 2 - ay);
        if (d > 0 && d < best) best = d;
      });
      return best === Infinity ? 0 : best;
    }

    function controlBox() {
      var controls = mapStage.querySelector(".map-controls");
      if (!controls || !viewport) return null;
      var vp = viewport.getBoundingClientRect();
      var c = controls.getBoundingClientRect();
      if (!c.width) return null;
      return {
        x: c.left - vp.left - 6,
        y: c.top - vp.top - 6,
        w: c.width + 12,
        h: c.height + 12
      };
    }

    function placeControls() {
      var controls = mapStage.querySelector(".map-controls");
      if (!controls || !viewport) return;
      var vp = viewport.getBoundingClientRect();
      var w = controls.offsetWidth || 148;
      var h = controls.offsetHeight || 44;
      var dots = [];
      svg.querySelectorAll(".pin__dot").forEach(function (dot) {
        var pin = dot.parentNode;
        if (!pin || pin.classList.contains("is-hidden")) return;
        var r = dot.getBoundingClientRect();
        if (!r.width) return;
        dots.push(r);
      });
      var spots = [
        { top: "10px", left: "10px", right: "auto", bottom: "auto" },
        { top: "10px", left: "auto", right: "10px", bottom: "auto" },
        { top: "auto", left: "10px", right: "auto", bottom: "10px" },
        { top: "auto", left: "auto", right: "10px", bottom: "10px" }
      ];
      function hits(spot) {
        var x = spot.left !== "auto" ? 10 : vp.width - w - 10;
        var y = spot.top !== "auto" ? 10 : vp.height - h - 10;
        var l = vp.left + x - 8;
        var t = vp.top + y - 8;
        var r = l + w + 16;
        var b = t + h + 16;
        return dots.some(function (d) {
          return d.left < r && d.right > l && d.top < b && d.bottom > t;
        });
      }
      var spot = spots[0];
      for (var i = 0; i < spots.length; i++) {
        if (!hits(spots[i])) {
          spot = spots[i];
          break;
        }
      }
      controls.style.top = spot.top;
      controls.style.left = spot.left;
      controls.style.right = spot.right;
      controls.style.bottom = spot.bottom;
    }

    function layoutLabels() {
      if (!labelLayer || !viewport) return;
      var vp = viewport.getBoundingClientRect();
      if (!vp.width || !vp.height) return;
      var shown = [];
      pins.concat([cluster]).forEach(function (pin) {
        if (pin.classList.contains("is-hidden")) {
          if (pin._label) pin._label.hidden = true;
          var hiddenLine = pin.querySelector(".pin__leader");
          if (hiddenLine) {
            hiddenLine.setAttribute("x2", "0");
            hiddenLine.setAttribute("y2", "0");
          }
          return;
        }
        shown.push(pin);
      });
      var items = [];
      shown.forEach(function (pin) {
        var id = pin.getAttribute("data-city") || "";
        var el = pin._label;
        var dot = pin.querySelector(".pin__dot");
        if (!el || !dot) return;
        if (exploded && view.w < 145 && id !== "ontario" && !ONTARIO[id]) {
          el.hidden = true;
          var farLine = pin.querySelector(".pin__leader");
          if (farLine) {
            farLine.setAttribute("x2", "0");
            farLine.setAttribute("y2", "0");
          }
          return;
        }
        el.hidden = false;
        var w = Math.max(24, el.offsetWidth);
        var h = Math.max(16, el.offsetHeight);
        var r = dot.getBoundingClientRect();
        var cx = r.left + r.width / 2 - vp.left;
        var cy = r.top + r.height / 2 - vp.top;
        var inside = cx >= -8 && cy >= -8 && cx <= vp.width + 8 && cy <= vp.height + 8;
        if (!inside) {
          el.hidden = true;
          return;
        }
        var pref = bias[id] || [0, -1];
        var lx = cx + pref[0] * (w * 0.5 + 12);
        var ly = cy + pref[1] * (h * 0.5 + 14);
        items.push({ id: id, pin: pin, el: el, w: w, h: h, cx: cx, cy: cy, x: lx - w / 2, y: ly - h / 2 });
      });
      var controls = controlBox();
      var edge = 4;
      var guard;
      for (guard = 0; guard < 80; guard++) {
        var moved = false;
        var a;
        var b;
        for (var i = 0; i < items.length; i++) {
          for (var j = i + 1; j < items.length; j++) {
            a = items[i];
            b = items[j];
            var overlapX = Math.min(a.x + a.w + 6, b.x + b.w + 6) - Math.max(a.x, b.x);
            var overlapY = Math.min(a.y + a.h + 6, b.y + b.h + 6) - Math.max(a.y, b.y);
            if (overlapX <= 0 || overlapY <= 0) continue;
            if (overlapX < overlapY) {
              var dir = a.cx <= b.cx ? -1 : 1;
              var push = overlapX / 2 + 0.5;
              a.x += dir * push;
              b.x -= dir * push;
            } else {
              var vdir = a.cy <= b.cy ? -1 : 1;
              var vpush = overlapY / 2 + 0.5;
              a.y += vdir * vpush;
              b.y -= vdir * vpush;
            }
            moved = true;
          }
        }
        items.forEach(function (it) {
          var left = it.x;
          var top = it.y;
          items.forEach(function (other) {
            var hx = Math.min(it.x + it.w, other.cx + 11) - Math.max(it.x, other.cx - 11);
            var hy = Math.min(it.y + it.h, other.cy + 11) - Math.max(it.y, other.cy - 11);
            if (hx <= 0 || hy <= 0) return;
            var dx = (it.x + it.w / 2) - other.cx;
            var dy = (it.y + it.h / 2) - other.cy;
            if (Math.abs(dx) >= Math.abs(dy)) it.x += dx >= 0 ? hx + 3 : -(hx + 3);
            else it.y += dy >= 0 ? hy + 3 : -(hy + 3);
            moved = true;
          });
          if (controls) {
            var cx0 = Math.min(it.x + it.w, controls.x + controls.w) - Math.max(it.x, controls.x);
            var cy0 = Math.min(it.y + it.h, controls.y + controls.h) - Math.max(it.y, controls.y);
            if (cx0 > 0 && cy0 > 0) {
              it.y = controls.y > vp.height / 2 ? controls.y - it.h - 6 : controls.y + controls.h + 6;
              moved = true;
            }
          }
          if (it.x < edge) it.x = edge;
          if (it.y < edge) it.y = edge;
          if (it.x + it.w > vp.width - edge) it.x = Math.max(edge, vp.width - edge - it.w);
          if (it.y + it.h > vp.height - edge) it.y = Math.max(edge, vp.height - edge - it.h);
          if (it.x !== left || it.y !== top) moved = true;
        });
        if (!moved) break;
      }
      var ctm = svg.getScreenCTM();
      items.forEach(function (it) {
        it.el.style.left = (it.x + it.w / 2) + "px";
        it.el.style.top = (it.y + it.h / 2) + "px";
        var line = it.pin.querySelector(".pin__leader");
        if (!line || !ctm) return;
        var lx = it.x + it.w / 2;
        var ly = it.y + it.h / 2;
        var dx = lx - it.cx;
        var dy = ly - it.cy;
        var dist = Math.hypot(dx, dy);
        if (dist < 16) {
          line.setAttribute("x2", "0");
          line.setAttribute("y2", "0");
          return;
        }
        var sxScale = Math.abs(dx) > 0.01 ? (it.w / 2) / Math.abs(dx) : 1;
        var syScale = Math.abs(dy) > 0.01 ? (it.h / 2) / Math.abs(dy) : 1;
        var scale = Math.min(sxScale, syScale, 0.92);
        var endX = vp.left + lx - dx * scale;
        var endY = vp.top + ly - dy * scale;
        var pt = svg.createSVGPoint();
        pt.x = endX;
        pt.y = endY;
        var local = pt.matrixTransform(ctm.inverse());
        var origin = svg.createSVGPoint();
        origin.x = vp.left + it.cx;
        origin.y = vp.top + it.cy;
        var o = origin.matrixTransform(ctm.inverse());
        line.setAttribute("x1", "0");
        line.setAttribute("y1", "0");
        line.setAttribute("x2", (local.x - o.x).toFixed(2));
        line.setAttribute("y2", (local.y - o.y).toFixed(2));
      });
    }

    function clampBox(box) {
      var w = Math.max(minW, Math.min(outer.w, box.w));
      var h = w / aspect;
      var x = box.x + (box.w - w) / 2;
      var y = box.y + (box.h - h) / 2;
      if (x < outer.x) x = outer.x;
      if (y < outer.y) y = outer.y;
      if (x + w > outer.x + outer.w) x = outer.x + outer.w - w;
      if (y + h > outer.y + outer.h) y = outer.y + outer.h - h;
      return { x: x, y: y, w: w, h: h };
    }

    function applyBox(box) {
      view.x = box.x;
      view.y = box.y;
      view.w = box.w;
      view.h = box.h;
      svg.setAttribute(
        "viewBox",
        view.x.toFixed(2) + " " + view.y.toFixed(2) + " " + view.w.toFixed(2) + " " + view.h.toFixed(2)
      );
      applyCluster();
      syncDots();
      updateArcVisibility();
      placeControls();
      layoutLabels();
      if (window.positionChapterCard) window.positionChapterCard();
      var zoomIn = mapStage.querySelector('[data-map="in"]');
      var zoomOut = mapStage.querySelector('[data-map="out"]');
      if (zoomIn) zoomIn.disabled = view.w <= minW + 0.6;
      if (zoomOut) zoomOut.disabled = view.w >= outer.w - 0.8;
    }

    function animateTo(box) {
      var next = clampBox(box);
      if (tween && window.gsap) tween.kill();
      if (reduced || !window.gsap) {
        applyBox(next);
        return;
      }
      var proxy = { x: view.x, y: view.y, w: view.w, h: view.h };
      tween = window.gsap.to(proxy, {
        x: next.x,
        y: next.y,
        w: next.w,
        h: next.h,
        duration: 0.7,
        ease: "power2.inOut",
        onUpdate: function () { applyBox(proxy); }
      });
    }

    function keepMapInView() {
      var header = document.getElementById("site-header");
      var top = (header ? header.getBoundingClientRect().height : 0) + 12;
      var rect = mapStage.getBoundingClientRect();
      if (rect.top < top) {
        window.scrollBy({ top: rect.top - top, behavior: reduced ? "auto" : "smooth" });
      }
    }

    function ontarioFrame() {
      var minX = Infinity;
      var maxX = -Infinity;
      var minY = Infinity;
      var maxY = -Infinity;
      ontarioPins.forEach(function (pin) {
        var x = Number(pin.getAttribute("data-x"));
        var y = Number(pin.getAttribute("data-y"));
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });
      var cx = (minX + maxX) / 2;
      var cy = (minY + maxY) / 2;
      var w = 128;
      var h = w / aspect;
      return { x: cx - w / 2, y: cy - h / 2, w: w, h: h };
    }

    function focusOntario() {
      exploded = true;
      animateTo(ontarioFrame());
      keepMapInView();
    }

    function framePin(pin) {
      if (!pin) return;
      var id = pin.getAttribute("data-city") || "";
      if (id === "ontario" || ONTARIO[id]) {
        focusOntario();
        return;
      }
      exploded = false;
      var cx = Number(pin.getAttribute("data-x"));
      var cy = Number(pin.getAttribute("data-y"));
      var boxW = Math.min(outer.w * 0.46, 240);
      var boxH = boxW / aspect;
      animateTo({ x: cx - boxW / 2, y: cy - boxH * 0.46, w: boxW, h: boxH });
      keepMapInView();
    }

    function home() {
      exploded = false;
      animateTo(belt);
      keepMapInView();
    }

    function showContinent() {
      exploded = false;
      animateTo({ x: outer.x, y: outer.y, w: outer.w, h: outer.h });
      keepMapInView();
    }

    function resetView() {
      home();
      document.dispatchEvent(new CustomEvent("devnet:mapreset"));
    }

    function zoomBy(factor, clientX, clientY, immediate) {
      if (factor > 1.01) exploded = true;
      else if (factor < 0.99) exploded = false;
      var rect = viewport.getBoundingClientRect();
      var px = clientX == null ? rect.left + rect.width / 2 : clientX;
      var py = clientY == null ? rect.top + rect.height / 2 : clientY;
      var ctm = svg.getScreenCTM();
      if (!ctm) return;
      var pt = svg.createSVGPoint();
      pt.x = px;
      pt.y = py;
      var focus = pt.matrixTransform(ctm.inverse());
      var w = view.w / factor;
      var h = view.h / factor;
      var next = {
        x: focus.x - ((px - rect.left) / rect.width) * w,
        y: focus.y - ((py - rect.top) / rect.height) * h,
        w: w,
        h: h
      };
      if (immediate) applyBox(clampBox(next));
      else animateTo(next);
    }

    applyBox(belt);
    window.requestAnimationFrame(function () { applyBox(view); });

    mapStage.querySelectorAll("[data-map]").forEach(function (button) {
      button.addEventListener("click", function () {
        var action = button.getAttribute("data-map");
        if (action === "in") {
          zoomBy(1.55);
          keepMapInView();
        } else if (action === "out") {
          zoomBy(1 / 1.55);
          keepMapInView();
        } else if (action === "reset") resetView();
      });
    });

    function pointerDistance() {
      var ids = Object.keys(pointers);
      if (ids.length < 2) return 0;
      var a = pointers[ids[0]];
      var b = pointers[ids[1]];
      return Math.hypot(a.x - b.x, a.y - b.y) || 1;
    }

    viewport.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (event.target.closest(".pin, .map-label, .map-controls")) return;
      pointers[event.pointerId] = { x: event.clientX, y: event.clientY };
      var count = Object.keys(pointers).length;
      if (tween && window.gsap) tween.kill();
      if (count === 1) {
        drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
        viewport.classList.add("is-drag");
      } else {
        drag = null;
        viewport.classList.remove("is-drag");
        pinchDist = pointerDistance();
      }
      try { viewport.setPointerCapture(event.pointerId); } catch (err) { /* already captured */ }
    });

    viewport.addEventListener("pointermove", function (event) {
      if (!pointers[event.pointerId]) return;
      pointers[event.pointerId] = { x: event.clientX, y: event.clientY };
      var ids = Object.keys(pointers);
      if (ids.length >= 2) {
        var dist = pointerDistance();
        var factor = dist / (pinchDist || dist);
        pinchDist = dist;
        if (Math.abs(factor - 1) > 0.008) {
          var a = pointers[ids[0]];
          var b = pointers[ids[1]];
          zoomBy(factor, (a.x + b.x) / 2, (a.y + b.y) / 2, true);
        }
        return;
      }
      if (!drag || event.pointerId !== drag.id) return;
      var rect = viewport.getBoundingClientRect();
      var dx = ((event.clientX - drag.x) / rect.width) * view.w;
      var dy = ((event.clientY - drag.y) / rect.height) * view.h;
      drag.x = event.clientX;
      drag.y = event.clientY;
      applyBox(clampBox({ x: view.x - dx, y: view.y - dy, w: view.w, h: view.h }));
    });

    function endPointer(event) {
      delete pointers[event.pointerId];
      if (drag && event.pointerId === drag.id) {
        drag = null;
        viewport.classList.remove("is-drag");
      }
      if (Object.keys(pointers).length < 2) pinchDist = 0;
    }
    viewport.addEventListener("pointerup", endPointer);
    viewport.addEventListener("pointercancel", endPointer);

    viewport.addEventListener("wheel", function (event) {
      event.preventDefault();
      if (tween && window.gsap) tween.kill();
      var delta = event.deltaY;
      if (event.deltaMode === 1) delta *= 16;
      if (event.deltaMode === 2) delta *= viewport.clientHeight;
      var factor = Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.0016));
      zoomBy(factor, event.clientX, event.clientY, true);
    }, { passive: false });

    mapStage.addEventListener("keydown", function (event) {
      var key = event.key;
      if (key === "ArrowLeft" || key === "ArrowRight" || key === "ArrowUp" || key === "ArrowDown") {
        event.preventDefault();
        var box = { x: view.x, y: view.y, w: view.w, h: view.h };
        if (key === "ArrowLeft") box.x -= view.w * 0.08;
        if (key === "ArrowRight") box.x += view.w * 0.08;
        if (key === "ArrowUp") box.y -= view.h * 0.08;
        if (key === "ArrowDown") box.y += view.h * 0.08;
        applyBox(clampBox(box));
        return;
      }
      if (key === "+" || key === "=") {
        event.preventDefault();
        zoomBy(1.25);
      } else if (key === "-" || key === "_") {
        event.preventDefault();
        zoomBy(1 / 1.25);
      } else if (key === "0" || key === "Home") {
        event.preventDefault();
        resetView();
      }
    });

    window.addEventListener("resize", function () {
      applyBox(view);
    });

    if ("IntersectionObserver" in window) {
      var arcObserver = new IntersectionObserver(function (entries) {
        if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
        arcObserver.disconnect();
        playArcs();
      }, { threshold: 0.28 });
      arcObserver.observe(mapStage);
    } else {
      playArcs();
    }

    return {
      framePin: framePin,
      resetView: resetView,
      home: home,
      showContinent: showContinent,
      focusOntario: focusOntario,
      layoutLabels: layoutLabels,
      clustered: function () { return clustered; }
    };
  }


  function setupMap(mapStage, reduced) {
    var geo = mapStage ? mapStage.querySelector(".na-map") : null;
    if (geo) return setupGeoMap(mapStage, geo, reduced);
    var viewport = mapStage ? mapStage.querySelector(".map-viewport") : null;
    var world = mapStage ? mapStage.querySelector(".map-world") : null;
    if (!viewport || !world) return null;
    var scale = 1;
    var x = 0;
    var y = 0;
    var homeScale = 1;
    var homeX = 0;
    var homeY = 0;
    var minScale = 1;
    var maxScale = 16;
    var drag = null;
    var exploring = false;
    var pan = null;

    function phoneMap() {
      return window.matchMedia("(max-width: 767px)").matches;
    }

    function allowGesture() {
      return !phoneMap() || exploring;
    }

    function setExplore(on) {
      exploring = !!on;
      mapStage.classList.toggle("is-exploring", exploring);
      var exploreBtn = mapStage.querySelector('[data-map="explore"]');
      var doneBtn = mapStage.querySelector('[data-map="done"]');
      if (exploreBtn) exploreBtn.hidden = exploring;
      if (doneBtn) doneBtn.hidden = !exploring;
      if (!exploring) {
        drag = null;
        pan = null;
        gesture = null;
        viewport.classList.remove("is-drag");
      }
    }

    function clamp() {
      var w = viewport.clientWidth;
      var h = viewport.clientHeight;
      var minX = w * (1 - scale);
      var minY = h * (1 - scale);
      if (x > 0) x = 0;
      if (y > 0) y = 0;
      if (x < minX) x = minX;
      if (y < minY) y = minY;
    }

    var clusterLayer = document.createElement("div");
    clusterLayer.className = "map-clusters";
    world.appendChild(clusterLayer);
    var clusterTimer = 0;

    function placeClusters() {
      window.clearTimeout(clusterTimer);
      var pins = Array.prototype.slice.call(world.querySelectorAll(".pin"));
      pins.forEach(function (pin) {
        pin.classList.remove("is-bunched");
      });
      clusterLayer.replaceChildren();
      if (!pins.length || !world.clientWidth || scale >= 3.2) return;
      var groups = {};
      pins.forEach(function (pin) {
        var place = pin.getAttribute("data-place") || "";
        if (!place) return;
        if (!groups[place]) groups[place] = [];
        groups[place].push(pin);
      });
      var hot = world.querySelector(".pin.is-hot");
      var hotPlace = hot ? hot.getAttribute("data-place") || "" : "";
      Object.keys(groups).forEach(function (place) {
        var group = groups[place];
        if (group.length < 2) return;
        var cx = 0;
        var cy = 0;
        var live = false;
        var centers = group.map(function (pin) {
          pin.classList.add("is-bunched");
          if (pin.classList.contains("pin--founding")) live = true;
          return { pin: pin, x: pin.offsetLeft, y: pin.offsetTop };
        });
        centers.forEach(function (center) {
          cx += center.x;
          cy += center.y;
        });
        cx /= centers.length;
        cy /= centers.length;
        var button = document.createElement("button");
        button.type = "button";
        button.className = "map-hub" + (live ? " map-hub--live" : "") + (place === hotPlace ? " is-hot" : "");
        button.setAttribute("data-place", place);
        button.setAttribute("aria-label", place);
        button.addEventListener("click", function (event) {
          event.stopPropagation();
          expandGroup(centers);
        });
        button.style.left = (cx / world.clientWidth * 100) + "%";
        button.style.top = (cy / world.clientHeight * 100) + "%";
        clusterLayer.appendChild(button);
      });
    }

    function expandGroup(group) {
      var minD = Infinity;
      for (var i = 0; i < group.length; i++) {
        for (var j = i + 1; j < group.length; j++) {
          var d = Math.hypot(group[i].x - group[j].x, group[i].y - group[j].y);
          if (d > 0 && d < minD) minD = d;
        }
      }
      if (!isFinite(minD)) minD = 1;
      var rect = viewport.getBoundingClientRect();
      var cx = 0;
      var cy = 0;
      group.forEach(function (center) {
        cx += center.x;
        cy += center.y;
      });
      cx /= group.length;
      cy /= group.length;
      scale = Math.min(maxScale, Math.max(scale * 1.35, 24 / minD));
      x = rect.width / 2 - cx * scale;
      y = rect.height / 2 - cy * scale;
      if (!reduced) world.classList.add("is-anim");
      apply();
    }

    function apply() {
      clamp();
      var next = "translate3d(" + x.toFixed(2) + "px," + y.toFixed(2) + "px,0) scale(" + scale.toFixed(4) + ")";
      var changed = world.style.transform !== next;
      world.style.transform = next;
      world.style.setProperty("--pin-scale", String(1 / scale));
      var zoomIn = mapStage.querySelector('[data-map="in"]');
      var zoomOut = mapStage.querySelector('[data-map="out"]');
      var reset = mapStage.querySelector('[data-map="reset"]');
      if (zoomIn) zoomIn.disabled = scale >= maxScale - 0.001;
      if (zoomOut) zoomOut.disabled = scale <= minScale + 0.001;
      if (!changed) world.classList.remove("is-anim");
      window.clearTimeout(clusterTimer);
      if (world.classList.contains("is-anim") && !reduced) {
        clusterTimer = window.setTimeout(placeClusters, 360);
        return;
      }
      placeClusters();
    }

    function zoomAt(clientX, clientY, next) {
      var rect = viewport.getBoundingClientRect();
      var px = clientX - rect.left;
      var py = clientY - rect.top;
      var clamped = Math.min(maxScale, Math.max(minScale, next));
      var cx = (px - x) / scale;
      var cy = (py - y) / scale;
      scale = clamped;
      x = px - cx * scale;
      y = py - cy * scale;
      apply();
    }

    function zoomBy(factor, clientX, clientY) {
      var rect = viewport.getBoundingClientRect();
      var cx = clientX == null ? rect.left + rect.width / 2 : clientX;
      var cy = clientY == null ? rect.top + rect.height / 2 : clientY;
      zoomAt(cx, cy, scale * factor);
    }

    function frameHome() {
      homeScale = 1;
      homeX = 0;
      homeY = 0;
    }

    function resetView() {
      frameHome();
      scale = homeScale;
      x = homeX;
      y = homeY;
      if (phoneMap()) setExplore(false);
      if (!reduced) world.classList.add("is-anim");
      apply();
    }

    function framePin(pin) {
      var worldRect = world.getBoundingClientRect();
      var pinRect = pin.getBoundingClientRect();
      var px = (pinRect.left + pinRect.width / 2 - worldRect.left) / scale;
      var py = (pinRect.top + pinRect.height / 2 - worldRect.top) / scale;
      var rect = viewport.getBoundingClientRect();
      var next = Math.max(scale, phoneMap() ? 7 : 5);
      if (next > maxScale) next = maxScale;
      scale = next;
      x = rect.width / 2 - px * scale;
      y = rect.height / 2 - py * scale;
      if (!reduced) world.classList.add("is-anim");
      apply();
    }

    frameHome();
    scale = homeScale;
    x = homeX;
    y = homeY;
    apply();

    viewport.addEventListener("pointerdown", function (event) {
      if (!allowGesture()) return;
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      if (event.target.closest(".pin, .map-cluster, .map-explore, .map-controls")) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      world.classList.remove("is-anim");
      viewport.classList.add("is-drag");
      viewport.setPointerCapture(event.pointerId);
    });
    viewport.addEventListener("pointermove", function (event) {
      if (!drag || event.pointerId !== drag.id) return;
      x += event.clientX - drag.x;
      y += event.clientY - drag.y;
      drag.x = event.clientX;
      drag.y = event.clientY;
      apply();
    });
    function endDrag(event) {
      if (!drag || event.pointerId !== drag.id) return;
      drag = null;
      viewport.classList.remove("is-drag");
    }
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);

    viewport.addEventListener("wheel", function (event) {
      if (!allowGesture()) return;
      var pinch = event.ctrlKey;
      var coarse = event.deltaMode !== 0 || Math.abs(event.deltaY) >= 40 || Math.abs(event.deltaX) >= 40;
      if (!pinch && !coarse) return;
      event.preventDefault();
      world.classList.remove("is-anim");
      var delta = event.deltaY;
      if (event.deltaMode === 1) delta *= 16;
      if (event.deltaMode === 2) delta *= viewport.clientHeight;
      var factor = Math.exp(-delta * (pinch ? 0.01 : 0.0016));
      zoomBy(factor, event.clientX, event.clientY);
    }, { passive: false });

    var touches = {};
    var gesture = null;
    var lastTap = 0;
    var lastTapX = 0;
    var lastTapY = 0;
    var skipTap = false;
    function points() {
      return Object.keys(touches).map(function (key) { return touches[key]; });
    }
    viewport.addEventListener("touchstart", function (event) {
      if (!allowGesture()) return;
      for (var i = 0; i < event.changedTouches.length; i++) {
        var t = event.changedTouches[i];
        touches[t.identifier] = { x: t.clientX, y: t.clientY };
      }
      var pts = points();
      if (pts.length === 1) pan = { x: pts[0].x, y: pts[0].y };
      if (pts.length >= 2) {
        pan = null;
        skipTap = true;
        world.classList.remove("is-anim");
        var dx = pts[0].x - pts[1].x;
        var dy = pts[0].y - pts[1].y;
        gesture = {
          dist: Math.hypot(dx, dy) || 1,
          x: (pts[0].x + pts[1].x) / 2,
          y: (pts[0].y + pts[1].y) / 2,
          scale: scale,
          tx: x,
          ty: y
        };
      }
    }, { passive: true });
    viewport.addEventListener("touchmove", function (event) {
      if (!allowGesture()) return;
      for (var i = 0; i < event.changedTouches.length; i++) {
        var t = event.changedTouches[i];
        if (touches[t.identifier]) touches[t.identifier] = { x: t.clientX, y: t.clientY };
      }
      var pts = points();
      if (pts.length === 1 && pan) {
        if (event.cancelable) event.preventDefault();
        world.classList.remove("is-anim");
        x += pts[0].x - pan.x;
        y += pts[0].y - pan.y;
        pan = { x: pts[0].x, y: pts[0].y };
        apply();
        return;
      }
      if (pts.length < 2 || !gesture) return;
      if (event.cancelable) event.preventDefault();
      var dx = pts[0].x - pts[1].x;
      var dy = pts[0].y - pts[1].y;
      var dist = Math.hypot(dx, dy) || 1;
      var mx = (pts[0].x + pts[1].x) / 2;
      var my = (pts[0].y + pts[1].y) / 2;
      x = gesture.tx + (mx - gesture.x);
      y = gesture.ty + (my - gesture.y);
      scale = gesture.scale;
      zoomAt(mx, my, gesture.scale * (dist / gesture.dist));
    }, { passive: false });
    function clearTouch(event) {
      for (var i = 0; i < event.changedTouches.length; i++) {
        delete touches[event.changedTouches[i].identifier];
      }
      if (points().length < 2) gesture = null;
      if (!points().length) pan = null;
    }
    viewport.addEventListener("touchend", function (event) {
      clearTouch(event);
      if (!allowGesture()) return;
      if (event.touches.length !== 0 || skipTap) {
        if (event.touches.length === 0) skipTap = false;
        return;
      }
      if (event.target.closest(".pin, .map-cluster")) return;
      var t = event.changedTouches[0];
      var now = Date.now();
      if (now - lastTap < 280 && Math.hypot(t.clientX - lastTapX, t.clientY - lastTapY) < 28) {
        if (!reduced) world.classList.add("is-anim");
        zoomBy(1.8, t.clientX, t.clientY);
        lastTap = 0;
      } else {
        lastTap = now;
        lastTapX = t.clientX;
        lastTapY = t.clientY;
      }
    });
    viewport.addEventListener("touchcancel", function (event) {
      clearTouch(event);
      skipTap = false;
    });

    mapStage.querySelectorAll("[data-map]").forEach(function (button) {
      button.addEventListener("click", function () {
        var action = button.getAttribute("data-map");
        if (action === "explore") {
          setExplore(true);
          return;
        }
        if (action === "done") {
          setExplore(false);
          return;
        }
        if (!reduced) world.classList.add("is-anim");
        if (action === "in") zoomBy(1.5);
        else if (action === "out") zoomBy(1 / 1.5);
        else resetView();
      });
    });

    mapStage.addEventListener("keydown", function (event) {
      if (!allowGesture()) return;
      var key = event.key;
      if (key === "ArrowLeft" || key === "ArrowRight" || key === "ArrowUp" || key === "ArrowDown") {
        event.preventDefault();
        world.classList.remove("is-anim");
        if (key === "ArrowLeft") x += 48;
        if (key === "ArrowRight") x -= 48;
        if (key === "ArrowUp") y += 48;
        if (key === "ArrowDown") y -= 48;
        apply();
        return;
      }
      if (key === "+" || key === "=" || key === "Add") {
        event.preventDefault();
        if (!reduced) world.classList.add("is-anim");
        zoomBy(1.25);
      } else if (key === "-" || key === "_" || key === "Subtract") {
        event.preventDefault();
        if (!reduced) world.classList.add("is-anim");
        zoomBy(1 / 1.25);
      } else if (key === "0" || key === "Home") {
        event.preventDefault();
        resetView();
      }
    });

    world.addEventListener("transitionend", function (event) {
      if (event.propertyName !== "transform") return;
      world.classList.remove("is-anim");
      placeClusters();
    });
    window.addEventListener("resize", function () {
      var stillHome = Math.abs(scale - homeScale) < 0.03 && Math.abs(x - homeX) < 3 && Math.abs(y - homeY) < 3;
      if (stillHome) {
        frameHome();
        scale = homeScale;
        x = homeX;
        y = homeY;
      }
      apply();
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { placeClusters(); });
    }

    return { framePin: framePin };
  }

  var mapApi = setupMap(stage, reduce);
  var lockedCity = "";
  var regionLock = "";

  function countryOf(id) {
    if (!id) return "";
    if (id === "ontario") return "Canada";
    var pin = document.querySelector('.map-stage .pin[data-city="' + id + '"]');
    return pin ? (pin.getAttribute("data-country") || "") : "";
  }

  function applyRegion(country) {
    document.querySelectorAll(".region-switch").forEach(function (button) {
      var on = !!country && button.getAttribute("data-region") === country;
      button.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function positionChapterCard() {}
  window.positionChapterCard = positionChapterCard;

  function showCard(pin) {
    var card = document.querySelector(".chapter-card");
    var readout = document.querySelector("[data-map-readout]");
    if (!card) return;
    if (!pin) {
      card.hidden = true;
      card._pin = null;
      if (readout) readout.textContent = "";
      return;
    }
    var name = pin.getAttribute("data-name") || "";
    var country = pin.getAttribute("data-country") || "";
    var flagship = pin.classList.contains("pin--founding");
    card.querySelector("[data-card-name]").textContent = name;
    card.querySelector("[data-card-country]").textContent = country;
    var flag = card.querySelector("[data-card-flag]");
    if (flag) flag.hidden = !flagship;
    card.hidden = false;
    card._pin = pin;
    if (readout) {
      var bits = [name, country];
      if (flagship) bits.push("Flagship");
      readout.textContent = bits.filter(Boolean).join(", ");
    }
    positionChapterCard();
  }

  function setCity(id) {
    if (lockedCity && id && id !== lockedCity) return;
    var active = id || lockedCity;
    document.querySelectorAll("[data-city]").forEach(function (el) {
      var on = active !== "" && el.getAttribute("data-city") === active;
      var grouped = active === "ontario" && el.classList.contains("city-row") && ONTARIO[el.getAttribute("data-city")];
      el.classList.toggle("is-hot", on || grouped);
      if (el.classList.contains("pin") || el.classList.contains("city-row") || el.classList.contains("map-label")) {
        var pressed = lockedCity !== "" && (el.getAttribute("data-city") === lockedCity || (lockedCity === "ontario" && el.classList.contains("city-row") && ONTARIO[el.getAttribute("data-city")]));
        el.setAttribute("aria-pressed", pressed ? "true" : "false");
      }
    });
    var pin = active ? document.querySelector('.map-stage .pin[data-city="' + active + '"]') : null;
    applyRegion((active && countryOf(active)) || regionLock);
    showCard(pin);
  }

  document.addEventListener("pointerover", function (event) {
    var target = event.target.closest("[data-city]");
    setCity(target ? target.getAttribute("data-city") : "");
  });
  document.addEventListener("focusin", function (event) {
    var target = event.target.closest("[data-city]");
    if (target) setCity(target.getAttribute("data-city"));
  });
  document.addEventListener("focusout", function (event) {
    var target = event.target.closest("[data-city]");
    if (!target) return;
    var next = event.relatedTarget && event.relatedTarget.closest("[data-city]");
    if (!next) setCity("");
  });
  document.addEventListener("pointerout", function (event) {
    var target = event.target.closest("[data-city]");
    if (!target) return;
    var next = event.relatedTarget && event.relatedTarget.closest ? event.relatedTarget.closest("[data-city]") : null;
    if (!next && !(document.activeElement && document.activeElement.closest && document.activeElement.closest("[data-city]"))) {
      setCity("");
    }
  });

  document.querySelectorAll(".chapter, .city-row, .map-stage .pin, .map-label").forEach(function (button) {
    button.addEventListener("click", function () {
      var id = button.getAttribute("data-city") || "";
      if (!id) return;
      var pin = document.querySelector('.map-stage .pin[data-city="' + id + '"]');
      if (lockedCity === id) {
        lockedCity = "";
        regionLock = "";
        setCity("");
        document.dispatchEvent(new CustomEvent("devnet:city", { detail: "" }));
        if (mapApi && mapApi.home) mapApi.home();
        return;
      }
      lockedCity = id;
      regionLock = countryOf(id) || regionLock;
      setCity(lockedCity);
      document.dispatchEvent(new CustomEvent("devnet:city", { detail: lockedCity }));
      var boardNow = document.querySelector(".map-board");
      if (pin && mapApi && (!boardNow || boardNow.getAttribute("data-network") !== "globe")) mapApi.framePin(pin);
    });
  });

  document.querySelectorAll(".region-switch").forEach(function (button) {
    button.addEventListener("click", function () {
      var region = button.getAttribute("data-region") || "";
      if (regionLock === region && !lockedCity) {
        regionLock = "";
        setCity("");
        if (mapApi && mapApi.home) mapApi.home();
        return;
      }
      regionLock = region;
      lockedCity = "";
      setCity("");
      if (!mapApi) return;
      if (region === "United States") mapApi.showContinent();
      else mapApi.home();
    });
  });

  document.addEventListener("devnet:spin", function () {
    lockedCity = "";
    regionLock = "";
    setCity("");
  });

  document.addEventListener("devnet:mapreset", function () {
    lockedCity = "";
    regionLock = "";
    setCity("");
  });

  var spine = document.querySelector(".spine");
  function paintSpine() {
    if (!spine || reduce) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var step = max <= 0 ? 20 : Math.max(0, Math.min(20, Math.round((window.scrollY / max) * 20)));
    spine.className = "spine is-p" + step;
    document.querySelectorAll(".spine__node").forEach(function (node) {
      var section = document.getElementById(node.getAttribute("data-spine"));
      if (!section) return;
      node.classList.toggle("is-on", section.getBoundingClientRect().top < window.innerHeight * 0.65);
    });
  }
  if (spine && !reduce) {
    paintSpine();
    window.addEventListener("scroll", paintSpine, { passive: true });
  }

  var countdown = document.getElementById("countdown");
  var intro = document.getElementById("event-intro");
  var week = document.getElementById("event-week3");
  var rsvp = intro ? intro.querySelector(".rsvp") : null;
  var introFlag = intro ? intro.querySelector(".tl-flag") : null;
  var weekFlag = week ? week.querySelector(".tl-flag") : null;
  var startMs = Date.parse("2026-11-06T14:00:00-05:00");
  var endMs = Date.parse("2026-11-06T16:00:00-05:00");

  function renderCountdown() {
    if (!intro) return;
    var units = countdown
      ? {
          d: countdown.querySelector('[data-unit="d"]'),
          h: countdown.querySelector('[data-unit="h"]'),
          m: countdown.querySelector('[data-unit="m"]'),
          s: countdown.querySelector('[data-unit="s"]')
        }
      : {};
    function setBoxes(ms) {
      if (!countdown) return;
      var days = Math.floor(ms / 86400000);
      var hours = Math.floor((ms % 86400000) / 3600000);
      var minutes = Math.floor((ms % 3600000) / 60000);
      var seconds = Math.floor((ms % 60000) / 1000);
      var labels = {
        d: days === 1 ? "Day" : "Days",
        h: hours === 1 ? "Hour" : "Hours",
        m: "Min",
        s: "Sec"
      };
      if (units.d) units.d.textContent = String(days);
      if (units.h) units.h.textContent = String(hours);
      if (units.m) units.m.textContent = String(minutes);
      if (units.s) units.s.textContent = String(seconds);
      ["d", "h", "m", "s"].forEach(function (key) {
        var label = countdown.querySelector('[data-label="' + key + '"]');
        if (label) label.textContent = labels[key];
      });
    }
    var now = Date.now();
    var past = now >= endMs;
    intro.classList.toggle("is-past", past);
    intro.classList.toggle("is-next", !past);
    intro.hidden = past;
    if (week) week.classList.toggle("is-next", past);
    if (countdown) countdown.hidden = past;
    if (rsvp) rsvp.hidden = past;
    if (introFlag) introFlag.textContent = past ? "Past" : "Next";
    if (weekFlag) weekFlag.hidden = !past;
    if (past) {
      setBoxes(0);
      return;
    }
    setBoxes(now >= startMs ? endMs - now : startMs - now);
  }

  if (intro) {
    renderCountdown();
    window.setInterval(renderCountdown, 1000);
  }

  var org = document.querySelector(".org");
  function drawOrg() {
    if (!org || org.classList.contains("is-drawn")) return;
    var rect = org.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.86 && rect.bottom > 40) org.classList.add("is-drawn");
  }
  if (org && reduce) {
    org.classList.add("is-drawn");
  } else if (org) {
    drawOrg();
    window.addEventListener("scroll", drawOrg, { passive: true });
  }


  var steps = document.querySelector(".steps");
  if (steps) {
    if (reduce || !("IntersectionObserver" in window)) {
      steps.classList.add("is-drawn");
    } else {
      var stepsObserver = new IntersectionObserver(
        function (entries) {
          if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
          steps.classList.add("is-drawn");
          stepsObserver.disconnect();
        },
        { threshold: 0.4 }
      );
      stepsObserver.observe(steps);
    }
  }

  var board = document.querySelector(".map-board");
  function sequencePins() {
    if (!board || board.dataset.sequenced === "1") return;
    board.dataset.sequenced = "1";
    if (reduce) return;
    var pins = Array.prototype.slice.call(board.querySelectorAll(".map-stage .pin"));
    if (!pins.length) return;
    board.classList.add("is-sequencing");
    pins.sort(function (a, b) {
      var aLondon = a.getAttribute("data-city") === "london" ? 0 : 1;
      var bLondon = b.getAttribute("data-city") === "london" ? 0 : 1;
      return aLondon - bLondon;
    });
    pins.forEach(function (pin, index) {
      window.setTimeout(function () {
        pin.classList.add("is-shown");
        if (pin.getAttribute("data-city") === "london") pin.classList.add("is-pulse");
        var row = board.querySelector('.city-row[data-city="' + pin.getAttribute("data-city") + '"]');
        if (row) row.classList.add("is-shown");
      }, 40 + index * 40);
    });
  }
  if (board && !reduce && "IntersectionObserver" in window) {
    var pinObserver = new IntersectionObserver(
      function (entries) {
        if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
        pinObserver.disconnect();
        sequencePins();
      },
      { threshold: 0.2 }
    );
    pinObserver.observe(board.querySelector(".map-stage") || board);
  }

  var hero = document.querySelector(".hero");
  var graph = document.querySelector(".hero-graph");
  if (graph && !reduce) {
    window.requestAnimationFrame(function () {
      graph.classList.add("is-drawn");
    });
  }
  if (hero && graph && !reduce) {
    var heroFrame = false;
    function paintHero() {
      heroFrame = false;
      var y = window.scrollY;
      var limit = hero.offsetHeight;
      if (y > limit) y = limit;
      if (y < 0) y = 0;
      graph.style.transform = "translate3d(0," + (y * 0.15).toFixed(2) + "px,0)";
    }
    paintHero();
    window.addEventListener("scroll", function () {
      if (heroFrame) return;
      heroFrame = true;
      window.requestAnimationFrame(paintHero);
    }, { passive: true });
  }

  var pickInput = document.getElementById("chapter-pick");
  var pickList = document.getElementById("chapter-list");
  if (pickInput && pickList) {
    var chapterOptions = Array.prototype.map.call(document.querySelectorAll(".city-row[data-city]"), function (row) {
      return { id: row.getAttribute("data-city"), name: row.textContent.replace(/\s+/g, " ").trim() };
    });
    var activeIndex = -1;
    function shownOptions(filter) {
      var query = (filter || "").trim().toLowerCase();
      return chapterOptions.filter(function (opt) {
        return !query || opt.name.toLowerCase().indexOf(query) !== -1 || opt.id.indexOf(query) !== -1;
      });
    }
    function renderPick(filter) {
      var shown = shownOptions(filter);
      pickList.replaceChildren();
      shown.forEach(function (opt, i) {
        var item = document.createElement("li");
        item.id = "chapter-opt-" + opt.id;
        item.setAttribute("role", "option");
        item.setAttribute("data-city", opt.id);
        item.setAttribute("aria-selected", i === activeIndex ? "true" : "false");
        item.textContent = opt.name;
        pickList.appendChild(item);
      });
      var open = shown.length > 0;
      pickList.hidden = !open;
      pickInput.setAttribute("aria-expanded", open ? "true" : "false");
      if (activeIndex >= 0 && shown[activeIndex]) pickInput.setAttribute("aria-activedescendant", "chapter-opt-" + shown[activeIndex].id);
      else pickInput.removeAttribute("aria-activedescendant");
    }
    function chooseChapter(id) {
      var row = document.querySelector('.city-row[data-city="' + id + '"]');
      var pin = document.querySelector('.map-stage .pin[data-city="' + id + '"]');
      if (!row) return;
      if (!pin || pin.getAttribute("aria-pressed") !== "true") row.click();
      var match = chapterOptions.filter(function (opt) { return opt.id === id; })[0];
      pickInput.value = match ? match.name : "";
      pickList.hidden = true;
      pickInput.setAttribute("aria-expanded", "false");
      var viewport = document.querySelector(".map-viewport");
      if (viewport) viewport.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    }
    pickInput.addEventListener("focus", function () {
      activeIndex = -1;
      renderPick(pickInput.value);
    });
    pickInput.addEventListener("input", function () {
      activeIndex = -1;
      renderPick(pickInput.value);
    });
    pickInput.addEventListener("keydown", function (event) {
      var items = pickList.querySelectorAll('[role="option"]');
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!items.length) renderPick(pickInput.value);
        items = pickList.querySelectorAll('[role="option"]');
        if (!items.length) return;
        activeIndex += event.key === "ArrowDown" ? 1 : -1;
        if (activeIndex < 0) activeIndex = items.length - 1;
        if (activeIndex >= items.length) activeIndex = 0;
        renderPick(pickInput.value);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        var current = activeIndex >= 0 ? shownOptions(pickInput.value)[activeIndex] : shownOptions(pickInput.value)[0];
        if (!current) {
          var typed = pickInput.value.trim().toLowerCase();
          current = chapterOptions.filter(function (opt) { return opt.name.toLowerCase() === typed; })[0];
        }
        if (current) chooseChapter(current.id);
        return;
      }
      if (event.key === "Escape") {
        pickList.hidden = true;
        pickInput.setAttribute("aria-expanded", "false");
      }
    });
    pickList.addEventListener("pointerdown", function (event) {
      var opt = event.target.closest("[data-city]");
      if (!opt) return;
      event.preventDefault();
      chooseChapter(opt.getAttribute("data-city"));
    });
    document.addEventListener("pointerdown", function (event) {
      if (event.target.closest(".chapter-pick")) return;
      pickList.hidden = true;
      pickInput.setAttribute("aria-expanded", "false");
    });
  }

});
