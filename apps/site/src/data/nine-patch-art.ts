import type { NinePatchRegion } from "@xtyle/core/elements";

const TORN_OUTLINE = [
	"32,7 38,1 44,10 50,3 56,11 60,4 64,7",
	"70,1 77,9 83,2 89,7 95,11 88,18 95,25 89,32",
	"95,38 86,45 94,51 87,57 93,61 89,64",
	"95,70 86,77 94,83 89,89 85,95 78,88 71,95 64,89",
	"58,95 52,86 46,94 40,87 36,93 32,89",
	"26,95 19,87 13,94 7,89 1,85 8,78 1,71 7,64",
	"1,58 10,51 2,45 9,39 3,35 7,32",
	"1,26 9,19 2,13 7,7 11,1 18,8 25,1",
].join(" ");

export const TORN_PANEL = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><polygon fill="#000" points="${TORN_OUTLINE}"/></svg>`;

const PLAQUE_BODY = "M24 8H72L88 24V72L72 88H24L8 72V24Z";

const PLAQUE_BOSSES = [
	"M1 12a11 11 0 0 1 22 0a11 11 0 0 1-22 0",
	"M73 12a11 11 0 0 1 22 0a11 11 0 0 1-22 0",
	"M1 84a11 11 0 0 1 22 0a11 11 0 0 1-22 0",
	"M73 84a11 11 0 0 1 22 0a11 11 0 0 1-22 0",
].join("");

const PLAQUE_HOLES = [
	"M8 12a4 4 0 0 0 8 0a4 4 0 0 0-8 0",
	"M80 12a4 4 0 0 0 8 0a4 4 0 0 0-8 0",
	"M8 84a4 4 0 0 0 8 0a4 4 0 0 0-8 0",
	"M80 84a4 4 0 0 0 8 0a4 4 0 0 0-8 0",
	"M45 14a3 3 0 0 0 6 0a3 3 0 0 0-6 0",
	"M45 82a3 3 0 0 0 6 0a3 3 0 0 0-6 0",
	"M11 48a3 3 0 0 0 6 0a3 3 0 0 0-6 0",
	"M79 48a3 3 0 0 0 6 0a3 3 0 0 0-6 0",
].join("");

export const PLAQUE_PANEL = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><path fill="#000" d="${PLAQUE_BODY}${PLAQUE_BOSSES}${PLAQUE_HOLES}"/></svg>`;

export const SCALLOP_PANEL = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><path fill="#000" d="M32 8A8 8 0 0 1 48 8A8 8 0 0 1 64 8A24 24 0 0 1 88 32A8 8 0 0 1 88 48A8 8 0 0 1 88 64A24 24 0 0 1 64 88A8 8 0 0 1 48 88A8 8 0 0 1 32 88A24 24 0 0 1 8 64A8 8 0 0 1 8 48A8 8 0 0 1 8 32A24 24 0 0 1 32 8Z"/></svg>`;

export const CREST = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path fill="#000" fill-rule="evenodd" d="M16 1 30 8v14l-14 9-14-9V8zm0 6-8 4v9l8 5 8-5v-9z"/></svg>`;

export const BUNTING = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="26"><g fill="#000"><path d="M0 3h18v3H0z"/><path d="M2 7h14l-7 12z"/></g></svg>`;

const SOLID = `<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="#000"/></svg>`;

const CORNER_WASH = "color-mix(in oklch, var(--accent) 55%, transparent)";
const EDGE_WASH = "color-mix(in oklch, var(--accent-2) 45%, transparent)";
const CENTRE_WASH = "transparent";

export const REGION_PIECES: Record<NinePatchRegion, string> = {
	"top-left": SOLID,
	top: SOLID,
	"top-right": SOLID,
	left: SOLID,
	center: SOLID,
	right: SOLID,
	"bottom-left": SOLID,
	bottom: SOLID,
	"bottom-right": SOLID,
};

export const REGION_TINTS: Record<NinePatchRegion, string> = {
	"top-left": CORNER_WASH,
	top: EDGE_WASH,
	"top-right": CORNER_WASH,
	left: EDGE_WASH,
	center: CENTRE_WASH,
	right: EDGE_WASH,
	"bottom-left": CORNER_WASH,
	bottom: EDGE_WASH,
	"bottom-right": CORNER_WASH,
};
