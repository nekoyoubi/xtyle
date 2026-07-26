// INFO: happy-dom ships no ResizeObserver/IntersectionObserver/MutationObserver; stubbed as no-ops
// so wrappers that construct one in a mount effect don't throw
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
