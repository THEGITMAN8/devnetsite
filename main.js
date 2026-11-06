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

  var sectionIds = ["about", "network", "western", "socials"];
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

  var lockedCity = "";
  function setCity(id) {
    var active = id || lockedCity;
    document.querySelectorAll("[data-city]").forEach(function (el) {
      var on = active !== "" && el.getAttribute("data-city") === active;
      el.classList.toggle("is-hot", on);
      if (el.classList.contains("city-row")) {
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

  document.querySelectorAll(".city-row").forEach(function (button) {
    button.addEventListener("click", function () {
      var id = button.getAttribute("data-city") || "";
      lockedCity = lockedCity === id ? "" : id;
      setCity(lockedCity);
      document.dispatchEvent(new CustomEvent("devnet:city", { detail: lockedCity }));
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
          el.textContent = "0" + (plus ? "+" : "");
          function frame(now) {
            var t = (now - begin) / 900;
            if (t < 0) {
              window.requestAnimationFrame(frame);
              return;
            }
            if (t > 1) t = 1;
            var eased = 1 - Math.pow(1 - t, 3);
            var value = Math.round(eased * target);
            el.textContent = String(t === 1 ? target : value) + (plus ? "+" : "");
            if (t < 1) window.requestAnimationFrame(frame);
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
    board.classList.add("is-sequencing");
    var pins = Array.prototype.slice.call(board.querySelectorAll(".map-stage .pin"));
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
