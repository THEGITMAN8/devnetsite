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

function mountMotion() {
  if (reduceQuery.matches || !window.gsap || !window.ScrollTrigger) return;
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

mountGlobe();
mountMotion();
