import type { DeriveOptions, TokenRegister } from "../src/types.js";

export interface MatrixCase {
	label: string;
	opts: DeriveOptions;
}

/** The three common seed colors as the token constraints they are — there is no separate anchor tier. */
function seeds(bg: string, fg: string, accent: string): TokenRegister {
	return { "--bg-0": bg, "--fg-0": fg, "--accent": accent };
}

const EXTREMES: TokenRegister[] = [
	seeds("#000000", "#ffffff", "#ff0000"),
	seeds("#ffffff", "#000000", "#0000ff"),
	seeds("#000000", "#000000", "#00ff00"),
	seeds("#ffffff", "#ffffff", "#ffff00"),
	seeds("#808080", "#808080", "#808080"),
	seeds("#010101", "#020202", "#ff00ff"),
	seeds("#fefefe", "#fdfdfd", "#00ffff"),
	seeds("#123456", "#abcdef", "#fedcba"),
];

const SCHEMED: Array<{ label: string; constraints: TokenRegister }> = [
	{ label: "dark-neutral", constraints: seeds("#0f1115", "#e8eaed", "#5b8cff") },
	{ label: "light-neutral", constraints: seeds("#f7f8fa", "#101216", "#3057d6") },
	{ label: "dark-warm", constraints: seeds("#1a1410", "#f0e6dc", "#ff9a3c") },
	{ label: "light-cool", constraints: seeds("#eef4ff", "#0c1830", "#0a7d6b") },
];

export function buildMatrix(): MatrixCase[] {
	const cases: MatrixCase[] = [];

	EXTREMES.forEach((constraints, i) => {
		cases.push({ label: `extreme-${i}`, opts: { constraints } });
	});

	for (const { label, constraints } of SCHEMED) {
		cases.push({ label, opts: { constraints } });

		for (const band of ["aa", "aaa"] as const) {
			cases.push({ label: `${label}-band-${band}`, opts: { constraints, knobs: { contrastBand: band } } });
		}

		for (const vibrancy of [0, 0.5, 1]) {
			cases.push({ label: `${label}-vibrancy-${vibrancy}`, opts: { constraints, knobs: { vibrancy } } });
		}

		for (const density of ["compact", "normal", "comfortable"] as const) {
			cases.push({ label: `${label}-density-${density}`, opts: { constraints, knobs: { density } } });
		}

		cases.push({
			label: `${label}-typeScale-radiusScale-shift`,
			opts: { constraints, knobs: { typeScale: 1.414, radiusScale: 2, accentShiftStep: 90 } },
		});
	}

	cases.push({
		label: "pinned-bg0",
		opts: {
			constraints: { ...seeds("#0f1115", "#e8eaed", "#5b8cff"), "--bg-0": "#14181f" },
		},
	});
	cases.push({
		label: "pinned-accent",
		opts: {
			constraints: { ...seeds("#0f1115", "#e8eaed", "#5b8cff"), "--accent": "#22c55e" },
		},
	});
	for (const hour of [0, 6, 12, 18, 23, 24]) {
		cases.push({
			label: `hour-${hour}`,
			opts: {
				constraints: seeds("#0f1115", "#e8eaed", "#5b8cff"),
				knobs: { hour },
			},
		});
	}
	cases.push({
		label: "hour-22-light",
		opts: {
			constraints: seeds("#f7f8fa", "#101216", "#3057d6"),
			knobs: { hour: 22 },
		},
	});

	cases.push({
		label: "pinned-bg0-and-accent",
		opts: {
			constraints: { ...seeds("#ffffff", "#000000", "#0000ff"), "--bg-0": "#fbfbfd", "--accent": "#d6336c" },
		},
	});

	return cases;
}
