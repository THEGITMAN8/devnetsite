/* DevNet updated-site, main interactions
 * - Centralized CTA links (single source of truth, mirrors data/chapters.js)
 * - Sticky header glass + scroll-spy
 * - Mobile nav toggle
 * - Reveal-on-scroll
 * - Leaflet map with chapter + presence pins, status legend, filter chips
 *
 * Map patterns (bounds, dark tiles, popup interaction) are ported from
 * Live-devnetsite/main.js and simplified for the data-driven shape used here.
 */

const CTA_LINKS = {
  joinDevNet:
    'https://docs.google.com/forms/d/e/1FAIpQLSf-zY-pXzwldWrckCPpmdXvuXlvv-fNodLRm0zabNjaP1JdvA/viewform?usp=dialog',
  startChapter:
    'https://docs.google.com/forms/d/e/1FAIpQLSfQ2YZFnGW_jo85EE1zla5nVDMlwmsz3wAoqt5cktMlDat7gQ/viewform?usp=dialog',
  submitProject:
    'https://docs.google.com/forms/d/e/1FAIpQLSf29qweW0Zok2b_80z03ueYLMd-n5IwpmRxCCSU0UYOikyYGg/viewform?usp=dialog'
};

const STATUS_LABEL = {
  active: 'Active chapter',
  future: 'Future',
  presence: 'Network presence'
};

const STATUS_LABEL_SHORT = {
  active: 'Active',
  future: 'Future',
  presence: 'Presence'
};

const PRESENCE_BADGE_LABEL = 'Active Presence';

const STATUS_STYLE = {
  active:   { fill: '#c084fc', stroke: '#f5d0fe', radius: 9, weight: 2.5, dash: null,    glow: true },
  future:   { fill: 'rgba(100,116,139,0.25)', stroke: '#94a3b8', radius: 7, weight: 2, dash: '4 3', glow: false },
  presence: { fill: '#7e22ce', stroke: '#d8b4fe', radius: 6, weight: 1.5, dash: null,    glow: false }
};

(function injectCtaHrefs() {
  document.querySelectorAll('[data-cta]').forEach(function (el) {
    const key = el.getAttribute('data-cta');
    const href = key && CTA_LINKS[key];
    if (!href) return;
    el.setAttribute('href', href);
    if (/^https?:\/\//.test(href)) {
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    }
  });
})();

(function siteUi() {
  const header = document.getElementById('site-header');
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  function closeMobileMenu() {
    if (!toggle || !menu) return;
    menu.classList.add('hidden');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  }

  function onScroll() {
    if (!header) return;
    if (window.scrollY > 12) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      const isHidden = menu.classList.toggle('hidden');
      toggle.setAttribute('aria-expanded', String(!isHidden));
      toggle.setAttribute('aria-label', isHidden ? 'Open menu' : 'Close menu');
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMobileMenu);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!menu || menu.classList.contains('hidden')) return;
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    closeMobileMenu();
  });

  /* Scroll-spy across header anchor links. */
  const navIds = ['top', 'map', 'members', 'chapters', 'projects'];
  const navLinks = document.querySelectorAll(
    '.site-header__link[href^="#"], .site-header__mobile-link[href^="#"]'
  );
  const sections = navIds
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach(function (a) {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  }

  let lastId = null;
  let ticking = false;
  function pickActive() {
    if (!sections.length) return null;
    const line = (header ? header.getBoundingClientRect().height : 0) + window.innerHeight * 0.25;
    let active = sections[0].id;
    for (let i = 0; i < sections.length; i++) {
      const r = sections[i].getBoundingClientRect();
      if (r.top <= line) active = sections[i].id;
      else break;
    }
    return active;
  }
  function updateSpy() {
    ticking = false;
    const id = pickActive();
    if (!id || id === lastId) return;
    lastId = id;
    setActive(id);
  }
  function requestSpy() {
    if (ticking) return;
    ticking = true;
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(updateSpy);
    } else {
      setTimeout(updateSpy, 16);
    }
  }
  if (navLinks.length && sections.length) {
    window.addEventListener('scroll', requestSpy, { passive: true });
    window.addEventListener('resize', requestSpy);
    updateSpy();
  }

  /* Reveal-on-scroll for elements with .reveal. */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.06 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('visible'); });
  }
})();

(function initMap() {
  const mapEl = document.getElementById('devnet-presence-map');
  if (!mapEl || typeof L === 'undefined') return;
  const pins = (window.DEVNET_PINS || []).slice();
  if (!pins.length) return;

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const useCluster = typeof L.markerClusterGroup === 'function';
  let clusterGroup = null;
  let arcRebuildTimer = null;

  /* Continental US + southern Canada (west through east). Matches annotation framing. */
  const MAP_MAX_BOUNDS = L.latLngBounds([21.8, -133.0], [53.2, -54.0]);
  const minZoomAllowed = 3;
  const OVERVIEW_FIT_OPTS = {
    paddingTopLeft: [76, 118],
    paddingBottomRight: [56, 72],
    maxZoom: 4
  };
  let arcHighlightRegion = null;
  let arcWebGroup = null;
  let focusBoundsRelaxed = false;
  let mapResetInProgress = false;

  function overviewBounds() {
    let pinBounds = null;
    pins.forEach(function (p) {
      const ll = L.latLng(p.lat, p.lng);
      if (!pinBounds) pinBounds = L.latLngBounds(ll, ll);
      else pinBounds.extend(ll);
    });
    /* Gulf south margin; no South America; Halifax + Vancouver margins (annotation loop). */
    const frame = L.latLngBounds([23.6, -129.2], [51.8, -59.2]);
    if (!pinBounds) return frame;
    return frame.extend(pinBounds);
  }
  const hubBounds = overviewBounds();

  const map = L.map(mapEl, {
    scrollWheelZoom: true,
    zoomControl: true,
    attributionControl: true,
    maxBounds: MAP_MAX_BOUNDS,
    maxBoundsViscosity: 1.0
  });
  const tileAttrib =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';
  const tileCommon = { maxZoom: 19, minZoom: minZoomAllowed };
  const cartoTiles = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    Object.assign({ attribution: tileAttrib, subdomains: 'abcd' }, tileCommon)
  );
  const osmTiles = L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    Object.assign({ attribution: '&copy; OpenStreetMap contributors' }, tileCommon)
  );
  cartoTiles.addTo(map);
  let tileFallbackActive = false;
  let cartoTileErrors = 0;
  cartoTiles.on('tileerror', function () {
    cartoTileErrors += 1;
    if (tileFallbackActive || cartoTileErrors < 2) return;
    tileFallbackActive = true;
    map.removeLayer(cartoTiles);
    osmTiles.addTo(map);
    invalidateMapLayout();
  });
  map.setMinZoom(minZoomAllowed);
  map.fitBounds(hubBounds, OVERVIEW_FIT_OPTS);
  if (map.getZoom() < minZoomAllowed) map.setZoom(minZoomAllowed);

  function relaxMapBoundsForFocus() {
    if (focusBoundsRelaxed) return;
    focusBoundsRelaxed = true;
    map.setMaxBounds(null);
    map.options.maxBoundsViscosity = 0;
  }

  function restoreMapBounds() {
    if (!focusBoundsRelaxed) return;
    focusBoundsRelaxed = false;
    map.setMaxBounds(MAP_MAX_BOUNDS);
    map.options.maxBoundsViscosity = 1.0;
  }

  map.createPane('devnetArcs');
  map.getPane('devnetArcs').classList.add('leaflet-devnet-arcs-pane');
  map.getPane('devnetArcs').style.zIndex = '410';
  arcWebGroup = L.featureGroup().addTo(map);

  if (useCluster) {
    clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 38,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      removeOutsideVisibleBounds: true,
      disableClusteringAtZoom: 9,
      zoomToBoundsOnClick: true,
      spiderLegPolylineOptions: { weight: 1.5, color: 'rgba(192, 132, 252, 0.45)', opacity: 0.9 },
      iconCreateFunction: function (cl) {
        const n = cl.getChildCount();
        return L.divIcon({
          html: '<span class="devnet-cluster-count">' + n + '</span>',
          className: 'devnet-marker-cluster',
          iconSize: L.point(34, 34)
        });
      }
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function hubDisplayTitle(p) {
    const city = p && p.city != null ? String(p.city).trim() : '';
    if (city) return city;
    const name = p && p.name != null ? String(p.name).trim() : '';
    return name;
  }

  function formatLocationSubtitle(p, compact) {
    const region = p && p.region != null ? String(p.region).trim() : '';
    if (!region) return '';
    const parts = region.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!parts.length) return '';
    const countryRaw = parts[parts.length - 1];
    let country = countryRaw;
    if (/^canada$/i.test(countryRaw)) country = 'CAN';
    else if (/^(usa|u\.?s\.?a?\.?|united states(?: of america)?)$/i.test(countryRaw)) country = 'USA';
    else if (/^can$/i.test(countryRaw)) country = 'CAN';
    const province = parts.slice(0, -1).join(', ');
    if (!province) return country;
    if (compact) return province + ' ' + country;
    return province + ', ' + country;
  }

  function popupTitle(p) {
    if (p.type === 'chapter') {
      const name = p && p.name != null ? String(p.name).trim() : '';
      if (name) return name;
    }
    return hubDisplayTitle(p);
  }

  function tooltipHtml(p) {
    if (p.type === 'presence') {
      const title = hubDisplayTitle(p);
      const subtitle = formatLocationSubtitle(p, true);
      return (
        '<div class="presence-tooltip-inner">' +
          '<span class="presence-tooltip-inner__name">' + escapeHtml(title) + '</span>' +
          (subtitle ? '<span class="presence-tooltip-inner__location">' + escapeHtml(subtitle) + '</span>' : '') +
          '<span class="presence-tooltip-inner__status">' + escapeHtml(PRESENCE_BADGE_LABEL) + '</span>' +
        '</div>'
      );
    }
    const title = popupTitle(p);
    const subtitle = formatLocationSubtitle(p, true);
    const status = STATUS_LABEL_SHORT[p.status] || STATUS_LABEL[p.status] || p.status;
    return (
      '<div class="presence-tooltip-inner">' +
        '<span class="presence-tooltip-inner__name">' + escapeHtml(title) + '</span>' +
        (subtitle ? '<span class="presence-tooltip-inner__location">' + escapeHtml(subtitle) + '</span>' : '') +
        '<span class="presence-tooltip-inner__status">' + escapeHtml(status) + '</span>' +
      '</div>'
    );
  }

  /* Flip tooltip away from map edges (Leaflet container clips overflow). */
  const TOOLTIP_EDGE_PAD = { top: 88, right: 130, bottom: 72, left: 130 };

  function tooltipPlacementForLatLng(latlng) {
    const size = map.getSize();
    const pt = map.latLngToContainerPoint(latlng);
    const spaceTop = pt.y;
    const spaceBottom = size.y - pt.y;
    const spaceLeft = pt.x;
    const spaceRight = size.x - pt.x;
    const needFlipY = spaceTop < TOOLTIP_EDGE_PAD.top || spaceBottom < TOOLTIP_EDGE_PAD.bottom;
    const needFlipX = spaceLeft < TOOLTIP_EDGE_PAD.left || spaceRight < TOOLTIP_EDGE_PAD.right;

    if (needFlipY && needFlipX) {
      const minVert = Math.min(spaceTop, spaceBottom);
      const minHoriz = Math.min(spaceLeft, spaceRight);
      if (minVert <= minHoriz) {
        return spaceTop < spaceBottom
          ? { direction: 'bottom', offset: L.point(0, 10) }
          : { direction: 'top', offset: L.point(0, -10) };
      }
      return spaceLeft < spaceRight
        ? { direction: 'right', offset: L.point(10, 0) }
        : { direction: 'left', offset: L.point(-10, 0) };
    }
    if (needFlipY) {
      return spaceTop < spaceBottom
        ? { direction: 'bottom', offset: L.point(0, 10) }
        : { direction: 'top', offset: L.point(0, -10) };
    }
    if (needFlipX) {
      return spaceLeft < spaceRight
        ? { direction: 'right', offset: L.point(10, 0) }
        : { direction: 'left', offset: L.point(-10, 0) };
    }
    return { direction: 'top', offset: L.point(0, -10) };
  }

  function applyTooltipPlacement(marker, latlng) {
    const tip = marker.getTooltip && marker.getTooltip();
    if (!tip) return;
    const place = tooltipPlacementForLatLng(latlng || marker.getLatLng());
    tip.options.direction = place.direction;
    tip.options.offset = place.offset;
    if (typeof tip.setDirection === 'function') tip.setDirection(place.direction);
    if (tip.isOpen && tip.isOpen()) tip.update();
  }

  function refreshOpenTooltipPlacements() {
    pins.forEach(function (p) {
      const m = markers[p.id];
      const tip = m && m.getTooltip && m.getTooltip();
      if (tip && tip.isOpen && tip.isOpen()) applyTooltipPlacement(m, m.getLatLng());
    });
  }

  const markers = {};
  pins.forEach(function (p) {
    const s = STATUS_STYLE[p.status] || STATUS_STYLE.presence;
    const opts = {
      radius: s.radius,
      fillColor: s.fill,
      color: s.stroke,
      weight: s.weight,
      opacity: 1,
      fillOpacity: s.fill === 'transparent' ? 0 : 0.88
    };
    if (s.dash) opts.dashArray = s.dash;
    const marker = L.circleMarker([p.lat, p.lng], opts);
    marker.bindTooltip(tooltipHtml(p), {
      direction: 'top',
      offset: [0, -10],
      opacity: 1,
      sticky: true,
      className: 'devnet-map-tooltip'
    });
    marker.bindPopup(popupHtml(p), {
      className: 'devnet-popup',
      maxWidth: 280,
      autoPan: true,
      autoPanPadding: L.point(48, 48)
    });
    markers[p.id] = marker;

    marker.on('mouseover', function () {
      setArcHighlightByRegion(p.mapRegion || null);
      applyTooltipPlacement(marker);
      marker.openTooltip();
    });
    marker.on('mouseout', function () {
      marker.closeTooltip();
      setArcHighlightByRegion(null);
    });
    marker.on('click', function () {
      focusPin(p.id);
    });
    marker.on('popupclose', function () {
      if (mapResetInProgress) return;
      setTimeout(function () {
        if (mapResetInProgress) return;
        let anyPopupOpen = false;
        pins.forEach(function (pin) {
          const m = markers[pin.id];
          if (m && m.isPopupOpen && m.isPopupOpen()) anyPopupOpen = true;
        });
        if (!anyPopupOpen) resetMapToOverview();
      }, 0);
    });
  });

  function markerVisibleOnMap(marker) {
    if (!marker) return false;
    if (map.hasLayer(marker)) return true;
    if (clusterGroup && clusterGroup.hasLayer(marker)) return true;
    return false;
  }

  function getMarkerDisplayParent(marker) {
    if (!useCluster || !clusterGroup) return marker;
    if (typeof clusterGroup.getVisibleParent !== 'function') return marker;
    const p = clusterGroup.getVisibleParent(marker);
    return p || marker;
  }

  function popupHtml(p) {
    const badgeClass = 'pin-popup__badge pin-popup__badge--' + p.status;
    let cta = '';
    if (p.cta && p.cta.href) {
      cta = '<a class="pin-popup__cta" href="' + escapeHtml(p.cta.href) +
        '" target="_blank" rel="noopener noreferrer">' + escapeHtml(p.cta.label || 'Learn more') + '</a>';
    } else if (p.type === 'presence') {
      cta = '<a class="pin-popup__cta" href="' + escapeHtml(CTA_LINKS.startChapter) +
        '" target="_blank" rel="noopener noreferrer">Start a chapter here</a>';
    }
    if (p.type === 'presence') {
      const title = hubDisplayTitle(p);
      const location = formatLocationSubtitle(p);
      const locationLine = location
        ? '<div class="pin-popup__location">' + escapeHtml(location) + '</div>'
        : '';
      return (
        '<div class="pin-popup">' +
          '<div class="pin-popup__title">' + escapeHtml(title) + '</div>' +
          locationLine +
          '<span class="' + badgeClass + '">' + escapeHtml(PRESENCE_BADGE_LABEL) + '</span>' +
          (cta ? '<div>' + cta + '</div>' : '') +
        '</div>'
      );
    }
    const statusLabel = STATUS_LABEL_SHORT[p.status] || STATUS_LABEL[p.status] || p.status;
    const title = popupTitle(p);
    const location = formatLocationSubtitle(p);
    const locationLine = location
      ? '<div class="pin-popup__location">' + escapeHtml(location) + '</div>'
      : '';
    const schoolLine = p.type === 'chapter' && p.school
      ? '<div class="pin-popup__school">' + escapeHtml(p.school) + '</div>'
      : '';
    return (
      '<div class="pin-popup">' +
        '<div class="pin-popup__title">' + escapeHtml(title) + '</div>' +
        locationLine +
        schoolLine +
        '<span class="' + badgeClass + '">' + escapeHtml(statusLabel) + '</span>' +
        (cta ? '<div>' + cta + '</div>' : '') +
      '</div>'
    );
  }

  /* Hub arc web (topology ported from Live-devnetsite/main.js). */
  function hubArcLatLngs(lat1, lng1, lat2, lng2, segments) {
    const dLat = lat2 - lat1;
    const dLng = lng2 - lng1;
    const chordDeg = Math.sqrt(dLat * dLat + dLng * dLng);
    const midLat = (lat1 + lat2) / 2;
    const midLng = (lng1 + lng2) / 2;
    const bulge = Math.min(0.38, Math.max(0.06, chordDeg * 0.028));
    const cLat = midLat + bulge;
    const cLng = midLng;
    const out = [];
    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const omu = 1 - u;
      out.push(L.latLng(
        omu * omu * lat1 + 2 * omu * u * cLat + u * u * lat2,
        omu * omu * lng1 + 2 * omu * u * cLng + u * u * lng2
      ));
    }
    return out;
  }

  const ARC_STYLE_BASE = {
    color: '#c084fc',
    weight: 1.2,
    opacity: 0.28,
    lineCap: 'round',
    lineJoin: 'round',
    dashArray: '6 4'
  };
  const ARC_STYLE_DIM = {
    color: '#c084fc',
    weight: 1,
    opacity: 0.06,
    lineCap: 'round',
    lineJoin: 'round',
    dashArray: '6 4'
  };
  const ARC_STYLE_HIGH_CA = {
    color: '#f5d0fe',
    weight: 2,
    opacity: 0.85,
    lineCap: 'round',
    lineJoin: 'round',
    dashArray: null
  };
  const ARC_STYLE_HIGH_US = {
    color: '#67e8f9',
    weight: 2,
    opacity: 0.85,
    lineCap: 'round',
    lineJoin: 'round',
    dashArray: null
  };

  function arcStyleHighForRegion(region) {
    if (region === 'us') return ARC_STYLE_HIGH_US;
    return ARC_STYLE_HIGH_CA;
  }

  function applyArcHighlightToLayers() {
    if (!arcWebGroup) return;
    const region = arcHighlightRegion;
    arcWebGroup.eachLayer(function (layer) {
      if (!layer._devnetEdgeType) return;
      if (!region) {
        layer.setStyle(ARC_STYLE_BASE);
        return;
      }
      if (layer._devnetEdgeType === region) {
        layer.setStyle(arcStyleHighForRegion(region));
      } else {
        layer.setStyle(ARC_STYLE_DIM);
      }
    });
  }

  function setArcHighlightByRegion(region) {
    arcHighlightRegion = region;
    applyArcHighlightToLayers();
  }

  function sortedPairKey(a, b) {
    return a < b ? a + '|' + b : b + '|' + a;
  }

  function pinVisibleByHubKey(key) {
    for (let i = 0; i < pins.length; i++) {
      const p = pins[i];
      if (p.hubKey !== key) continue;
      const m = markers[p.id];
      if (m && markerVisibleOnMap(m)) return p;
    }
    return null;
  }

  const CA_PRESENCE_SPINE = [
    'vancouver', 'london', 'waterloo', 'guelph', 'kingston', 'toronto', 'montreal', 'halifax'
  ];

  const CA_BACKBONE_ADJ = {};
  (function () {
    for (let i = 0; i < CA_PRESENCE_SPINE.length - 1; i++) {
      CA_BACKBONE_ADJ[sortedPairKey(CA_PRESENCE_SPINE[i], CA_PRESENCE_SPINE[i + 1])] = true;
    }
  }());

  const CA_EXTRA_KEYS = {};
  CA_EXTRA_KEYS[sortedPairKey('halifax', 'london')] = true;
  CA_EXTRA_KEYS[sortedPairKey('halifax', 'kingston')] = true;
  CA_EXTRA_KEYS[sortedPairKey('vancouver', 'london')] = true;
  CA_EXTRA_KEYS[sortedPairKey('vancouver', 'kingston')] = true;
  CA_EXTRA_KEYS[sortedPairKey('vancouver', 'montreal')] = true;
  /* Direct Toronto–Montréal corridor (not adjacent on spine: Guelph sits between). */
  CA_EXTRA_KEYS[sortedPairKey('montreal', 'toronto')] = true;
  /* Ontario presence corridor: Guelph–Toronto–London (no direct London–Guelph on Presence). */
  CA_EXTRA_KEYS[sortedPairKey('guelph', 'toronto')] = true;
  CA_EXTRA_KEYS[sortedPairKey('london', 'toronto')] = true;
  CA_EXTRA_KEYS[sortedPairKey('waterloo', 'toronto')] = true;
  /* Chapter view spine when Waterloo (presence-only) is hidden. */
  CA_EXTRA_KEYS[sortedPairKey('london', 'guelph')] = true;

  const CA_HUB_STRAIGHT_KEYS = {};
  CA_HUB_STRAIGHT_KEYS[sortedPairKey('halifax', 'london')] = true;

  const US_BACKBONE_ADJ = {};
  (function () {
    const chain = ['los-angeles', 'tucson', 'miami', 'new-york-city', 'boston'];
    for (let i = 0; i < chain.length - 1; i++) {
      US_BACKBONE_ADJ[sortedPairKey(chain[i], chain[i + 1])] = true;
    }
  }());

  const US_EXTRA_KEYS = {};
  US_EXTRA_KEYS[sortedPairKey('los-angeles', 'new-york-city')] = true;
  US_EXTRA_KEYS[sortedPairKey('new-york-city', 'tucson')] = true;
  US_EXTRA_KEYS[sortedPairKey('boston', 'miami')] = true;

  const CROSS_US_CA_KEYS = {};
  [
    ['boston', 'montreal'],
    ['london', 'tucson'],
    ['london', 'miami'],
    ['london', 'boston'],
    ['boston', 'halifax'],
    ['vancouver', 'los-angeles'],
    ['los-angeles', 'london'],
    ['vancouver', 'miami'],
    ['vancouver', 'tucson'],
    ['new-york-city', 'montreal'],
    ['new-york-city', 'toronto'],
    ['new-york-city', 'london']
  ].forEach(function (pair) {
    CROSS_US_CA_KEYS[sortedPairKey(pair[0], pair[1])] = true;
  });

  function hubArcEdgeAllowed(idA, idB) {
    const cA = pinVisibleByHubKey(idA);
    const cB = pinVisibleByHubKey(idB);
    if (!cA || !cB) return false;
    const k = sortedPairKey(idA, idB);
    if (cA.mapRegion === 'ca' && cB.mapRegion === 'ca') {
      return !!(CA_BACKBONE_ADJ[k] || CA_EXTRA_KEYS[k]);
    }
    if (cA.mapRegion === 'us' && cB.mapRegion === 'us') {
      return !!(US_BACKBONE_ADJ[k] || US_EXTRA_KEYS[k]);
    }
    return !!CROSS_US_CA_KEYS[k];
  }

  function groupRegionFlavor(hubKeys) {
    let ca = false;
    let us = false;
    hubKeys.forEach(function (key) {
      const p = pinVisibleByHubKey(key);
      if (!p) return;
      if (p.mapRegion === 'ca') ca = true;
      if (p.mapRegion === 'us') us = true;
    });
    if (ca && !us) return 'ca';
    if (us && !ca) return 'us';
    return 'cross';
  }

  function edgeTypeForHubPair(keysA, keysB) {
    const f1 = groupRegionFlavor(keysA);
    const f2 = groupRegionFlavor(keysB);
    if (f1 === 'ca' && f2 === 'ca') return 'ca';
    if (f1 === 'us' && f2 === 'us') return 'us';
    return 'cross';
  }

  function groupsAllowHubArc(keysA, keysB) {
    for (let ai = 0; ai < keysA.length; ai++) {
      for (let bi = 0; bi < keysB.length; bi++) {
        if (hubArcEdgeAllowed(keysA[ai], keysB[bi])) return true;
      }
    }
    return false;
  }

  function groupsUseStraightHubChord(keysA, keysB) {
    for (let ai = 0; ai < keysA.length; ai++) {
      for (let bi = 0; bi < keysB.length; bi++) {
        const a = keysA[ai];
        const b = keysB[bi];
        if (!hubArcEdgeAllowed(a, b)) continue;
        if (CA_HUB_STRAIGHT_KEYS[sortedPairKey(a, b)]) return true;
      }
    }
    return false;
  }

  function rebuildHubArcWeb() {
    if (!arcWebGroup) return;
    arcWebGroup.clearLayers();
    const groups = {};
    pins.forEach(function (p) {
      if (!p.hubKey) return;
      const marker = markers[p.id];
      if (!marker || !markerVisibleOnMap(marker)) return;
      const par = getMarkerDisplayParent(marker);
      const sid = L.Util.stamp(par);
      if (!groups[sid]) {
        groups[sid] = { latlng: par.getLatLng(), hubKeys: [] };
      }
      const g = groups[sid];
      if (g.hubKeys.indexOf(p.hubKey) === -1) g.hubKeys.push(p.hubKey);
    });
    const groupKeys = Object.keys(groups);
    for (let gi = 0; gi < groupKeys.length; gi++) {
      for (let gj = gi + 1; gj < groupKeys.length; gj++) {
        const ga = groups[groupKeys[gi]];
        const gb = groups[groupKeys[gj]];
        if (!groupsAllowHubArc(ga.hubKeys, gb.hubKeys)) continue;
        const la = ga.latlng;
        const lb = gb.latlng;
        const edgeType = edgeTypeForHubPair(ga.hubKeys, gb.hubKeys);
        const latlngs = groupsUseStraightHubChord(ga.hubKeys, gb.hubKeys)
          ? [la, lb]
          : hubArcLatLngs(la.lat, la.lng, lb.lat, lb.lng, 16);
        const line = L.polyline(latlngs, Object.assign({
          pane: 'devnetArcs',
          interactive: false,
          className: 'devnet-hub-arc'
        }, ARC_STYLE_BASE));
        line._devnetEdgeType = edgeType;
        arcWebGroup.addLayer(line);
      }
    }
    applyArcHighlightToLayers();
  }

  function scheduleRebuildArcWeb() {
    clearTimeout(arcRebuildTimer);
    arcRebuildTimer = setTimeout(function () {
      arcRebuildTimer = null;
      rebuildHubArcWeb();
    }, 48);
  }

  map.on('zoomend', scheduleRebuildArcWeb);
  map.on('moveend', scheduleRebuildArcWeb);
  map.on('moveend zoomend', refreshOpenTooltipPlacements);
  if (clusterGroup) {
    clusterGroup.on('animationend', scheduleRebuildArcWeb);
    clusterGroup.on('spiderfied', scheduleRebuildArcWeb);
    clusterGroup.on('unspiderfied', scheduleRebuildArcWeb);
  }

  /* Filter chips: chapter | presence (mutually exclusive). */
  const chips = document.querySelectorAll('.map-chips .chip');
  const legendFuture = document.querySelector('.legend-item--future, [data-legend="future"]');
  const legendActive = document.querySelector('[data-legend="active"]');
  const legendChapterHub = document.querySelector('.legend-item--chapter-hub, [data-legend="chapter-hub"]');
  const legendPresence = document.querySelector('.legend-item--presence, [data-legend="presence"]');
  const mapSectionSub = document.getElementById('map-section-sub');
  const hasChapters = pins.some(function (p) { return p.type === 'chapter'; });
  const MAP_SUB_CHAPTER_EMPTY =
    'No campus chapters on the map right now — every listed hub is network presence. Switch to Presence to see all network hubs.';
  const MAP_SUB_CHAPTER =
    'London and Halifax are live campus chapters; Guelph is a planned startup (dashed pin). Use Presence for the other city hubs.';
  const MAP_SUB_PRESENCE =
    'Thirteen network presence hubs — builders coordinating locally before or alongside a formal campus chapter. Hover a pin for city and region; switch to Chapters for campus chapter pins.';

  function setMarkerOnMap(marker, show, useClusterLayer) {
    if (clusterGroup) {
      if (clusterGroup.hasLayer(marker)) clusterGroup.removeLayer(marker);
    }
    if (map.hasLayer(marker)) map.removeLayer(marker);
    if (!show) return;
    if (useClusterLayer && clusterGroup) {
      clusterGroup.addLayer(marker);
    } else {
      marker.addTo(map);
    }
  }

  function applyFilter(kind) {
    const showChapterLayer = kind === 'chapter';
    const showChapterStatusLegend = showChapterLayer && hasChapters;
    const showPresenceLegend = kind === 'presence';
    const useClusterLayer = kind === 'presence' && !!clusterGroup;
    if (legendChapterHub) {
      legendChapterHub.classList.toggle('is-hidden', !showChapterLayer);
      legendChapterHub.setAttribute('aria-hidden', showChapterLayer ? 'false' : 'true');
    }
    if (legendPresence) {
      legendPresence.classList.toggle('is-hidden', !showPresenceLegend);
      legendPresence.setAttribute('aria-hidden', showPresenceLegend ? 'false' : 'true');
    }
    if (legendFuture) {
      legendFuture.classList.toggle('is-hidden', !showChapterStatusLegend);
      legendFuture.setAttribute('aria-hidden', showChapterStatusLegend ? 'false' : 'true');
    }
    if (legendActive) {
      legendActive.classList.toggle('is-hidden', !showChapterStatusLegend);
      legendActive.setAttribute('aria-hidden', showChapterStatusLegend ? 'false' : 'true');
    }
    if (mapSectionSub) {
      if (kind === 'presence') mapSectionSub.textContent = MAP_SUB_PRESENCE;
      else if (!hasChapters) mapSectionSub.textContent = MAP_SUB_CHAPTER_EMPTY;
      else mapSectionSub.textContent = MAP_SUB_CHAPTER;
    }
    pins.forEach(function (p) {
      const m = markers[p.id];
      if (!m) return;
      setMarkerOnMap(m, p.type === kind, useClusterLayer);
    });
    if (clusterGroup && typeof clusterGroup.refreshClusters === 'function') {
      clusterGroup.refreshClusters();
    }
    rebuildHubArcWeb();
    rebuildPills(kind);
  }
  chips.forEach(function (btn) {
    btn.addEventListener('click', function () {
      chips.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      applyFilter(btn.getAttribute('data-filter') || 'chapter');
    });
  });
  if (useCluster && clusterGroup) map.addLayer(clusterGroup);
  applyFilter('presence');

  const pillRow = document.querySelector('.chapter-pill-row');

  function rebuildPills(kind) {
    if (!pillRow) return;
    const pillSource = kind === 'chapter'
      ? (window.DEVNET_CHAPTERS || [])
      : (window.DEVNET_PRESENCE || []);
    pillRow.innerHTML = '';
    pillRow.setAttribute(
      'aria-label',
      kind === 'chapter' ? 'Jump to chapter' : 'Jump to presence hub'
    );
    if (!pillSource.length) {
      pillRow.classList.add('is-hidden');
      pillRow.setAttribute('aria-hidden', 'true');
      return;
    }
    pillRow.classList.remove('is-hidden');
    pillRow.setAttribute('aria-hidden', 'false');
    pillSource.forEach(function (c) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chapter-pill';
      btn.setAttribute('data-pin', c.id);
      const dot = document.createElement('span');
      dot.className = 'chapter-pill__dot';
      const s = STATUS_STYLE[c.status] || STATUS_STYLE.presence;
      dot.style.background = s ? s.fill : '#a855f7';
      dot.style.boxShadow = s && s.glow ? '0 0 8px ' + s.fill : 'none';
      const label = document.createElement('span');
      label.textContent = c.city;
      btn.appendChild(dot);
      btn.appendChild(label);
      btn.addEventListener('click', function () { focusPin(c.id); });
      li.appendChild(btn);
      pillRow.appendChild(li);
    });
  }

  function focusPin(id) {
    const m = markers[id];
    const p = pins.find(function (pin) { return pin.id === id; });
    if (!m || !p) return;
    relaxMapBoundsForFocus();
    document.querySelectorAll('.chapter-pill').forEach(function (el) {
      el.classList.toggle('is-active', el.getAttribute('data-pin') === id);
    });
    setArcHighlightByRegion(p.mapRegion || null);
    const z = Math.max(map.getZoom(), 9);
    function afterVisible() {
      if (reduceMotion) map.setView([p.lat, p.lng], z);
      else map.flyTo([p.lat, p.lng], z, { duration: 0.55 });
      m.openPopup();
    }
    if (useCluster && clusterGroup && clusterGroup.hasLayer(m)) {
      clusterGroup.zoomToShowLayer(m, afterVisible);
    } else {
      afterVisible();
    }
  }

  function resetMapToOverview() {
    if (mapResetInProgress) return;
    mapResetInProgress = true;
    restoreMapBounds();
    setArcHighlightByRegion(null);
    document.querySelectorAll('.chapter-pill').forEach(function (el) {
      el.classList.remove('is-active');
    });
    pins.forEach(function (pin) {
      const m = markers[pin.id];
      if (m) {
        m.closePopup();
        m.closeTooltip();
      }
    });
    const fitOpts = OVERVIEW_FIT_OPTS;
    function clampZoomAfterFit() {
      if (map.getZoom() < minZoomAllowed) map.setZoom(minZoomAllowed);
      mapResetInProgress = false;
    }
    if (reduceMotion) {
      map.fitBounds(hubBounds, fitOpts);
      clampZoomAfterFit();
    } else {
      map.flyToBounds(hubBounds, Object.assign({ duration: 0.55 }, fitOpts));
      map.once('moveend', clampZoomAfterFit);
    }
  }

  const ResetControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function () {
      const wrap = L.DomUtil.create('div', 'leaflet-bar leaflet-control presence-map-reset-control');
      const btn = L.DomUtil.create('button', 'presence-map-reset-btn', wrap);
      btn.type = 'button';
      btn.textContent = 'Reset';
      btn.setAttribute('aria-label', 'Reset map to original view');
      L.DomEvent.disableClickPropagation(wrap);
      L.DomEvent.on(btn, 'click', function (e) {
        L.DomEvent.stopPropagation(e);
        resetMapToOverview();
      });
      return wrap;
    }
  });
  map.addControl(new ResetControl());

  const mapCard = mapEl.closest('.map-card');

  function invalidateMapLayout() {
    map.invalidateSize({ animate: false, pan: false });
    scheduleRebuildArcWeb();
  }

  map.whenReady(invalidateMapLayout);
  requestAnimationFrame(invalidateMapLayout);
  setTimeout(invalidateMapLayout, 400);
  window.addEventListener('load', invalidateMapLayout, { once: true });

  if (mapCard) {
    mapCard.addEventListener('transitionend', function (e) {
      if (e.target !== mapCard) return;
      if (e.propertyName === 'opacity' || e.propertyName === 'transform') invalidateMapLayout();
    });
    if (!mapCard.classList.contains('visible')) {
      const revealMo = new MutationObserver(function () {
        if (!mapCard.classList.contains('visible')) return;
        revealMo.disconnect();
        requestAnimationFrame(invalidateMapLayout);
      });
      revealMo.observe(mapCard, { attributes: true, attributeFilter: ['class'] });
    }
  }

  if ('IntersectionObserver' in window) {
    const ioMap = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) invalidateMapLayout(); });
    }, { threshold: 0.05 });
    ioMap.observe(mapEl);
  }
})();
