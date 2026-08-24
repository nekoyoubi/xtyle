<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import { defineBbcodeVocabulary } from "@xtyle/core/elements";
	import {
		Avatar,
		Badge,
		Bbcode,
		Button,
		Card,
		Cluster,
		Eyebrow,
		Grid,
		Heading,
		Pagination,
		Radio,
		RadioGroup,
		Separator,
		Stack,
		Text,
		Textarea,
	} from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	defineBbcodeVocabulary("forum-post", [
		"b",
		"i",
		"u",
		"s",
		"url",
		"quote",
		"code",
		"list",
		"*",
		"color",
		"size",
		"mark",
		"spoiler",
		"table",
		"tr",
		"td",
		"th",
		"hr",
	]);
	defineBbcodeVocabulary("forum-bio", ["b", "i", "url"]);

	const title = "Sidebar [b]wrap[/b] threshold on [color=accent]Grid[/color]";

	const posts = [
		{
			author: "Ada Lovelace",
			role: "reporter",
			tone: "info" as const,
			when: "3 days ago",
			body: `[quote=grace]The rail wraps below the floor rather than squeezing, which is what I wanted.[/quote]

Confirmed on [b]0.12.0[/b]. Three things I checked before filing:

[list]
[*]the rail holds its stated width side by side
[*][color=accent]gap[/color] still comes from the token rather than a local rule
[*]nothing overflows at 390px
[/list]

Longer write-up in [url=/docs/derivation-model]the derivation model[/url].`,
		},
		{
			author: "Grace Hopper",
			role: "maintainer",
			tone: "accent" as const,
			when: "2 days ago",
			body: `[b]Here is the repro[/b], trimmed to the smallest thing that still moves:

[code=ts]const theme = derive({ bg: "#0f1115", accent: "#3ad6f8" });
apply(theme, { target: document.body });[/code]

[spoiler=What it looked like before]A 224px rail inside a 164px track, with every child laid out against the wrong width.[/spoiler]

[table=Measured at three widths]
[tr][th]viewport[/th][th]rail[/th][th]main[/th][/tr]
[tr][td]1280[/td][td]288[/td][td]944[/td][/tr]
[tr][td]768[/td][td]288[/td][td]432[/td][/tr]
[tr][td]390[/td][td]390[/td][td]390[/td][/tr]
[/table]`,
		},
		{
			author: "Karen Spärck Jones",
			role: "member",
			tone: "neutral" as const,
			when: "yesterday",
			body: `[size=4]Reads correctly here too.[/size] Checked on [mark]Firefox[/mark] and [mark]WebKit[/mark] at the same three widths.

[hr]

[i]Closing unless someone reopens it.[/i]`,
		},
	];

	const bio = `Writes about derivation. [b]Maintainer[/b] since 0.4, mostly in the colour module.
Reachable from [url=/about]the about page[/url].

[quote]A bio cannot quote. This vocabulary does not list the tag, so it renders as text.[/quote]`;

	let vote = $state("stack");
	let draft = $state(`Agreed. One more case worth naming: [b]a rail on the leading side[/b].

[list]
[*]same floor, mirrored
[*][color=accent]side="start"[/color] moves it
[/list]`);
</script>

<MockFrame {register} title="Forums — layout">
	<div class="forum">
		<Grid sidebar="17rem" minColWidth="26rem" gap={5}>
			<Stack gap={4}>
				<Stack gap={2}>
					<Eyebrow>Components / Layout</Eyebrow>
					<Heading level={2} size="xl">
						<Bbcode inline vocabulary="forum-post" source={title} />
					</Heading>
					<Cluster gap={2} align="center">
						<Badge tone="success" variant="soft">answered</Badge>
						<Text size="sm" tone="muted">3 replies · 41 views</Text>
					</Cluster>
				</Stack>

				{#each posts as post (post.author)}
					<Card>
						<Stack gap={3}>
							<Cluster gap={2} align="center">
								<Avatar userName={post.author} size="sm" />
								<Text size="sm" weight="semibold">{post.author}</Text>
								<Badge tone={post.tone} variant="soft" size="sm">{post.role}</Badge>
								<Text size="xs" tone="subtle">{post.when}</Text>
							</Cluster>
							<Separator />
							<Bbcode vocabulary="forum-post" source={post.body} />
						</Stack>
					</Card>
				{/each}

				<Card>
					<Stack gap={3}>
						<Text size="xs" tone="subtle" mono>Poll · 18 votes</Text>
						<RadioGroup
							label="Should the main column stack or scroll below its floor?"
							onchange={(e: Event) => (vote = (e.target as HTMLInputElement).value)}
						>
							<Radio
								card
								name="wrap"
								value="stack"
								label="Stack"
								checked={vote === "stack"}
								description="The rail drops to its own row once the main column would be forced under the floor."
							/>
							<Radio
								card
								name="wrap"
								value="scroll"
								label="Scroll"
								checked={vote === "scroll"}
								description="Both tracks hold their widths and the container scrolls sideways."
							/>
							<Radio
								card
								name="wrap"
								value="squeeze"
								label="Squeeze"
								checked={vote === "squeeze"}
								description="The floor is advisory and the main column shrinks past it."
							/>
						</RadioGroup>
					</Stack>
				</Card>

				<Card>
					<Stack gap={3}>
						<Text size="sm" weight="semibold">Reply</Text>
						<Textarea bind:value={draft} label="Your reply" rows={7} mono placeholder="BBCode is accepted" />
						<Separator />
						<Text size="xs" tone="subtle" mono>Preview</Text>
						<Bbcode vocabulary="forum-post" source={draft} />
						<Cluster gap={2}>
							<Button variant="solid">Post reply</Button>
							<Button variant="subtle">Save draft</Button>
						</Cluster>
					</Stack>
				</Card>

				<Pagination page={1} total={3} label="Thread pages" />
			</Stack>

			<aside>
				<Stack gap={4}>
					<Card compact>
						<Stack gap={3}>
							<Cluster gap={2} align="center">
								<Avatar userName="Grace Hopper" size="md" />
								<Stack gap={0}>
									<Text size="sm" weight="semibold">Grace Hopper</Text>
									<Text size="xs" tone="subtle">joined 0.4</Text>
								</Stack>
							</Cluster>
							<Separator />
							<Bbcode vocabulary="forum-bio" source={bio} />
						</Stack>
					</Card>

					<Card compact>
						<Stack gap={2}>
							<Text size="xs" tone="subtle" mono>Thread</Text>
							<Cluster gap={2}>
								<Badge variant="outline" size="sm">grid</Badge>
								<Badge variant="outline" size="sm">layout</Badge>
								<Badge variant="outline" size="sm">v0.12.0</Badge>
							</Cluster>
						</Stack>
					</Card>
				</Stack>
			</aside>
		</Grid>
	</div>
</MockFrame>

<style>
	.forum {
		padding: var(--space-5);
		background: var(--bg-0);
	}
</style>
