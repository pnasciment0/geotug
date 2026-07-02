// Tiny sound helper built on the Web Audio API so we don't need any audio
// assets. Browsers suspend the AudioContext until a user gesture, so call
// resumeAudio() from a click handler (e.g. the Ready button) to unlock it.

let audioCtx = null;

function getCtx() {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        audioCtx = new Ctx();
    }
    return audioCtx;
}

export function resumeAudio() {
    const ctx = getCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume();
}

function beep({ frequency = 600, duration = 0.15, type = 'sine', volume = 0.2 }) {
    const ctx = getCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
}

// A short blip for each countdown number (3, 2, 1).
export function playTick() {
    beep({ frequency: 600, duration: 0.12, type: 'triangle', volume: 0.15 });
}

// A brighter, longer tone for "Go!" / flag reveal.
export function playGo() {
    beep({ frequency: 950, duration: 0.35, type: 'sawtooth', volume: 0.2 });
}

// A soft notification when the opponent joins the lobby.
export function playOpponentJoined() {
    beep({ frequency: 500, duration: 0.18, type: 'sine', volume: 0.15 });
}

// A bright two-note chime for a correct guess.
export function playCorrect() {
    beep({ frequency: 700, duration: 0.12, type: 'sine', volume: 0.2 });
    setTimeout(() => beep({ frequency: 1050, duration: 0.2, type: 'sine', volume: 0.2 }), 110);
}

// A low buzz for a wrong guess.
export function playWrong() {
    beep({ frequency: 160, duration: 0.25, type: 'square', volume: 0.12 });
}
