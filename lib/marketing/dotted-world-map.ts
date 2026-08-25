import DottedMap from "dotted-map";

// Computed once at module load (this file is only imported by the server
// component contact page), embedded as static markup — no client JS needed.
const MAP_HEIGHT = 60;
const DOT_COLOR = "#e4e4e7"; // zinc-200
const PIN_COLOR = "#246150"; // primary-600

const map = new DottedMap({ height: MAP_HEIGHT, grid: "diagonal" });

const dotsSvg = map.getSVG({
  radius: 0.22,
  color: DOT_COLOR,
  shape: "circle",
  backgroundColor: "transparent",
});

// A separate throwaway map instance just to project lat/lng to the grid's
// x/y — addPin() also bakes a static circle into that instance's own
// getSVG() output, which we don't want mixed into the base dot grid above
// since we're drawing our own animated pin markup instead.
const pinMap = new DottedMap({ height: MAP_HEIGHT, grid: "diagonal" });
// Central India — Shikshaloy's support line is an Indian (+91) number.
const pin = pinMap.addPin({ lat: 22.9734, lng: 78.6569, svgOptions: {} });

const pinSvg = `
  <circle cx="${pin.x}" cy="${pin.y}" r="0.7" fill="${PIN_COLOR}" opacity="0.5">
    <animate attributeName="r" values="0.7;3.4;0.7" dur="2.8s" repeatCount="indefinite" />
    <animate attributeName="opacity" values="0.5;0;0.5" dur="2.8s" repeatCount="indefinite" />
  </circle>
  <circle cx="${pin.x}" cy="${pin.y}" r="0.7" fill="${PIN_COLOR}" />
`;

// No width/height attributes on the generated <svg> (only viewBox), so it
// scales freely to whatever the container's CSS size is.
export const worldMapSvg = dotsSvg.replace("</svg>", `${pinSvg}</svg>`);
