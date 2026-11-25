// Tiny sound effects from the Web Audio API: no audio files, nothing to
// load over the network. Created lazily on the first user gesture.
export function createAudio() {
  let context = null;

  function ensure() {
    if (!context) {
      try {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        context = new Ctor();
      } catch {
        context = null;
      }
    }
    if (context && context.state === 'suspended') context.resume();
    return context;
  }

  function blip(freq, seconds, type = 'sine', gain = 0.08) {
    const ctx = ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);
    osc.connect(amp).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + seconds);
  }

  return {
    /** A soft pick-up/plating tap. */
    pick() { blip(520, 0.08, 'triangle', 0.06); },
    /** A knife thock while chopping. */
    chop() { blip(180, 0.06, 'square', 0.05); blip(90, 0.05, 'sawtooth', 0.04); },
    /** A pot bubble while cooking. */
    cook() { blip(300, 0.12, 'sine', 0.05); blip(420, 0.1, 'sine', 0.04); },
    /** A happy two-note chime for a served dish. */
    serve() { blip(660, 0.12, 'triangle', 0.07); setTimeout(() => blip(880, 0.18, 'triangle', 0.07), 90); },
    /** A low buzz for a mistake or a burned pot. */
    wrong() { blip(140, 0.25, 'sawtooth', 0.06); },
  };
}
