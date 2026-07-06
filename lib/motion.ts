// Shared framer-motion transition presets. Change a value here to retune
// animation timing across every page/component that uses it.
export const TRANSITIONS = {
  /** Entrance for a full page's main content block (login, signup, success screens). */
  pageEntrance: { duration: 0, ease: "easeOut" },
  /** Switching between steps of a multi-step form. */
  formStep: { duration: 0.25, ease: "easeInOut" },
  /** Success/confirmation screen entrance (scale + fade). */
  successEntrance: { duration: 0.4, ease: "easeOut" },
  /** Scroll-reveal used by <FadeIn>. */
  fadeIn: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] },
  /** Individual item within <StaggerChildren>. */
  staggerItem: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] },
} as const;
