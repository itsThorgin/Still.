export function initializeMediaSession(engine, navigatorObject = globalThis.navigator, Metadata = globalThis.MediaMetadata) {
  const session = navigatorObject?.mediaSession;
  if (!session || typeof session.setActionHandler !== 'function') return { update() {} };
  let registered = false;
  const actions = {
    play: () => { void engine.resume(); },
    pause: () => engine.pause(),
    stop: () => engine.stop(),
  };
  return {
    update() {
      if (engine.playing) {
        if (!registered) {
          registered = true;
          for (const [action, handler] of Object.entries(actions)) {
            try { session.setActionHandler(action, handler); } catch {}
          }
          try {
            // Only generic app text goes to the operating system's media controls.
            if (typeof Metadata === 'function') session.metadata = new Metadata({ title: 'Still', artist: 'Generated on your device' });
          } catch {}
        }
        try { session.playbackState = engine.paused || engine.interrupted ? 'paused' : 'playing'; } catch {}
      } else if (registered) {
        registered = false;
        for (const action of Object.keys(actions)) {
          try { session.setActionHandler(action, null); } catch {}
        }
        try { session.playbackState = 'none'; } catch {}
        try { session.metadata = null; } catch {}
      }
    },
  };
}
