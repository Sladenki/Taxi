import type { ExpressionSpecification, StyleSpecification } from "maplibre-gl";

import { pmtilesProtocolUrl } from "@/lib/map-config";

export type MapThemeName = "light" | "dark";

export const FIRST_LABEL_LAYER_ID = "label-waterway";

/**
 * Layer and property names below are the ones present in kaliningrad.pmtiles
 * (OpenMapTiles 3.14). Class values were read from the archive, not assumed.
 * There is no `motorway` class in this extract; trunk is the top road class.
 * `transportation_name` has `name`, `name:latin` and `ref`, and no `name:ru`.
 */

interface Palette {
  background: string;
  residential: string;
  commercial: string;
  industrial: string;
  construction: string;
  civic: string;
  wood: string;
  grass: string;
  farmland: string;
  wetland: string;
  sand: string;
  pitch: string;
  cemetery: string;
  water: string;
  waterPool: string;
  waterway: string;
  building: string;
  buildingLine: string;
  aerodrome: string;
  runway: string;
  pier: string;
  bridge: string;
  rail: string;
  path: string;
  boundary: string;
  casing: string;
  road: string;
  trunk: string;
  trunkCasing: string;
  primary: string;
  primaryCasing: string;
  secondaryCasing: string;
  label: string;
  labelMuted: string;
  labelHalo: string;
  waterLabel: string;
}

const light: Palette = {
  background: "#f3f0e8",
  residential: "#efeae1",
  commercial: "#e6e1d8",
  industrial: "#e2ddd4",
  construction: "#ebe4d4",
  civic: "#e4e2ef",
  wood: "#c5ddb4",
  grass: "#d5ebc6",
  farmland: "#efe4c4",
  wetland: "#c5ddd4",
  sand: "#f0e4c6",
  pitch: "#c9e2b4",
  cemetery: "#d5e0d2",
  water: "#a9cfe4",
  waterPool: "#b7dff0",
  waterway: "#7eb4d2",
  building: "#e4ddd2",
  buildingLine: "#d2c9bc",
  aerodrome: "#e5e1d8",
  runway: "#cfc6b8",
  pier: "#d9cfc0",
  bridge: "#c8bfb2",
  rail: "#b7aea2",
  path: "#c9c1b4",
  boundary: "#b7a898",
  casing: "#ddd6cb",
  road: "#ffffff",
  trunk: "#e7a31a",
  trunkCasing: "#c4840c",
  primary: "#f3d48a",
  primaryCasing: "#e0b15a",
  secondaryCasing: "#dccbad",
  label: "#3f3a34",
  labelMuted: "#6d675e",
  labelHalo: "#f7f4ee",
  waterLabel: "#1d4e72",
};

const dark: Palette = {
  background: "#161a18",
  residential: "#1d221f",
  commercial: "#232826",
  industrial: "#262421",
  construction: "#2a2722",
  civic: "#242833",
  wood: "#1c3328",
  grass: "#24382c",
  farmland: "#2c3124",
  wetland: "#1a3334",
  sand: "#3a3428",
  pitch: "#234232",
  cemetery: "#2a332e",
  water: "#16344a",
  waterPool: "#1d4c66",
  waterway: "#2f6f93",
  building: "#2a302c",
  buildingLine: "#3a413c",
  aerodrome: "#2a2e2c",
  runway: "#8d867c",
  pier: "#6d6458",
  bridge: "#8a8176",
  rail: "#8d867c",
  path: "#6a645c",
  boundary: "#8a7d6e",
  casing: "#0e1210",
  road: "#3c4440",
  trunk: "#e1b15a",
  trunkCasing: "#8a6420",
  primary: "#6d6248",
  primaryCasing: "#3d3424",
  secondaryCasing: "#2a312e",
  label: "#f3efe6",
  labelMuted: "#c9c2b6",
  labelHalo: "#161a18",
  waterLabel: "#d5ecf8",
};

const DRIVING = [
  "motorway",
  "trunk",
  "primary",
  "primary_construction",
  "secondary",
  "tertiary",
  "minor",
  "minor_construction",
  "service",
  "service_construction",
  "raceway",
];

type Expr = ExpressionSpecification;

function expr(value: unknown[]): Expr {
  return value as Expr;
}

function matchClass(pairs: Array<[string, string | number]>, fallback: string | number): Expr {
  const expression: unknown[] = ["match", ["get", "class"]];
  for (const [name, value] of pairs) expression.push(name, value);
  expression.push(fallback);
  return expr(expression);
}

function inClasses(classes: string[]): Expr {
  return expr(["match", ["get", "class"], classes, true, false]);
}

function zoomWidth(stops: Array<[number, Array<[string, number]>, number]>): Expr {
  const expression: unknown[] = ["interpolate", ["linear"], ["zoom"]];
  for (const [zoom, pairs, fallback] of stops) {
    expression.push(zoom, matchClass(pairs, fallback));
  }
  return expr(expression);
}

const roadWidths: Array<[number, Array<[string, number]>, number]> = [
  [
    10,
    [
      ["trunk", 1.6],
      ["primary", 1.2],
      ["primary_construction", 1.1],
      ["secondary", 0.8],
      ["tertiary", 0.45],
      ["minor", 0.25],
      ["minor_construction", 0.25],
      ["raceway", 0.4],
      ["service", 0],
      ["service_construction", 0],
      ["motorway", 1.8],
    ],
    0.3,
  ],
  [
    13,
    [
      ["trunk", 4.2],
      ["primary", 3.2],
      ["primary_construction", 3],
      ["secondary", 2.4],
      ["tertiary", 1.7],
      ["minor", 1.1],
      ["minor_construction", 1],
      ["raceway", 1.4],
      ["service", 0],
      ["service_construction", 0],
      ["motorway", 4.6],
    ],
    1,
  ],
  [
    14,
    [
      ["trunk", 6.4],
      ["primary", 5],
      ["primary_construction", 4.6],
      ["secondary", 4],
      ["tertiary", 3],
      ["minor", 2.2],
      ["minor_construction", 2],
      ["raceway", 2.4],
      ["service", 1.3],
      ["service_construction", 1.2],
      ["motorway", 7],
    ],
    1.4,
  ],
  [
    16.5,
    [
      ["trunk", 14],
      ["primary", 11],
      ["primary_construction", 10],
      ["secondary", 8.5],
      ["tertiary", 6.5],
      ["minor", 5],
      ["minor_construction", 4.5],
      ["raceway", 5],
      ["service", 3],
      ["service_construction", 2.6],
      ["motorway", 16],
    ],
    3,
  ],
];

function casingWidths(): Array<[number, Array<[string, number]>, number]> {
  return roadWidths.map(([zoom, pairs, fallback]) => [
    zoom,
    pairs.map(([name, width]) => [name, width === 0 ? 0 : width + (zoom < 12 ? 1.1 : 2.1)]),
    fallback === 0 ? 0 : fallback + 1.8,
  ]);
}

const nameRu = expr([
  "case",
  ["all", ["has", "name:ru"], ["!=", ["get", "name:ru"], ""]],
  ["get", "name:ru"],
  ["all", ["has", "name"], ["!=", ["get", "name"], ""]],
  ["get", "name"],
  ["all", ["has", "name:latin"], ["!=", ["get", "name:latin"], ""]],
  ["get", "name:latin"],
  "",
]);

const roadName = expr([
  "case",
  ["all", ["has", "name"], ["!=", ["get", "name"], ""]],
  ["get", "name"],
  ["all", ["has", "name:latin"], ["!=", ["get", "name:latin"], ""]],
  ["get", "name:latin"],
  ["all", ["has", "ref"], ["!=", ["get", "ref"], ""]],
  ["get", "ref"],
  "",
]);

function roadFilter(brunnel: "ground" | "bridge" | "tunnel"): Expr {
  const brunnelFilter =
    brunnel === "ground"
      ? ["all", ["!=", ["get", "brunnel"], "tunnel"], ["!=", ["get", "brunnel"], "bridge"]]
      : ["==", ["get", "brunnel"], brunnel];

  return expr([
    "all",
    inClasses(DRIVING),
    brunnelFilter,
    [
      "any",
      ["match", ["get", "class"], ["service", "service_construction"], false, true],
      [">=", ["zoom"], 14],
    ],
  ]);
}

export function createBasemapStyle(theme: MapThemeName, origin: string): StyleSpecification {
  const palette = theme === "dark" ? dark : light;

  return {
    version: 8,
    name: `Народное такси (${theme})`,
    glyphs: "/fonts/{fontstack}/{range}.pbf",
    sources: {
      kaliningrad: {
        type: "vector",
        url: pmtilesProtocolUrl(origin),
        attribution:
          '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a> · <a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">© OpenMapTiles</a>',
      },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": palette.background } },
      {
        id: "landuse-base",
        type: "fill",
        source: "kaliningrad",
        "source-layer": "landuse",
        paint: {
          "fill-color": matchClass(
            [
              ["residential", palette.residential],
              ["suburb", palette.residential],
              ["neighbourhood", palette.residential],
              ["commercial", palette.commercial],
              ["retail", palette.commercial],
              ["industrial", palette.industrial],
              ["railway", palette.industrial],
              ["military", palette.industrial],
              ["garages", palette.industrial],
              ["construction", palette.construction],
              ["quarry", palette.sand],
              ["dam", palette.sand],
              ["bus_station", palette.commercial],
            ],
            palette.residential,
          ),
        },
      },
      {
        id: "landcover",
        type: "fill",
        source: "kaliningrad",
        "source-layer": "landcover",
        paint: {
          "fill-color": matchClass(
            [
              ["wood", palette.wood],
              ["grass", palette.grass],
              ["farmland", palette.farmland],
              ["wetland", palette.wetland],
              ["sand", palette.sand],
            ],
            palette.grass,
          ),
        },
      },
      {
        id: "landuse-overlay",
        type: "fill",
        source: "kaliningrad",
        "source-layer": "landuse",
        filter: inClasses([
          "pitch",
          "playground",
          "recreation_ground",
          "cemetery",
          "allotments",
          "school",
          "university",
          "college",
          "kindergarten",
          "education",
          "hospital",
          "library",
          "stadium",
          "theme_park",
          "zoo",
          "track",
        ]),
        paint: {
          "fill-color": matchClass(
            [
              ["pitch", palette.pitch],
              ["playground", palette.pitch],
              ["stadium", palette.pitch],
              ["track", palette.pitch],
              ["recreation_ground", palette.grass],
              ["cemetery", palette.cemetery],
              ["allotments", palette.farmland],
              ["theme_park", palette.grass],
              ["zoo", palette.grass],
            ],
            palette.civic,
          ),
        },
      },
      {
        id: "water",
        type: "fill",
        source: "kaliningrad",
        "source-layer": "water",
        paint: {
          "fill-color": matchClass(
            [
              ["swimming_pool", palette.waterPool],
              ["dock", palette.water],
              ["lake", palette.water],
              ["ocean", palette.water],
              ["river", palette.water],
            ],
            palette.water,
          ),
        },
      },
      {
        id: "waterway",
        type: "line",
        source: "kaliningrad",
        "source-layer": "waterway",
        paint: {
          "line-color": palette.waterway,
          "line-width": zoomWidth([
            [10, [["river", 1.1], ["canal", 0.8], ["stream", 0], ["ditch", 0], ["drain", 0]], 0.4],
            [13, [["river", 2.2], ["canal", 1.6], ["stream", 1], ["ditch", 0.3], ["drain", 0.4]], 0.6],
            [15.5, [["river", 4.2], ["canal", 3], ["stream", 1.8], ["ditch", 0.8], ["drain", 0.9]], 1],
          ]),
          "line-opacity": expr(["case", ["==", ["get", "brunnel"], "tunnel"], 0.35, 1]),
        },
      },
      {
        id: "aeroway-fill",
        type: "fill",
        source: "kaliningrad",
        "source-layer": "aeroway",
        filter: inClasses(["aerodrome", "apron", "helipad"]),
        paint: { "fill-color": palette.aerodrome, "fill-opacity": 0.85 },
      },
      {
        id: "aeroway-line",
        type: "line",
        source: "kaliningrad",
        "source-layer": "aeroway",
        filter: inClasses(["runway", "taxiway"]),
        paint: {
          "line-color": palette.runway,
          "line-width": matchClass([["runway", 3], ["taxiway", 1.4]], 1),
        },
      },
      {
        id: "road-tunnel-casing",
        type: "line",
        source: "kaliningrad",
        "source-layer": "transportation",
        filter: roadFilter("tunnel"),
        layout: { "line-cap": "butt", "line-join": "round", "line-sort-key": expr(["coalesce", ["get", "layer"], 0]) },
        paint: { "line-color": palette.casing, "line-width": zoomWidth(casingWidths()), "line-opacity": 0.45, "line-dasharray": [1.4, 1.2] },
      },
      {
        id: "road-tunnel",
        type: "line",
        source: "kaliningrad",
        "source-layer": "transportation",
        filter: roadFilter("tunnel"),
        layout: { "line-cap": "butt", "line-join": "round", "line-sort-key": expr(["coalesce", ["get", "layer"], 0]) },
        paint: {
          "line-color": matchClass(
            [
              ["trunk", palette.trunk],
              ["primary", palette.primary],
              ["primary_construction", palette.primary],
              ["motorway", palette.trunk],
            ],
            palette.road,
          ),
          "line-width": zoomWidth(roadWidths),
          "line-opacity": 0.55,
          "line-dasharray": [1.6, 1.1],
        },
      },
      {
        id: "bridge-structure",
        type: "line",
        source: "kaliningrad",
        "source-layer": "transportation",
        filter: inClasses(["bridge"]),
        minzoom: 13,
        layout: { "line-cap": "butt", "line-join": "round" },
        paint: { "line-color": palette.bridge, "line-width": expr(["interpolate", ["linear"], ["zoom"], 13, 2, 16, 8]) },
      },
      {
        id: "road-casing",
        type: "line",
        source: "kaliningrad",
        "source-layer": "transportation",
        filter: roadFilter("ground"),
        layout: { "line-cap": "round", "line-join": "round", "line-sort-key": expr(["coalesce", ["get", "layer"], 0]) },
        paint: {
          "line-color": matchClass(
            [
              ["trunk", palette.trunkCasing],
              ["motorway", palette.trunkCasing],
              ["primary", palette.primaryCasing],
              ["primary_construction", palette.primaryCasing],
              ["secondary", palette.secondaryCasing],
            ],
            palette.casing,
          ),
          "line-width": zoomWidth(casingWidths()),
        },
      },
      {
        id: "road",
        type: "line",
        source: "kaliningrad",
        "source-layer": "transportation",
        filter: roadFilter("ground"),
        layout: { "line-cap": "round", "line-join": "round", "line-sort-key": expr(["coalesce", ["get", "layer"], 0]) },
        paint: {
          "line-color": matchClass(
            [
              ["trunk", palette.trunk],
              ["motorway", palette.trunk],
              ["primary", palette.primary],
              ["primary_construction", palette.primary],
            ],
            palette.road,
          ),
          "line-width": zoomWidth(roadWidths),
          "line-opacity": expr([
            "match",
            ["get", "class"],
            ["primary_construction", "minor_construction", "service_construction"],
            0.72,
            1,
          ]),
        },
      },
      {
        id: "road-bridge-casing",
        type: "line",
        source: "kaliningrad",
        "source-layer": "transportation",
        filter: roadFilter("bridge"),
        layout: { "line-cap": "round", "line-join": "round", "line-sort-key": expr(["coalesce", ["get", "layer"], 0]) },
        paint: {
          "line-color": matchClass(
            [
              ["trunk", palette.trunkCasing],
              ["motorway", palette.trunkCasing],
              ["primary", palette.primaryCasing],
              ["primary_construction", palette.primaryCasing],
            ],
            palette.casing,
          ),
          "line-width": zoomWidth(casingWidths()),
        },
      },
      {
        id: "road-bridge",
        type: "line",
        source: "kaliningrad",
        "source-layer": "transportation",
        filter: roadFilter("bridge"),
        layout: { "line-cap": "round", "line-join": "round", "line-sort-key": expr(["coalesce", ["get", "layer"], 0]) },
        paint: {
          "line-color": matchClass(
            [
              ["trunk", palette.trunk],
              ["motorway", palette.trunk],
              ["primary", palette.primary],
              ["primary_construction", palette.primary],
            ],
            palette.road,
          ),
          "line-width": zoomWidth(roadWidths),
        },
      },
      {
        id: "road-path",
        type: "line",
        source: "kaliningrad",
        "source-layer": "transportation",
        minzoom: 13,
        filter: inClasses(["path", "path_construction", "track"]),
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": palette.path,
          "line-width": expr(["interpolate", ["linear"], ["zoom"], 13, 0.4, 16, 1.6]),
          "line-dasharray": [1.2, 1.1],
        },
      },
      {
        id: "road-rail",
        type: "line",
        source: "kaliningrad",
        "source-layer": "transportation",
        minzoom: 12,
        filter: inClasses(["rail", "transit"]),
        layout: { "line-cap": "butt", "line-join": "round" },
        paint: {
          "line-color": palette.rail,
          "line-width": expr(["interpolate", ["linear"], ["zoom"], 12, 0.6, 15.5, 1.8]),
          "line-dasharray": [2, 1.4],
        },
      },
      {
        id: "road-pier",
        type: "line",
        source: "kaliningrad",
        "source-layer": "transportation",
        minzoom: 13,
        filter: inClasses(["pier"]),
        paint: {
          "line-color": palette.pier,
          "line-width": expr(["interpolate", ["linear"], ["zoom"], 13, 1, 16, 3]),
        },
      },
      {
        id: "building",
        type: "fill",
        source: "kaliningrad",
        "source-layer": "building",
        minzoom: 13,
        paint: { "fill-color": palette.building, "fill-outline-color": palette.buildingLine },
      },
      {
        id: "boundary",
        type: "line",
        source: "kaliningrad",
        "source-layer": "boundary",
        filter: expr(["!=", ["get", "maritime"], 1]),
        paint: {
          "line-color": palette.boundary,
          "line-width": expr(["interpolate", ["linear"], ["zoom"], 9, 0.6, 13, 1.4]),
          "line-dasharray": [3, 2],
          "line-opacity": 0.7,
        },
      },
      {
        id: "cliff",
        type: "line",
        source: "kaliningrad",
        "source-layer": "mountain_peak",
        filter: expr(["==", ["get", "class"], "cliff"]),
        paint: { "line-color": palette.boundary, "line-width": 1, "line-opacity": 0.6 },
      },
      {
        id: FIRST_LABEL_LAYER_ID,
        type: "symbol",
        source: "kaliningrad",
        "source-layer": "waterway",
        minzoom: 12,
        filter: expr(["any", ["has", "name:ru"], ["has", "name"]]),
        layout: {
          "symbol-placement": "line",
          "text-field": nameRu,
          "text-font": ["Noto Sans Regular"],
          "text-size": 12,
          "text-max-angle": 30,
          "text-padding": 4,
        },
        paint: {
          "text-color": palette.waterLabel,
          "text-halo-color": palette.labelHalo,
          "text-halo-width": 1.3,
        },
      },
      {
        id: "label-water",
        type: "symbol",
        source: "kaliningrad",
        "source-layer": "water_name",
        minzoom: 10,
        layout: {
          "text-field": nameRu,
          "text-font": ["Noto Sans Regular"],
          "text-size": expr(["interpolate", ["linear"], ["zoom"], 10, 12, 14, 16]),
          "text-padding": 6,
        },
        paint: {
          "text-color": palette.waterLabel,
          "text-halo-color": palette.labelHalo,
          "text-halo-width": 1.4,
        },
      },
      {
        id: "label-road",
        type: "symbol",
        source: "kaliningrad",
        "source-layer": "transportation_name",
        minzoom: 12,
        filter: expr([
          "all",
          ["==", ["geometry-type"], "LineString"],
          [
            "step",
            ["zoom"],
            ["match", ["get", "class"], ["trunk", "primary", "primary_construction"], true, false],
            13,
            ["match", ["get", "class"], ["trunk", "primary", "primary_construction", "secondary", "tertiary"], true, false],
            14,
            ["match", ["get", "class"], ["path", "track", "service"], false, true],
            15,
            ["match", ["get", "class"], ["path", "track"], false, true],
          ],
        ]),
        layout: {
          "symbol-placement": "line",
          "text-field": roadName,
          "text-font": ["Noto Sans Regular"],
          "text-size": expr(["interpolate", ["linear"], ["zoom"], 12, 11, 16, 14]),
          "text-max-angle": 28,
          "text-padding": 10,
        },
        paint: {
          "text-color": palette.label,
          "text-halo-color": palette.labelHalo,
          "text-halo-width": 1.5,
        },
      },
      {
        id: "label-housenumber",
        type: "symbol",
        source: "kaliningrad",
        "source-layer": "housenumber",
        minzoom: 15.4,
        layout: {
          "text-field": expr(["get", "housenumber"]),
          "text-font": ["Noto Sans Regular"],
          "text-size": 11,
          "text-padding": 2,
          "text-optional": true,
        },
        paint: {
          "text-color": palette.labelMuted,
          "text-halo-color": palette.labelHalo,
          "text-halo-width": 1,
        },
      },
      {
        id: "label-poi",
        type: "symbol",
        source: "kaliningrad",
        "source-layer": "poi",
        minzoom: 14,
        filter: expr([
          "all",
          [
            "match",
            ["get", "class"],
            [
              "hospital",
              "school",
              "college",
              "university",
              "park",
              "railway",
              "bus",
              "museum",
              "library",
              "town_hall",
              "police",
              "fire_station",
              "place_of_worship",
              "stadium",
              "fuel",
              "parking",
              "pharmacy",
              "post",
              "theatre",
              "cemetery",
            ],
            true,
            false,
          ],
          ["any", ["has", "name:ru"], ["has", "name"], ["has", "name:latin"]],
        ]),
        layout: {
          "text-field": nameRu,
          "text-font": ["Noto Sans Regular"],
          "text-size": 11,
          "text-padding": 6,
          "text-optional": true,
          "text-max-width": 8,
        },
        paint: {
          "text-color": palette.labelMuted,
          "text-halo-color": palette.labelHalo,
          "text-halo-width": 1.2,
        },
      },
      {
        id: "label-peak",
        type: "symbol",
        source: "kaliningrad",
        "source-layer": "mountain_peak",
        filter: expr(["all", ["==", ["get", "class"], "peak"], ["any", ["has", "name:ru"], ["has", "name"]]]),
        layout: {
          "text-field": nameRu,
          "text-font": ["Noto Sans Regular"],
          "text-size": 11,
          "text-optional": true,
        },
        paint: {
          "text-color": palette.labelMuted,
          "text-halo-color": palette.labelHalo,
          "text-halo-width": 1.2,
        },
      },
      {
        id: "label-aerodrome",
        type: "symbol",
        source: "kaliningrad",
        "source-layer": "aerodrome_label",
        layout: {
          "text-field": nameRu,
          "text-font": ["Noto Sans Medium"],
          "text-size": 13,
          "text-optional": true,
        },
        paint: {
          "text-color": palette.label,
          "text-halo-color": palette.labelHalo,
          "text-halo-width": 1.4,
        },
      },
      {
        id: "label-place",
        type: "symbol",
        source: "kaliningrad",
        "source-layer": "place",
        filter: expr([
          "step",
          ["zoom"],
          ["match", ["get", "class"], ["city", "town"], true, false],
          11,
          ["match", ["get", "class"], ["city", "town", "village", "suburb", "island"], true, false],
          13,
          true,
        ]),
        layout: {
          "text-field": nameRu,
          "text-font": ["Noto Sans Medium"],
          "text-size": matchClass(
            [
              ["city", 22],
              ["town", 16],
              ["village", 14],
              ["suburb", 13],
              ["neighbourhood", 12],
              ["hamlet", 12],
              ["island", 13],
            ],
            12,
          ),
          "text-padding": 8,
          "text-max-width": 10,
          "symbol-sort-key": expr(["coalesce", ["get", "rank"], 20]),
        },
        paint: {
          "text-color": palette.label,
          "text-halo-color": palette.labelHalo,
          "text-halo-width": 1.6,
        },
      },
    ],
  };
}
