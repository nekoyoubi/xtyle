import { XtyleElement, define, type StyleMode } from "./base.js";
import { revealHostCss } from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/reveal/source.generated.js";
import { startDrag, settle, type DragAxis } from "./gesture.js";
import { REVEAL_DIRECTIONS, REVEAL_BEHAVIORS, REVEAL_GRIP_STYLES, resolveVocab, resolveOptionalTone, type FullTone } from "../vocab.js";
import { resolveRevealShape } from "../reveal-shapes.js";
import { iconBody } from "../icon-registry.js";

export type RevealDirection = (typeof REVEAL_DIRECTIONS)[number];
export type RevealBehavior = (typeof REVEAL_BEHAVIORS)[number];
export type RevealGripStyle = (typeof REVEAL_GRIP_STYLES)[number];

const AXIS_OF: Record<RevealDirection, DragAxis> = { start: "x", end: "x", top: "y", bottom: "y" };

const DEFAULT_GRIP: Record<RevealDirection, string> = {
	start: "chevron-right",
	end: "chevron-left",
	top: "chevron-down",
	bottom: "chevron-up",
};

const TRAVEL_FRACTION = 0.7;
const LATCH_FRACTION = 0.4;
const COMMIT_FRACTION = 0.85;

const asFraction = (raw: string | null | undefined, fallback: number): number => {
	if (raw === null || raw === undefined || raw.trim() === "") return fallback;
	const trimmed = raw.trim();
	const parsed = trimmed.endsWith("%") ? Number.parseFloat(trimmed) / 100 : Number.parseFloat(trimmed);
	return Number.isFinite(parsed) && parsed > 0 && parsed <= 1 ? parsed : fallback;
};

export class XtyleReveal extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "reveal", {
		context: () => ({ directions: this.liveDirections, open: this.open }),
		applyIntent: (intent, event) => this.applyIntent(intent, event),
		afterApply: () => this.wireLid(),
	});

	static get observedAttributes(): string[] {
		return [
			"name",
			"open",
			"disabled",
			"lock-threshold",
			"flick-velocity",
			"shape",
			"contained",
			"bleed",
			"grip-style",
			"tone",
			"behavior",
			"latch-at",
			"commit-at",
			"travel",
			"grip-size",
			"grip-pad",
			"label",
			...REVEAL_DIRECTIONS.flatMap((direction) => [
				`${direction}-behavior`,
				`${direction}-latch-at`,
				`${direction}-commit-at`,
				`${direction}-travel`,
				`${direction}-tone`,
				`${direction}-grip`,
				`${direction}-grip-style`,
			]),
		];
	}

	get name(): string | null {
		return this.getAttribute("name");
	}
	set name(value: string | null | undefined) {
		this.reflectString("name", value);
	}

	get open(): RevealDirection | null {
		const raw = this.getAttribute("open");
		return raw !== null && (REVEAL_DIRECTIONS as readonly string[]).includes(raw) ? (raw as RevealDirection) : null;
	}
	set open(value: RevealDirection | null | undefined) {
		this.reflectString("open", value);
	}

	get disabled(): boolean {
		return this.hasAttribute("disabled");
	}
	set disabled(value: boolean) {
		this.reflectBoolean("disabled", value);
	}

	get lockThreshold(): number {
		const raw = Number(this.getAttribute("lock-threshold") ?? "8");
		return Number.isFinite(raw) && raw >= 0 ? raw : 8;
	}

	private get rtl(): boolean {
		return getComputedStyle(this).direction === "rtl";
	}

	get liveDirections(): RevealDirection[] {
		return REVEAL_DIRECTIONS.filter(
			(direction) => this.fragment.hasSlotted(direction) || this.bellyFor(direction, { live: true }) !== null,
		);
	}

	private bellyFor(direction: RevealDirection, options: { live?: boolean } = {}): HTMLElement | null {
		const live = options.live ? ":not([hidden])" : "";
		return this.root.querySelector<HTMLElement>(`[data-belly="${direction}"]${live}`);
	}

	behaviorFor(direction: RevealDirection): RevealBehavior {
		const raw = this.getAttribute(`${direction}-behavior`) ?? this.getAttribute("behavior");
		return resolveVocab(raw, REVEAL_BEHAVIORS, "latch", "reveal behavior");
	}

	latchAt(direction: RevealDirection): number {
		const host = asFraction(this.getAttribute("latch-at"), LATCH_FRACTION);
		return asFraction(this.getAttribute(`${direction}-latch-at`), host);
	}

	get shape(): string | null {
		return this.getAttribute("shape");
	}
	set shape(value: string | null | undefined) {
		this.reflectString("shape", value);
	}

	get bleed(): boolean {
		return this.hasAttribute("bleed");
	}
	set bleed(value: boolean) {
		this.reflectBoolean("bleed", value);
	}

	get contained(): boolean {
		return this.hasAttribute("contained");
	}
	set contained(value: boolean) {
		this.reflectBoolean("contained", value);
	}

	toneFor(direction: RevealDirection): FullTone | null {
		return resolveOptionalTone(this.getAttribute(`${direction}-tone`) ?? this.getAttribute("tone"));
	}

	gripStyleFor(direction: RevealDirection): RevealGripStyle {
		const raw = this.getAttribute(`${direction}-grip-style`) ?? this.getAttribute("grip-style");
		return resolveVocab(raw, REVEAL_GRIP_STYLES, "glyph", "reveal grip style");
	}

	gripFor(direction: RevealDirection): string {
		const named = this.getAttribute(`${direction}-grip`);
		return named && named.trim() !== "" ? named : DEFAULT_GRIP[direction];
	}

	commitAt(direction: RevealDirection): number {
		const host = asFraction(this.getAttribute("commit-at"), COMMIT_FRACTION);
		return asFraction(this.getAttribute(`${direction}-commit-at`), host);
	}

	travelFor(direction: RevealDirection): number {
		const host = asFraction(this.getAttribute("travel"), TRAVEL_FRACTION);
		return asFraction(this.getAttribute(`${direction}-travel`), host);
	}

	private extentOf(direction: RevealDirection): number {
		if (!this.bellyFor(direction)) return 0;
		return this.extentFallback(direction) * this.travelFor(direction);
	}

	private directionFrom(axis: DragAxis, distance: number): RevealDirection | null {
		if (distance === 0) return null;
		const towardOrigin = distance > 0;
		if (axis === "x") return towardOrigin === !this.rtl ? "start" : "end";
		return towardOrigin ? "top" : "bottom";
	}

	private get lid(): HTMLElement | null {
		return this.root.querySelector(".xtyle-reveal__lid");
	}

	private async settleTo(direction: RevealDirection | null, offset: number): Promise<void> {
		const lid = this.lid;
		if (!lid) return;
		if (!direction || offset === 0) {
			await settle(lid, "");
			return;
		}
		const signed = direction === "start" || direction === "top" ? offset : -offset;
		await settle(lid, AXIS_OF[direction] === "x" ? `translateX(${signed}px)` : `translateY(${signed}px)`);
	}

	private dragDirection: RevealDirection | null = null;

	private applyInert(): void {
		const showing = this.dragDirection ?? this.open;
		for (const direction of REVEAL_DIRECTIONS) {
			const belly = this.bellyFor(direction);
			if (!belly) continue;
			if (direction === this.open) belly.removeAttribute("inert");
			else belly.setAttribute("inert", "");
			if (direction === showing) belly.removeAttribute("data-dormant");
			else belly.setAttribute("data-dormant", "");
		}
	}

	private extentFallback(direction: RevealDirection): number {
		const rect = this.getBoundingClientRect();
		return AXIS_OF[direction] === "x" ? rect.width : rect.height;
	}

	private get groupScope(): ParentNode {
		return this.closest("xtyle-reveal-group") ?? (this.getRootNode() as Document | ShadowRoot);
	}

	private openGroupPeer(): XtyleReveal | null {
		const name = this.name;
		if (!name) return null;
		for (const peer of Array.from(this.groupScope.querySelectorAll<XtyleReveal>("xtyle-reveal"))) {
			if (peer !== this && peer.name === name && peer.open !== null) return peer;
		}
		return null;
	}

	private closeGroupPeers(): void {
		const name = this.name;
		if (!name) return;
		for (const peer of Array.from(this.groupScope.querySelectorAll<XtyleReveal>("xtyle-reveal"))) {
			if (peer === this || peer.name !== name || peer.open === null) continue;
			if (peer.contains(document.activeElement)) peer.focusLid();
			peer.conceal();
		}
	}

	focusLid(): void {
		this.lid?.focus?.();
	}

	reveal(direction: RevealDirection): void {
		if (this.disabled || !this.liveDirections.includes(direction)) return;
		this.closeGroupPeers();
		this.open = direction;
		this.applyInert();
		this.fragment.update(this.bindings);
		void this.settleTo(direction, this.extentOf(direction));
		this.emit("xtyle:reveal", { direction });
	}

	conceal(): void {
		const was = this.open;
		if (was === null) return;
		this.closeTo("xtyle:conceal", was);
	}

	private commitDirection(direction: RevealDirection): void {
		this.closeTo("xtyle:reveal-commit", direction);
	}

	private closeTo(eventType: string, direction: RevealDirection): void {
		this.open = null;
		this.applyInert();
		this.fragment.update(this.bindings);
		void this.settleTo(null, 0);
		this.emit(eventType, { direction });
	}

	private emit(type: string, detail: Record<string, unknown>): void {
		this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail }));
	}

	get flickVelocity(): number {
		const raw = Number(this.getAttribute("flick-velocity") ?? "0.4");
		return Number.isFinite(raw) && raw > 0 ? raw : 0.4;
	}

	private axisEnds(axis: DragAxis): { positive: RevealDirection; negative: RevealDirection } {
		if (axis === "y") return { positive: "top", negative: "bottom" };
		return this.rtl ? { positive: "end", negative: "start" } : { positive: "start", negative: "end" };
	}

	private signedOffsetOf(direction: RevealDirection): number {
		const magnitude = this.extentOf(direction);
		const ends = this.axisEnds(AXIS_OF[direction]);
		return direction === ends.positive ? magnitude : -magnitude;
	}

	private travelSigned(axis: DragAxis, offset: number): void {
		const lid = this.lid;
		if (!lid) return;
		if (offset === 0) {
			lid.style.transform = "";
			return;
		}
		lid.style.transform = axis === "x" ? `translateX(${offset}px)` : `translateY(${offset}px)`;
	}

	private onPointerdown(event: PointerEvent): void {
		if (this.disabled) return;
		const live = this.liveDirections;
		if (live.length === 0) return;
		event.preventDefault();

		let axis: DragAxis | null = null;
		let anchor = 0;
		let offset = 0;
		let abandoned: { peer: XtyleReveal; direction: RevealDirection } | null = null;

		const resolve = (signed: number): { direction: RevealDirection | null; extent: number } => {
			if (axis === null || signed === 0) return { direction: null, extent: 0 };
			const ends = this.axisEnds(axis);
			const direction = signed > 0 ? ends.positive : ends.negative;
			if (!live.includes(direction)) return { direction: null, extent: 0 };
			return { direction, extent: this.extentOf(direction) };
		};

		startDrag(event, {
			lockThreshold: this.lockThreshold,
			onMove: (state) => {
				if (state.axis === null) return;
				if (axis === null) {
					axis = state.axis;
					const opened = this.open;
					if (opened && AXIS_OF[opened] === axis) anchor = this.signedOffsetOf(opened);
					else if (opened) this.conceal();
					this.setAttribute("data-dragging", "");
					const peer = this.openGroupPeer();
					if (peer && peer.open) abandoned = { peer, direction: peer.open };
					this.closeGroupPeers();
				}

				offset = anchor + state.distance;
				const { direction, extent } = resolve(offset);
				if (direction === null) {
					offset = 0;
					this.dragDirection = null;
					this.applyInert();
					this.travelSigned(axis, 0);
					return;
				}
				offset = offset > 0 ? Math.min(offset, extent) : Math.max(offset, -extent);
				if (this.dragDirection !== direction) {
					this.dragDirection = direction;
					this.applyInert();
				}
				this.travelSigned(axis, offset);
			},
			onEnd: (state) => {
				this.removeAttribute("data-dragging");
				if (axis === null) return;

				const { direction, extent } = resolve(offset);
				const springBack = (): void => {
					const done = this.open !== null ? this.conceal() : this.settleTo(null, 0);
					void Promise.resolve(done).then(() => {
						this.dragDirection = null;
						this.applyInert();
					});
					if (abandoned) abandoned.peer.reveal(abandoned.direction);
				};

				if (direction === null || extent === 0) {
					springBack();
					return;
				}

				const ends = this.axisEnds(axis);
				const towardOpen = direction === ends.positive ? state.velocity > 0 : state.velocity < 0;
				const flicked = towardOpen && Math.abs(state.velocity) >= this.flickVelocity;
				const fraction = Math.abs(offset) / extent;
				const behavior = this.behaviorFor(direction);

				if (behavior !== "latch" && fraction >= this.commitAt(direction)) {
					this.dragDirection = null;
					this.commitDirection(direction);
					return;
				}
				if (behavior !== "commit" && (flicked || fraction >= this.latchAt(direction))) {
					this.dragDirection = null;
					this.reveal(direction);
					return;
				}
				springBack();
			},
		});
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.preventDefault) event.preventDefault();
		if (intent.conceal) {
			this.conceal();
			return;
		}
		if (intent.reveal && (REVEAL_DIRECTIONS as readonly string[]).includes(intent.reveal as string)) {
			const direction = intent.reveal as RevealDirection;
			if (this.open === direction) this.conceal();
			else this.reveal(direction);
		}
	}

	private get bindings(): Record<string, unknown> {
		const live = this.liveDirections;
		return {
			open: this.open,
			disabled: this.disabled,
			grouped: this.name !== null,
			directions: live,
			hasStart: live.includes("start"),
			hasEnd: live.includes("end"),
			hasTop: live.includes("top"),
			hasBottom: live.includes("bottom"),
			shaped: resolveRevealShape(this.shape) !== null,
			contained: this.contained,
			bleed: this.bleed,
			tones: Object.fromEntries(REVEAL_DIRECTIONS.map((d) => [d, this.toneFor(d)])),
			grips: Object.fromEntries(REVEAL_DIRECTIONS.map((d) => [d, this.gripFor(d)])),
			gripStyles: Object.fromEntries(REVEAL_DIRECTIONS.map((d) => [d, this.gripStyleFor(d)])),
			gripBodies: Object.fromEntries(REVEAL_DIRECTIONS.map((d) => [d, iconBody(this.gripFor(d)) ?? null])),
			label: this.getAttribute("label"),
		};
	}

	private shapeSignature(): string {
		return `${this.liveDirections.join(",")}|${this.disabled}|${this.getAttribute("label") != null}|${this.shape ?? ""}|${this.contained}|${this.bleed}|${REVEAL_DIRECTIONS.map((d) => `${this.toneFor(d) ?? ""}:${this.gripFor(d)}:${this.gripStyleFor(d)}`).join(",")}`;
	}

	attributeChangedCallback(name: string): void {
		if (!this.root.firstChild) return;
		if (name === "open") {
			this.applyInert();
			this.fragment.update(this.bindings);
			return;
		}
		this.render();
	}

	protected template(): string {
		return "";
	}

	private applyShape(): void {
		const def = resolveRevealShape(this.shape);
		if (def) {
			this.style.setProperty("--xtyle-reveal-shape", def.clip);
			if (def.gripInset) this.style.setProperty("--xtyle-reveal-grip-inset", def.gripInset);
			else this.style.removeProperty("--xtyle-reveal-grip-inset");
		} else {
			this.style.removeProperty("--xtyle-reveal-shape");
			this.style.removeProperty("--xtyle-reveal-grip-inset");
		}
	}

	private applyGripSizing(): void {
		const size = this.getAttribute("grip-size");
		const pad = this.getAttribute("grip-pad");
		if (size) this.style.setProperty("--xtyle-reveal-grip-size", size);
		else this.style.removeProperty("--xtyle-reveal-grip-size");
		if (pad) this.style.setProperty("--xtyle-reveal-grip-pad", pad);
		else this.style.removeProperty("--xtyle-reveal-grip-pad");
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.applyGripSizing();
		this.applyShape();
		this.fragment.ensureScaffold(revealHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.applyInert();
	}

	private wiredLid: HTMLElement | null = null;
	private wireLid(): void {
		const lid = this.lid;
		if (!lid || lid === this.wiredLid) return;
		this.wiredLid = lid;
		lid.addEventListener("pointerdown", (e) => this.onPointerdown(e as PointerEvent));
	}
}

define("xtyle-reveal", XtyleReveal);
