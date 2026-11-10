document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

  var motionOn = document.documentElement.classList.contains("motion-on");
  var revealNodes = document.querySelectorAll(".reveal");
  function markVisible(node) {
    var rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 40) node.classList.add("is-in");
  }
  function markAllVisible() {
    revealNodes.forEach(markVisible);
  }
  if (motionOn || reduce || !("IntersectionObserver" in window)) {
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

  var sectionIds = ["events", "about", "builds", "landed", "cursor", "western", "network", "faq"];
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

  function setupGeoMap(mapStage, svg, reduced) {
    var viewport = mapStage.querySelector(".map-viewport");
    var labelLayer = mapStage.querySelector(".map-labels");
    var parts = (svg.getAttribute("viewBox") || "0 0 1000 599").split(/[\s,]+/).map(Number);
    var homeBox = { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
    var view = { x: homeBox.x, y: homeBox.y, w: homeBox.w, h: homeBox.h };
    var maxZoom = 5.2;
    var pins = Array.prototype.slice.call(svg.querySelectorAll(".na-pin"));
    var tween = null;
    var bias = {
      vancouver: [-1, -0.2],
      london: [-1.2, 0.2],
      waterloo: [-0.15, -1],
      guelph: [0.2, -1],
      toronto: [1.1, -0.15],
      kingston: [1, 0.45],
      montreal: [0.2, -1],
      halifax: [-1, -0.1],
      tucson: [0.3, 1],
      miami: [0.1, -1],
      boston: [1, -0.8],
      "new-york-city": [0.15, 1]
    };

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
      syncDots();
      layoutLabels();
      var zoomIn = mapStage.querySelector('[data-map="in"]');
      var zoomOut = mapStage.querySelector('[data-map="out"]');
      if (zoomIn) zoomIn.disabled = view.w <= homeBox.w / maxZoom + 0.2;
      if (zoomOut) zoomOut.disabled = view.w >= homeBox.w - 0.6;
    }

    function syncDots() {
      var rect = svg.getBoundingClientRect();
      if (!rect.width) return;
      var unit = view.w / rect.width;
      pins.forEach(function (pin) {
        var founding = pin.classList.contains("pin--founding");
        var r = (founding ? 6.4 : 5) * unit;
        var dot = pin.querySelector(".pin__dot");
        var pulse = pin.querySelector(".pin__pulse");
        var hit = pin.querySelector(".pin__hit");
        if (dot) dot.setAttribute("r", r.toFixed(3));
        if (pulse) pulse.setAttribute("r", r.toFixed(3));
        if (hit) {
          var nearest = nearestPx(pin);
          var hitPx = nearest > 0 ? Math.max(8, Math.min(22, nearest * 0.42)) : 16;
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
      pins.forEach(function (other) {
        if (other === pin) return;
        var b = other.querySelector(".pin__dot");
        if (!b) return;
        var r = b.getBoundingClientRect();
        var d = Math.hypot(r.left + r.width / 2 - ax, r.top + r.height / 2 - ay);
        if (d < best) best = d;
      });
      return best === Infinity ? 0 : best;
    }

    function measure(name) {
      if (!measure.ctx) measure.ctx = document.createElement("canvas").getContext("2d");
      measure.ctx.font = "700 12px Inter, system-ui, sans-serif";
      return Math.ceil(measure.ctx.measureText(name).width) + 8;
    }

    function layoutLabels() {
      if (!labelLayer || !viewport) return;
      var vp = viewport.getBoundingClientRect();
      if (!vp.width || !vp.height) return;
      var items = [];
      pins.forEach(function (pin) {
        var id = pin.getAttribute("data-city");
        var name = pin.getAttribute("data-name") || "";
        var dot = pin.querySelector(".pin__dot");
        var r = dot.getBoundingClientRect();
        var w = measure(name);
        var h = 16;
        var cx = r.left + r.width / 2 - vp.left;
        var cy = r.top + r.height / 2 - vp.top;
        var inside = cx >= -6 && cy >= -6 && cx <= vp.width + 6 && cy <= vp.height + 6;
        var line = pin.querySelector(".pin__leader");
        if (!inside) {
          if (pin._label) pin._label.hidden = true;
          if (line) {
            line.setAttribute("x2", "0");
            line.setAttribute("y2", "0");
          }
          return;
        }
        if (pin._label) pin._label.hidden = false;
        items.push({
          id: id,
          pin: pin,
          w: w,
          h: h,
          cx: cx,
          cy: cy,
          x: cx - w / 2,
          y: cy - h - 10
        });
      });
      var edge = 2;
      for (var n = 0; n < 100; n++) {
        var moved = false;
        for (var i = 0; i < items.length; i++) {
          for (var j = i + 1; j < items.length; j++) {
            var a = items[i];
            var b = items[j];
            var overlapX = Math.min(a.x + a.w + 4 - b.x, b.x + b.w + 4 - a.x);
            var overlapY = Math.min(a.y + a.h + 4 - b.y, b.y + b.h + 4 - a.y);
            if (overlapX <= 0 || overlapY <= 0) continue;
            var ba = bias[a.id] || [0, -1];
            var bb = bias[b.id] || [0, -1];
            if (overlapX < overlapY) {
              var dir = (a.cx + ba[0] * 8) <= (b.cx + bb[0] * 8) ? -1 : 1;
              var push = overlapX / 2 + 0.6;
              a.x += dir * push;
              b.x -= dir * push;
            } else {
              var vdir = (a.cy + ba[1] * 8) <= (b.cy + bb[1] * 8) ? -1 : 1;
              var vpush = overlapY / 2 + 0.6;
              a.y += vdir * vpush;
              b.y -= vdir * vpush;
            }
            moved = true;
          }
        }
        items.forEach(function (it) {
          if (it.x < edge) it.x = edge;
          if (it.y < edge) it.y = edge;
          if (it.x + it.w > vp.width - edge) it.x = Math.max(edge, vp.width - edge - it.w);
          if (it.y + it.h > vp.height - edge) it.y = Math.max(edge, vp.height - edge - it.h);
        });
        if (!moved) break;
      }
      var ctm = svg.getScreenCTM();
      items.forEach(function (it) {
        var el = it.pin._label;
        if (el) {
          el.style.left = (it.x + it.w / 2) + "px";
          el.style.top = (it.y + it.h / 2) + "px";
        }
        var line = it.pin.querySelector(".pin__leader");
        if (!line || !ctm) return;
        var lx = it.x + it.w / 2;
        var ly = it.y + it.h / 2;
        var dx = lx - it.cx;
        var dy = ly - it.cy;
        var dist = Math.hypot(dx, dy);
        if (dist < 18) {
          line.setAttribute("x2", "0");
          line.setAttribute("y2", "0");
          return;
        }
        var halfW = it.w / 2;
        var halfH = it.h / 2;
        var sx = Math.abs(dx) > 0.01 ? halfW / Math.abs(dx) : 1;
        var sy = Math.abs(dy) > 0.01 ? halfH / Math.abs(dy) : 1;
        var scale = Math.min(sx, sy, 0.92);
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
      var minW = homeBox.w / maxZoom;
      var w = Math.max(minW, Math.min(homeBox.w, box.w));
      var h = w * (homeBox.h / homeBox.w);
      var x = box.x + (box.w - w) / 2;
      var y = box.y + (box.h - h) / 2;
      var slackX = w * 0.28;
      var slackY = h * 0.28;
      if (x < homeBox.x - slackX) x = homeBox.x - slackX;
      if (y < homeBox.y - slackY) y = homeBox.y - slackY;
      if (x + w > homeBox.x + homeBox.w + slackX) x = homeBox.x + homeBox.w + slackX - w;
      if (y + h > homeBox.y + homeBox.h + slackY) y = homeBox.y + homeBox.h + slackY - h;
      return { x: x, y: y, w: w, h: h };
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

    function framePin(pin) {
      var cx = Number(pin.getAttribute("data-x"));
      var cy = Number(pin.getAttribute("data-y"));
      var boxW = homeBox.w / 4.4;
      var boxH = boxW * homeBox.h / homeBox.w;
      animateTo({ x: cx - boxW / 2, y: cy - boxH / 2, w: boxW, h: boxH });
    }

    function home() {
      animateTo({ x: homeBox.x, y: homeBox.y, w: homeBox.w, h: homeBox.h });
    }

    function resetView() {
      home();
      document.dispatchEvent(new CustomEvent("devnet:mapreset"));
    }

    applyBox(homeBox);
    window.requestAnimationFrame(function () { applyBox(view); });

    mapStage.querySelectorAll("[data-map]").forEach(function (button) {
      button.addEventListener("click", function () {
        var action = button.getAttribute("data-map");
        if (action === "in") zoomBy(1.6);
        else if (action === "out") zoomBy(1 / 1.6);
        else if (action === "reset") resetView();
      });
    });

    function zoomBy(factor, clientX, clientY) {
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
      animateTo({
        x: focus.x - ((px - rect.left) / rect.width) * w,
        y: focus.y - ((py - rect.top) / rect.height) * h,
        w: w,
        h: h
      });
    }

    var drag = null;
    viewport.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "touch") return;
      if (event.button !== 0) return;
      if (event.target.closest(".na-pin, .map-label, .map-controls")) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      if (tween && window.gsap) tween.kill();
      viewport.classList.add("is-drag");
      viewport.setPointerCapture(event.pointerId);
    });
    viewport.addEventListener("pointermove", function (event) {
      if (!drag || event.pointerId !== drag.id) return;
      var rect = viewport.getBoundingClientRect();
      var dx = ((event.clientX - drag.x) / rect.width) * view.w;
      var dy = ((event.clientY - drag.y) / rect.height) * view.h;
      drag.x = event.clientX;
      drag.y = event.clientY;
      applyBox(clampBox({ x: view.x - dx, y: view.y - dy, w: view.w, h: view.h }));
    });
    function endDrag(event) {
      if (!drag || event.pointerId !== drag.id) return;
      drag = null;
      viewport.classList.remove("is-drag");
    }
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);

    viewport.addEventListener("wheel", function (event) {
      var pinch = event.ctrlKey;
      var coarse = event.deltaMode !== 0 || Math.abs(event.deltaY) >= 40;
      if (!pinch && !coarse) return;
      event.preventDefault();
      if (tween && window.gsap) tween.kill();
      var rect = viewport.getBoundingClientRect();
      var ctm = svg.getScreenCTM();
      if (!ctm) return;
      var delta = event.deltaY;
      if (event.deltaMode === 1) delta *= 16;
      var factor = Math.exp(-delta * (pinch ? 0.01 : 0.0016));
      var pt = svg.createSVGPoint();
      pt.x = event.clientX;
      pt.y = event.clientY;
      var focus = pt.matrixTransform(ctm.inverse());
      var w = view.w / factor;
      var h = view.h / factor;
      applyBox(clampBox({
        x: focus.x - ((event.clientX - rect.left) / rect.width) * w,
        y: focus.y - ((event.clientY - rect.top) / rect.height) * h,
        w: w,
        h: h
      }));
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

    pins.forEach(function (pin) {
      pin.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        pin.click();
      });
    });

    window.addEventListener("resize", function () {
      syncDots();
      layoutLabels();
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { layoutLabels(); });
    }

    return { framePin: framePin, resetView: resetView, home: home, layoutLabels: layoutLabels };
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
  function setCity(id) {
    var active = id || lockedCity;
    document.querySelectorAll("[data-city]").forEach(function (el) {
      var on = active !== "" && el.getAttribute("data-city") === active;
      el.classList.toggle("is-hot", on);
      if (el.classList.contains("pin") || el.classList.contains("city-row") || el.classList.contains("map-label")) {
        el.setAttribute("aria-pressed", lockedCity !== "" && el.getAttribute("data-city") === lockedCity ? "true" : "false");
      }
    });
    var readout = document.querySelector("[data-map-readout]");
    if (readout) {
      var pin = active ? document.querySelector('.map-stage .pin[data-city="' + active + '"]') : null;
      readout.textContent = pin ? (pin.getAttribute("data-name") || "") : "";
    }
    var hotPin = active ? document.querySelector('.map-stage .pin[data-city="' + active + '"]') : null;
    var hotPlace = hotPin ? hotPin.getAttribute("data-place") || "" : "";
    document.querySelectorAll(".map-hub").forEach(function (hub) {
      hub.classList.toggle("is-hot", hotPlace !== "" && hub.getAttribute("data-place") === hotPlace);
    });
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
      var pin = document.querySelector('.map-stage .pin[data-city="' + id + '"]');
      var row = document.querySelector('.city-row[data-city="' + id + '"]');
      if (lockedCity === id) {
        lockedCity = "";
        setCity("");
        document.dispatchEvent(new CustomEvent("devnet:city", { detail: "" }));
        if (mapApi && mapApi.home) mapApi.home();
        return;
      }
      lockedCity = id;
      setCity(lockedCity);
      document.dispatchEvent(new CustomEvent("devnet:city", { detail: lockedCity }));
      if ((button.classList.contains("pin") || button.classList.contains("map-label")) && row) {
        row.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
      }
      var boardNow = document.querySelector(".map-board");
      if (pin && mapApi && (!boardNow || boardNow.getAttribute("data-network") !== "globe")) mapApi.framePin(pin);
    });
  });

  document.addEventListener("devnet:spin", function () {
    lockedCity = "";
    setCity("");
  });

  document.addEventListener("devnet:mapreset", function () {
    lockedCity = "";
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

  function retirePastEvents() {
    var nowMs = Date.now();
    Array.prototype.slice.call(document.querySelectorAll("#upcoming [data-end], .hub-events [data-end]")).forEach(function (card) {
      var end = Date.parse(card.getAttribute("data-end"));
      var past = isFinite(end) && nowMs >= end;
      card.classList.toggle("is-past", past);
      card.hidden = past;
      var rsvpLink = card.querySelector(".rsvp, .btn");
      if (rsvpLink && past) rsvpLink.hidden = true;
    });
  }

  retirePastEvents();

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
      }, index * 60);
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

  var timeline = document.querySelector(".timeline");
  var timelineFill = timeline ? timeline.querySelector(".timeline__fill") : null;
  var timelineNodes = timeline ? timeline.querySelectorAll(".tl-node") : [];
  var timelineFrame = false;
  function paintTimeline() {
    timelineFrame = false;
    if (!timeline || !timelineFill || !timelineNodes.length || reduce) return;
    var horizontal = window.matchMedia("(min-width: 1100px)").matches;
    var first = timelineNodes[0].getBoundingClientRect();
    var last = timelineNodes[timelineNodes.length - 1].getBoundingClientRect();
    var top = Math.min(first.top, last.top);
    var bottom = Math.max(first.bottom, last.bottom);
    var progress = (window.innerHeight * 0.72 - top) / Math.max(bottom - top, 1);
    if (progress < 0) progress = 0;
    if (progress > 1) progress = 1;
    timelineFill.style.transform = (horizontal ? "scaleX(" : "scaleY(") + progress.toFixed(4) + ")";
    Array.prototype.forEach.call(timelineNodes, function (node) {
      var rect = node.getBoundingClientRect();
      node.classList.toggle("is-lit", rect.top <= window.innerHeight * 0.72);
    });
  }
  if (timeline && document.documentElement.classList.contains("motion-on")) {
    timeline.classList.add("is-motion");
  } else if (timeline) {
    if (reduce) {
      timeline.classList.add("is-complete");
      Array.prototype.forEach.call(timelineNodes, function (node) {
        node.classList.add("is-lit");
      });
    } else {
      paintTimeline();
      window.addEventListener("scroll", function () {
        if (timelineFrame) return;
        timelineFrame = true;
        window.requestAnimationFrame(paintTimeline);
      }, { passive: true });
      window.addEventListener("resize", paintTimeline);
    }
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

});
