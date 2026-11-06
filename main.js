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

  function setupMap(mapStage, reduced) {
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
        pin.removeAttribute("aria-hidden");
      });
      clusterLayer.replaceChildren();
      if (!pins.length || !world.clientWidth) return;
      var centers = pins.map(function (pin) {
        var label = pin.querySelector(".pin__label");
        return {
          pin: pin,
          x: pin.offsetLeft,
          y: pin.offsetTop,
          name: label ? label.textContent : pin.getAttribute("data-city"),
          place: pin.getAttribute("data-place") || "",
          country: pin.getAttribute("data-country") || ""
        };
      });
      var parent = centers.map(function (_, index) { return index; });
      function find(index) {
        while (parent[index] !== index) {
          parent[index] = parent[parent[index]];
          index = parent[index];
        }
        return index;
      }
      if (scale < 3.2) {
        var byPlace = {};
        centers.forEach(function (center, index) {
          if (!center.place) return;
          if (!byPlace[center.place]) byPlace[center.place] = [];
          byPlace[center.place].push(index);
        });
        Object.keys(byPlace).forEach(function (place) {
          var ids = byPlace[place];
          if (ids.length < 2) return;
          for (var n = 1; n < ids.length; n++) parent[find(ids[n])] = find(ids[0]);
        });
      }
      var groups = {};
      centers.forEach(function (center, index) {
        var root = find(index);
        if (!groups[root]) groups[root] = [];
        groups[root].push(center);
      });
      var placed = [];
      var chrome = controlRects();
      function screenPoint(wx, wy) {
        return { sx: x + wx * scale, sy: y + wy * scale };
      }
      function overlaps(a, b, gap) {
        var pad = gap || 0;
        return a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad;
      }
      function hitsChrome(rect) {
        for (var c = 0; c < chrome.length; c++) {
          if (overlaps(rect, chrome[c], 0)) return true;
        }
        return false;
      }
      function hitsLabels(rect) {
        for (var p = 0; p < placed.length; p++) {
          if (overlaps(rect, placed[p], 6)) return true;
        }
        return false;
      }
      function onScreen(rect) {
        return rect.left >= 4 && rect.top >= 4 && rect.right <= viewport.clientWidth - 4 && rect.bottom <= viewport.clientHeight - 4;
      }
      function visualRect(sx, sy, layoutW, layoutH) {
        return {
          left: sx - layoutW / 2,
          top: sy - layoutH / 2,
          right: sx + layoutW / 2,
          bottom: sy + layoutH / 2
        };
      }
      function labelShifts() {
        var shifts = [[0, -40]];
        var radii = [28, 48, 72, 104, 144, 188];
        for (var r = 0; r < radii.length; r++) {
          for (var a = 0; a < 16; a++) {
            var ang = -Math.PI / 2 + (Math.PI * 2 * a) / 16;
            shifts.push([Math.cos(ang) * radii[r], Math.sin(ang) * radii[r]]);
          }
        }
        return shifts;
      }
      var shifts = labelShifts();
      Object.keys(groups).sort(function (a, b) {
        return groups[b].length - groups[a].length;
      }).forEach(function (key) {
        var group = groups[key];
        var cx = 0;
        var cy = 0;
        var names = [];
        var live = false;
        group.forEach(function (center) {
          cx += center.x;
          cy += center.y;
          names.push(center.name);
          if (center.pin.classList.contains("pin--founding")) live = true;
        });
        cx /= group.length;
        cy /= group.length;
        var label = group.length > 1 ? group[0].place : group[0].name;
        if (!label) label = names[0];
        var anchor = screenPoint(cx, cy);
        if (anchor.sx < -8 || anchor.sy < -8 || anchor.sx > viewport.clientWidth + 8 || anchor.sy > viewport.clientHeight + 8) return;
        var button = document.createElement("button");
        button.type = "button";
        button.className = "map-cluster map-label" + (live ? " map-cluster--live" : "");
        button.textContent = label;
        button.setAttribute("aria-label", group.length > 1 ? label + ": " + names.join(", ") : label);
        button.addEventListener("click", function (event) {
          event.stopPropagation();
          if (group.length > 1) expandGroup(group);
          else framePin(group[0].pin);
        });
        clusterLayer.appendChild(button);
        var layoutW = Math.max(button.offsetWidth, 44);
        var layoutH = Math.max(button.offsetHeight, 28);
        var chosen = null;
        var spare = null;
        for (var s = 0; s < shifts.length; s++) {
          var tryX = cx + shifts[s][0] / scale;
          var tryY = cy + shifts[s][1] / scale;
          var point = screenPoint(tryX, tryY);
          var rect = visualRect(point.sx, point.sy, layoutW, layoutH);
          if (!onScreen(rect) || hitsChrome(rect)) continue;
          if (!hitsLabels(rect)) {
            chosen = { x: tryX, y: tryY, rect: rect };
            break;
          }
          if (!spare) spare = { x: tryX, y: tryY, rect: rect };
        }
        if (!chosen) chosen = spare;
        if (!chosen) {
          button.remove();
          return;
        }
        button.style.left = (chosen.x / world.clientWidth * 100) + "%";
        button.style.top = (chosen.y / world.clientHeight * 100) + "%";
        placed.push(chosen.rect);
      });
    }

    function controlRects() {
      var origin = viewport.getBoundingClientRect();
      var pad = 8;
      var rects = [];
      var nodes = mapStage.querySelectorAll(".map-ctl, .map-explore button");
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (el.hidden) continue;
        var computed = window.getComputedStyle(el);
        if (computed.display === "none" || computed.visibility === "hidden") continue;
        var rect = el.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) continue;
        rects.push({
          left: rect.left - origin.left - pad,
          top: rect.top - origin.top - pad,
          right: rect.right - origin.left + pad,
          bottom: rect.bottom - origin.top + pad
        });
      }
      return rects;
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
      var pins = world.querySelectorAll(".pin");
      var vw = viewport.clientWidth;
      var vh = viewport.clientHeight;
      var ww = world.clientWidth;
      var wh = world.clientHeight;
      if (!pins.length || !vw || !vh || !ww || !wh) return;
      var focused = [];
      var all = [];
      Array.prototype.forEach.call(pins, function (pin) {
        var px = pin.offsetLeft;
        var py = pin.offsetTop;
        all.push({ x: px, y: py });
        var rx = px / ww;
        var ry = py / wh;
        if (rx > 0.55 && rx < 0.95 && ry > 0.32 && ry < 0.62) focused.push({ x: px, y: py });
      });
      var use = focused.length >= 4 ? focused : all;
      var minX = Infinity;
      var minY = Infinity;
      var maxX = -Infinity;
      var maxY = -Infinity;
      use.forEach(function (point) {
        if (point.x < minX) minX = point.x;
        if (point.y < minY) minY = point.y;
        if (point.x > maxX) maxX = point.x;
        if (point.y > maxY) maxY = point.y;
      });
      var cx = (minX + maxX) / 2;
      var cy = (minY + maxY) / 2;
      var bw = Math.max(maxX - minX, 48);
      var bh = Math.max(maxY - minY, 48);
      var next = Math.min((vw - 168) / bw, (vh - 96) / bh);
      if (!isFinite(next) || next < 1) next = 1;
      if (next > 3.05) next = 3.05;
      homeScale = next;
      homeX = vw / 2 - cx * next;
      homeY = vh / 2 - cy * next;
      var minBoundX = vw * (1 - homeScale);
      var minBoundY = vh * (1 - homeScale);
      if (homeX > 0) homeX = 0;
      if (homeY > 0) homeY = 0;
      if (homeX < minBoundX) homeX = minBoundX;
      if (homeY < minBoundY) homeY = minBoundY;
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
      var next = Math.max(scale, 4);
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
      document.dispatchEvent(new CustomEvent("devnet:city", { detail: lockedCity }));
      if (!lockedCity) return;
      var pin = document.querySelector('.map-stage .pin[data-city="' + lockedCity + '"]');
      var row = document.querySelector('.city-row[data-city="' + lockedCity + '"]');
      if (button.classList.contains("pin")) {
        if (row) row.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
        return;
      }
      var boardNow = document.querySelector(".map-board");
      if (pin && mapApi && (!boardNow || boardNow.getAttribute("data-network") !== "globe")) mapApi.framePin(pin);
    });
  });

  document.addEventListener("devnet:spin", function () {
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


  var stats = document.querySelector(".stats");
  if (stats && !reduce && "IntersectionObserver" in window) {
    var counted = false;
    var statsObserver = new IntersectionObserver(
      function (entries) {
        if (counted || !entries.some(function (entry) { return entry.isIntersecting; })) return;
        counted = true;
        statsObserver.disconnect();
        stats.querySelectorAll("[data-count]").forEach(function (el, index) {
          var target = Number(el.getAttribute("data-count"));
          var plus = el.getAttribute("data-plus") === "1";
          var begin = performance.now() + index * 80;
          el.textContent = "0";
          function frame(now) {
            var t = (now - begin) / 900;
            if (t < 0) {
              window.requestAnimationFrame(frame);
              return;
            }
            if (t > 1) t = 1;
            var eased = 1 - Math.pow(1 - t, 3);
            var value = Math.round(eased * target);
            var done = t === 1;
            el.textContent = String(done ? target : value) + (plus && done ? "+" : "");
            if (!done) window.requestAnimationFrame(frame);
          }
          window.requestAnimationFrame(frame);
        });
      },
      { threshold: 0.4 }
    );
    statsObserver.observe(stats);
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
