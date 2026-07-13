<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import {
		Alert,
		Badge,
		Button,
		Card,
		Checkbox,
		Cluster,
		Dot,
		Field,
		FormGroup,
		Heading,
		Icon,
		NumberInput,
		Panel,
		Radio,
		Segmented,
		Select,
		Separator,
		Slider,
		Swatch,
		Switch,
		Text,
		Textarea,
	} from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	const sections = [
		{ name: "Appearance", icon: "palette", active: true },
		{ name: "Notifications", icon: "volume" },
		{ name: "Account", icon: "eye" },
		{ name: "Integrations", icon: "external-link" },
		{ name: "Advanced", icon: "gear" },
		{ name: "Danger zone", icon: "trash" },
	] as const;

	// The accent family is a categorical axis, never a semantic one. This row is the derived palette
	// itself, so whatever `accentStrategy` produced (four hues, one hue at four lightnesses, two brands)
	// is exactly what belongs on screen — and each chip carries its own name and token, so the row still
	// reads under `shade`, where hue alone tells you nothing.
	const palette = [
		{ id: "accent", label: "Primary", token: "--accent" },
		{ id: "accent-2", label: "Secondary", token: "--accent-2" },
		{ id: "accent-3", label: "Tertiary", token: "--accent-3" },
		{ id: "accent-4", label: "Quaternary", token: "--accent-4" },
	] as const;

	const tags = [
		{ name: "Design", tone: "accent-2", on: true },
		{ name: "Ops", tone: "accent-3", on: true },
		{ name: "Research", tone: "accent-4", on: false },
	] as const;

	const densityLabels = ["Compact", "Cozy", "Comfortable", "Roomy", "Airy"] as const;

	let theme = $state("system");
	let highlight = $state("accent-2");
	let density = $state(3);
	let reduceMotion = $state(true);
	let stickyRail = $state(false);
	let muteInFocus = $state(true);
	let digest = $state("weekly");
	let alertBudget = $state(12);
	let visibility = $state("team");

	const visibilities = [
		{ value: "public", label: "Public", description: "Anyone holding the workspace link." },
		{ value: "team", label: "Team", description: "Members of this workspace only." },
		{ value: "private", label: "Private", description: "Nobody but you and the admins." },
	] as const;
</script>

<MockFrame {register} title="Preferences">
	<div class="prefs">
		<nav class="prefs__rail" aria-label="Settings sections">
			<div class="prefs__rail-head">
				<Icon name="gear" size="sm" tone="accent" />
				<Text size="xs" tone="subtle" weight="semibold">Workspace</Text>
			</div>
			{#each sections as s (s.name)}
				<button
					type="button"
					class="prefs__link"
					class:prefs__link--active={s.active}
					aria-current={s.active ? "page" : undefined}
				>
					<Icon name={s.icon} size="sm" />
					<span class="prefs__link-name">{s.name}</span>
				</button>
			{/each}
		</nav>

		<form class="prefs__form" onsubmit={(e) => e.preventDefault()}>
			<header class="prefs__head">
				<div class="prefs__head-text">
					<Heading level={2} size="md">Appearance</Heading>
					<Text size="sm" tone="subtle">Applies to this workspace on every device you sign in from.</Text>
				</div>
				<Badge tone="neutral" variant="outline" size="sm">Draft</Badge>
			</header>

			<Panel title="Appearance">
				{#snippet actions()}
					<Button variant="ghost" size="sm">
						{#snippet iconStart()}<Icon name="arrow-left" />{/snippet}
						Reset section
					</Button>
				{/snippet}

				<div class="prefs__stack">
					<FormGroup label="Theme" description="System follows your OS until you override it here.">
						<Segmented
							bind:value={theme}
							label="Theme"
							options={[
								{ value: "system", label: "System" },
								{ value: "light", label: "Light" },
								{ value: "dark", label: "Dark" },
							]}
						/>
					</FormGroup>

					<FormGroup
						label="Accent palette"
						description="The family your algorithm derived. Pick the one highlights use."
					>
						<div class="prefs__palette">
							{#each palette as p (p.id)}
								<Swatch
									color={`var(${p.token})`}
									label={p.label}
									value={p.token}
									size="lg"
									interactive
									selected={highlight === p.id}
									onselect={() => (highlight = p.id)}
								/>
							{/each}
						</div>
					</FormGroup>

					<FormGroup
						label="Tag colors"
						description="Which label colors appear in lists. The name carries the meaning; the color only decorates it."
					>
						<Cluster gap={4}>
							{#each tags as t (t.name)}
								<Checkbox tone={t.tone} checked={t.on} label={t.name} />
							{/each}
						</Cluster>
					</FormGroup>

					<Separator />

					<div class="prefs__pair">
						<Slider
							label="Interface density"
							bind:value={density}
							min={1}
							max={5}
							step={1}
							showValue
							format={(v) => densityLabels[v - 1] ?? String(v)}
						/>
						<div class="prefs__switches">
							<Switch bind:checked={reduceMotion} label="Reduce motion" onLabel="On" offLabel="Off" />
							<Switch bind:checked={stickyRail} label="Pin the sidebar" onLabel="On" offLabel="Off" />
						</div>
					</div>
				</div>
			</Panel>

			<Panel title="Notifications">
				<div class="prefs__stack">
					<FormGroup label="Delivery" description="Where routine notifications land.">
						<Cluster gap={4}>
							<Checkbox checked label="Email" />
							<Checkbox checked label="In-app" />
							<Checkbox disabled label="Desktop push" />
						</Cluster>
						<Text size="xs" tone="muted">Desktop push is blocked by this browser's permission setting.</Text>
					</FormGroup>

					<div class="prefs__pair">
						<Select bind:value={digest} label="Digest frequency" name="digest">
							<option value="daily">Every morning</option>
							<option value="weekly">Weekly summary</option>
							<option value="off">Never</option>
						</Select>
						<NumberInput label="Alert budget (per hour)" bind:value={alertBudget} min={1} max={60} />
					</div>

					<Switch
						bind:checked={muteInFocus}
						label="Mute while focus mode is on"
						onLabel="Muted"
						offLabel="Audible"
					/>
				</div>
			</Panel>

			<Panel title="Account">
				<div class="prefs__stack">
					<Card compact>
						<div class="prefs__plan">
							<div class="prefs__plan-name">
								<Dot tone="success" size="sm" />
								<Text size="sm" weight="medium">Studio plan</Text>
								<Badge tone="accent-2" variant="soft" size="sm">Seat 4 of 10</Badge>
							</div>
							<Button variant="outline" size="sm">Manage seats</Button>
						</div>
					</Card>

					<div class="prefs__pair">
						<Field label="Display name" name="name" value="Ada Lovelace" clearable />
						<Field
							label="Work email"
							name="email"
							type="email"
							value="ada@analytical"
							invalid
							error="Enter a full address, domain included."
						/>
					</div>

					<Textarea
						label="Bio"
						name="bio"
						rows={3}
						value="Notes on the Analytical Engine, mostly. Occasionally a poem about it."
						invalid
						error="Keep the bio under 160 characters."
					/>

					<FormGroup label="Profile visibility" description="Who can see your activity in shared spaces.">
						<div class="prefs__cards">
							{#each visibilities as v (v.value)}
								<Radio
									card
									name="visibility"
									value={v.value}
									label={v.label}
									description={v.description}
									bind:group={visibility}
								/>
							{/each}
						</div>
					</FormGroup>

					<Separator variant="with-label">Recovery</Separator>

					<Field label="Recovery key" name="recovery" value="XTYL-8F2C-91AD-77E0" mono readonly>
						{#snippet suffix()}<Icon name="copy" size="sm" tone="neutral" />{/snippet}
					</Field>
				</div>
			</Panel>

			<Panel title="Danger zone">
				<Alert severity="danger" variant="soft">
					{#snippet title()}Deleting a workspace is permanent{/snippet}
					Every theme, algorithm, and derived token set in it goes too. Exports do not come back.
					{#snippet actions()}
						<Button tone="danger" variant="solid" size="sm">
							{#snippet iconStart()}<Icon name="trash" />{/snippet}
							Delete workspace
						</Button>
						<Button variant="ghost" size="sm" disabled>Transfer ownership</Button>
					{/snippet}
				</Alert>
			</Panel>

			<footer class="prefs__bar">
				<div class="prefs__dirty">
					<Dot tone="warn" size="sm" pulse="slow" />
					<Text size="sm" tone="subtle">3 unsaved changes</Text>
				</div>
				<Cluster gap={2}>
					<Button variant="ghost" size="sm">Discard</Button>
					<Button variant="solid" size="sm">
						{#snippet iconStart()}<Icon name="check" />{/snippet}
						Save changes
					</Button>
				</Cluster>
			</footer>
		</form>
	</div>
</MockFrame>

<style>
	.prefs {
		display: grid;
		grid-template-columns: minmax(0, 14rem) minmax(0, 1fr);
		min-height: 32rem;
	}

	.prefs__rail {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-4);
		background: var(--bg-2);
		border-right: var(--border-thin) solid var(--line);
	}

	.prefs__rail-head {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-1) var(--space-3) var(--space-3);
	}

	.prefs__link {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-2) var(--space-3);
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
		color: var(--fg-2);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		text-align: left;
		cursor: pointer;
	}

	.prefs__link:hover {
		background: var(--state-hover);
	}

	.prefs__link--active {
		background: var(--accent-bg);
		color: var(--accent-text);
		font-weight: var(--weight-medium);
	}

	.prefs__link-name {
		flex: 1;
	}

	.prefs__form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-5);
		min-width: 0;
	}

	.prefs__head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.prefs__head-text {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.prefs__stack {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.prefs__palette {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	.prefs__pair {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		gap: var(--space-4);
		align-items: start;
	}

	.prefs__switches {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.prefs__cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
		gap: var(--space-3);
	}

	.prefs__plan {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.prefs__plan-name {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.prefs__bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		margin-top: auto;
		padding-top: var(--space-4);
		border-top: var(--border-thin) solid var(--line);
	}

	.prefs__dirty {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
</style>
