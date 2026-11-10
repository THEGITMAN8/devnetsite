import createGlobe from "/vendor/cobe.js";

var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

var CITIES = [
  { id: "vancouver", location: [49.2827, -123.1207], size: 0.028 },
  { id: "london", location: [42.9849, -81.2453], size: 0.062, color: [0.961, 0.816, 0.996] },
  { id: "waterloo", location: [43.4643, -80.5204], size: 0.022 },
  { id: "guelph", location: [43.5448, -80.2482], size: 0.022 },
  { id: "toronto", location: [43.6532, -79.3832], size: 0.028 },
  { id: "kingston", location: [44.2312, -76.486], size: 0.024 },
  { id: "montreal", location: [45.5017, -73.5673], size: 0.03 },
  { id: "halifax", location: [44.6488, -63.5752], size: 0.028 },
  { id: "tucson", location: [32.2226, -110.9747], size: 0.028 },
  { id: "miami", location: [25.7617, -80.1918], size: 0.028 },
  { id: "boston", location: [42.3601, -71.0589], size: 0.028 },
  { id: "new-york-city", location: [40.7128, -74.006], size: 0.03 }
];

function phiFor(lon) {
  return Math.PI - ((lon * Math.PI) / 180 - Math.PI / 2);
}

function wrapPi(value) {
  var turn = Math.PI * 2;
  var next = value % turn;
  if (next < 0) next += turn;
  return next;
}

function mountGlobe() {
  var board = document.querySelector(".map-board");
  if (!board || board.getAttribute("data-network") !== "globe") return;
  var canvas = document.getElementById("network-globe");
  var stage = canvas ? canvas.closest(".globe-stage") : null;
  if (!canvas || !stage) return;

  var mobile = window.matchMedia("(max-width: 767px)").matches;
  var dpr = mobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.75);
  var reduce = reduceQuery.matches;
  var onscreen = false;
  var settled = false;
  var frames = 0;
  var dragging = false;
  var drag = null;
  var locked = "";
  var phi = phiFor(-95);
  var theta = 0.32;
  var aim = null;
  var globe = null;
  var markerKey = "";

  function markers() {
    return CITIES.map(function (city) {
      var marker = { location: city.location, size: city.size };
      if (city.color) marker.color = city.color;
      if (locked && city.id === locked) marker.size = Math.max(city.size, 0.07);
      return marker;
    });
  }

  function running() {
    if (document.hidden || !onscreen) return false;
    if (reduce) return !settled;
    return true;
  }

  function sync() {
    if (!globe) return;
    var run = running();
    globe.toggle(run);
    stage.dataset.globe = run ? "running" : "paused";
  }

  try {
    globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: 300,
      height: 300,
      phi: phi,
      theta: theta,
      dark: 1,
      diffuse: 1.35,
      mapSamples: mobile ? 7000 : 12000,
      mapBrightness: 7,
      mapBaseBrightness: 0.04,
      baseColor: [0.11, 0.05, 0.2],
      markerColor: [0.541, 0.361, 0.941],
      glowColor: [0.42, 0.22, 0.78],
      markers: markers(),
      scale: 1,
      offset: [0, 0],
      onRender: function (state) {
        frames += 1;
        if (!dragging && aim == null && !reduce) phi += mobile ? 0.0016 : 0.0022;
        if (aim != null) {
          var delta = aim - phi;
          while (delta > Math.PI) delta -= Math.PI * 2;
          while (delta < -Math.PI) delta += Math.PI * 2;
          if (reduce || Math.abs(delta) < 0.004) phi = aim;
          else phi += delta * 0.12;
        }
        state.phi = phi;
        state.theta = theta;
        state.width = canvas.width || 300;
        state.height = canvas.height || 300;
        if (markerKey !== locked) {
          markerKey = locked;
          state.markers = markers();
        }
        if (reduce && frames > 24) {
          settled = true;
          stage.dataset.globe = "paused";
          if (globe) globe.toggle(false);
        } else if (!reduce && onscreen && !document.hidden) {
          stage.dataset.globe = "running";
        }
      }
    });
  } catch (error) {
    stage.classList.add("globe-stage--fallback");
    return;
  }

  globe.toggle(false);
  if (typeof globe.resize === "function") globe.resize();

  if ("ResizeObserver" in window) {
    var resizeObserver = new ResizeObserver(function () {
      if (typeof globe.resize === "function") globe.resize();
    });
    resizeObserver.observe(stage);
  } else {
    window.addEventListener("resize", function () {
      if (typeof globe.resize === "function") globe.resize();
    });
  }

  if ("IntersectionObserver" in window) {
    var visibility = new IntersectionObserver(
      function (entries) {
        onscreen = entries.some(function (entry) {
          return entry.isIntersecting;
        });
        if (onscreen && reduce) {
          settled = false;
          frames = 0;
        }
        sync();
      },
      { threshold: 0.12 }
    );
    visibility.observe(stage);
  } else {
    onscreen = true;
    sync();
  }

  document.addEventListener("visibilitychange", sync);
  reduceQuery.addEventListener("change", function () {
    reduce = reduceQuery.matches;
    settled = false;
    frames = 0;
    sync();
  });

  canvas.addEventListener("pointerdown", function (event) {
    if (event.button != null && event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, locked: false };
  });

  canvas.addEventListener("pointermove", function (event) {
    if (!drag || event.pointerId !== drag.id || reduce) return;
    var dx = event.clientX - drag.x;
    var dy = event.clientY - drag.y;
    if (!drag.locked) {
      if (Math.hypot(dx, dy) < 5) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        drag = null;
        return;
      }
      drag.locked = true;
      dragging = true;
      aim = null;
      locked = "";
      document.dispatchEvent(new CustomEvent("devnet:spin"));
      canvas.setPointerCapture(event.pointerId);
    }
    phi = wrapPi(phi + dx * 0.005);
    drag.x = event.clientX;
    drag.y = event.clientY;
  });

  function endDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    drag = null;
    dragging = false;
  }

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  document.addEventListener("devnet:city", function (event) {
    var id = event.detail || "";
    locked = id;
    var city = null;
    for (var i = 0; i < CITIES.length; i += 1) {
      if (CITIES[i].id === id) city = CITIES[i];
    }
    aim = city ? phiFor(city.location[1]) : null;
    if (reduce) {
      if (aim != null) phi = aim;
      settled = false;
      frames = 0;
      sync();
    }
  });
}

function plainMotion() {
  return reduceQuery.matches || window.matchMedia("(max-width: 767px)").matches;
}

function mountMotion() {
  if (plainMotion() || !window.gsap || !window.ScrollTrigger) return;
  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  try {
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("motion-on");

  var chars = document.querySelectorAll(".split__ch > span");
  if (chars.length) {
    gsap.fromTo(
      chars,
      { yPercent: 115 },
      { yPercent: 0, duration: 0.72, stagger: 0.045, ease: "power3.out", delay: 0.05 }
    );
  }

  var cursorBits = document.querySelectorAll(".cursor-lockup, .cursor-copy");
  if (cursorBits.length) {
    gsap.fromTo(
      cursorBits,
      { autoAlpha: 0, y: 20 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "#cursor",
          start: "top 82%",
          once: true
        }
      }
    );
  }

  if (typeof gsap.utils.toArray === "function") {
    gsap.utils.toArray("main .reveal").forEach(function (section) {
      gsap.fromTo(
        section,
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.75,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 88%",
            once: true
          }
        }
      );
    });
  }

  var fill = document.querySelector(".timeline__fill");
  var nodes = document.querySelectorAll(".tl-node");
  var western = document.getElementById("western");
  if (fill && western && nodes.length) {
    var proxy = { p: 0 };
    gsap.to(proxy, {
      p: 1,
      ease: "none",
      scrollTrigger: {
        trigger: western,
        start: "top 70%",
        end: "bottom 58%",
        scrub: true
      },
      onUpdate: function () {
        var horizontal = window.matchMedia("(min-width: 1100px)").matches;
        var progress = proxy.p;
        fill.style.transform = (horizontal ? "scaleX(" : "scaleY(") + progress.toFixed(4) + ")";
        Array.prototype.forEach.call(nodes, function (node, index) {
          node.classList.toggle("is-lit", progress >= (index + 0.2) / nodes.length);
        });
      }
    });
  }
  } catch (error) {
    document.documentElement.classList.remove("motion-on");
    document.querySelectorAll(".reveal, .cursor-lockup, .cursor-copy").forEach(function (section) {
      section.style.opacity = "";
      section.style.transform = "";
      section.style.visibility = "";
    });
  }
}

function mountMarquee() {
  if (reduceQuery.matches) return;
  var strip = document.querySelector(".logo-strip");
  if (!strip || strip.dataset.marquee === "1") return;
  var items = Array.prototype.slice.call(strip.children);
  if (items.length < 2) return;
  for (var copy = 0; copy < 3; copy += 1) {
    items.forEach(function (item) {
      var clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      strip.appendChild(clone);
    });
  }
  strip.dataset.marquee = "1";
  strip.classList.add("is-marquee");
}

function mountTilt() {
  if (reduceQuery.matches) return;
  document.querySelectorAll(".build-card").forEach(function (card) {
    card.addEventListener("pointermove", function (event) {
      if (event.pointerType !== "mouse") return;
      var rect = card.getBoundingClientRect();
      var px = (event.clientX - rect.left) / rect.width - 0.5;
      var py = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = "rotateX(" + (-py * 6).toFixed(2) + "deg) rotateY(" + (px * 8).toFixed(2) + "deg) translateY(-2px)";
    });
    card.addEventListener("pointerleave", function () {
      card.style.transform = "";
    });
  });
  document.querySelectorAll(".btn--primary").forEach(function (btn) {
    btn.addEventListener("pointermove", function (event) {
      if (event.pointerType !== "mouse") return;
      var rect = btn.getBoundingClientRect();
      var px = (event.clientX - rect.left) / rect.width - 0.5;
      var py = (event.clientY - rect.top) / rect.height - 0.5;
      btn.style.transform = "translate(" + (px * 6).toFixed(1) + "px," + (py * 4).toFixed(1) + "px)";
    });
    btn.addEventListener("pointerleave", function () {
      btn.style.transform = "";
    });
  });
}

function mountCounts() {
  var chapters = document.querySelectorAll(".na-map .na-pin").length;
  document.querySelectorAll("[data-count-chapters]").forEach(function (el) {
    if (!chapters) return;
    el.setAttribute("data-count", String(chapters));
    el.textContent = String(chapters);
  });
  var reduced = plainMotion() || !window.gsap || !window.ScrollTrigger;
  document.querySelectorAll(".chapter-facts, .hero-count, .story-seq").forEach(function (group) {
    Array.prototype.forEach.call(group.querySelectorAll("[data-count]"), function (el, index) {
      var target = Number(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      if (!isFinite(target)) return;
      el.textContent = String(target) + suffix;
      if (reduced) return;
      var obj = { n: 0 };
      window.gsap.to(obj, {
        n: target,
        duration: 1.15,
        delay: index * 0.08,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          toggleActions: "play none none none"
        },
        onStart: function () {
          el.textContent = "0" + suffix;
        },
        onUpdate: function () {
          el.textContent = String(Math.round(obj.n)) + suffix;
        }
      });
    });
  });
  if (reduced) return;
  document.querySelectorAll(".chart__bar").forEach(function (bar, index) {
    var width = Number(bar.getAttribute("width"));
    if (!isFinite(width)) return;
    window.gsap.fromTo(bar, { attr: { width: 0 } }, {
      attr: { width: width },
      duration: 0.9,
      delay: index * 0.08,
      ease: "power2.out",
      scrollTrigger: {
        trigger: bar.closest(".chart") || bar,
        start: "top 84%",
        toggleActions: "play none none none"
      }
    });
  });
  var line = document.querySelector(".timechart__line");
  if (line && typeof line.getTotalLength === "function") {
    var length = line.getTotalLength();
    window.gsap.fromTo(line, { strokeDasharray: length, strokeDashoffset: length }, {
      strokeDashoffset: 0,
      duration: 1.15,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".timechart",
        start: "top 84%",
        toggleActions: "play none none none"
      }
    });
  }
  if (window.gsap.utils && window.gsap.utils.toArray) {
    window.gsap.from(window.gsap.utils.toArray(".timechart__node"), {
      autoAlpha: 0,
      y: 8,
      duration: 0.45,
      stagger: 0.12,
      delay: 0.15,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".timechart",
        start: "top 84%",
        toggleActions: "play none none none"
      }
    });
  }
}

function mountConstellation() {
  var canvas = document.getElementById("constellation");
  if (!canvas || !canvas.getContext) return;
  var phone = window.matchMedia("(max-width: 767px)");
  if (phone.matches) {
    if (phone.addEventListener) {
      phone.addEventListener("change", function startWhenWide(event) {
        if (event.matches) return;
        phone.removeEventListener("change", startWhenWide);
        mountConstellation();
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      });
    }
    return;
  }
  var stars = [
    { id: "vancouver", lon: -123.12, lat: 49.28 },
    { id: "tucson", lon: -110.97, lat: 32.22 },
    { id: "london", lon: -81.25, lat: 42.98, lead: true },
    { id: "waterloo", lon: -80.52, lat: 43.46 },
    { id: "guelph", lon: -80.25, lat: 43.54 },
    { id: "toronto", lon: -79.38, lat: 43.65 },
    { id: "kingston", lon: -76.49, lat: 44.23 },
    { id: "montreal", lon: -73.57, lat: 45.5 },
    { id: "new-york-city", lon: -74.01, lat: 40.71 },
    { id: "boston", lon: -71.06, lat: 42.36 },
    { id: "miami", lon: -80.19, lat: 25.76 },
    { id: "halifax", lon: -63.58, lat: 44.65 }
  ];
  var ctx = canvas.getContext("2d");
  var fine = window.matchMedia("(min-width: 1100px)");
  var points = [];
  var links = [];
  var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  var raf = 0;

  function km(a, b) {
    var dLat = (b.lat - a.lat) * Math.PI / 180;
    var dLon = (b.lon - a.lon) * Math.PI / 180;
    var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(s)));
  }

  function project() {
    var w = canvas.width;
    var h = canvas.height;
    var lon0 = -123.12;
    var lon1 = -63.58;
    var lat0 = 25.76;
    var lat1 = 49.28;
    var raw = stars.map(function (star) {
      return {
        lead: !!star.lead,
        x: (star.lon - lon0) / (lon1 - lon0),
        y: (lat1 - star.lat) / (lat1 - lat0)
      };
    });
    var hub = raw.filter(function (star) { return star.lead; })[0] || raw[0];
    points = raw.map(function (star) {
      var dx = star.x - hub.x;
      var dy = star.y - hub.y;
      var dist = Math.hypot(dx, dy) || 0.001;
      var opened = star.lead ? 0 : Math.pow(dist, 0.46);
      return {
        lead: star.lead,
        lock: star.lead,
        x: hub.x + (dx / dist) * opened,
        y: hub.y + (dy / dist) * opened
      };
    });
    function fit() {
      var minX = Infinity;
      var maxX = -Infinity;
      var minY = Infinity;
      var maxY = -Infinity;
      points.forEach(function (p) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });
      var spanX = Math.max(0.001, maxX - minX);
      var spanY = Math.max(0.001, maxY - minY);
      var margin = Math.min(w, h) * 0.1;
      var scale = Math.min((w - margin * 2) / spanX, (h - margin * 2) / spanY);
      var originX = (w - spanX * scale) / 2;
      var originY = (h - spanY * scale) / 2;
      points.forEach(function (p) {
        p.x = originX + (p.x - minX) * scale;
        p.y = originY + (p.y - minY) * scale;
      });
    }
    fit();
    var min = Math.min(w, h) * 0.11;
    var n;
    var i;
    var j;
    for (n = 0; n < 40; n += 1) {
      for (i = 0; i < points.length; i += 1) {
        for (j = i + 1; j < points.length; j += 1) {
          var a = points[i];
          var b = points[j];
          var dx = b.x - a.x;
          var dy = b.y - a.y;
          var dist = Math.hypot(dx, dy) || 0.01;
          if (dist >= min) continue;
          var push = (min - dist) / 2;
          var ux = dx / dist;
          var uy = dy / dist;
          if (!a.lock) {
            a.x -= ux * push;
            a.y -= uy * push;
          }
          if (!b.lock) {
            b.x += ux * push;
            b.y += uy * push;
          }
        }
      }
      var edge = Math.min(w, h) * 0.06;
      points.forEach(function (p) {
        p.x = Math.max(edge, Math.min(w - edge, p.x));
        p.y = Math.max(edge, Math.min(h - edge, p.y));
      });
    }
    fit();
    links = [];
    for (i = 0; i < stars.length; i += 1) {
      for (j = i + 1; j < stars.length; j += 1) {
        if (km(stars[i], stars[j]) < 480) links.push([i, j]);
      }
    }
  }

  function draw(still) {
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    var ox = still ? 0 : pointer.x;
    var oy = still ? 0 : pointer.y;
    ctx.lineWidth = Math.max(1, w / 640);
    ctx.strokeStyle = "rgba(205, 184, 242, 0.32)";
    links.forEach(function (pair) {
      var a = points[pair[0]];
      var b = points[pair[1]];
      ctx.beginPath();
      ctx.moveTo(a.x + ox * 0.45, a.y + oy * 0.45);
      ctx.lineTo(b.x + ox * 0.45, b.y + oy * 0.45);
      ctx.stroke();
    });
    points.forEach(function (p, index) {
      var shift = 0.3 + (index % 5) * 0.1;
      var x = p.x + (still ? 0 : ox * (p.lead ? 0.15 : shift));
      var y = p.y + (still ? 0 : oy * (p.lead ? 0.15 : shift));
      if (p.lead) {
        ctx.beginPath();
        ctx.fillStyle = "rgba(245, 208, 254, 0.18)";
        ctx.arc(x, y, Math.max(10, w * 0.026), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.fillStyle = p.lead ? "#f5d0fe" : "rgba(205, 184, 242, 0.92)";
      ctx.arc(x, y, p.lead ? Math.max(3.5, w * 0.007) : Math.max(2, w * 0.0038), 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function resize() {
    if (phone.matches) {
      if (raf) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
      return;
    }
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.round(rect.width * dpr));
    var h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    project();
    draw(true);
  }

  function moving() {
    return !reduceQuery.matches && fine.matches;
  }

  function loop() {
    raf = 0;
    if (!moving()) {
      pointer.x = 0;
      pointer.y = 0;
      draw(true);
      return;
    }
    pointer.x += (pointer.tx - pointer.x) * 0.08;
    pointer.y += (pointer.ty - pointer.y) * 0.08;
    draw(false);
    if (Math.hypot(pointer.tx - pointer.x, pointer.ty - pointer.y) > 0.35) {
      raf = window.requestAnimationFrame(loop);
    }
  }

  canvas.addEventListener("pointermove", function (event) {
    if (!moving()) return;
    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var scale = canvas.width / rect.width;
    pointer.tx = ((event.clientX - rect.left) / rect.width - 0.5) * 16 * scale;
    pointer.ty = ((event.clientY - rect.top) / rect.height - 0.5) * 12 * scale;
    if (!raf) raf = window.requestAnimationFrame(loop);
  });
  canvas.addEventListener("pointerleave", function () {
    pointer.tx = 0;
    pointer.ty = 0;
    if (moving() && !raf) raf = window.requestAnimationFrame(loop);
  });

  resize();
  window.addEventListener("resize", resize);
  if (fine.addEventListener) fine.addEventListener("change", resize);
  if (phone.addEventListener) phone.addEventListener("change", resize);
}

mountGlobe();
mountMarquee();
mountTilt();
mountMotion();
mountCounts();
mountConstellation();
window.addEventListener("load", function () {
  if (window.ScrollTrigger) window.ScrollTrigger.refresh();
});
