/**
 * PreOne Audio Synthesizer: Lobby Walk-In Chime
 *
 * Uses the Web Audio API to play an elegant, crystal-clear two-tone chime
 * ("Ding-Dong" bell chime: D5 [587.33 Hz] -> A5 [880.00 Hz]) without needing
 * any external MP3/WAV files.
 *
 * Handles browser audio autostart policies gracefully: if the AudioContext
 * is suspended, it resumes on the first user interaction or when invoked.
 */

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return null
    if (!audioCtx) {
      audioCtx = new AudioContextClass()
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {})
    }
    return audioCtx
  } catch {
    return null
  }
}

/**
 * Plays a warm, professional reception lobby chime.
 * Suitable for notifying front-desk staff when a parent submits a self-fill walk-in form.
 */
export function playLobbyChime(volume: number = 0.35): void {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    // Tone 1: High crisp bell (D5 - 587.33 Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()

    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now) // D5
    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(volume * 0.9, now + 0.02)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55)

    osc1.connect(gain1)
    gain1.connect(ctx.destination)

    osc1.start(now)
    osc1.stop(now + 0.6)

    // Tone 2: Harmonious resonance (A5 - 880.00 Hz)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()

    const tone2Start = now + 0.16
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880.0, tone2Start) // A5
    gain2.gain.setValueAtTime(0, tone2Start)
    gain2.gain.linearRampToValueAtTime(volume, tone2Start + 0.03)
    gain2.gain.exponentialRampToValueAtTime(0.001, tone2Start + 0.8)

    osc2.connect(gain2)
    gain2.connect(ctx.destination)

    osc2.start(tone2Start)
    osc2.stop(tone2Start + 0.85)
  } catch {
    // Graceful fallback: audio failure should never interrupt user workflows
  }
}
