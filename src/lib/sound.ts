import { play, setVolume, bind, type SoundName, type PlayOptions } from "cuelume";

let initialized = false;

/**
 * Initializes Cuelume globally once in the browser.
 * Sets a conservative volume that sits gently beneath the visual interface.
 */
export function initSound(): void {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;

  try {
    // Conservative global volume
    setVolume(0.35);
    bind(document);
  } catch {
    /* AudioContext unavailable or blocked by autoplay policy until gesture */
  }
}

/**
 * Imperatively plays a sound cue with safety checks.
 */
export function playSound(sound: SoundName, options?: PlayOptions): void {
  if (typeof window === "undefined") return;
  try {
    play(sound, options);
  } catch {
    /* Safe fallback if audio is not permitted or fails */
  }
}
