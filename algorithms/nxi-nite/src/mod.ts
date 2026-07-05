import { defineXtyleAlgorithm } from "@xtyle/core/authoring";
import { spec } from "./preset.js";
import { nxiNitePasses } from "./passes.js";

defineXtyleAlgorithm({ ...spec, passes: nxiNitePasses });
