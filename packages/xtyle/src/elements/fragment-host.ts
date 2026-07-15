import { initXript, type XriptRuntime, type ModInstance, type FragmentOp } from "@xriptjs/runtime";
import componentHost from "./fragments/component-host.json" with { type: "json" };
import { builtInFillFor } from "./built-in-fills.js";

/** A DOM event flattened to the JSON the sandbox handler receives. */
export interface SerializedEvent {
	tagName: string;
	dataset: Record<string, string | undefined>;
	value?: string;
	checked?: boolean;
	text: string;
	key?: string;
	disabled?: boolean;
	ariaDisabled?: string;
}

/** What a handler export returns; the trusted host applies it. */
export interface FragmentIntent {
	select?: string;
	focus?: string;
	preventDefault?: boolean;
	emit?: { type: string; detail?: unknown };
	/** Accordion: the full set of open section keys after a toggle. */
	open?: string[];
	toggledKey?: string;
	isOpen?: boolean;
	/** Switch: flip the checked state. */
	toggleChecked?: boolean;
	setChecked?: boolean;
	dismiss?: boolean;
	requestClose?: boolean;
	toggleReveal?: boolean;
	clearValue?: boolean;
	focusInput?: boolean;
	inputValue?: string;
	stopPropagation?: boolean;
	openMenu?: "first" | "last";
	focusValue?: string;
	activateValue?: string;
	activateLabel?: string;
	activateIndex?: number;
	closeMenu?: boolean;
	returnFocus?: boolean;
	selectRadio?: string;
	toggleOpen?: boolean;
	/** Carousel: flip the persistent autoplay play/pause intent. */
	togglePlay?: boolean;
	nudge?: number;
	forceAlt?: boolean;
	commit?: string;
	expand?: boolean;
	expandKey?: string;
	activate?: string;
	value?: string;
	commitValue?: boolean;
	reset?: boolean;
	jump?: string;
	setValue?: number;
	/** Combobox: drop one value out of a multi-select (a chip's remove button), or the last one (Backspace on an empty query). */
	removeValue?: string;
	removeLast?: boolean;
	/** Tour: which way a nav button moves the sequence. */
	tourNav?: "back" | "next" | "skip";
}

/** One delegated handler a fill declares: the element inside its markup, the DOM event, and the sandbox
 * export that answers it with a {@link FragmentIntent}. */
export interface HandlerDecl {
	selector: string;
	on: string;
	handler: string;
}

/** One fill a mod declares for a component slot: which fragment it fills, the markup source file that
 * replaces the built-in's, and the handlers that wire that markup back to the sandbox. */
export interface FillDecl {
	/** The fragment this fill draws — `popover`, `chart`. Matches the built-in's `id` to override it. */
	id: string;
	/** The key in `fragmentSources` holding the markup. */
	source: string;
	format?: string;
	handlers?: HandlerDecl[];
	[key: string]: unknown;
}

/**
 * The manifest a component fill ships: an ordinary xript mod manifest whose `fills` block claims one or
 * more `component.<id>` slots. Hand it to {@link loadFill} alongside the sources it names, and its ops
 * apply over xtyle's own fill for the same slot.
 */
export interface FillManifest {
	/** The mod's unique name. Loading the same name twice is a no-op; the first load wins. */
	name: string;
	/** The slots this mod fills, keyed `component.<id>` (`component.popover`). */
	fills: Record<string, FillDecl[]>;
	[key: string]: unknown;
}

export interface FragmentBinding {
	/** Extra context passed to a handler after the serialized event (e.g. nav state). */
	context?(handler: string, event: Event): unknown;
	/** Apply the intent a handler returned. */
	applyIntent(intent: FragmentIntent, event: Event): void;
	/**
	 * Run after every fragment apply (mount and update), once the hook's ops have hit the
	 * live DOM — the seam for imperative post-render work (e.g. painting live colors onto
	 * the freshly-built nodes) that must outlast a deferred first-load mount rebuild.
	 */
	afterApply?(): void;
}

const grantedCapabilities = Object.keys(
	(componentHost as { capabilities?: Record<string, unknown> }).capabilities ?? {},
);

let runtimePromise: Promise<XriptRuntime> | undefined;
function componentRuntime(): Promise<XriptRuntime> {
	if (!runtimePromise) {
		runtimePromise = initXript().then((factory) =>
			factory.createRuntime(componentHost, {
				hostBindings: {},
				capabilities: grantedCapabilities,
			}),
		);
	}
	return runtimePromise;
}

interface LoadedFill {
	runtime: XriptRuntime;
	mod: ModInstance;
}

const fillCache = new Map<string, Promise<LoadedFill>>();
const loadedFills = new Map<string, LoadedFill>();

/** The slots a fill manifest claims — the keys of its `fills` block (`component.rating`). */
function filledSlots(manifest: unknown): string[] {
	return Object.keys((manifest as { fills?: Record<string, unknown> }).fills ?? {});
}

/**
 * Load xtyle's own fill for every slot this manifest fills, before the manifest itself loads.
 *
 * The component runtime holds one handler list per fragment hook and concatenates the ops of every
 * registered mod in registration order, last op wins — there is no per-mod firing and no declared
 * precedence to lean on. So precedence *is* load order, and the only way a fill can override another
 * is to load after it. Left to itself the built-in loads lazily, on an element's first paint, which
 * puts it *after* any mod an app installed at boot — the natural order — and the built-in would then
 * silently win. Pulling mod-zero in first here makes it registration index 0 for its slot, so an
 * override installed at any point afterward is the one whose ops land last.
 *
 * The built-in's own load short-circuits (it is mod-zero for its slot), and a slot xtyle ships no
 * fill for is nobody's to precede, so both cost nothing but a lookup.
 */
async function loadModZero(manifest: unknown): Promise<void> {
	const self = (manifest as { name: string }).name;
	await Promise.all(
		filledSlots(manifest).map(async (slot) => {
			const builtIn = builtInFillFor(slot);
			if (!builtIn || builtIn.name === self) return;
			const source = await builtIn.load();
			if (source.manifest === manifest) return;
			await loadFill(source.manifest as FillManifest, source.fragmentSources);
		}),
	);
}

/** The fragment ids a fill manifest declares handlers and structure for (`rating`). */
function filledFragmentIds(manifest: unknown): string[] {
	const fills = (manifest as { fills?: Record<string, Array<{ id?: string }>> }).fills ?? {};
	const ids = new Set<string>();
	for (const list of Object.values(fills)) {
		for (const fill of list) if (fill.id) ids.add(fill.id);
	}
	return [...ids];
}

/**
 * The mounted hosts, so a fill that loads *after* an element has painted still reaches the screen.
 * An app can't always install its mods before the elements upgrade — SSR'd markup with a module
 * script, a lazily imported mod, a theme switched at runtime — and a fill that only takes effect on
 * the component's next state change would read as no fill at all on a component that never changes.
 * Held weakly: a host lives exactly as long as its element, and a page that churns elements must not
 * accumulate them here.
 */
const mountedHosts = new Set<WeakRef<FragmentHost>>();

function repaintHosts(fragmentIds: string[]): void {
	if (fragmentIds.length === 0) return;
	for (const ref of mountedHosts) {
		const host = ref.deref();
		if (!host) {
			mountedHosts.delete(ref);
			continue;
		}
		if (fragmentIds.includes(host.id)) host.repaint();
	}
}

async function registerFill(
	key: string,
	manifest: unknown,
	fragmentSources: Record<string, string>,
): Promise<LoadedFill> {
	await loadModZero(manifest);
	const runtime = await componentRuntime();
	const loaded: LoadedFill = { runtime, mod: runtime.loadMod(manifest, { fragmentSources }) };
	loadedFills.set(key, loaded);
	repaintHosts(filledFragmentIds(manifest));
	return loaded;
}

/**
 * Load a component fill into the shared component runtime. This is how an app installs a mod over a
 * built-in fill: load it whenever the app likes (boot is the natural moment) and its ops apply over
 * xtyle's, because the built-in is pulled in ahead of it.
 *
 * @param manifest the mod's manifest, claiming the `component.<id>` slots it fills
 * @param fragmentSources every file the manifest names, keyed by the name it names them with — the mod
 *   script (`mod.js`) and each fill's markup source
 */
export function loadFill(manifest: FillManifest, fragmentSources: Record<string, string>): Promise<LoadedFill> {
	const key = manifest.name;
	let entry = fillCache.get(key);
	if (!entry) {
		entry = registerFill(key, manifest, fragmentSources);
		fillCache.set(key, entry);
	}
	return entry;
}

/**
 * The fills loaded into the component runtime, in registration order — which is precedence order,
 * lowest first: every registered fill's ops are concatenated in this order and the last one wins.
 * xtyle's own fill for a slot always precedes any mod that overrides it.
 */
export function loadedFillNames(): string[] {
	return [...loadedFills.keys()];
}

let fillFailureWarned = false;

/**
 * Surface a fill / component-runtime load failure. A client-only (bare-shadow) element has
 * only its empty scaffold when the fill can't load, so it collapses to 0×0 with no other
 * signal; an SSR-composed element keeps its server-rendered content but loses live updates.
 * Marks the host `data-xtyle-fill-error` (inspectable, and a CSS hook for a consumer fallback)
 * and logs one attributed diagnostic per page, so a silently-blank client-only UI can't cost a
 * consumer a debugging session chasing an invisible runtime-init failure.
 */
export function markFillFailure(host: Element, error: unknown): void {
	host.setAttribute("data-xtyle-fill-error", "");
	if (fillFailureWarned) return;
	fillFailureWarned = true;
	const tag = host.tagName.toLowerCase();
	console.error(
		`xtyle: the component fragment runtime failed to load, so client-rendered elements ` +
			`(starting with <${tag}>) cannot paint their content and will appear empty. This usually ` +
			`means the xript runtime's WebAssembly could not initialize in this environment ` +
			`(e.g. a Content-Security-Policy blocking wasm, or a blocked asset fetch). Server-rendered ` +
			`content is unaffected; only the client-only render path needs the runtime.`,
		error,
	);
}

function serializeEvent(el: HTMLElement, event: Event): SerializedEvent {
	const input = el as HTMLInputElement;
	return {
		tagName: el.tagName,
		dataset: { ...el.dataset },
		value: typeof input.value === "string" ? input.value : undefined,
		checked: typeof input.checked === "boolean" ? input.checked : undefined,
		text: (el.textContent ?? "").trim(),
		key: event instanceof KeyboardEvent ? event.key : undefined,
		disabled: input.disabled === true || undefined,
		ariaDisabled: el.getAttribute("aria-disabled") ?? undefined,
	};
}

function applyOps(root: ShadowRoot | HTMLElement, ops: FragmentOp[]): void {
	for (const op of ops) {
		const el = root.querySelector(op.selector);
		if (!el) continue;
		switch (op.op) {
			case "replaceChildren":
				el.innerHTML = String(op.value ?? "");
				break;
			case "setAttr":
				// An empty value removes the attribute, so a naming/state op can clear itself
				// without a separate removeAttr verb. Set boolean attrs with a non-empty value
				// (`setAttr(sel, "hidden", "hidden")`), never `""`.
				if (op.attr) {
					const value = String(op.value ?? "");
					if (value === "") el.removeAttribute(op.attr);
					else el.setAttribute(op.attr, value);
				}
				break;
			case "toggle":
				(el as HTMLElement).hidden = !op.value;
				break;
			case "addClass":
				el.classList.add(String(op.value));
				break;
			case "removeClass":
				el.classList.remove(String(op.value));
				break;
			case "setText":
				el.textContent = String(op.value ?? "");
				break;
		}
	}
}

/** A region's consumer-provided nodes: its captured children minus the fill's own fallback
 * (`[data-slot-fallback]`) and the `<!--xtyle:slot-->` composition marker comment. So `hasSlotted`
 * reflects whether the consumer actually filled the slot, not whether the region merely renders a
 * default — the distinction a fallback-bearing slot (alert's icon, progress's value) turns on. */
function consumerNodes(region: Element): Node[] {
	return [...region.childNodes].filter(
		(node) => node.nodeType !== 8 && !(node instanceof Element && node.hasAttribute("data-slot-fallback")),
	);
}

/** Group nodes by their `slot` attribute (`""` for unslotted elements and text nodes) — the
 * light-DOM stand-in for shadow `<slot name>` projection. */
function groupBySlot(nodes: Iterable<Node>): Map<string, Node[]> {
	const map = new Map<string, Node[]>();
	for (const node of nodes) {
		const name = node instanceof Element ? (node.getAttribute("slot") ?? "") : "";
		const group = map.get(name);
		if (group) group.push(node);
		else map.set(name, [node]);
	}
	return map;
}

/**
 * Drives a component fill against one element's shadow root: resolves the runtime,
 * paints the inert scaffold once, applies the update hook's ops on every render, and
 * routes shadow DOM events to the fill's sandboxed handlers — applying whatever intent
 * they return. The runtime and each fill load once and serve every instance; per-element
 * state stays in the host element, passed in as `bindings`.
 */
export class FragmentHost {
	private handlers: HandlerDecl[];
	private template: string;
	private wired = false;
	private mounted = false;
	private pendingBindings: Record<string, unknown> | null = null;
	private lastBindings: Record<string, unknown> | null = null;
	private loadKicked = false;
	private registered = false;
	private scaffoldDone = false;
	private readonly lightDom: boolean;
	/** Consumer-provided children grouped by slot name (`""` = the default slot), held across
	 * rebuilds. In light DOM there is no `<slot>` to re-project them, so the host relocates each
	 * group into its matching `[data-slot]` / `[data-slot="name"]` region after every (re)mount.
	 * `null` until first captured. */
	private slotted: Map<string, Node[]> | null = null;

	constructor(
		private root: ShadowRoot | HTMLElement,
		private manifest: unknown,
		private fragmentSources: Record<string, string>,
		private fragmentId: string,
		private binding: FragmentBinding,
	) {
		this.handlers = collectHandlers(manifest);
		this.template = this.fragmentSources[fillSource(manifest, fragmentId)] ?? "";
		this.lightDom = !(typeof ShadowRoot !== "undefined" && root instanceof ShadowRoot);
	}

	/** Force the next `update` to rebuild the structure (a `mount`) — for a change ops can't express, like a tag switch. */
	remount(): void {
		this.mounted = false;
	}

	/** The fragment this host drives — how a late-loading fill finds the elements it now fills. */
	get id(): string {
		return this.fragmentId;
	}

	/**
	 * Rebuild against the fills registered *now*, with the bindings last rendered. Called when a fill
	 * lands after this host already painted: the new mod's ops only exist from its `mount`/`update`
	 * hooks onward, so the structure is rebuilt rather than patched — a mod that replaces the whole
	 * region (the point of an override) has nothing to patch against the built-in's markup.
	 */
	repaint(): void {
		if (!this.lastBindings) return;
		this.remount();
		this.update(this.lastBindings);
	}

	private lastShape = "";

	/** Rebuild on the next `update` when an element's structure-signature changed — a shape
	 * change (tag switch, an added boolean attr) the patch ops can't express. The first call
	 * only records the baseline; it never forces a rebuild of a freshly-mounted scaffold. */
	reshapeIfChanged(signature: string): void {
		if (this.lastShape && signature !== this.lastShape) this.remount();
		this.lastShape = signature;
	}

	/**
	 * Sync: paint the inert scaffold unless the root already holds it (DSD / SSR). Shadow roots
	 * carry the host css inline; light DOM leans on the already-global component sheet, so it
	 * writes no `<style>`. For a client-created light element the consumer's children are captured
	 * here (the scaffold paint would otherwise wipe them) for relocation after mount; for an
	 * SSR-composed light element the children already sit in `[data-slot]`, so the scaffold is
	 * left intact and the first apply runs as an `update`, not a structure-destroying `mount`.
	 */
	ensureScaffold(hostCss: string): void {
		if (this.scaffoldDone) return;
		this.scaffoldDone = true;
		const existing = this.root.querySelector("[data-root]");
		if (this.lightDom) {
			if (existing) {
				// SSR-composed: each region already holds its slot's content. Capture the consumer's
				// nodes per region (excluding any rendered fallback) so a later remount can re-place
				// them and `hasSlotted` stays honest, and skip the structure-destroying mount.
				this.slotted = new Map();
				for (const region of this.ownRegions()) {
					this.slotted.set(region.getAttribute("data-slot") ?? "", consumerNodes(region));
				}
				this.mounted = true;
				return;
			}
			this.slotted = groupBySlot(this.root.childNodes);
			this.root.innerHTML = this.template;
			return;
		}
		if (existing) return;
		this.root.innerHTML = `<style>${hostCss}</style>${this.template}`;
	}

	/** The consumer's content grouped by slot name. In light DOM it's the map captured at scaffold
	 * time (the scaffold paint relocates the children out of the element, so they must be read from
	 * the held map). In shadow DOM the children stay in the host element's light tree — projected
	 * by native `<slot>` — so they're read live off the host, never captured. */
	private slottedMap(): Map<string, Node[]> {
		if (this.slotted) return this.slotted;
		if (typeof ShadowRoot !== "undefined" && this.root instanceof ShadowRoot) {
			return groupBySlot(this.root.host.childNodes);
		}
		return new Map();
	}

	/** The trimmed text of the consumer's default-slot content — what a `<slot>`'s text would
	 * have been in the shadow build. Read it instead of the host element's `textContent`, which
	 * in light DOM now also includes the fill's own rendered chrome. */
	slottedText(): string {
		return (this.slottedMap().get("") ?? [])
			.map((node) => node.textContent ?? "")
			.join("")
			.trim();
	}

	/** Whether the consumer filled a given slot (`""` = default). Read this instead of querying
	 * the live DOM for `[slot="name"]` — in light DOM the host has already captured those children
	 * out of the element by the time an element computes its bindings. */
	hasSlotted(name = ""): boolean {
		return (this.slottedMap().get(name)?.length ?? 0) > 0;
	}

	/** The consumer's captured nodes for a slot (`""` = default). For an element that reads
	 * structured config children — progress's `<threshold>` elements — light DOM's scaffold wipe
	 * detaches them, so they must be read here rather than off the live tree. */
	slottedNodes(name = ""): Node[] {
		return this.slottedMap().get(name) ?? [];
	}

	/**
	 * Apply the update hook's ops to the live scaffold and wire handlers once. Runs
	 * synchronously once the runtime is warm (the first call kicks off the async load),
	 * so a re-render triggered from a handler completes before the host applies focus.
	 */
	update(bindings: Record<string, unknown>): void {
		const key = (this.manifest as { name: string }).name;
		const loaded = loadedFills.get(key);
		if (loaded) {
			this.apply(loaded, bindings);
			return;
		}
		this.pendingBindings = bindings;
		if (this.loadKicked) return;
		this.loadKicked = true;
		void loadFill(this.manifest as FillManifest, this.fragmentSources).then(
			(l) => {
				const latest = this.pendingBindings;
				this.pendingBindings = null;
				if (latest) this.apply(l, latest);
			},
			(error) => markFillFailure(this.hostElement(), error),
		);
	}

	/**
	 * The `[data-slot]` regions belonging to *this* fill, never one that a component nested inside
	 * the consumer's own content brought with it. In light DOM the two trees are one, so an
	 * unfiltered query reaches straight into a nested element's fill: a carousel holding a carousel
	 * would find the inner track first (it precedes the outer's later regions in document order) and
	 * fill it with the outer's slides. A region under a nested custom element is that element's to
	 * fill, so it is skipped here.
	 */
	private ownRegions(): Element[] {
		const boundary = this.root as unknown as Element;
		return [...this.root.querySelectorAll("[data-slot]")].filter((region) => {
			for (let parent = region.parentElement; parent && parent !== boundary; parent = parent.parentElement) {
				if (parent.tagName.includes("-")) return false;
			}
			return true;
		});
	}

	/** The light-DOM host element or the shadow root's host — where a fill-load failure is marked. */
	private hostElement(): Element {
		return this.lightDom ? (this.root as HTMLElement) : (this.root as ShadowRoot).host;
	}

	private apply(loaded: LoadedFill, bindings: Record<string, unknown>): void {
		this.lastBindings = bindings;
		if (!this.registered) {
			this.registered = true;
			mountedHosts.add(new WeakRef(this));
		}
		const lifecycle = this.mounted ? "update" : "mount";
		applyOps(this.root, loaded.runtime.fireFragmentHook(this.fragmentId, lifecycle, bindings));
		// A `mount` rebuilds the scaffold's inner structure, so in light DOM each region must be
		// refilled. When the consumer filled the slot, its held nodes *replace* the region's
		// contents — clearing any fallback the fill rendered (and the `[data-slot-fallback]` node
		// the refill ops target, so they then no-op against the consumer's content). When unfilled,
		// the fallback stays and only the `<!--xtyle:slot-->` composition marker is stripped (so an
		// unfilled, fallback-free region is truly `:empty`, matching the SSR path).
		if (lifecycle === "mount" && this.lightDom) {
			for (const region of this.ownRegions()) {
				const nodes = this.slotted?.get(region.getAttribute("data-slot") ?? "");
				if (nodes?.length) {
					region.replaceChildren(...nodes);
				} else {
					for (const node of [...region.childNodes]) {
						if (node.nodeType === 8 && /^xtyle:slot/.test(node.textContent ?? "")) region.removeChild(node);
					}
				}
			}
		}
		this.mounted = true;
		if (!this.wired) {
			this.wire(loaded.runtime);
			this.wired = true;
		}
		this.binding.afterApply?.();
	}

	/**
	 * Resolve a delegated handler target across the shadow boundary. `target.closest(selector)` walks
	 * the clicked node's own-tree ancestors, so a click that lands on *projected* (slotted) light-DOM
	 * content — an icon inside a segment — never reaches the shadow control that owns the handler: the
	 * slotted node's light-DOM ancestors are the host element, not the shadow button. Walking the
	 * composed path instead crosses the boundary and finds the first matching element inside this
	 * host's own subtree, so a click on slotted content selects the same as a click on the control's
	 * own chrome. The subtree guard keeps a nested component's matching element from being claimed here.
	 */
	private matchInPath(path: EventTarget[], selector: string): HTMLElement | null {
		for (const node of path) {
			if (node === this.root) break;
			if (node instanceof HTMLElement && node.matches(selector) && this.root.contains(node)) return node;
		}
		return null;
	}

	private wire(runtime: XriptRuntime): void {
		const eventTypes = [...new Set(this.handlers.map((h) => h.on))];
		for (const type of eventTypes) {
			this.root.addEventListener(type, (event) => {
				const path = event.composedPath();
				if (path.length === 0) return;
				for (const decl of this.handlers) {
					if (decl.on !== type) continue;
					const match = this.matchInPath(path, decl.selector);
					if (!match) continue;
					const payload = serializeEvent(match, event);
					// Handlers are namespaced by fragment id (`tabs__navKeydown`) so the shared
					// sandbox export table can't collide across components. The element's own
					// `context` callback still keys on the bare handler name, so strip the prefix
					// before asking it for per-handler context.
					const bareHandler = decl.handler.startsWith(`${this.fragmentId}__`)
						? decl.handler.slice(this.fragmentId.length + 2)
						: decl.handler;
					const context = this.binding.context?.(bareHandler, event);
					const intent = runtime.invokeExport(decl.handler, [payload, context]) as FragmentIntent;
					if (intent) this.binding.applyIntent(intent, event);
					if (event.cancelBubble) break;
				}
			});
		}
	}
}

export function fillSource(manifest: unknown, fragmentId: string): string {
	const fills = (manifest as { fills?: Record<string, Array<{ id?: string; source: string }>> }).fills ?? {};
	for (const list of Object.values(fills)) {
		for (const fill of list) {
			if (fill.id === fragmentId || fill.source) return fill.source;
		}
	}
	return "";
}

function collectHandlers(manifest: unknown): HandlerDecl[] {
	const fills = (manifest as { fills?: Record<string, Array<{ handlers?: HandlerDecl[] }>> }).fills ?? {};
	const out: HandlerDecl[] = [];
	for (const list of Object.values(fills)) {
		for (const fill of list) {
			if (fill.handlers) out.push(...fill.handlers);
		}
	}
	return out;
}
