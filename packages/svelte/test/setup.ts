// happy-dom ships none of the observer APIs, and a handful of wrappers construct one in an effect
// during mount. Without these the sweep reports a render failure that has nothing to do with the
// prop under test, so they are stubbed to inert no-ops rather than left to throw.
class NoopObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
	takeRecords() {
		return [];
	}
}

const g = globalThis as Record<string, unknown>;
g.ResizeObserver ??= NoopObserver;
g.IntersectionObserver ??= NoopObserver;
g.MutationObserver ??= NoopObserver;

window.matchMedia ??= ((query: string) => ({
	matches: false,
	media: query,
	onchange: null,
	addListener() {},
	removeListener() {},
	addEventListener() {},
	removeEventListener() {},
	dispatchEvent: () => false,
})) as typeof window.matchMedia;

globalThis.requestAnimationFrame ??= ((cb: FrameRequestCallback) => setTimeout(() => cb(0), 0) as unknown as number) as typeof requestAnimationFrame;
globalThis.cancelAnimationFrame ??= ((id: number) => clearTimeout(id)) as typeof cancelAnimationFrame;
