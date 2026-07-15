<script lang="ts">
	import "@xtyle/core/elements/dock-zone.js";
	import type { Snippet } from "svelte";
	import type { DockNode, DockLayout, FloatRect } from "@xtyle/core/elements";

	type LayoutChange = CustomEvent<{ layout: DockLayout | null }>;
	type PanelClose = CustomEvent<{ panelId: string }>;
	type PanelAction = CustomEvent<{ panelId: string; actionId: string }>;

	interface Props {
		/** Restore a persisted layout (a `DockLayout` with docks + floats, or a bare `DockNode` tree).
		 * Read the current one back from `onLayoutChange`. */
		layout?: DockNode | DockLayout | null;
		onLayoutChange?: (event: LayoutChange) => void;
		/** A panel's close button was pressed. Cancelable: call `event.preventDefault()` to keep the panel. */
		onPanelClose?: (event: PanelClose) => void;
		/** A panel header button or menu row was activated (`detail: { panelId, actionId }`). */
		onPanelAction?: (event: PanelAction) => void;
		children?: Snippet;
		/** Any other attribute (`style`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { layout, onLayoutChange, onPanelClose, onPanelAction, children, ...rest }: Props = $props();

	let host:
		| (HTMLElement & {
				layout: DockNode | DockLayout | null;
				closePanel(panelId: string): void;
				floatPanel(panelId: string, rect?: FloatRect): void;
				dockFloating(panelId: string, target?: string, region?: string): void;
		  })
		| undefined = $state();

	/** Close a panel through the element's own path (cancelable `panel-close`, then removal). Exposed so
	 * a `bind:this` consumer can wire a `data-menu` "close" row's `panel-action` back to a real close. */
	export function closePanel(panelId: string): void {
		host?.closePanel(panelId);
	}

	/** Tear a docked panel out into a floating window (a `data-menu` "float" row wires here through `bind:this`). */
	export function floatPanel(panelId: string, rect?: FloatRect): void {
		host?.floatPanel(panelId, rect);
	}

	/** Re-dock a floating panel back into the tree (defaults to the root zone as a tab). */
	export function dockFloating(panelId: string, target?: string, region?: string): void {
		host?.dockFloating(panelId, target, region);
	}

	// `layout` is a tree object, not an attribute, so set it as a property on the live element.
	$effect(() => {
		if (host && layout !== undefined) host.layout = layout;
	});

	// The callback is read through a getter so swapping the prop re-registers the listener.
	function forward<E extends Event>(type: string, callback: () => ((event: E) => void) | undefined): void {
		$effect(() => {
			const cb = callback();
			if (!host || !cb) return;
			const handler = (event: Event) => cb(event as E);
			host.addEventListener(type, handler);
			return () => host?.removeEventListener(type, handler);
		});
	}

	forward<LayoutChange>("layout-change", () => onLayoutChange);
	forward<PanelClose>("panel-close", () => onPanelClose);
	forward<PanelAction>("panel-action", () => onPanelAction);
</script>

<xtyle-dock-zone {...rest} bind:this={host}>
	{@render children?.()}
</xtyle-dock-zone>
