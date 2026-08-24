import { listEffects } from "@xtyle/core";

export interface EffectDemo {
	spec: string;
	stage: "plain" | "stripes" | "dark";
	body: "mark" | "panel" | "swatches" | "glass";
	clip?: boolean;
	arm?: boolean;
	fire?: boolean;
	toggle?: boolean;
}

export const BLURB: Record<string, string> = {
	glow: "a halo, the accent bloom",
	throb: "a slow pulse that drifts between the two accent hues",
	glare: "an animated sheen that sweeps across the box",
	lift: "a small rise with a shadow under it",
	tint: "a color wash over the surface",
	frost: "a backdrop blur and saturation bump",
	reveal: "fades and slides in once armed",
	shake: "a short nudge, for an error",
	flash: "a hard blink of color: impact, rejection, that one",
	float: "a rise and fade out; a readout that appears, travels, and dies",
	pop: "a scale in past the resting size and back; something arriving",
	wobble: "a rotational jitter, where shake is a translational one",
	spin: "a continuous rotation: the ambient still-working verb",
	saturate: "hover boosts to 200; the switch overrides to grayscale, hover and all",
};

export const DEMOS: Record<string, EffectDemo> = {
	glow: { spec: "glow@hover?spread:18", stage: "dark", body: "mark" },
	throb: { spec: "throb?rate:5s,colors:[accent,accent-2],spread:20", stage: "dark", body: "mark" },
	glare: { spec: "glare@hover?angle:105,rate:900ms", stage: "plain", body: "panel", clip: true },
	lift: { spec: "lift@hover?distance:7", stage: "plain", body: "panel" },
	tint: { spec: "tint@hover?amount:55,color:accent", stage: "plain", body: "panel" },
	frost: { spec: "frost@hover?blur:7,saturation:90", stage: "stripes", body: "glass" },
	reveal: { spec: "reveal?distance:14,rate:400ms", stage: "plain", body: "panel", arm: true },
	shake: { spec: "shake@hover?distance:6", stage: "plain", body: "panel" },
	flash: { spec: "flash@fired?amount:80", stage: "plain", body: "panel", fire: true },
	float: { spec: "float@fired?distance:34,rate:900ms", stage: "plain", body: "panel", fire: true },
	pop: { spec: "pop@fired?scale:0.3", stage: "plain", body: "panel", fire: true },
	wobble: { spec: "wobble@fired?angle:9", stage: "plain", body: "panel", fire: true },
	spin: { spec: "spin", stage: "plain", body: "mark" },
	saturate: { spec: "saturate@hover?amount:200  ·  switch → saturate@armed?amount:0", stage: "plain", body: "swatches", toggle: true },
};


/** Every effect the library registers, paired with the page's demo for it. An effect with no entry
 * is a feature that ships invisible: listed in the table, absent from the stage a reader browses. */
export function effectsWithoutDemo(): string[] {
	return listEffects()
		.map((effect) => effect.name)
		.filter((name) => !DEMOS[name] || !BLURB[name]);
}
