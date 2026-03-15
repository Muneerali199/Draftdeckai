import type { Transition, Variants } from "framer-motion";

export const PRESENTATION_WHEEL_LOCK_MS = 700;
const CINEMATIC_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function getSlideMotionVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      enter: { opacity: 0 },
      center: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }

  return {
    enter: (direction: number) => ({
      x: direction > 0 ? 120 : -120,
      opacity: 0,
      scale: 0.985,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -120 : 120,
      opacity: 0,
      scale: 0.992,
    }),
  };
}

export function getSlideMotionTransition(reducedMotion: boolean): Transition {
  if (reducedMotion) {
    return { duration: 0.12, ease: "linear" };
  }

  return {
    duration: 0.46,
    ease: CINEMATIC_EASE,
  };
}

export function isWheelNavigationLocked(
  lastWheelAt: number,
  lockMs = PRESENTATION_WHEEL_LOCK_MS
): boolean {
  return Date.now() - lastWheelAt < lockMs;
}
