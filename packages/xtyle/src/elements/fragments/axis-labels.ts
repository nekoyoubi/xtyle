import { escapeAttr } from "./escape.js";
import { parseLabelAngle, type LabelAngle } from "../../markup/axis";

export type { LabelAngle };

const TICK_FONT = 11;
const CHAR_WIDTH = TICK_FONT * 0.58;
const LABEL_GAP = 10;
const UPRIGHT_OFFSET = 18;
const UPRIGHT_SPACE = 30;

export interface AxisLabelLayout {
	angle: number;
	space: number;
	labels: string[];
}

function clip(label: string, maxChars: number): string {
	return label.length <= maxChars ? label : `${label.slice(0, Math.max(1, maxChars - 1))}…`;
}

export function layoutAxisLabels(
	labels: readonly string[],
	slot: number,
	requested: LabelAngle | undefined,
	maxSpace: number,
): AxisLabelLayout {
	const widest = Math.max(0, ...labels.map((label) => label.length)) * CHAR_WIDTH;
	const fixed = parseLabelAngle(requested);
	const angle =
		typeof fixed === "number"
			? Math.round(fixed)
			: widest <= slot * 0.9
				? 0
				: slot >= TICK_FONT * 1.3
					? -45
					: -90;
	if (angle === 0) return { angle, space: UPRIGHT_SPACE, labels: [...labels] };

	const rad = (Math.abs(angle) * Math.PI) / 180;
	const rise = Math.sin(rad);
	const fontRise = TICK_FONT * Math.cos(rad);
	const maxChars = Math.max(4, Math.floor((maxSpace - LABEL_GAP - fontRise) / rise / CHAR_WIDTH));
	const clipped = labels.map((label) => clip(label, maxChars));
	const clippedWidest = Math.max(0, ...clipped.map((label) => label.length)) * CHAR_WIDTH;
	return { angle, space: Math.max(UPRIGHT_SPACE, LABEL_GAP + clippedWidest * rise + fontRise), labels: clipped };
}

export function fitSideLabels(labels: readonly string[], minPad: number, maxPad: number): { pad: number; labels: string[] } {
	const maxChars = Math.max(4, Math.floor((maxPad - LABEL_GAP) / CHAR_WIDTH));
	const clipped = labels.map((label) => clip(label, maxChars));
	const widest = Math.max(0, ...clipped.map((label) => label.length)) * CHAR_WIDTH;
	return { pad: Math.max(minPad, Math.min(maxPad, Math.ceil(widest + LABEL_GAP))), labels: clipped };
}

export function axisLabel(attrs: string, x: number, axisY: number, label: string, angle: number): string {
	const cx = x.toFixed(1);
	if (angle === 0) {
		return `<text ${attrs} x="${cx}" y="${(axisY + UPRIGHT_OFFSET).toFixed(1)}" text-anchor="middle">${escapeAttr(label)}</text>`;
	}
	const y = (axisY + LABEL_GAP).toFixed(1);
	return `<text ${attrs} x="${cx}" y="${y}" dy="0.32em" text-anchor="end" transform="rotate(${angle} ${cx} ${y})">${escapeAttr(label)}</text>`;
}
