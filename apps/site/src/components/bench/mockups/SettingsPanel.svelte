<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import { Button, Field, Icon, Segmented, Select, Slider, Switch, Radio } from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	const sections = [
		{ name: "Profile", active: true },
		{ name: "Appearance" },
		{ name: "Notifications" },
		{ name: "Privacy" },
		{ name: "Advanced" },
	];

	let theme = $state("auto");
	let density = $state(3);
	let emailAlerts = $state(true);
	let desktopAlerts = $state(false);
	let digest = $state(true);
	let visibility = $state("friends");
</script>

<MockFrame {register} title="Preferences">
	<div class="settings">
		<nav class="settings__rail" aria-label="Settings sections">
			<span class="settings__brand">
				<Icon name="acct--shield-c3--star-s45-c1" colors="accents" size="lg" />
				<span class="settings__brand-name">Account</span>
			</span>
			{#each sections as s (s.name)}
				<span class="settings__link" class:settings__link--active={s.active}>{s.name}</span>
			{/each}
		</nav>

		<form class="settings__form" onsubmit={(e) => e.preventDefault()}>
			<header class="settings__head">
				<h3 class="settings__title">Profile</h3>
				<p class="settings__sub">How you appear across the workspace.</p>
			</header>

			<div class="settings__grid">
				<Field label="Display name" value="Ada Lovelace" />
				<Field label="Email" type="email" value="ada@analytical.engine" description="Used for sign-in and alerts." />
			</div>

			<Select label="Language" value="en">
				<option value="en">English</option>
				<option value="fr">Français</option>
				<option value="ja">日本語</option>
				<option value="de">Deutsch</option>
			</Select>

			<div class="settings__section">
				<span class="settings__legend">Appearance</span>
				<div class="settings__row">
					<span class="settings__label">Theme</span>
					<Segmented
						bind:value={theme}
						options={[
							{ value: "light", label: "Light" },
							{ value: "dark", label: "Dark" },
							{ value: "auto", label: "Auto" },
						]}
						size="sm"
						label="Theme"
					/>
				</div>
				<Slider bind:value={density} min={1} max={5} step={1} label="Density" showValue format={(v) => ["Airy", "Roomy", "Cozy", "Snug", "Dense"][v - 1]} />
			</div>

			<div class="settings__section">
				<span class="settings__legend">Notifications</span>
				<Switch bind:checked={emailAlerts} label="Email alerts" onLabel="On" offLabel="Off" />
				<Switch bind:checked={desktopAlerts} label="Desktop push" onLabel="On" offLabel="Off" />
				<Switch bind:checked={digest} label="Weekly digest" onLabel="On" offLabel="Off" />
			</div>

			<div class="settings__section">
				<span class="settings__legend">Profile visibility</span>
				<div class="settings__radios" role="radiogroup" aria-label="Profile visibility">
					<Radio name="vis" value="public" bind:group={visibility} label="Public" />
					<Radio name="vis" value="friends" bind:group={visibility} label="Team only" />
					<Radio name="vis" value="private" bind:group={visibility} label="Private" />
				</div>
			</div>

			<footer class="settings__foot">
				<Button variant="ghost" tone="neutral" size="sm">Cancel</Button>
				<Button variant="solid" tone="accent" size="sm">Save changes</Button>
			</footer>
		</form>
	</div>
</MockFrame>

<style>
	.settings {
		display: grid;
		grid-template-columns: minmax(0, 10rem) minmax(0, 1fr);
		min-height: 24rem;
	}

	.settings__rail {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-4);
		border-right: var(--border-thin) solid var(--line);
		background: var(--surface-sunken, var(--bg-1));
	}

	.settings__brand {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3) var(--space-3);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--fg-0);
	}

	.settings__link {
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		color: var(--fg-2);
		cursor: pointer;
	}

	.settings__link--active {
		background: var(--selection-bg, var(--surface-overlay));
		color: var(--fg-0);
		font-weight: var(--weight-semibold);
	}

	.settings__form {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		padding: var(--space-5);
	}

	.settings__head {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.settings__title {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		color: var(--fg-0);
	}

	.settings__sub {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--fg-2);
	}

	.settings__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
		gap: var(--space-4);
	}

	.settings__section {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding-top: var(--space-4);
		border-top: var(--border-thin) solid var(--line);
	}

	.settings__legend {
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--fg-3);
	}

	.settings__row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.settings__label {
		font-size: var(--text-sm);
		color: var(--fg-1);
	}

	.settings__radios {
		display: flex;
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	.settings__foot {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
		padding-top: var(--space-4);
		border-top: var(--border-thin) solid var(--line);
	}
</style>
