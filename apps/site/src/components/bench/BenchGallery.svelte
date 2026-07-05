<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import { apply } from "@xtyle/core/dom";
	import {
		Alert,
		Avatar,
		Badge,
		Breadcrumb,
		Button,
		Checkbox,
		Dialog,
		Eyebrow,
		Field,
		Heading,
		Kbd,
		Link,
		Menu,
		NumberInput,
		Progress,
		Radio,
		RadioGroup,
		Segmented,
		Select,
		Separator,
		Skeleton,
		Slider,
		Spinner,
		Stat,
		Swatch,
		Switch,
		Table,
		Tabs,
		Text,
		Textarea,
		Tooltip,
		Tree,
	} from "@xtyle/svelte";

	interface Props {
		register: TokenRegister;
		family: string;
	}

	let { register, family }: Props = $props();

	let stage: HTMLDivElement | undefined = $state();
	let dialogOpen = $state(false);

	$effect(() => {
		if (!stage) return;
		apply(register, { target: stage });
	});

	const crumbs = [
		{ label: "Home", href: "#" },
		{ label: "Components", href: "#" },
		{ label: "Gallery", current: true },
	];

	const navTabs = [
		{ value: "one", label: "Overview" },
		{ value: "two", label: "Tokens" },
		{ value: "three", label: "Coverage" },
	];

	const tree = [
		{
			label: "Surfaces",
			locked: true,
			children: [
				{ label: "Background", href: "#", selected: true },
				{ label: "Overlay", href: "#" },
			],
		},
		{
			label: "Content",
			children: [{ label: "Foreground", href: "#" }],
		},
	];

	const buttonVariants = ["solid", "outline", "ghost", "subtle"] as const;
	const swatchHues = ["red", "orange", "yellow", "green", "blue", "purple"];

	const menuItems = [
		{ label: "New theme", value: "new" },
		{ label: "Duplicate", value: "dup" },
		{ separator: true },
		{ label: "Export…", value: "export" },
		{ label: "Delete", value: "delete", disabled: true },
	];
</script>

<div class="gallery" bind:this={stage}>
	{#if family === "buttons"}
	<section class="gallery__family">
		<h4 class="gallery__head">Buttons</h4>
		<div class="gallery__row">
			{#each buttonVariants as v (v)}
				<Button variant={v}>{v}</Button>
			{/each}
			<Button variant="solid" tone="danger">danger</Button>
			<Button variant="solid" disabled>disabled</Button>
		</div>
		<div class="gallery__row">
			<Button size="sm">small</Button>
			<Button size="md">medium</Button>
			<Button size="lg">large</Button>
		</div>
	</section>
	{:else if family === "form"}
	<section class="gallery__family">
		<h4 class="gallery__head">Form</h4>
		<div class="gallery__grid">
			<Field label="Name" placeholder="Ada Lovelace" />
			<Select label="Role">
				<option>Engineer</option>
				<option>Designer</option>
			</Select>
			<NumberInput label="Quantity" value={3} min={0} max={99} />
			<Textarea label="Notes" name="g-notes" rows={2} placeholder="A short note…" />
			<Segmented label="View" options="Day,Week,Month" value="Week" />
			<Slider label="Vibrancy" value={60} />
		</div>
		<div class="gallery__row">
			<Switch label="Notifications" checked />
			<Checkbox label="Remember me" checked />
			<RadioGroup label="Plan">
				<Radio name="g-plan" value="free" label="Free" checked />
				<Radio name="g-plan" value="pro" label="Pro" />
			</RadioGroup>
		</div>
	</section>
	{:else if family === "feedback"}
	<section class="gallery__family">
		<h4 class="gallery__head">Feedback</h4>
		<div class="gallery__row">
			<Badge>neutral</Badge>
			<Badge tone="success">success</Badge>
			<Badge tone="warn">warn</Badge>
			<Badge tone="danger">danger</Badge>
			<Badge tone="info">info</Badge>
		</div>
		<div class="gallery__alerts">
			<Alert tone="success">{#snippet title()}Saved{/snippet}Your derivation landed without a hitch.</Alert>
			<Alert tone="warn">{#snippet title()}Careful{/snippet}Vibrancy this high can clip contrast on AA.</Alert>
		</div>
		<div class="gallery__row gallery__row--center">
			<Progress value={64} showValue ariaLabel="Sample progress" />
			<Spinner ariaLabel="Loading" />
			<Skeleton shape="text" />
		</div>
		<div class="gallery__row">
			<Stat label="Tokens" delta="+6" trend="up" caption="this cycle">198</Stat>
			<Stat label="Coverage" delta="100%" trend="up" caption="components">48/48</Stat>
		</div>
	</section>
	{:else if family === "navigation"}
	<section class="gallery__family">
		<h4 class="gallery__head">Navigation</h4>
		<Breadcrumb items={crumbs} label="Gallery location" />
		<Tabs items={navTabs} variant="underline" label="Sample tabs">
			{#snippet panel(value)}
				<Text size="sm" tone="muted">Panel content for <strong>{value}</strong> — themed live.</Text>
			{/snippet}
		</Tabs>
		<Tree label="Sample tree" items={tree} />
	</section>
	{:else if family === "data"}
	<section class="gallery__family">
		<h4 class="gallery__head">Data &amp; identity</h4>
		<div class="gallery__row gallery__row--center">
			<Avatar tone="accent" alt="Ada Lovelace">AL</Avatar>
			<Avatar tone="purple" shape="square" alt="Grace Hopper">GH</Avatar>
			<span><Kbd>Ctrl</Kbd> <Kbd>K</Kbd></span>
		</div>
		<div class="gallery__row">
			{#each swatchHues as hue (hue)}
				<Swatch color={register[`--color-${hue}`] ?? "#888"} label={hue} value={register[`--color-${hue}`]} />
			{/each}
		</div>
		<Table ariaLabel="Sample token roles">
			<table>
				<thead>
					<tr><th>Token</th><th>Role</th><th>State</th></tr>
				</thead>
				<tbody>
					<tr><td>--accent</td><td>fill</td><td><Badge tone="success" size="sm">ok</Badge></td></tr>
					<tr><td>--warn-bg</td><td>tint</td><td><Badge tone="warn" size="sm">watch</Badge></td></tr>
				</tbody>
			</table>
		</Table>
	</section>
	{:else if family === "typography"}
	<section class="gallery__family">
		<h4 class="gallery__head">Typography</h4>
		<Eyebrow>Type scale</Eyebrow>
		<Heading level={2} size="2xl">Display heading</Heading>
		<Heading level={3} size="lg">Section heading</Heading>
		<Text>Body text sets the baseline — a derived token for ink, leading, and measure.</Text>
		<Text tone="muted">Muted text recedes a step for secondary copy.</Text>
		<Text size="sm" tone="subtle">Subtle, small — captions and helper text.</Text>
		<div class="gallery__row gallery__row--center">
			<Link href="#">A themed link</Link>
			<Text tone="accent" weight="semibold">Accent emphasis</Text>
		</div>
		<Separator />
	</section>
	{:else if family === "overlays"}
	<section class="gallery__family">
		<h4 class="gallery__head">Overlays</h4>
		<div class="gallery__row gallery__row--center">
			<Tooltip text="Floats above the trigger, themed live" placement="top">
				<Button variant="outline">Hover for a tip</Button>
			</Tooltip>
			<Menu label="Actions" items={menuItems} />
			<Button variant="solid" onclick={() => (dialogOpen = true)}>Open a dialog</Button>
		</div>
		<Dialog bind:open={dialogOpen} heading="Apply this theme?" size="sm">
			<Text tone="muted">
				Every surface, border, and ink in this dialog is a derived token — it re-themes
				with the register like the rest of the gallery.
			</Text>
			{#snippet footer()}
				<Button variant="ghost" tone="neutral" onclick={() => (dialogOpen = false)}>Cancel</Button>
				<Button variant="solid" onclick={() => (dialogOpen = false)}>Apply</Button>
			{/snippet}
		</Dialog>
	</section>
	{/if}
</div>

<style>
	.gallery {
		display: flex;
		flex-direction: column;
		gap: var(--space-7);
		background: var(--bg-0);
		color: var(--fg-0);
		font-family: var(--font-sans);
		padding: var(--space-5);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-lg);
	}

	.gallery__family {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		min-width: 0;
	}

	.gallery__head {
		margin: 0;
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--fg-2);
	}

	.gallery__row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		align-items: flex-start;
	}

	.gallery__row--center {
		align-items: center;
	}

	.gallery__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
		gap: var(--space-4);
		align-items: start;
	}

	.gallery__alerts {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
</style>
