import { SKELETON_SHAPES } from "../vocab.js";
export type SkeletonShape = (typeof SKELETON_SHAPES)[number];

/** The host-layout rule for a skeleton — the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const skeletonHostCss = ":host { display: block; }";
