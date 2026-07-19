// Every wrapper side-effect-imports its element module to register the custom element. The harness
// asserts on the wrapper→element seam, so it stubs those imports out: an unregistered `<xtyle-*>` is
// inert markup that holds exactly the attributes the wrapper set, with no `connectedCallback` to
// reflect, normalize, or consume them. A failure is then unambiguously the wrapper's.
export {};
