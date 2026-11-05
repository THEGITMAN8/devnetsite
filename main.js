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

  document.querySelectorAll("[data-count]").forEach(function (el) {
    var target = Number(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var finalText = String(target) + suffix;
    if (reduce || !("IntersectionObserver" in window)) {
      el.textContent = finalText;
      return;
    }
    var started = false;
    var counter = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || started) return;
          started = true;
          counter.unobserve(el);
          var start = null;
          var duration = 800;
          function frame(now) {
            if (start === null) start = now;
            var progress = Math.min(1, (now - start) / duration);
            var eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = String(Math.round(target * eased)) + suffix;
            if (progress < 1) requestAnimationFrame(frame);
            else el.textContent = finalText;
          }
          requestAnimationFrame(frame);
        });
      },
      { threshold: 0.6 }
    );
    counter.observe(el);
  });

  var stage = document.querySelector(".map-stage");
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

  var lockedCity = "";
  function setCity(id) {
    var active = id || lockedCity;
    document.querySelectorAll("[data-city]").forEach(function (el) {
      el.classList.toggle("is-hot", active !== "" && el.getAttribute("data-city") === active);
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

  document.querySelectorAll(".chapter").forEach(function (button) {
    button.addEventListener("click", function () {
      var id = button.getAttribute("data-city") || "";
      lockedCity = lockedCity === id ? "" : id;
      setCity(lockedCity);
      if (!lockedCity) return;
      var pin = document.querySelector('.map-stage .pin[data-city="' + lockedCity + '"]');
      if (pin) pin.scrollIntoView({ block: "center", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
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
    var now = Date.now();
    if (now >= endMs) {
      countdown.textContent = "Past";
      intro.classList.add("is-past");
      if (introButton) introButton.setAttribute("aria-label", "Intro workshop, past");
      if (!intro.dataset.user && !intro.dataset.shifted) {
        intro.dataset.shifted = "1";
        openOnly(nextItem);
      }
      return;
    }
    if (now >= startMs) {
      countdown.textContent = "Happening now";
      return;
    }
    var diff = startMs - now;
    var days = Math.floor(diff / 86400000);
    var hours = Math.floor((diff % 86400000) / 3600000);
    var minutes = Math.floor((diff % 3600000) / 60000);
    countdown.textContent = days > 0 ? "Starts in " + days + "d " + hours + "h" : "Starts in " + hours + "h " + minutes + "m";
  }

  if (intro) {
    renderCountdown();
    window.setInterval(renderCountdown, 30000);
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
