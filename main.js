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

  var revealNodes = document.querySelectorAll(".reveal");
  function markVisible(node) {
    var rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 40) node.classList.add("is-in");
  }
  function markAllVisible() {
    revealNodes.forEach(markVisible);
  }
  if (!reduce && "IntersectionObserver" in window) {
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

  var sectionIds = ["about", "network", "western"];
  var sections = sectionIds
    .map(function (id) {
      return document.getElementById(id);
    })
    .filter(Boolean);

  if (sections.length) {
    function spy() {
      var current = "";
      sections.forEach(function (section) {
        if (section.getBoundingClientRect().top < 120) current = section.id;
      });
      document.querySelectorAll("[data-nav]").forEach(function (link) {
        var href = link.getAttribute("href") || "";
        var hashIndex = href.indexOf("#");
        var hash = hashIndex >= 0 ? href.slice(hashIndex + 1) : "";
        var on = hash === current && current !== "";
        if (on) link.setAttribute("aria-current", "true");
        else if (link.getAttribute("aria-current") === "true") link.removeAttribute("aria-current");
      });
    }
    spy();
    window.addEventListener("scroll", spy, { passive: true });
  }

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

  function setupMap(mapStage, reduced) {
    var viewport = mapStage ? mapStage.querySelector(".map-viewport") : null;
    var world = mapStage ? mapStage.querySelector(".map-world") : null;
    if (!viewport || !world) return null;
    var scale = 1;
    var x = 0;
    var y = 0;
    var minScale = 1;
    var maxScale = 16;
    var drag = null;

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

    function apply() {
      clamp();
      world.style.transform = "translate3d(" + x.toFixed(2) + "px," + y.toFixed(2) + "px,0) scale(" + scale.toFixed(4) + ")";
      world.style.setProperty("--pin-scale", String(1 / scale));
      var zoomIn = mapStage.querySelector('[data-map="in"]');
      var zoomOut = mapStage.querySelector('[data-map="out"]');
      var reset = mapStage.querySelector('[data-map="reset"]');
      if (zoomIn) zoomIn.disabled = scale >= maxScale - 0.001;
      if (zoomOut) zoomOut.disabled = scale <= minScale + 0.001;
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

    function resetView() {
      scale = 1;
      x = 0;
      y = 0;
      if (!reduced) world.classList.add("is-anim");
      apply();
    }

    function framePin(pin) {
      var worldRect = world.getBoundingClientRect();
      var pinRect = pin.getBoundingClientRect();
      var px = (pinRect.left + pinRect.width / 2 - worldRect.left) / scale;
      var py = (pinRect.top + pinRect.height / 2 - worldRect.top) / scale;
      var rect = viewport.getBoundingClientRect();
      var next = Math.max(scale, 4);
      if (next > maxScale) next = maxScale;
      scale = next;
      x = rect.width / 2 - px * scale;
      y = rect.height / 2 - py * scale;
      if (!reduced) world.classList.add("is-anim");
      apply();
    }

    apply();

    viewport.addEventListener("pointerdown", function (event) {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      if (event.target.closest(".pin")) return;
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
      for (var i = 0; i < event.changedTouches.length; i++) {
        var t = event.changedTouches[i];
        touches[t.identifier] = { x: t.clientX, y: t.clientY };
      }
      var pts = points();
      if (pts.length >= 2) {
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
      for (var i = 0; i < event.changedTouches.length; i++) {
        var t = event.changedTouches[i];
        if (touches[t.identifier]) touches[t.identifier] = { x: t.clientX, y: t.clientY };
      }
      var pts = points();
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
    }
    viewport.addEventListener("touchend", function (event) {
      clearTouch(event);
      if (event.touches.length !== 0 || skipTap) {
        if (event.touches.length === 0) skipTap = false;
        return;
      }
      if (event.target.closest(".pin")) return;
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
        if (!reduced) world.classList.add("is-anim");
        if (action === "in") zoomBy(1.5);
        else if (action === "out") zoomBy(1 / 1.5);
        else resetView();
      });
    });

    mapStage.addEventListener("keydown", function (event) {
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
      if (event.propertyName === "transform") world.classList.remove("is-anim");
    });
    window.addEventListener("resize", apply);

    return { framePin: framePin };
  }

  var mapApi = setupMap(stage, reduce);
  var lockedCity = "";
  function setCity(id) {
    var active = id || lockedCity;
    document.querySelectorAll("[data-city]").forEach(function (el) {
      var on = active !== "" && el.getAttribute("data-city") === active;
      el.classList.toggle("is-hot", on);
      if (el.classList.contains("pin") || el.classList.contains("city-row")) {
        el.setAttribute("aria-pressed", lockedCity !== "" && el.getAttribute("data-city") === lockedCity ? "true" : "false");
      }
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

  document.querySelectorAll(".chapter, .city-row, .map-stage .pin").forEach(function (button) {
    button.addEventListener("click", function () {
      var id = button.getAttribute("data-city") || "";
      lockedCity = lockedCity === id ? "" : id;
      setCity(lockedCity);
      if (!lockedCity) return;
      var pin = document.querySelector('.map-stage .pin[data-city="' + lockedCity + '"]');
      var row = document.querySelector('.city-row[data-city="' + lockedCity + '"]');
      if (button.classList.contains("pin")) {
        if (row) row.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
        return;
      }
      if (pin && mapApi) mapApi.framePin(pin);
    });
  });

  var flow = document.querySelector(".orgflow");
  function drawFlow() {
    if (!flow || flow.classList.contains("is-drawn")) return;
    var rect = flow.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85 && rect.bottom > 40) flow.classList.add("is-drawn");
  }
  if (flow && reduce) {
    flow.classList.add("is-drawn");
  } else if (flow) {
    drawFlow();
    window.addEventListener("scroll", drawFlow, { passive: true });
    if ("IntersectionObserver" in window) {
      var flowObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            flow.classList.add("is-drawn");
            flowObserver.unobserve(flow);
          });
        },
        { threshold: 0.2 }
      );
      flowObserver.observe(flow);
    }
  }
  var lockedNode = "";
  function focusNode(id) {
    if (!flow) return;
    var active = id || lockedNode;
    flow.classList.remove("is-focus-devnet", "is-focus-chapters", "is-focus-members");
    if (active) flow.classList.add("is-focus-" + active);
  }
  document.querySelectorAll(".orgflow .node").forEach(function (node) {
    node.addEventListener("pointerover", function () {
      focusNode(node.getAttribute("data-node"));
    });
    node.addEventListener("focusin", function () {
      focusNode(node.getAttribute("data-node"));
    });
    node.addEventListener("click", function () {
      var id = node.getAttribute("data-node");
      lockedNode = lockedNode === id ? "" : id;
      focusNode(lockedNode);
    });
  });
  if (flow) {
    flow.addEventListener("pointerout", function (event) {
      var next = event.relatedTarget && event.relatedTarget.closest ? event.relatedTarget.closest(".node") : null;
      if (!next) focusNode("");
    });
  }

  document.querySelectorAll(".org__node").forEach(function (node) {
    node.addEventListener("click", function () {
      var on = node.classList.contains("is-on");
      document.querySelectorAll(".org__node").forEach(function (other) {
        other.classList.remove("is-on");
      });
      if (!on) node.classList.add("is-on");
    });
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

  document.querySelectorAll(".tl-item button").forEach(function (button) {
    button.addEventListener("click", function () {
      var item = button.closest(".tl-item");
      var open = item.classList.contains("is-open");
      document.querySelectorAll(".tl-item").forEach(function (other) {
        var otherButton = other.querySelector("button");
        var panel = other.querySelector(".tl-panel");
        var willOpen = other === item && !open;
        other.classList.toggle("is-open", willOpen);
        if (otherButton) otherButton.setAttribute("aria-expanded", willOpen ? "true" : "false");
        if (panel) panel.hidden = !willOpen;
      });
    });
    button.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      var buttons = Array.prototype.slice.call(document.querySelectorAll(".tl-item button"));
      var index = buttons.indexOf(button);
      var nextIndex = event.key === "ArrowDown" ? index + 1 : index - 1;
      if (nextIndex < 0) nextIndex = buttons.length - 1;
      if (nextIndex >= buttons.length) nextIndex = 0;
      event.preventDefault();
      buttons[nextIndex].focus();
    });
  });

  var countdown = document.getElementById("countdown");
  var intro = document.getElementById("event-intro");
  var introButton = intro ? intro.querySelector("button") : null;
  var introPanel = intro ? intro.querySelector(".tl-panel") : null;
  var nextItem = document.getElementById("event-speaker");
  var startMs = Date.parse("2026-11-06T14:00:00-05:00");
  var endMs = Date.parse("2026-11-06T16:00:00-05:00");

  function openOnly(item) {
    document.querySelectorAll(".tl-item").forEach(function (other) {
      var button = other.querySelector("button");
      var panel = other.querySelector(".tl-panel");
      var willOpen = other === item;
      other.classList.toggle("is-open", willOpen);
      if (button) button.setAttribute("aria-expanded", willOpen ? "true" : "false");
      if (panel) panel.hidden = !willOpen;
    });
  }

  function renderCountdown() {
    if (!countdown || !intro) return;
    var units = {
      d: countdown.querySelector('[data-unit="d"]'),
      h: countdown.querySelector('[data-unit="h"]'),
      m: countdown.querySelector('[data-unit="m"]'),
      s: countdown.querySelector('[data-unit="s"]')
    };
    function setBoxes(ms) {
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
    if (now >= endMs) {
      setBoxes(0);
      intro.classList.add("is-past");
      var plan = document.getElementById("plan-rest");
      var planBtn = document.querySelector(".plan-toggle");
      if (plan && !intro.dataset.shifted) {
        intro.dataset.shifted = "1";
        plan.hidden = false;
        if (planBtn) {
          planBtn.setAttribute("aria-expanded", "true");
          planBtn.textContent = "Hide full plan";
        }
      }
      return;
    }
    if (now >= startMs) {
      setBoxes(endMs - now);
      return;
    }
    setBoxes(startMs - now);
  }

  if (intro) {
    renderCountdown();
    window.setInterval(renderCountdown, 1000);
    if (introButton) {
      introButton.addEventListener("click", function () {
        intro.dataset.user = "1";
      });
    }
    if (introPanel) introPanel.hidden = !intro.classList.contains("is-open");
  }

  var cursorChip = document.querySelector(".cursor-chip");
  if (cursorChip) {
    var cursorButton = cursorChip.querySelector("button");
    function setCursor(open) {
      cursorChip.classList.toggle("is-open", open);
      cursorButton.setAttribute("aria-expanded", open ? "true" : "false");
    }
    cursorButton.addEventListener("click", function () {
      setCursor(!cursorChip.classList.contains("is-open"));
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setCursor(false);
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.className = "visually-hidden";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy") ? resolve() : reject(new Error("copy failed"));
      } catch (error) {
        reject(error);
      }
      document.body.removeChild(area);
    });
  }

  var planBtn = document.querySelector(".plan-toggle");
  var planRest = document.getElementById("plan-rest");
  if (planBtn && planRest) {
    planBtn.addEventListener("click", function () {
      var open = planBtn.getAttribute("aria-expanded") === "true";
      planBtn.setAttribute("aria-expanded", open ? "false" : "true");
      planRest.hidden = open;
      planBtn.textContent = open ? "See full plan" : "Hide full plan";
    });
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

  document.querySelectorAll(".copy").forEach(function (button) {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      var url = button.getAttribute("data-copy") || "";
      var live = button.parentElement.querySelector(".copy-live");
      copyText(url).then(function () {
        button.classList.add("is-copied");
        if (live) live.textContent = "Copied";
        window.setTimeout(function () {
          button.classList.remove("is-copied");
          if (live) live.textContent = "";
        }, 1500);
      }).catch(function () {
        if (live) live.textContent = "";
      });
    });
  });
});
