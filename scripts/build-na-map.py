#!/usr/bin/env python3
"""Build assets/na-map.svg from Natural Earth 50m (public domain).

Coastlines, the Canada–US border, and the Great Lakes. No runtime dependency.
The live page inlines this SVG in index.html. Do not commit both copies.
"""

import json
import math
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COUNTRIES = os.environ.get("NE_COUNTRIES", "/tmp/ne/countries50.geojson")
LAKES = os.environ.get("NE_LAKES", "/tmp/ne/lakes50.geojson")
OUT = os.path.join(ROOT, "assets", "na-map.svg")

# Wider than the framed window so the clip edge stays off-screen.
CLIP = (-150.0, 12.0, -45.0, 72.0)  # lon0, lat0, lon1, lat1
# Framed window: ocean around the network so labels have room.
VIEW = (-136.0, 17.5, -50.0, 62.0)

KEEP = {"Canada", "United States of America", "Mexico"}
LAKE_NAMES = {
    "Lake Superior",
    "Lake Michigan",
    "Lake Huron",
    "Lake Erie",
    "Lake Ontario",
    "Lake Winnipeg",
    "Great Salt Lake",
    "Lake Okeechobee",
    "Lake Nipigon",
    "Lake of the Woods",
    "Reindeer Lake",
    "Lake Athabasca",
}

CITIES = [
    ("vancouver", "Vancouver", "British Columbia", "Canada", -123.1207, 49.2827, ""),
    ("london", "London", "Southern Ontario", "Canada", -81.2453, 42.9849, " pin--founding"),
    ("waterloo", "Waterloo", "Southern Ontario", "Canada", -80.5204, 43.4643, ""),
    ("guelph", "Guelph", "Southern Ontario", "Canada", -80.2482, 43.5448, ""),
    ("toronto", "Toronto", "Southern Ontario", "Canada", -79.3832, 43.6532, ""),
    ("kingston", "Kingston", "Southern Ontario", "Canada", -76.4860, 44.2312, ""),
    ("montreal", "Montreal", "Quebec", "Canada", -73.5673, 45.5017, ""),
    ("halifax", "Halifax", "Nova Scotia", "Canada", -63.5752, 44.6488, ""),
    ("tucson", "Tucson", "Arizona", "United States", -110.9747, 32.2226, ""),
    ("miami", "Miami", "Florida", "United States", -80.1918, 25.7617, ""),
    ("boston", "Boston", "Northeast US", "United States", -71.0589, 42.3601, ""),
    ("new-york-city", "New York City", "Northeast US", "United States", -74.0060, 40.7128, ""),
]


def albers():
    phi1 = math.radians(29.5)
    phi2 = math.radians(45.5)
    phi0 = math.radians(37.5)
    lam0 = math.radians(-96.0)
    n = (math.sin(phi1) + math.sin(phi2)) / 2.0
    c = math.cos(phi1) ** 2 + 2 * n * math.sin(phi1)
    rho0 = math.sqrt(c - 2 * n * math.sin(phi0)) / n

    def project(lon, lat):
        phi = math.radians(lat)
        lam = math.radians(lon)
        rho = math.sqrt(max(c - 2 * n * math.sin(phi), 0.0)) / n
        theta = n * (lam - lam0)
        return (rho * math.sin(theta), rho0 - rho * math.cos(theta))

    return project


PROJECT = albers()


def clip_ring(ring, box):
    minx, miny, maxx, maxy = box

    def clip(points, inside, cross):
        if not points:
            return []
        out = []
        prev = points[-1]
        prev_in = inside(prev)
        for cur in points:
            cur_in = inside(cur)
            if cur_in:
                if not prev_in:
                    out.append(cross(prev, cur))
                out.append(cur)
            elif prev_in:
                out.append(cross(prev, cur))
            prev, prev_in = cur, cur_in
        return out

    def lerp(a, b, t):
        return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)

    pts = [(p[0], p[1]) for p in ring]
    if len(pts) > 1 and pts[0] == pts[-1]:
        pts = pts[:-1]
    pts = clip(
        pts,
        lambda p: p[0] >= minx,
        lambda a, b: lerp(a, b, (minx - a[0]) / (b[0] - a[0] or 1e-12)),
    )
    pts = clip(
        pts,
        lambda p: p[0] <= maxx,
        lambda a, b: lerp(a, b, (maxx - a[0]) / (b[0] - a[0] or 1e-12)),
    )
    pts = clip(
        pts,
        lambda p: p[1] >= miny,
        lambda a, b: lerp(a, b, (miny - a[1]) / (b[1] - a[1] or 1e-12)),
    )
    pts = clip(
        pts,
        lambda p: p[1] <= maxy,
        lambda a, b: lerp(a, b, (maxy - a[1]) / (b[1] - a[1] or 1e-12)),
    )
    return pts


def simplify(points, eps):
    if len(points) < 3:
        return points

    def dist(p, a, b):
        dx, dy = b[0] - a[0], b[1] - a[1]
        if dx == 0 and dy == 0:
            return math.hypot(p[0] - a[0], p[1] - a[1])
        t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)
        t = max(0.0, min(1.0, t))
        return math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))

    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        i, j = stack.pop()
        a, b = points[i], points[j]
        max_d, idx = -1.0, -1
        for k in range(i + 1, j):
            d = dist(points[k], a, b)
            if d > max_d:
                max_d, idx = d, k
        if idx != -1 and max_d > eps:
            keep[idx] = True
            stack.append((i, idx))
            stack.append((idx, j))
    return [p for p, k in zip(points, keep) if k]


def rings_of(geom):
    gtype = geom.get("type")
    coords = geom.get("coordinates") or []
    if gtype == "Polygon":
        yield coords
    elif gtype == "MultiPolygon":
        for poly in coords:
            yield poly
    elif gtype == "GeometryCollection":
        for g in geom.get("geometries") or []:
            yield from rings_of(g)


def path_for(feature, eps):
    chunks = []
    for rings in rings_of(feature.get("geometry") or {}):
        if not rings:
            continue
        for ring in rings:
            clipped = clip_ring(ring, CLIP)
            if len(clipped) < 3:
                continue
            projected = [PROJECT(lon, lat) for lon, lat in clipped]
            simplified = simplify(projected, eps)
            if len(simplified) < 3:
                continue
            chunks.append(simplified)
    return chunks


def fmt(n):
    return ("%.1f" % n).rstrip("0").rstrip(".")


def encode(chunks, tx):
    parts = []
    for ring in chunks:
        cmds = []
        for i, (x, y) in enumerate(ring):
            sx, sy = tx(x, y)
            op = "M" if i == 0 else "L"
            cmds.append(op + fmt(sx) + " " + fmt(sy))
        cmds.append("Z")
        parts.append("".join(cmds))
    return "".join(parts)


def main():
    countries = json.load(open(COUNTRIES))
    lakes = json.load(open(LAKES))
    land = []
    for feature in countries["features"]:
        props = feature.get("properties") or {}
        name = props.get("ADMIN") or props.get("NAME") or ""
        if name not in KEEP:
            continue
        chunks = path_for(feature, 0.004)
        if chunks:
            land.append((name, chunks))
    water = []
    for feature in lakes["features"]:
        props = feature.get("properties") or {}
        name = props.get("name") or ""
        if name not in LAKE_NAMES:
            continue
        chunks = path_for(feature, 0.003)
        if chunks:
            water.append(chunks)

    samples = []
    lon0, lat0, lon1, lat1 = VIEW
    for i in range(33):
        t = i / 32.0
        samples.append(PROJECT(lon0 + (lon1 - lon0) * t, lat0))
        samples.append(PROJECT(lon0 + (lon1 - lon0) * t, lat1))
        samples.append(PROJECT(lon0, lat0 + (lat1 - lat0) * t))
        samples.append(PROJECT(lon1, lat0 + (lat1 - lat0) * t))
    xs = [p[0] for p in samples]
    ys = [p[1] for p in samples]
    minx, maxx = min(xs), max(xs)
    miny, maxy = min(ys), max(ys)
    pad_x = (maxx - minx) * 0.012
    pad_y = (maxy - miny) * 0.012
    minx -= pad_x
    maxx += pad_x
    miny -= pad_y
    maxy += pad_y
    width = 1000.0
    height = width * (maxy - miny) / (maxx - minx)

    def tx(x, y):
        return ((x - minx) / (maxx - minx) * width, (maxy - y) / (maxy - miny) * height)

    land_paths = []
    for name, chunks in land:
        slug = name.lower().replace(" ", "-")
        land_paths.append(
            '<path class="na-land" data-country="%s" d="%s"/>' % (slug, encode(chunks, tx))
        )
    lake_paths = ['<path class="na-lake" d="%s"/>' % encode(chunks, tx) for chunks in water]

    pins = []
    for cid, label, place, country, lon, lat, extra in CITIES:
        x, y = tx(*PROJECT(lon, lat))
        pins.append(
            '<g class="pin na-pin%s" data-city="%s" data-name="%s" data-place="%s" data-country="%s" data-x="%s" data-y="%s" transform="translate(%s %s)" role="button" tabindex="0" aria-label="%s" aria-pressed="false">'
            '<circle class="pin__pulse" r="5" fill="none"/>'
            '<circle class="pin__hit" r="14" fill="none"/>'
            '<circle class="pin__dot" r="4.5"/>'
            '<line class="pin__leader" x1="0" y1="0" x2="0" y2="0"/>'
            "</g>"
            % (
                extra,
                cid,
                label,
                place,
                country,
                fmt(x),
                fmt(y),
                fmt(x),
                fmt(y),
                label,
            )
        )

    svg = (
        '<svg class="na-map matrix" viewBox="0 0 %s %s" preserveAspectRatio="xMidYMid meet" role="img" aria-label="North America, with DevNet chapters">'
        "<g class=\"na-countries\">%s</g>"
        "<g class=\"na-lakes\">%s</g>"
        "<g class=\"na-pins\">%s</g>"
        "</svg>"
        % (
            fmt(width),
            fmt(height),
            "".join(land_paths),
            "".join(lake_paths),
            "".join(pins),
        )
    )
    with open(OUT, "w") as handle:
        handle.write(svg)
    print("wrote", OUT, "bytes", len(svg), "view", fmt(width), fmt(height))
    for cid, label, place, country, lon, lat, extra in CITIES:
        x, y = tx(*PROJECT(lon, lat))
        print(" city", cid, fmt(x), fmt(y))


if __name__ == "__main__":
    main()
