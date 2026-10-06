import { play, setVolume, bind, type SoundName, type PlayOptions } from "cuelume";

let initialized = false;

export function initSound(): void {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;

  try {
    setVolume(0.35);
    bind(document);
  } catch {
    // Silent fallback when browser autoplay policy blocks audio until user interaction.
  }
}

export function playSound(sound: SoundName, options?: PlayOptions): void {
  if (typeof window === "undefined") return;
  try {
    play(sound, options);
  } catch {
    // Audio unavailable or blocked.
  }
}
