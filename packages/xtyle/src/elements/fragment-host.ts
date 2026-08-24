import { initXript, type XriptRuntime, type ModInstance, type FragmentOp } from "@xriptjs/runtime";
import componentHost from "./fragments/component-host.json" with { type: "json" };
import { sandboxInitOptions } from "../sandbox.js";
import { builtInFillFor } from "./built-in-fills.js";

/**
 * Event types that never bubble, so a root-delegated listener has to catch them on the way *down*.
 * `toggle` is the one the accordion depends on — `<details>` fires it at the element and it stops
 * there. Add to this list rather than reaching for a direct per-node listener, which would have to be
 * re-bound on every re-render.
 */
const NON_BUBBLING = new Set(["toggle", "focus", "blur", "mouseenter", "mouseleave", "load", "error"]);

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
	/** Modifier keys on a mouse/keyboard event, for a collection's toggle (ctrl/meta) and range (shift). */
	ctrlKey?: boolean;
	shiftKey?: boolean;
	metaKey?: boolean;
	/** A `<details>`' open state, read after the browser's own toggle (accordion's `toggle` handler). */
	open?: boolean;
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
	/** Reveal: slide the lid to expose one direction's belly, or close whichever is open. */
	reveal?: string;
	conceal?: boolean;
	/** Markdown: flip between the rendered body and the source editor. */
	toggleEditing?: boolean;
	/** Collection: how a selection gesture transitions the selection model. */
	selectMode?: "replace" | "toggle" | "range";
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

/** Whether the runtime has read the host manifest yet. `allowUriSchemes` refuses to run past this
 * point rather than widening the renderer while the fragment format keeps the set it already read. */
export function componentRuntimeStarted(): boolean {
	return runtimePromise !== undefined;
}

function componentRuntime(): Promise<XriptRuntime> {
	if (!runtimePromise) {
		runtimePromise = initXript(sandboxInitOptions()).then((factory) =>
			factory.createRuntime(componentHost, {
				hostBindings: {},
				capabilities: grantedCapabilities,
				strictBindings: true,
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
let emptyMountWarned = false;
let formNameWarned = false;
let formDoubledWarned = false;

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

/**
 * Surface a mount that produced no markup. A fill's `mount` builds the whole scaffold, so an empty
 * one paints nothing — and unlike a load failure it throws nothing, which is the worse shape: the
 * element looks like a component that renders badly rather than one that never ran. Shares the
 * `data-xtyle-fill-error` marker, so a consumer's fallback CSS covers both.
 */
export function markEmptyMount(host: Element, fragmentId: string): void {
	host.setAttribute("data-xtyle-fill-error", "");
	if (emptyMountWarned) return;
	emptyMountWarned = true;
	const tag = host.tagName.toLowerCase();
	console.error(
		`xtyle: the "${fragmentId}" fill mounted and produced no markup, so client-rendered elements ` +
			`(starting with <${tag}>) will appear empty. Either an override registered for this fill ` +
			`emits nothing on mount, or the sandbox loaded but cannot answer — a QuickJS variant passed ` +
			`to setSandboxVariant that does not match the quickjs-emscripten-core the runtime resolves ` +
			`fails exactly this way, reporting "QuickJSContext had no callback with id 0".`,
	);
}

/**
 * Surface a fill that rendered its control without the `name` it was handed. In light DOM that
 * control is the only thing inside the form, because the host deliberately does not also report
 * through `ElementInternals` there — so the value submits nowhere while the component looks and
 * behaves correctly. Nothing else catches it: the slot's payload schema declares the binding but
 * no runtime enforces that a fill writes it, and a form that posts a missing key fails at the
 * server rather than here. Marked with its own attribute rather than `data-xtyle-fill-error`,
 * since the component did render and a consumer's blank-render fallback should not fire.
 */
export function markFormNameUnbound(host: Element, name: string): void {
	host.setAttribute("data-xtyle-form-unbound", "");
	if (formNameWarned) return;
	formNameWarned = true;
	const tag = host.tagName.toLowerCase();
	console.error(
		`xtyle: <${tag}> was given name="${name}" but the fill rendered no control carrying it, so the ` +
			`value will not submit with the form. In light DOM the inner control is the only submitting ` +
			`channel. A fill overriding this component must write the \`name\` binding onto its control.`,
	);
}

/**
 * The inverse of `markFormNameUnbound`: a component whose host owns form reporting rendered a
 * light-DOM node carrying the same `name`, so the form collects the value twice under one key and a
 * server reads an array where it expected a string. This is what an override that adds a `name` to a
 * control whose host never expected one produces, and the component looks correct throughout.
 */
export function markFormNameDoubled(host: Element, name: string): void {
	host.setAttribute("data-xtyle-form-doubled", "");
	if (formDoubledWarned) return;
	formDoubledWarned = true;
	const tag = host.tagName.toLowerCase();
	console.error(
		`xtyle: <${tag}> reports name="${name}" through ElementInternals, and a light-DOM node it ` +
			`rendered carries the same name, so the value will submit twice under one key. A fill for ` +
			`this component must not write the \`name\` binding onto its control.`,
	);
}

function serializeEvent(el: HTMLElement, event: Event): SerializedEvent {
	const input = el as HTMLInputElement;
	const mod = event as Partial<MouseEvent & KeyboardEvent>;
	return {
		tagName: el.tagName,
		dataset: { ...el.dataset },
		value: typeof input.value === "string" ? input.value : undefined,
		checked: typeof input.checked === "boolean" ? input.checked : undefined,
		text: (el.textContent ?? "").trim(),
		key: event instanceof KeyboardEvent ? event.key : undefined,
		disabled: input.disabled === true || undefined,
		ariaDisabled: el.getAttribute("aria-disabled") ?? undefined,
		ctrlKey: typeof mod.ctrlKey === "boolean" ? mod.ctrlKey : undefined,
		shiftKey: typeof mod.shiftKey === "boolean" ? mod.shiftKey : undefined,
		metaKey: typeof mod.metaKey === "boolean" ? mod.metaKey : undefined,
		open: el instanceof HTMLDetailsElement ? el.open : undefined,
	};
}

/**
 * Apply a fill's op buffer to a live root — the browser half of the pair whose other half is
 * `applyOpsToHtml` in `elements/fragment-ssr`. A component renders through both over its life
 * (the build-time string rewrite, then this against the DOM), so the two must agree on every op:
 * a divergence shows up only for a reader who never reaches the second one.
 */
export function applyOps(root: ShadowRoot | HTMLElement, ops: FragmentOp[]): void {
	for (const op of ops) {
		for (const el of root.querySelectorAll(op.selector)) {
			applyOp(el, op);
		}
	}
}

function applyOp(el: Element, op: FragmentOp): void {
	switch (op.op) {
		case "replaceChildren":
			el.innerHTML = String(op.value ?? "");
			break;
		case "setProp":
		case "setAttr": {
			const prop = op.prop ?? op.attr;
			if (prop) {
				const value = String(op.value ?? "");
				if (value === "") el.removeAttribute(prop);
				else el.setAttribute(prop, value);
			}
			break;
		}
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
	private scaffoldRoots: Node[] = [];
	private readonly ownedNodes = new Set<Node>();

	constructor(
		private root: ShadowRoot | HTMLElement,
		private manifest: unknown,
		private fragmentSources: Record<string, string>,
		private fragmentId: string,
		private binding: FragmentBinding,
	) {
		this.handlers = collectHandlers(manifest);
		this.template = fillScaffold(manifest, fragmentSources, fragmentId);
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
				this.slotted = new Map();
				for (const region of this.ownRegions()) {
					this.slotted.set(region.getAttribute("data-slot") ?? "", consumerNodes(region));
				}
				this.scaffoldRoots = [...this.root.childNodes];
				this.mounted = true;
				return;
			}
			this.slotted = groupBySlot(this.root.childNodes);
			this.root.innerHTML = this.template;
			this.scaffoldRoots = [...this.root.childNodes];
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
	 * Declare a node the element created for itself — an `aria-live` announcer, a hidden mirror input,
	 * a measurement sentinel. Such a node sits among the consumer's children and is indistinguishable
	 * from them by inspection, so {@link recaptureSlotted} would adopt it as content and a child
	 * observer would read its arrival as a consumer edit. Call this the moment the node is appended.
	 */
	ownNode(node: Node): void {
		this.ownedNodes.add(node);
	}

	/**
	 * Whether a node is something this fill painted or the element declared as its own, rather than
	 * the consumer's content. The authority is the fill's actual root-level output, recorded when the
	 * scaffold painted, plus whatever {@link ownNode} named — never a marker attribute: a fill may
	 * render several root-level siblings (`carousel` draws a viewport *and* a control bar) and only
	 * one of them carries `[data-root]`, so a marker walk answers "consumer content" for the rest.
	 */
	ownsPaint(node: Node | null): boolean {
		for (let at: Node | null = node; at && at !== this.root; at = at.parentNode) {
			if (this.ownedNodes.has(at) || this.scaffoldRoots.includes(at)) return true;
		}
		return false;
	}

	/**
	 * Fold children that arrived after the scaffold into the captured slot map, and report whether any
	 * did. In light DOM the capture is taken once — the scaffold paint would otherwise wipe it — so a
	 * slide, option, or row a framework renders after mount is invisible to the element forever. Call
	 * this before reading {@link slottedNodes}, and remount when it returns `true`.
	 *
	 * Additions only. A removal cannot be told from the relocation's own detach without the element
	 * naming every node it moves, so this never drops a captured node; a consumer that removes content
	 * keeps rendering it until the next remount.
	 */
	recaptureSlotted(): boolean {
		if (!this.lightDom || !this.mounted || !this.slotted) return false;
		let added = false;
		for (const node of [...this.root.childNodes]) {
			if (this.ownsPaint(node)) continue;
			const name = node instanceof Element ? (node.getAttribute("slot") ?? "") : "";
			const group = this.slotted.get(name);
			if (!group) this.slotted.set(name, [node]);
			else if (!group.includes(node)) group.push(node);
			else continue;
			added = true;
		}
		return added;
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
		const ops = loaded.runtime.fireFragmentHook(this.fragmentId, lifecycle, bindings);
		if (lifecycle === "mount" && !ops.length) markEmptyMount(this.hostElement(), this.fragmentId);
		applyOps(this.root, ops);
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
					const bareHandler = decl.handler.startsWith(`${this.fragmentId}__`)
						? decl.handler.slice(this.fragmentId.length + 2)
						: decl.handler;
					const context = this.binding.context?.(bareHandler, event);
					const intent = runtime.invokeExport(decl.handler, [payload, context]) as FragmentIntent;
					if (intent) this.binding.applyIntent(intent, event);
					if (event.cancelBubble) break;
				}
			}, NON_BUBBLING.has(type));
		}
	}
}

export function fillScaffold(manifest: unknown, sources: Record<string, string>, fragmentId: string): string {
	return (sources[fillSource(manifest, fragmentId)] ?? "").trim();
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
